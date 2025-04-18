from urllib.parse import quote_plus

from Backend.services.flavor.flavor_service import FlavorService


class DatabricksFlavorService(FlavorService):
    # def __init__(self):
    #     self.http_path = None

    # def get_connection_string_head(self, strPW):
    #     strConnect = f"{self.flavor}://{self.username}:{quote_plus(strPW)}@"
    #     return strConnect

    # def get_connection_string_from_fields(self, strPW, is_password_overwritten: bool = False):  # NOQA ARG002
    #     strConnect = (
    #         f"{self.flavor}://{self.username}:{quote_plus(strPW)}@{self.host}:{self.port}/{self.dbname}"
    #         f"?http_path={self.http_path}"
    #     )
    #     return strConnect

    # def get_pre_connection_queries(self):
    #     return []

    # def get_connect_args(self, is_password_overwritten: bool = False):  # NOQA ARG002
    #     return {}


    def init(self, connection_params: dict):
        super().init(connection_params)
        self.http_path = connection_params.get("http_path", None)

    def get_connection_string_head(self, strPW):
        return f"{self.flavor}://{self.username}:{quote_plus(strPW)}@"

    def get_connection_string_from_fields(self, strPW, is_password_overwritten: bool = False):
        conn_str = (
            f"{self.flavor}://{self.username}:{quote_plus(strPW)}@{self.host}:{self.port}/{self.dbname}"
        )
        if self.http_path:
            conn_str += f"?http_path={self.http_path}"
        return conn_str

    def get_pre_connection_queries(self):
        return []

    def get_connect_args(self, is_password_overwritten: bool = False):
        return {}
