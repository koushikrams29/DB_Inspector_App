from typing import List, Dict, Any, Optional, Union
from uuid import uuid4, UUID
import base64
from sqlalchemy import create_engine, desc
from fastapi import Depends
from sqlalchemy.orm import sessionmaker, Session # Import Session
from fastapi import HTTPException
from Backend.models.models import (
    DBConnectionCreate,
    DBConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse,
    TableGroupCreate, # Use TableGroupCreate for input
    ConnectionProfilingRequest,
    DBConnectionOut, # Use DBConnectionOut for output
    TableGroupOut, # Use TableGroupOut for output
    ProfileResultOut,
    ProfilingRunOut,
    LatestProfilingRunDashboardData
)
from Backend.db.database import TableGroupModel, Connection, ProfileResultModel, ProfilingRunModel
from testgen.common.encrypt import EncryptText, DecryptText
from testgen.commands.queries.profiling_query import CProfilingSQL
import testgen.commands.run_profiling_bridge as rpb
#from testgen.commands.run_profiling_bridge import run_profiling_in_background
 
# Assuming ConnectionsPage is still used for the initial test connection
from testgen.ui.views.connections import ConnectionsPage
import logging
 
# Assuming you have a utility for password encryption/decryption
 
 
# Logging config
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger(__name__)
 
# SQLAlchemy setup
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:bhuvan@localhost:5432/postgres"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
 
# Utility functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
 
# API logic functions
 
#----------------------------test connection-----------------------------------
# Uses TestConnectionRequest Pydantic model for input
def test_connection_service(conn: TestConnectionRequest):
    try:
        con = ConnectionsPage()
        password = conn.password
        if any(c in password for c in ['/', '+', '=']) and len(password) > 30:
            password = DecryptText(password)
        # Maps fields from Pydantic model to the dictionary expected by ConnectionsPage
        connection_dict = {
            "sql_flavor": conn.sql_flavor.lower(),
            "project_host": conn.db_hostname,
            "project_port": conn.db_port, # TestConnectionRequest expects int port
            "project_db": conn.project_db,
            "project_user": conn.user_id,
            "password": password,
            "url": None,
            "connect_by_url": False,
            "connect_by_key": False,
            "private_key": None,
            "private_key_passphrase": None,
            "http_path": None,
        }
        status = con.test_connection(connection_dict)
        # Returns TestConnectionResponse Pydantic model
        return TestConnectionResponse(
            status=status.successful,
            message=status.message,
            details=status.details,
        )
    except Exception as e:
        LOG.error(f"Connection test failed: {e}")
        # Returns TestConnectionResponse Pydantic model on error
        return TestConnectionResponse(
            status=False,
            message=f"Connection test failed: {str(e)}",
            details=None,
        )
 
#-------------------------create connection---------------------------------
# Uses DBConnectionCreate Pydantic model for input and Connection SQLAlchemy model for DB interaction
def create_connection_service(conn_data: DBConnectionCreate, db: Session = next(get_db())):
    try:
        # Maps fields from DBConnectionCreate Pydantic model to Connection SQLAlchemy model
        db_conn = Connection(
            project_code=conn_data.project_code,
            connection_name=conn_data.connection_name,
            connection_description=conn_data.connection_description,
            sql_flavor=conn_data.sql_flavor,
            project_host=conn_data.project_host,
            project_port=conn_data.project_port,
            project_user=conn_data.project_user,
            project_db = conn_data.project_db,
            project_pw_encrypted = EncryptText(conn_data.password).encode('utf-8'),
            max_query_chars=conn_data.max_query_chars,
            url=conn_data.url,
            connect_by_url=conn_data.connect_by_url,
            connect_by_key=conn_data.connect_by_key,
            private_key=conn_data.private_key,
            private_key_passphrase=conn_data.private_key_passphrase,
            http_path=conn_data.http_path,
        )
        db.add(db_conn)
        db.commit()
        db.refresh(db_conn)
        # Returns DBConnectionOut Pydantic model by converting the SQLAlchemy object
        return DBConnectionOut.from_orm(db_conn)
    except Exception as e:
        db.rollback()
        LOG.error(f"Error creating connection: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating connection: {str(e)}")
 
 
