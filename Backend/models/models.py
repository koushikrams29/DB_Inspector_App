from pydantic import BaseModel, Field, UUID4
from typing import Optional, Literal, List, Union
from uuid import UUID
from datetime import datetime

SUPPORTED_DB_TYPES = Literal[
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "Oracle",
    "SQL Server",
    "MongoDB",
    "Snowflake",
    "Redshift"
]

class ConnectionBase(BaseModel):
    # This model is used for input (Create) and as a base for Update
    # It includes the password field because the user provides it during creation/update
    project_code: str = Field(..., description="Code identifying the project this connection belongs to")
    connection_name: str = Field(..., description="Name of the database connection")
    connection_description: Optional[str] = Field(None, description="Description of the connection")
    sql_flavor: SUPPORTED_DB_TYPES = Field(..., description=f"Database type/flavor. Select from: {list(SUPPORTED_DB_TYPES.__args__)}")
    project_host: str = Field(..., description="Database Hostname")
    project_port: str = Field(..., description="Database Port (as string)")
    project_user: str = Field(..., description="Database User ID")
    password: str = Field(..., description="Database Password (will be encrypted before saving)") # Password is required for input
    project_db: str = Field(None, description="Database Name")
    max_threads: Optional[int] = Field(4, description="Maximum threads for connection operations")
    max_query_chars: Optional[int] = Field(None, description="Maximum characters for queries")
    url: Optional[str] = Field('', description="Connection URL (if connecting by URL)")
    connect_by_url: Optional[bool] = Field(False, description="Connect using URL")
    connect_by_key: Optional[bool] = Field(False, description="Connect using private key")
    private_key: Optional[str] = Field(None, description="Private Key (if connecting by key)")
    private_key_passphrase: Optional[str] = Field(None, description="Private Key Passphrase (if connecting by key)")
    http_path: Optional[str] = Field(None, description="HTTP Path (if applicable)")


class DBConnectionCreate(ConnectionBase):
    # Inherits all fields from ConnectionBase, including the required password for creation
    pass


class DBConnectionUpdate(BaseModel):
    # This model is used for update input. All fields are optional.
    # Password is optional here because it's only sent if the user changes it.
    project_code: Optional[str] = Field(None, description="Code identifying the project this connection belongs to")
    connection_name: Optional[str] = Field(None, description="Name of the database connection")
    connection_description: Optional[str] = Field(None, description="Description of the connection")
    sql_flavor: Optional[SUPPORTED_DB_TYPES] = Field(None, description=f"Database type/flavor. Select from: {list(SUPPORTED_DB_TYPES.__args__)}")
    project_host: Optional[str] = Field(None, description="Database Hostname")
    project_port: Optional[str] = Field(None, description="Database Port (as string)")
    project_user: Optional[str] = Field(None, description="Database User ID")
    password: str = Field(..., description="Database Password (will be encrypted before saving)")
    project_db: Optional[str] = Field(None, description="Database Name (if applicable)")
    max_threads: Optional[int] = Field(None, description="Maximum threads for connection operations")
    max_query_chars: Optional[int] = Field(None, description="Maximum characters for queries")
    url: Optional[str] = Field(None, description="Connection URL (if connecting by URL)")
    connect_by_url: Optional[bool] = Field(None, description="Connect using URL")
    connect_by_key: Optional[bool] = Field(None, description="Connect using private key")
    private_key: Optional[str] = Field(None, description="Private Key (if connecting by key)")
    private_key_passphrase: Optional[str] = Field(None, description="Private Key Passphrase (if connecting by key)")
    http_path: Optional[str] = Field(None, description="HTTP Path (if applicable)")


