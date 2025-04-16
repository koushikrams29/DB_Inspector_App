import importlib
from sqlalchemy import create_engine, text

from Backend.models.models import DBConnection, TestConnectionRequest,TestConnectionResponse



def get_flavor_service(flavor: str):
    module_path = f"Backend.services.flavor.{flavor.lower()}_flavor_service"
    class_name = f"{flavor.capitalize()}FlavorService"
    module = importlib.import_module(module_path)
    flavor_class = getattr(module, class_name)
    return flavor_class()


def _start_target_db_engine(connection: DBConnection):
    flavor_service = get_flavor_service(connection.db_type)
    
    connection_params = {
        "db_type": connection.db_type,
        "db_hostname": connection.db_hostname,
        "db_port": connection.db_port,
        "user_id": connection.user_id,
        "password": connection.password,
        "database": connection.database,
    }

    flavor_service.init(connection_params)
    connection_string = flavor_service.get_connection_string(connection.password)
    
    connect_args = {"connect_timeout": 3600}
    connect_args.update(flavor_service.get_connect_args())
    
    return create_engine(connection_string, connect_args=connect_args)


def retrieve_target_db_data(
    connection: DBConnection,
    sql_query: str,
    # decrypt: bool = False
):
    # if decrypt:
    #     connection.password = DecryptText(connection.password)  # Assuming this function is defined elsewhere
    
    db_engine = _start_target_db_engine(connection)
    
    with db_engine.connect() as conn:
        result = conn.execute(text(sql_query))
        return result.fetchall()


def test_connection(request: TestConnectionRequest) -> TestConnectionResponse:
    try:
        conn = DBConnection(
            name="test",
            db_type=request.db_type,
            db_hostname=request.db_hostname,
            db_port=request.db_port,
            user_id=request.user_id,
            password=request.password,
            database=request.database
        )

        sql_query = "SELECT 1;"
        results = retrieve_target_db_data(conn, sql_query)

        connection_successful = len(results) == 1 and results[0][0] == 1

        if connection_successful:
            return TestConnectionResponse(status=True, message="The connection was successful.")
        else:
            return TestConnectionResponse(status=False, message="Error completing a query to the database server.")

    except Exception as e:
        return TestConnectionResponse(status=False, message=f"Error attempting the connection: {str(e)}")