#------------------------------------list all connection---------------------------------
# Queries the Connection SQLAlchemy model and returns a list of DBConnectionOut
def list_connections_service(db: Session = next(get_db())):
    try:
        connections = db.query(Connection).all()
        # Converts list of SQLAlchemy objects to list of DBConnectionOut Pydantic models
        return [DBConnectionOut.from_orm(conn) for conn in connections]
    except Exception as e:
        LOG.error(f"Error listing connections: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing connections: {str(e)}")
 
 
#--------------------get one connection---------------------------------
# Queries the Connection SQLAlchemy model by connection_id (BIGINT PK) and returns DBConnectionOut
def get_connection_service(conn_id: int, db: Session = next(get_db())):
    try:
        conn = db.query(Connection).filter(Connection.connection_id == conn_id).first()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")
        # Returns DBConnectionOut Pydantic model
        return DBConnectionOut.from_orm(conn)
    except Exception as e:
        LOG.error(f"Error getting connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting connection: {str(e)}")

 
 
#----------------------------update a connection---------------------------------
# Uses DBConnectionUpdate Pydantic model for input and updates Connection SQLAlchemy model
def update_connection_service(conn_id: int, conn_data: DBConnectionUpdate, db: Session = next(get_db())):
    try:
        conn = db.query(Connection).filter(Connection.connection_id == conn_id).first()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")
 
        # Gets update data from Pydantic model, excluding fields not set in the request
        update_data = conn_data.dict(exclude_unset=True)
 
        # Iterates through update data and sets attributes on the SQLAlchemy model
        for key, value in update_data.items():
            # Handles password encryption if password is being updated
            if key == "password" and value is not None:
                    setattr(conn, "project_pw_encrypted", EncryptText(value).encode('utf-8'))
            # Handles private key encryption if private_key is being updated
            elif key == "private_key" and value is not None:
                    setattr(conn, "private_key", value)
            # Handles private key passphrase encryption if private_key_passphrase is being updated
            elif key == "private_key_passphrase" and value is not None:
                    setattr(conn, "private_key_passphrase", value)
            # Check if the attribute exists on the SQLAlchemy model before setting
            elif hasattr(conn, key):
                    setattr(conn, key, value)
            else:
                    LOG.warning(f"Attempted to update non-existent attribute on Connection model: {key}")
 
 
        db.commit()
        db.refresh(conn)
        # Returns the updated connection as DBConnectionOut
        return DBConnectionOut.from_orm(conn)
    except Exception as e:
        db.rollback()
        LOG.error(f"Error updating connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating connection: {str(e)}")
 
 
#-------------------------------delete a connection---------------------------------
# Queries and deletes a Connection SQLAlchemy object by connection_id (BIGINT PK)
def delete_connection_service(conn_id: int, db: Session = next(get_db())):
    try:
        conn = db.query(Connection).filter(Connection.connection_id == conn_id).first()
        if not conn:
            raise HTTPException(status_code=404, detail="Connection not found")
        db.delete(conn)
        db.commit()
        return {"message": "Connection deleted successfully"}
    except Exception as e:
        db.rollback()
        LOG.error(f"Error deleting connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting connection: {str(e)}")
 
 
