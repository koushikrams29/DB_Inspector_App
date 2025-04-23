from urllib import request
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String
from typing import List, Dict
from Backend.models.models import (
    DBConnection,
    DBConnectionCreate,
    DBConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse
)
from pydantic import BaseModel, Field
from Backend.services.backend_services import test_connection as run_test_connection
from Backend.services.backend_services import get_flavor_service
from Backend.queries.profiling_query import CProfilingSQL
from Backend.db.database import TableGroupModel
from uuid import UUID, uuid4

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database for storing connection info (SQLite for now)
# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:bhuvan@localhost:5432/postgres"
# engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
# SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# Base = declarative_base()


SQLALCHEMY_DATABASE_URL = "postgresql://postgres:koushik@localhost:5432/postgres"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# SQLAlchemy model for storing DB connection info
class DBConnectionModel(Base):
    __tablename__ = "db_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    db_type = Column(String)
    db_hostname = Column(String)
    db_port = Column(Integer)
    user_id = Column(String)
    password = Column(String)
    database = Column(String, nullable=True)
    
#This is the profiling model for storing the profiling data
class ConnectionProfilingRequest(BaseModel):
    db_type: str
    db_hostname: str
    db_port: int
    user: str
    password: str
    database: str
    project_code: str = "DEFAULT"

#Table group models for user input
class TableGroup(BaseModel):
    name: str
    schema: str
    tables_to_include_mask: str
    profiling_id_column_mask: str
    tables_to_exclude_mask: str
    profiling_surrogate_key_column_mask: str
    explicit_table_list: List[str]
    min_profiling_age_days: int


# In-memory database substitute
table_groups_db: Dict[int, Dict[UUID, dict]] = {}  # maps conn_id -> {group_id -> table group data}

def list_to_str(lst: List[str]) -> str:
    return ",".join(lst)

def str_to_list(s: str) -> List[str]:
    return s.split(",") if s else []



class TableGroupOut(TableGroup):
    id: str
    id: UUID = Field(default_factory=uuid4)

Base.metadata.create_all(bind=engine)


# Utility function: get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# Endpoint: Test DB connection
@app.post("/connections/test", response_model=TestConnectionResponse)
def test_connection_api(conn: TestConnectionRequest):
    return run_test_connection(conn)




# Endpoint: Save a new connection
@app.post("/connections", response_model=DBConnection)
def create_connection(conn_data: DBConnectionCreate):
    db = next(get_db())
    db_conn = DBConnectionModel(**conn_data.dict())
    db.add(db_conn)
    db.commit()
    db.refresh(db_conn)
    return db_conn


# Endpoint: Get all saved connections
@app.get("/connections", response_model=List[DBConnection])
def list_connections():
    db = next(get_db())
    return db.query(DBConnectionModel).all()


