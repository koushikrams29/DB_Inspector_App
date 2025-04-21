from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from typing import Optional, List

# Define the PostgreSQL database URL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:bhuvan@localhost:5432/postgres"  # Replace with your credentials

# Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a SessionLocal class to create database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define the base for declarative models
Base = declarative_base()

# Define the SQLAlchemy model for the 'connections' table
class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    db_type = Column(String, nullable=False)
    db_hostname = Column(String, nullable=False)
    db_port = Column(Integer, nullable=False)
    user_id = Column(String, nullable=False)
    password = Column(String, nullable=False)

# Function to create the tables in PostgreSQL
def create_tables():
    Base.metadata.create_all(bind=engine)

# Call create_tables to ensure the table exists
create_tables()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_connection(db: Session, connection: dict) -> int:
    db_connection = Connection(**connection)
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    return db_connection.id

def get_all_connections(db: Session) -> List[Connection]:
    return db.query(Connection).all()

def get_connection(db: Session, connection_id: int) -> Optional[Connection]:
    return db.query(Connection).filter(Connection.id == connection_id).first()

def update_connection(db: Session, connection_id: int, updated_data: dict) -> bool:
    db_connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if db_connection:
        for key, value in updated_data.items():
            setattr(db_connection, key, value)
        db.commit()
        return True
    return False

def delete_connection(db: Session, connection_id: int) -> bool:
    db_connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if db_connection:
        db.delete(db_connection)
        db.commit()
        return True
    return False