#--------------------------SQLquery generation for profiling---------------------------------
def profile_connection_service(conn_id: int, conn_data: ConnectionProfilingRequest):
    try:
        LOG.info(f"Received profiling request for connection ID: {conn_id}")
        # Maps fields from ConnectionProfilingRequest to CProfilingSQL parameters
        profiler = CProfilingSQL(
            strProjectCode=conn_data.project_code, # Use project_code from payload
            flavor=conn_data.db_type.lower() # Use db_type from payload
        )
        profiler.connection_id = str(conn_id) # Pass connection_id from URL
        # Assuming data_schema, data_table, contingency_columns are fixed or derived elsewhere
        # If these should come from the payload or a TableGroup, you'll need to adjust
        profiler.data_schema = "testdb"
        profiler.data_table = "land_registry_price"
        profiler.contingency_columns = "'property_type', 'city'"
 
        # Assuming GetContingencyCounts is the method you want to call
        result = profiler.GetContingencyCounts()
 
        return {"status": "success", "data": result}
    except Exception as e:
        LOG.error(f"Profiling failed for connection {conn_id}: {e}")
        # Returns a failure status and message
        return {"status":"failed", "data":str(e)}
 
 
#--------------------create table groups for a connection---------------------------------
def create_table_group_service(conn_id: int, table_group_data: TableGroupCreate, db: Session = next(get_db())):
    try:
        # Retrieves the connection to get the project_code
        connection = db.query(Connection).filter(Connection.connection_id == conn_id).first()
        if not connection:
            raise HTTPException(status_code=404, detail=f"Connection with id {conn_id} not found")
 
        project_code = connection.project_code
 
        # Explicitly map fields from TableGroupCreate Pydantic model to TableGroupModel SQLAlchemy model attributes
        db_group = TableGroupModel(
    project_code=project_code, # Assign project_code from the connection
    connection_id=conn_id, # Assign connection_id from URL parameter
    name=table_group_data.table_group_name,
    db_schema=table_group_data.table_group_schema,
    explicit_table_list=table_group_data.explicit_table_list,
    tables_to_include_mask=table_group_data.profiling_include_mask,
    profiling_exclude_mask=table_group_data.profiling_exclude_mask,
    profiling_id_column_mask=table_group_data.profile_id_column_mask,
    profiling_surrogate_key_column_mask=table_group_data.profile_sk_column_mask,
    profile_use_sampling=str(table_group_data.profile_use_sampling), # Ensure this is converted to string if Pydantic model is bool/enum
    profile_sample_percent=str(table_group_data.profile_sample_percent), # Ensure this is converted to string if Pydantic model is int
    profile_sample_min_count=table_group_data.profile_sample_min_count,
    min_profiling_age_days=str(table_group_data.min_profiling_age_days), # Ensure this is converted to string
    profile_flag_cdes=table_group_data.profile_flag_cdes,
    profile_do_pair_rules=str(table_group_data.profile_do_pair_rules), # Ensure this is converted to string
    profile_pair_rule_pct=table_group_data.profile_pair_rule_pct,
    description=table_group_data.description,
    data_source=table_group_data.data_source,
    source_system=table_group_data.source_system,
    source_process=table_group_data.source_process,
    data_location=table_group_data.data_location,
    business_domain=table_group_data.business_domain,
    stakeholder_group=table_group_data.stakeholder_group,
    transform_level=table_group_data.transform_level,
    data_product=table_group_data.data_product,
    # These fields likely come from profiling results, not creation payload:
    last_complete_profile_run_id=table_group_data.last_complete_profile_run_id,
    dq_score_profiling=table_group_data.dq_score_profiling,
    dq_score_testing=table_group_data.dq_score_testing,
)
        db.add(db_group)
        db.commit()
        db.refresh(db_group)
 
        # Manually construct the TableGroupOut object from the SQLAlchemy model
        # This ensures correct mapping and type conversions
        return TableGroupOut(
            id=db_group.id,
            project_code=db_group.project_code,
            connection_id=db_group.connection_id,
            table_group_name=db_group.name, # Map SQLA attribute 'name' to Pydantic 'table_group_name'
            table_group_schema=db_group.db_schema, # Map SQLA attribute 'db_schema' to Pydantic 'table_group_schema'
            explicit_table_list=db_group.explicit_table_list, # Convert string to list for Pydantic 'explicit_table_list'
            # FIX: Map SQLAlchemy attribute 'tables_to_include_mask' to Pydantic field 'profiling_include_mask'
            profiling_include_mask=db_group.tables_to_include_mask,
            # FIX: Map SQLAlchemy attribute 'tables_to_exclude_mask' to Pydantic field 'profiling_exclude_mask'
            profiling_exclude_mask=db_group.profiling_exclude_mask,
            profile_id_column_mask=db_group.profiling_id_column_mask, # Map SQLA attribute 'profiling_id_column_mask' to Pydantic 'profile_id_column_mask'
            profiling_surrogate_key_column_mask=db_group.profiling_surrogate_key_column_mask, # Map SQLA attribute 'profiling_surrogate_key_column_mask' to Pydantic 'profile_sk_column_mask'
            profile_use_sampling=db_group.profile_use_sampling, # Map SQLA attribute 'profile_use_sampling' to Pydantic 'profile_use_sampling'
            profile_sample_percent=db_group.profile_sample_percent, # Map SQLA attribute 'profile_sample_percent' to Pydantic 'profile_sample_percent'
            profile_sample_min_count=db_group.profile_sample_min_count, # Map SQLA attribute 'profile_sample_min_count' to Pydantic 'profile_sample_min_count'
            min_profiling_age_days=int(db_group.min_profiling_age_days) if db_group.min_profiling_age_days else 0, # Convert string to int for Pydantic 'min_profiling_age_days'
            profile_flag_cdes=db_group.profile_flag_cdes, # Map SQLA attribute 'profile_flag_cdes' to Pydantic 'profile_flag_cdes'
            profile_do_pair_rules=db_group.profile_do_pair_rules, # Map SQLA attribute 'profile_do_pair_rules' to Pydantic 'profile_do_pair_rules'
            profile_pair_rule_pct=db_group.profile_pair_rule_pct, # Map SQLA attribute 'profile_pair_rule_pct' to Pydantic 'profile_pair_rule_pct'
            description=db_group.description, # Map SQLA attribute 'description' to Pydantic 'description'
            data_source=db_group.data_source, # Map SQLA attribute 'data_source' to Pydantic 'data_source'
            source_system=db_group.source_system, # Map SQLA attribute 'source_system' to Pydantic 'source_system'
            source_process=db_group.source_process, # Map SQLA attribute 'source_process' to Pydantic 'source_process'
            data_location=db_group.data_location, # Map SQLA attribute 'data_location' to Pydantic 'data_location'
            business_domain=db_group.business_domain, # Map SQLA attribute 'business_domain' to Pydantic 'business_domain'
            stakeholder_group=db_group.stakeholder_group, # Map SQLA attribute 'stakeholder_group' to Pydantic 'stakeholder_group'
            transform_level=db_group.transform_level, # Map SQLA attribute 'transform_level' to Pydantic 'transform_level'
            data_product=db_group.data_product, # Map SQLA attribute 'data_product' to Pydantic 'data_product'
            last_complete_profile_run_id=db_group.last_complete_profile_run_id, # Map SQLA attribute 'last_complete_profile_run_id' to Pydantic 'last_complete_profile_run_id'
            dq_score_profiling=db_group.dq_score_profiling, # Map SQLA attribute 'dq_score_profiling' to Pydantic 'dq_score_profiling'
            dq_score_testing=db_group.dq_score_testing, # Map SQLA attribute 'dq_score_testing' to Pydantic 'dq_score_testing'
        )
    except Exception as e:
        db.rollback()
        LOG.error(f"Error creating table group for connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating table group: {str(e)}")
 
 
