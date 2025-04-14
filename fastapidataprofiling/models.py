from pydantic import BaseModel, Field
from typing import Optional, Literal

SUPPORTED_DB_TYPES = ["PostgreSQL", "MySQL", "SQLite", "Oracle", "SQL Server"]

class DBConnection(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., title="Connection Name")
    description: Optional[str] = Field(None, title="Description of the connection")
    db_type: Literal["PostgreSQL", "MySQL", "SQLite", "Oracle", "SQL Server"] = Field(..., title="Database Type", description=f"Select from: {SUPPORTED_DB_TYPES}")
    db_hostname: str = Field(..., title="DB Hostname")
    db_port: int = Field(..., title="DB Port")
    user_id: str = Field(..., title="User ID")
    password: str = Field(..., title="Password") 

class DBConnectionCreate(BaseModel):
    name: str = Field(..., title="Connection Name")
    description: Optional[str] = Field(None, title="Description of the connection")
    db_type: Literal["PostgreSQL", "MySQL", "SQLite", "Oracle", "SQL Server"] = Field(..., title="Database Type", description=f"Select from: {SUPPORTED_DB_TYPES}")
    db_hostname: str = Field(..., title="DB Hostname")
    db_port: int = Field(..., title="DB Port")
    user_id: str = Field(..., title="User ID")
    password: str = Field(..., title="Password")
    

class DBConnectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    db_type: Optional[Literal["PostgreSQL", "MySQL", "SQLite", "Oracle", "SQL Server"]] = None
    db_hostname: Optional[str] = None
    db_port: Optional[int] = None
    user_id: Optional[str] = None
    password: Optional[str] = None
    

class TestConnectionRequest(BaseModel):
    db_type: Literal["PostgreSQL", "MySQL", "SQLite", "Oracle", "SQL Server"] = Field(..., title="Database Type", description=f"Select from: {SUPPORTED_DB_TYPES}")
    db_hostname: str = Field(..., title="DB Hostname")
    db_port: int = Field(..., title="DB Port")
    user_id: str = Field(..., title="User ID")
    password: str = Field(..., title="Password")
    database: Optional[str] = Field(None, title="Database Name (if applicable)") # Some DBs require database name for connection

class TestConnectionResponse(BaseModel):
    status: bool
    message: str