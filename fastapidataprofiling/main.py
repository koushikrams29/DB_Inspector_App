from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String
from typing import List
from pymongo import MongoClient
from models import (
    DBConnection,
    DBConnectionCreate,
    DBConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse
)

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
SQLALCHEMY_DATABASE_URL = "sqlite:///./connections.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
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


Base.metadata.create_all(bind=engine)


# Utility function: get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Utility: build DB URL
def construct_connection_url(db_type, db_hostname, db_port, user_id, password, database=None):
    if db_type == "PostgreSQL":
        return f"postgresql://{user_id}:{password}@{db_hostname}:{db_port}/{database}"
    elif db_type == "MySQL":
        return f"mysql+pymysql://{user_id}:{password}@{db_hostname}:{db_port}/{database}"
    elif db_type == "SQLite":
        return f"sqlite:///{database or ':memory:'}"
    elif db_type == "Oracle":
        return f"oracle+cx_oracle://{user_id}:{password}@{db_hostname}:{db_port}/?service_name={database}"
    elif db_type == "SQL Server":
        return f"mssql+pyodbc://{user_id}:{password}@{db_hostname},{db_port}/{database}?driver=ODBC+Driver+17+for+SQL+Server"
    elif db_type == "MongoDB":
        # Check if hostname includes .mongodb.net to assume MongoDB Atlas
        is_srv = db_hostname.endswith(".mongodb.net")
        prefix = "mongodb+srv" if is_srv else "mongodb"
        port_part = "" if is_srv else f":{db_port}"
        # Construct the connection string
        return f"{prefix}://{user_id}:{password}@{db_hostname}{port_part}/{database or 'admin'}"
    else:
        raise ValueError(f"Unsupported database type: {db_type}")



# Endpoint: Test DB connection
@app.post("/connections/test", response_model=TestConnectionResponse)
def test_connection(conn: TestConnectionRequest):
    try:
        # MongoDB uses pymongo, not SQLAlchemy
        if conn.db_type == "MongoDB":
            is_srv = conn.db_hostname.endswith(".mongodb.net")
            prefix = "mongodb+srv" if is_srv else "mongodb"
            port_part = "" if is_srv else f":{conn.db_port}"
            db_url = f"{prefix}://{conn.user_id}:{conn.password}@{conn.db_hostname}{port_part}/{conn.database or 'admin'}"

            client = MongoClient(db_url)
            client.admin.command("ping")
            return TestConnectionResponse(status=True, message="MongoDB connection successful")

        # All other SQL DBs
        db_url = construct_connection_url(
            conn.db_type,
            conn.db_hostname,
            conn.db_port,
            conn.user_id,
            conn.password,
            conn.database
        )
        test_engine = create_engine(db_url)
        with test_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return TestConnectionResponse(status=True, message="SQL DB connection successful")
    
    except Exception as e:
        return TestConnectionResponse(status=False, message=str(e))



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


@app.get("/overview/{conn_id}")
def get_overview(conn_id: int):
    db = next(get_db())
    conn = db.query(DBConnectionModel).filter(DBConnectionModel.id == conn_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    if conn.db_type == "MongoDB":
        try:
            is_srv = conn.db_hostname.endswith(".mongodb.net")
            prefix = "mongodb+srv" if is_srv else "mongodb"
            port_part = "" if is_srv else f":{conn.db_port}"
            db_url = f"{prefix}://{conn.user_id}:{conn.password}@{conn.db_hostname}{port_part}/{conn.database or 'admin'}"

            client = MongoClient(db_url)
            db_instance = client[conn.database or "admin"]
            collections = db_instance.list_collection_names()

            result = []
            for col in collections:
                sample = db_instance[col].find_one()
                if sample:
                    sample_fields = list(sample.keys())
                else:
                    sample_fields = []
                result.append({"name": col, "sample_fields": sample_fields})

            return {
                "db_type": "MongoDB",
                "collections": result
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(e)}")

    else:
        try:
            db_url = construct_connection_url(
                conn.db_type,
                conn.db_hostname,
                conn.db_port,
                conn.user_id,
                conn.password,
                conn.database
            )
            engine = create_engine(db_url)
            with engine.connect() as connection:
                # Fetch tables
                table_query = text("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                """)
                tables = connection.execute(table_query).fetchall()

                result = []
                for table_row in tables:
                    table_name = table_row[0]
                    column_query = text("""
                        SELECT column_name, data_type FROM information_schema.columns
                        WHERE table_name = :table_name
                    """)
                    columns = connection.execute(column_query, {"table_name": table_name}).fetchall()
                    result.append({
                        "name": table_name,
                        "columns": [{"name": col[0], "type": col[1]} for col in columns]
                    })

            return {
                "db_type": conn.db_type,
                "tables": result
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SQL DB Error: {str(e)}")