#--------------------get all table groups for a connection---------------------------------
# Queries the TableGroupModel SQLAlchemy model by connection_id and returns a list of TableGroupOut
def get_table_groups_service(conn_id: int, db: Session = next(get_db())):
    try:
        groups = db.query(TableGroupModel).filter(TableGroupModel.connection_id == conn_id).all()
        # Converts list of SQLAlchemy objects to list of TableGroupOut Pydantic models, handling conversions
        return [
            TableGroupOut(
                id=group.id,
                project_code=group.project_code,
                connection_id=group.connection_id,
                table_group_name=group.name, # Map SQLA attribute 'name' to Pydantic 'table_group_name'
                table_group_schema=group.db_schema, # Map SQLA attribute 'db_schema' to Pydantic 'table_group_schema'
                explicit_table_list=group.explicit_table_list, # Convert string to list for Pydantic 'explicit_table_list'
                # FIX: Map SQLAlchemy attribute 'tables_to_include_mask' to Pydantic field 'profiling_include_mask'
                profiling_include_mask=group.tables_to_include_mask,
                # FIX: Map SQLAlchemy attribute 'tables_to_exclude_mask' to Pydantic field 'profiling_exclude_mask'
                profiling_exclude_mask=group.profiling_exclude_mask,
                profile_id_column_mask=group.profiling_id_column_mask, # Map SQLA attribute 'profiling_id_column_mask' to Pydantic 'profile_id_column_mask'
                profiling_surrogate_key_column_mask=group.profiling_surrogate_key_column_mask, # Map SQLA attribute 'profiling_surrogate_key_column_mask' to Pydantic 'profile_sk_column_mask'
                profile_use_sampling=group.profile_use_sampling, # Map SQLA attribute 'profile_use_sampling' to Pydantic 'profile_use_sampling'
                profile_sample_percent=group.profile_sample_percent, # Map SQLA attribute 'profile_sample_percent' to Pydantic 'profile_sample_percent'
                profile_sample_min_count=group.profile_sample_min_count, # Map SQLA attribute 'profile_sample_min_count' to Pydantic 'profile_sample_min_count'
                min_profiling_age_days=int(group.min_profiling_age_days) if group.min_profiling_age_days else 0, # Convert string to int for Pydantic 'min_profiling_age_days'
                profile_flag_cdes=group.profile_flag_cdes, # Map SQLA attribute 'profile_flag_cdes' to Pydantic 'profile_flag_cdes'
                profile_do_pair_rules=group.profile_do_pair_rules, # Map SQLA attribute 'profile_do_pair_rules' to Pydantic 'profile_do_pair_rules'
                profile_pair_rule_pct=group.profile_pair_rule_pct, # Map SQLA attribute 'profile_pair_rule_pct' to Pydantic 'profile_pair_rule_pct'
                description=group.description, # Map SQLA attribute 'description' to Pydantic 'description'
                data_source=group.data_source, # Map SQLA attribute 'data_source' to Pydantic 'data_source'
                source_system=group.source_system, # Map SQLA attribute 'source_system' to Pydantic 'source_system'
                source_process=group.source_process, # Map SQLA attribute 'source_process' to Pydantic 'source_process'
                data_location=group.data_location, # Map SQLA attribute 'data_location' to Pydantic 'data_location'
                business_domain=group.business_domain, # Map SQLA attribute 'business_domain' to Pydantic 'business_domain'
                stakeholder_group=group.stakeholder_group, # Map SQLA attribute 'stakeholder_group' to Pydantic 'stakeholder_group'
                transform_level=group.transform_level, # Map SQLA attribute 'transform_level' to Pydantic 'transform_level'
                data_product=group.data_product, # Map SQLA attribute 'data_product' to Pydantic 'data_product'
                last_complete_profile_run_id=group.last_complete_profile_run_id, # Map SQLA attribute 'last_complete_profile_run_id' to Pydantic 'last_complete_profile_run_id'
                dq_score_profiling=group.dq_score_profiling, # Map SQLA attribute 'dq_score_profiling' to Pydantic 'dq_score_profiling'
                dq_score_testing=group.dq_score_testing, # Map SQLA attribute 'dq_score_testing' to Pydantic 'dq_score_testing'
            )
            for group in groups
        ]
    except Exception as e:
        LOG.error(f"Error getting table groups for connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting table groups: {str(e)}")
 
 