# Model for representing a Connection retrieved from the database (Output Model)
# This model does NOT inherit from ConnectionBase and does NOT include the raw password.
class DBConnectionOut(BaseModel):
    # Include fields that are safe to return from the database
    id: Union[UUID, str] # UUID from DB
    connection_id: int # BIGINT PK from DB
    project_code: str
    connection_name: str
    connection_description: Optional[str] = None
    sql_flavor: str # Return as string, not Literal, as DB stores string
    project_host: str
    project_port: str
    project_user: str
    project_pw_encrypted: str 
    project_db: str
    max_threads: Optional[int] = None
    max_query_chars: Optional[int] = None
    url: Optional[str] = None
    connect_by_url: Optional[bool] = None
    connect_by_key: Optional[bool] = None
    # private_key and private_key_passphrase are NOT included for security
    http_path: Optional[str] = None

    class Config:
        # Allows Pydantic to read from SQLAlchemy model attributes (orm_mode)
        orm_mode = True
        # Allows population by field name or alias (important for mapping SQL column names)
        allow_population_by_field_name = True



class TestConnectionRequest(BaseModel):
    # This model is specifically for the test endpoint input
    sql_flavor: str = Field(
        ..., title="Database Type", description="Select from: PostgreSQL, MSSQL, Oracle, SQL Server, Snowflake, Redshift"
    )
    db_hostname: str = Field(..., title="DB Hostname")
    db_port: int = Field(..., title="DB Port") # Test connection expects integer port
    user_id: str = Field(..., title="User ID")
    password: str = Field(..., title="Password")
    project_db: Optional[str] = Field(None, title="Database Name (if applicable)")


class TestConnectionResponse(BaseModel):
    status: bool
    message: str
    details: Optional[str] = None


class TableGroupBase(BaseModel):
    # Base model for Table Group input/output fields
    table_group_name: str = Field(..., description="Name of the table group")
    table_group_schema: Optional[str] = Field(None, description="Database schema for the table group")
    explicit_table_list: Optional[str] = Field(None, description="List of tables included in the group")
    profiling_include_mask: Optional[str] = Field(None, description="Mask for tables to include")
    profiling_exclude_mask: Optional[str] = Field(None, description="Mask for tables to exclude")
    profile_id_column_mask: Optional[str] = Field('%id', description="Mask for ID columns")
    profile_sk_column_mask: Optional[str] = Field('%_sk', description="Mask for surrogate key columns")
    profile_use_sampling: Optional[str] = Field('N', description="Use sampling ('Y'/'N')")
    profile_sample_percent: Optional[str] = Field('30', description="Sample percentage (as string)")
    profile_sample_min_count: Optional[int] = Field(100000, description="Minimum sample count")
    min_profiling_age_days: Optional[int] = Field(0, description="Minimum profiling age in days") # Pydantic is int, DB is string
    profile_flag_cdes: Optional[bool] = Field(True, description="Flag CDEs")
    profile_do_pair_rules: Optional[str] = Field('N', description="Do pair rules ('Y'/'N')")
    profile_pair_rule_pct: Optional[int] = Field(95, description="Pair rule percentage")
    description: Optional[str] = Field(None, description="Description of the table group")
    data_source: Optional[str] = Field(None, description="Data source")
    source_system: Optional[str] = Field(None, description="Source system")
    source_process: Optional[str] = Field(None, description="Source process")
    data_location: Optional[str] = Field(None, description="Data location")
    business_domain: Optional[str] = Field(None, description="Business domain")
    stakeholder_group: Optional[str] = Field(None, description="Stakeholder group")
    transform_level: Optional[str] = Field(None, description="Transform level")
    data_product: Optional[str] = Field(None, description="Data product")
    last_complete_profile_run_id: Optional[Union[UUID, str]] = Field(None, description="Last complete profile run ID")
    dq_score_profiling: Optional[float] = Field(None, description="DQ score from profiling")
    dq_score_testing: Optional[float] = Field(None, description="DQ score from testing")


class TableGroupCreate(TableGroupBase):
    # Inherits fields from TableGroupBase for creation input
    pass


class TableGroupOut(TableGroupBase):
    # Output model for Table Group, includes DB-generated fields
    id: Union[UUID, str] # UUID from DB
    project_code: str
    connection_id: int # BIGINT from DB

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class ConnectionProfilingRequest(BaseModel):
    # This model is specifically for the profiling endpoint input body
    db_type: str # Should map to sql_flavor in backend service
    db_hostname: str # Should map to project_host
    db_port: int # Should map to project_port (str in DB, int in this model)
    user: str # Should map to project_user
    password: str # Should map to password input (encrypted as project_pw_encrypted)
    database: str # Should map to project_db
    project_code: str = "DEFAULT" # Should map to project_code

