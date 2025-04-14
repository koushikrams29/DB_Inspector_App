from fastapi import FastAPI, HTTPException, Depends
from typing import List
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from database import DATABASE_PATH

from models import (
    DBConnection,
    DBConnectionCreate,
    DBConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse,
    SUPPORTED_DB_TYPES
)
import database
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OR use ["http://localhost:5173"] to be more secure
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers (especially needed for JSON and auth)
)

def get_db_dependency():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)  # ✅ Correct DB file
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

async def test_db_connection(test_data: TestConnectionRequest) -> TestConnectionResponse:
    db_type = test_data.db_type
    host = test_data.db_hostname
    port = test_data.db_port
    user = test_data.user_id
    password = test_data.password
    database_name = test_data.database

    logger.info(f"Attempting to connect to {db_type} at {host}:{port} as {user} to database {database_name}")

    return TestConnectionResponse(status=True, message=f"Connection parameters provided for {db_type}.")

@app.post("/connections/", response_model=DBConnection, status_code=201)
def create_db_connection(connection: DBConnectionCreate, db: sqlite3.Connection = Depends(get_db_dependency)):
    connection_id = database.create_connection(db, connection.dict())
    return database.get_connection(db, connection_id)

@app.put("/connections/{connection_id}", response_model=DBConnection)
def update_db_connection(connection_id: int, connection: DBConnectionUpdate, db: sqlite3.Connection = Depends(get_db_dependency)):
    existing_connection = database.get_connection(db, connection_id)
    if not existing_connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    update_data = connection.dict(exclude_unset=True)
    if database.update_connection(db, connection_id, update_data):
        return database.get_connection(db, connection_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update connection")

@app.get("/connections/", response_model=List[DBConnection])
def list_db_connections(db: sqlite3.Connection = Depends(get_db_dependency)):
    return database.get_all_connections(db)

@app.get("/connections/{connection_id}", response_model=DBConnection)
def view_db_connection(connection_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    connection = database.get_connection(db, connection_id)
    if connection:
        return connection
    else:
        raise HTTPException(status_code=404, detail="Connection not found")

@app.delete("/connections/{connection_id}", status_code=204)
def delete_db_connection(connection_id: int, db: sqlite3.Connection = Depends(get_db_dependency)):
    if not database.get_connection(db, connection_id):
        raise HTTPException(status_code=404, detail="Connection not found")
    if not database.delete_connection(db, connection_id):
        raise HTTPException(status_code=500, detail="Failed to delete connection")
    return {"detail": "Connection deleted successfully"}

@app.post("/connections/test", response_model=TestConnectionResponse)
async def test_connection(test_data: TestConnectionRequest):
    return await test_db_connection(test_data)