#--------------------get specific table group---------------------------------
# Queries the TableGroupModel by connection_id and id (UUID) and returns TableGroupOut
def get_specific_table_group_service(conn_id: int, group_id: str, db: Session = next(get_db())):
    try:
        group = db.query(TableGroupModel).filter(TableGroupModel.connection_id == conn_id, TableGroupModel.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Table group not found")
        # Returns TableGroupOut Pydantic model, handling conversions
        return TableGroupOut(
            id=group.id,
            project_code=group.project_code,
            connection_id=group.connection_id,
            table_group_name=group.name, # Map SQLA attribute 'name' to Pydantic 'table_group_name'
            table_group_schema=group.db_schema, # Map SQLA attribute 'db_schema' to Pydantic 'table_group_schema'
            explicit_table_list=group.explicit_table_list, # Convert string to list for Pydantic 'explicit_table_list'
            # FIX: Map SQLAlchemy attribute 'tables_to_include_mask' to Pydantic field 'profiling_include_mask'
            profiling_include_mask=group.tables_to_include_mask,
            # FIX: Map SQLAlchemy attribute 'tables_to_exclude_mask' to Pydantic field 'profiling_exclude_mask'
            profiling_exclude_mask=group.profiling_exclude_mask,
            profile_id_column_mask=group.profiling_id_column_mask, # Map SQLA attribute 'profiling_id_column_mask' to Pydantic 'profile_id_column_mask'
            profiling_surrogate_key_column_mask=group.profiling_surrogate_key_column_mask, # Map SQLA attribute 'profiling_surrogate_key_column_mask' to Pydantic 'profile_sk_column_mask'
            profile_use_sampling=group.profile_use_sampling, # Map SQLA attribute 'profile_use_sampling' to Pydantic 'profile_use_sampling'
            profile_sample_percent=group.profile_sample_percent, # Map SQLA attribute 'profile_sample_percent' to Pydantic 'profile_sample_percent'
            profile_sample_min_count=group.profile_sample_min_count, # Map SQLA attribute 'profile_sample_min_count' to Pydantic 'profile_sample_min_count'
            min_profiling_age_days=int(group.min_profiling_age_days) if group.min_profiling_age_days else 0, # Convert string to int for Pydantic 'min_profiling_age_days'
            profile_flag_cdes=group.profile_flag_cdes, # Map SQLA attribute 'profile_flag_cdes' to Pydantic 'profile_flag_cdes'
            profile_do_pair_rules=group.profile_do_pair_rules, # Map SQLA attribute 'profile_do_pair_rules' to Pydantic 'profile_do_pair_rules'
            profile_pair_rule_pct=group.profile_pair_rule_pct, # Map SQLA attribute 'profile_pair_rule_pct' to Pydantic 'profile_pair_rule_pct'
            description=group.description, # Map SQLA attribute 'description' to Pydantic 'description'
            data_source=group.data_source, # Map SQLA attribute 'data_source' to Pydantic 'data_source'
            source_system=group.source_system, # Map SQLA attribute 'source_system' to Pydantic 'source_system'
            source_process=group.source_process, # Map SQLA attribute 'source_process' to Pydantic 'source_process'
            data_location=group.data_location, # Map SQLA attribute 'data_location' to Pydantic 'data_location'
            business_domain=group.business_domain, # Map SQLA attribute 'business_domain' to Pydantic 'business_domain'
            stakeholder_group=group.stakeholder_group, # Map SQLA attribute 'stakeholder_group' to Pydantic 'stakeholder_group'
            transform_level=group.transform_level, # Map SQLA attribute 'transform_level' to Pydantic 'transform_level'
            data_product=group.data_product, # Map SQLA attribute 'data_product' to Pydantic 'data_product'
            last_complete_profile_run_id=group.last_complete_profile_run_id, # Map SQLA attribute 'last_complete_profile_run_id' to Pydantic 'last_complete_profile_run_id'
            dq_score_profiling=group.dq_score_profiling, # Map SQLA attribute 'dq_score_profiling' to Pydantic 'dq_score_profiling'
            dq_score_testing=group.dq_score_testing, # Map SQLA attribute 'dq_score_testing' to Pydantic 'dq_score_testing'
        )
    except Exception as e:
        LOG.error(f"Error getting table group {group_id} for connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting table group: {str(e)}")
 
 
#-----------------------delete table group--------------------------------------
# Queries and deletes a TableGroupModel object by connection_id and id (UUID)
def delete_table_group_service(conn_id: int, group_id: str, db: Session = next(get_db())):
    try:
        group = db.query(TableGroupModel).filter(TableGroupModel.connection_id == conn_id, TableGroupModel.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Table group not found")
        db.delete(group)
        db.commit()
        return {"message": "Table group deleted successfully"}
    except Exception as e:
        db.rollback()
        LOG.error(f"Error deleting table group {group_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting table group: {str(e)}")
 
 
#--------------------do background profiling job---------------------------------
# Triggers a background profiling job using the TableGroup UUID (str)
def trigger_profiling_service(conn_id: int, group_id: str):
    try:
        rpb.run_profiling_in_background(group_id)
        return {"status": "started", "message": "Profiling job launched in background"}
    except Exception as e:
        LOG.error(f"Error triggering profiling for group {group_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
#---------------------profiling results--------------------------------------------------------------------
def get_profiling_runs_by_connection(conn_id: int, db: Session):
    try:
        results = db.query(ProfilingRunModel).filter(ProfilingRunModel.connection_id == conn_id).all()
        if not results:
            raise HTTPException(status_code=404, detail="No profiling runs found for this connection.")
        return results
    except Exception as e:
        LOG.error(f"Error fetching profiling runs for connection {conn_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_profile_results_by_run_id(conn_id: int, profileresult_id: UUID, db: Session):
    try:
        results = db.query(ProfileResultModel).filter(
            ProfileResultModel.connection_id == conn_id,
            ProfileResultModel.profile_run_id == profileresult_id
        ).all()

        if not results:
            raise HTTPException(status_code=404, detail="No profile results found for this run.")

        # Convert ORM objects to Pydantic
        return [ProfileResultOut.from_orm(r) for r in results]

    except Exception as e:
        LOG.error(f"Error fetching profile results for run {profileresult_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_all_profiling_runs_service(db: Session):
    try:
        connections_count = db.query(Connection).count()
        table_groups_count = db.query(TableGroupModel).count()
        profiling_runs = db.query(ProfilingRunModel).all()

        formatted_runs = [
            {
                "connection_id": run.connection_id,
                "profiling_id": run.id,
                "status": run.status,
                "table_groups_id": run.table_groups_id,
                "created_at": run.profiling_starttime,
            }
            for run in profiling_runs
        ]

        return {
            "connections": connections_count,
            "table_groups": table_groups_count,
            "profiling_runs": len(profiling_runs),
            "runs": formatted_runs,
        }

    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard stats")
    
def get_latest_profiling_run_dashboard_data_service(db: Session) -> LatestProfilingRunDashboardData:
    latest_run = (
        db.query(ProfilingRunModel)
        .order_by(desc(ProfilingRunModel.profiling_starttime))
        .first()
    )

    if not latest_run:
        raise HTTPException(status_code=404, detail="No profiling run found")

    # Fetch profile results linked to the latest run
    results = (
        db.query(ProfileResultModel)
        .filter(ProfileResultModel.profile_run_id == latest_run.id)
        .all()
    )

    return LatestProfilingRunDashboardData(
        latest_run=latest_run,
        profile_results=results
    )
