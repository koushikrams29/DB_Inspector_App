from fastapi import FastAPI, HTTPException, Depends 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import logging
import os
# Get the absolute path to the directory containing backend_services.py
backend_dir = os.path.dirname(os.path.abspath(__file__))
# Get the absolute path to the parent directory (DB_Inspector_App)
parent_dir = os.path.dirname(backend_dir)
# Logging config
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger(__name__)
LOG.info(f"Backend directory: {backend_dir}")
LOG.info(f"Backend directory: {parent_dir}")
# Add the parent directory to sys.path temporarily
sys.path.insert(0, parent_dir)

from Backend.backend_services import(
    test_connection_service,
    create_connection_service,
    list_connections_service,
    get_connection_service,
    update_connection_service,
    delete_connection_service,
    create_table_group_service,
    get_table_groups_service,
    get_specific_table_group_service,
    delete_table_group_service,
    profile_connection_service,
    trigger_profiling_service,
    get_profile_results_by_run_id,
    get_profiling_runs_by_connection,
    get_all_profiling_runs_service,
    get_latest_profiling_run_dashboard_data_service
)
from Backend.models.models import (
    DBConnectionCreate,
    DBConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse,
    TableGroupCreate, # Use TableGroupCreate for input
    ConnectionProfilingRequest,
    DBConnectionOut, # Use DBConnectionOut for output
    TableGroupOut,
    ProfileResultOut,
    ProfilingRunOut,
    TriggerProfilingRequest,
    RunInfo,
    DashboardStats,
    LatestProfilingRunDashboardData
    )
from pydantic import BaseModel
from typing import List, Dict, Any # Import Dict and Any for the profiling response
from uuid import UUID

# Import the get_db dependency from your database file
from Backend.db.database import get_db
from sqlalchemy.orm import Session 

app = FastAPI()

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Consider restricting this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# --- Connection Endpoints ---

@app.post("/connections/test", response_model=TestConnectionResponse)
def test_connection_route(conn: TestConnectionRequest):
    return test_connection_service(conn)

@app.post("/connections", response_model=DBConnectionOut)
def create_connection_route(conn_data: DBConnectionCreate, db: Session = Depends(get_db)):
    return create_connection_service(conn_data=conn_data, db=db)

@app.get("/connections", response_model=List[DBConnectionOut])
def list_connections_route(db: Session = Depends(get_db)):
    return list_connections_service(db=db)

@app.get("/connections/{connection_id}", response_model=DBConnectionOut)
def get_connection_route(connection_id: int, db: Session = Depends(get_db)):
    return get_connection_service(conn_id=connection_id, db=db)

@app.put("/connections/{connection_id}", response_model=DBConnectionOut)
def update_connection_route(connection_id: int, conn_data: DBConnectionUpdate, db: Session = Depends(get_db)):
    return update_connection_service(conn_id=connection_id, conn_data=conn_data, db=db)

@app.delete("/connections/{connection_id}")
def delete_connection_route(connection_id: int, db: Session = Depends(get_db)):
    return delete_connection_service(conn_id=connection_id, db=db)

# --- Profiling Endpoint ---

@app.post("/connection/{connection_id}/profiling", response_model=Dict[str, Any]) 
def profile_connection_route(connection_id: int, conn_data: ConnectionProfilingRequest):
    return profile_connection_service(conn_id=connection_id, conn_data=conn_data)

# --- Table Group Endpoints ---

@app.post("/connection/{connection_id}/table-groups/", response_model=TableGroupOut)
def create_table_group_route(connection_id: int, table_group_data: TableGroupCreate, db: Session = Depends(get_db)):
    return create_table_group_service(conn_id=connection_id, table_group_data=table_group_data, db=db)

@app.get("/connection/{connection_id}/table-groups/", response_model=List[TableGroupOut])
def get_table_groups_route(connection_id: int, db: Session = Depends(get_db)):
    return get_table_groups_service(conn_id=connection_id, db=db)

@app.get("/connection/{connection_id}/table-groups/{group_id}", response_model=TableGroupOut)
def get_specific_table_group_route(connection_id: int, group_id: str, db: Session = Depends(get_db)):
    return get_specific_table_group_service(conn_id=connection_id, group_id=group_id, db=db)

@app.delete("/connection/{connection_id}/table-groups/{group_id}")
def delete_table_group_route(connection_id: int, group_id: str, db: Session = Depends(get_db)):
    return delete_table_group_service(conn_id=connection_id, group_id=group_id, db=db)

# --- Trigger Background Profiling Endpoint ---

@app.post("/run-profiling")
def trigger_profiling_route(request_data: TriggerProfilingRequest):
    return trigger_profiling_service(conn_id=request_data.connection_id, group_id=request_data.table_group_id)


#----------   Profiling Endpoints   ----------
@app.get("/{conn_id}/profileresult", response_model=List[ProfilingRunOut])
def get_profiling_runs_route(conn_id: int, db: Session = Depends(get_db)):
    return get_profiling_runs_by_connection(conn_id, db)


@app.get("/{conn_id}/profileresult/{profileresult_id}", response_model=List[ProfileResultOut])
def get_profile_results_route(conn_id: int, profileresult_id: UUID, db: Session = Depends(get_db)):
    return get_profile_results_by_run_id(conn_id, profileresult_id, db)

@app.get("/home", response_model=DashboardStats)
def get_all_profiling_runs(db: Session = Depends(get_db)):
    return get_all_profiling_runs_service(db)

@app.get("/latest-profiling-run", response_model=LatestProfilingRunDashboardData)
def get_latest_profiling_run_dashboard_data(db: Session = Depends(get_db)):
    return get_latest_profiling_run_dashboard_data_service(db)