class ProfilingRunOut(BaseModel):
    id: UUID
    project_code: str
    connection_id: int
    table_groups_id: UUID
    profiling_starttime: Optional[datetime]
    profiling_endtime: Optional[datetime]
    status: Optional[str]
    log_message: Optional[str]
    table_ct: Optional[int]
    column_ct: Optional[int]
    anomaly_ct: Optional[int]
    anomaly_table_ct: Optional[int]
    anomaly_column_ct: Optional[int]
    dq_affected_data_points: Optional[int]
    dq_total_data_points: Optional[int]
    dq_score_profiling: Optional[float]
    process_id: Optional[int]

    class Config:
        orm_mode = True


class ProfileResultOut(BaseModel):
    id: UUID4
    dk_id: Optional[int]
    column_id: Optional[UUID4]
    project_code: Optional[str]
    connection_id: Optional[int]
    table_groups_id: Optional[UUID4]
    profile_run_id: Optional[UUID4]
    schema_name: Optional[str]
    run_date: Optional[datetime]
    table_name: Optional[str]
    position: Optional[int]
    column_name: Optional[str]
    column_type: Optional[str]
    general_type: Optional[str]
    record_ct: Optional[int]
    value_ct: Optional[int]
    distinct_value_ct: Optional[int]
    distinct_std_value_ct: Optional[int]
    null_value_ct: Optional[int]
    min_length: Optional[int]
    max_length: Optional[int]
    avg_length: Optional[float]
    zero_value_ct: Optional[int]
    zero_length_ct: Optional[int]
    lead_space_ct: Optional[int]
    quoted_value_ct: Optional[int]
    includes_digit_ct: Optional[int]
    filled_value_ct: Optional[int]
    min_text: Optional[str]
    max_text: Optional[str]
    upper_case_ct: Optional[int]
    lower_case_ct: Optional[int]
    non_alpha_ct: Optional[int]
    mixed_case_ct: Optional[int]
    numeric_ct: Optional[int]
    date_ct: Optional[int]
    top_patterns: Optional[str]
    top_freq_values: Optional[str]
    distinct_value_hash: Optional[str]
    min_value: Optional[float]
    min_value_over_0: Optional[float]
    max_value: Optional[float]
    avg_value: Optional[float]
    stdev_value: Optional[float]
    percentile_25: Optional[float]
    percentile_50: Optional[float]
    percentile_75: Optional[float]
    fractional_sum: Optional[float]
    min_date: Optional[datetime]
    max_date: Optional[datetime]
    before_1yr_date_ct: Optional[int]
    before_5yr_date_ct: Optional[int]
    before_20yr_date_ct: Optional[int]
    before_100yr_date_ct: Optional[int]
    within_1yr_date_ct: Optional[int]
    within_1mo_date_ct: Optional[int]
    future_date_ct: Optional[int]
    distant_future_date_ct: Optional[int]
    date_days_present: Optional[int]
    date_weeks_present: Optional[int]
    date_months_present: Optional[int]
    boolean_true_ct: Optional[int]
    datatype_suggestion: Optional[str]
    distinct_pattern_ct: Optional[int]
    embedded_space_ct: Optional[int]
    avg_embedded_spaces: Optional[float]
    std_pattern_match: Optional[str]
    pii_flag: Optional[str]
    functional_data_type: Optional[str]
    functional_table_type: Optional[str]
    sample_ratio: Optional[float]

    class Config:
        orm_mode = True
        
        
class TriggerProfilingRequest(BaseModel):
    connection_id: int
    table_group_id: str
    
class RunInfo(BaseModel):
    connection_id: int
    profiling_id: UUID
    status: str
    table_groups_id: UUID
    created_at: datetime

class DashboardStats(BaseModel):
    connections: int
    table_groups: int
    profiling_runs: int
    runs: List[RunInfo]
    
    
class LatestProfilingRunDashboardData(BaseModel):
    latest_run: ProfilingRunOut
    profile_results: List[ProfileResultOut]

    class Config:
        orm_mode = True