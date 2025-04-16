from urllib.parse import quote_plus
from Backend.services.flavor.flavor_service import FlavorService


class RedshiftFlavorService(FlavorService):
    def get_connection_string_head(self, strPW):
        strConnect = f"{self.flavor}://{self.username}:{quote_plus(strPW)}@"
        return strConnect

    def get_connection_string_from_fields(self, strPW, is_password_overwritten: bool = False):  # NOQA ARG002
        # Use the updated attribute names initialized from connection_params
        strConnect = (
            f"{self.flavor}://{self.username}:{quote_plus(strPW)}@"
            f"{self.host}:{self.port}/{self.dbname}"
        )
        return strConnect

    def get_pre_connection_queries(self):
        if self.dbschema:
            return [f"SET SEARCH_PATH = '{self.dbschema}'"]
        return []

    def get_connect_args(self, is_password_overwritten: bool = False):  # NOQA ARG002
        return {}