# Endpoint: Get a single connection
@app.get("/connections/{conn_id}", response_model=DBConnection)
def get_connection(conn_id: str):
    db = next(get_db())
    conn = db.query(DBConnectionModel).filter(DBConnectionModel.id == conn_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


# Endpoint: Update a connection
@app.put("/connections/{conn_id}", response_model=DBConnection)
def update_connection(conn_id: int, conn_data: DBConnectionUpdate):
    db = next(get_db())
    conn = db.query(DBConnectionModel).filter(DBConnectionModel.id == conn_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    for key, value in conn_data.dict(exclude_unset=True).items():
        setattr(conn, key, value)
    db.commit()
    db.refresh(conn)
    return conn


# Endpoint: Delete a connection
@app.delete("/connections/{conn_id}")
def delete_connection(conn_id: int):
    db = next(get_db())
    conn = db.query(DBConnectionModel).filter(DBConnectionModel.id == conn_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    db.delete(conn)
    db.commit()
    return {"message": "Connection deleted successfully"}



@app.post("/connection/{conn_id}/profiling")
def profile_connection(conn_id: int, conn: ConnectionProfilingRequest):
    print(f"conn_id received: {conn_id}")
    print(f"conn data: {conn}")

    try:
       
        profiler = CProfilingSQL(strProjectCode=conn.project_code, flavor=conn.db_type.lower())

        profiler.connection_id = str(conn_id)
        profiler.data_schema = "testdb"  # or derive dynamically
        profiler.data_table = "land_registry_price"  # set appropriately if needed
        profiler.contingency_columns = "'property_type', 'city'"
        result = profiler.GetContingencyCounts()

        return {"status": "success", "data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a table group
@app.post("/connection/{conn_id}/table-groups/", response_model=TableGroupOut)
def create_table_group_for_connection(conn_id: int, table_group: TableGroup):
    db = next(get_db())
    group_id = str(uuid4())
    db_group = TableGroupModel(
        id=group_id,
        conn_id=conn_id,
        **{**table_group.dict(), "explicit_table_list": list_to_str(table_group.explicit_table_list)}
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return TableGroupOut(id=db_group.id, **table_group.dict())

 
# Get all table groups
@app.get("/connection/{conn_id}/table-groups/", response_model=List[TableGroupOut])
def get_table_groups_for_connection(conn_id: int):
    db = next(get_db())
    groups = db.query(TableGroupModel).filter_by(conn_id=conn_id).all()
    return [
        TableGroupOut(
            id=group.id,
            name=group.name,
            schema=group.schema,
            tables_to_include_mask=group.tables_to_include_mask,
            profiling_id_column_mask=group.profiling_id_column_mask,
            tables_to_exclude_mask=group.tables_to_exclude_mask,
            profiling_surrogate_key_column_mask=group.profiling_surrogate_key_column_mask,
            explicit_table_list=str_to_list(group.explicit_table_list),
            min_profiling_age_days=group.min_profiling_age_days
        )
        for group in groups
    ]



# Get one table group
@app.get("/connection/{conn_id}/table-groups/{group_id}", response_model=TableGroupOut)
def get_specific_table_group(conn_id: int, group_id: str):
    db = next(get_db())
    group = db.query(TableGroupModel).filter_by(conn_id=conn_id, id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Table group not found")
    return TableGroupOut(
        id=group.id,
        name=group.name,
        schema=group.schema,
        tables_to_include_mask=group.tables_to_include_mask,
        profiling_id_column_mask=group.profiling_id_column_mask,
        tables_to_exclude_mask=group.tables_to_exclude_mask,
        profiling_surrogate_key_column_mask=group.profiling_surrogate_key_column_mask,
        explicit_table_list=str_to_list(group.explicit_table_list),
        min_profiling_age_days=group.min_profiling_age_days
    )



#Delete a table group
@app.delete("/connection/{conn_id}/table-groups/{group_id}")
def delete_table_group(conn_id: int, group_id: str):
    db = next(get_db())
    group = db.query(TableGroupModel).filter_by(conn_id=conn_id, id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Table group not found")
    db.delete(group)
    db.commit()
    return {"message": "Table group deleted"}



    
@app.get("/overview/{conn_id}")
def get_overview(conn_id: int):
    pass


    # if conn.db_type == "MongoDB":
    #     try:
    #         is_srv = conn.db_hostname.endswith(".mongodb.net")
    #         prefix = "mongodb+srv" if is_srv else "mongodb"
    #         port_part = "" if is_srv else f":{conn.db_port}"
    #         db_url = f"{prefix}://{conn.user_id}:{conn.password}@{conn.db_hostname}{port_part}/{conn.database or 'admin'}"

    #         client = MongoClient(db_url)
    #         db_instance = client[conn.database or "admin"]
    #         collections = db_instance.list_collection_names()

    #         result = []
    #         for col in collections:
    #             sample = db_instance[col].find_one()
    #             if sample:
    #                 sample_fields = list(sample.keys())
    #             else:
    #                 sample_fields = []
    #             result.append({"name": col, "sample_fields": sample_fields})

    #         return {
    #             "db_type": "MongoDB",
    #             "collections": result
    #         }

    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(e)}")

    # else:
    #     try:

    #         engine = create_engine(db_url)
    #         with engine.connect() as connection:
    #             # Fetch tables
    #             table_query = text("""
    #                 SELECT table_name FROM information_schema.tables 
    #                 WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    #             """)
    #             tables = connection.execute(table_query).fetchall()

    #             result = []
    #             for table_row in tables:
    #                 table_name = table_row[0]
    #                 column_query = text("""
    #                     SELECT column_name, data_type FROM information_schema.columns
    #                     WHERE table_name = :table_name
    #                 """)
    #                 columns = connection.execute(column_query, {"table_name": table_name}).fetchall()
    #                 result.append({
    #                     "name": table_name,
    #                     "columns": [{"name": col[0], "type": col[1]} for col in columns]
    #                 })

    #         return {
    #             "db_type": conn.db_type,
    #             "tables": result
    #         }

    #     except Exception as e:
    #         raise HTTPException(status_code=500, detail=f"SQL DB Error: {str(e)}")