from abc import abstractmethod
from Backend.models.models import DBConnection


"""SKIP_DATABASE_CERTIFICATE_VERIFICATION is being hard coded because we do not have a settings file as of now, and in the settings its set to no by default. so hard coding it to be no. 
Will Implement in future"""
SKIP_DATABASE_CERTIFICATE_VERIFICATION = 'no'


class FlavorService:

    url = None
    connect_by_url = False
    username = None
    host = None
    port = None
    dbname = None
    flavor = None
    dbschema = None
    connect_by_key = False
    private_key = None
    private_key_passphrase = None
    http_path = None
    catalog = None

    def init(self, connection: DBConnection):
        self.url = None
        self.connect_by_url = False
        self.username = connection.user_id
        self.host = connection.db_hostname
        self.port = connection.db_port
        self.dbname = connection.database
        self.flavor = connection.db_type
        self.dbschema = None
        self.connect_by_key = False
        self.http_path = None
        self.catalog = None

    def override_user(self, user_override: str):
        self.username = user_override

    def get_db_name(self) -> str:
        return self.dbname

    def is_connect_by_key(self) -> bool:
        return self.connect_by_key

    def get_connect_args(self, is_password_overwritten: bool = False):
        if SKIP_DATABASE_CERTIFICATE_VERIFICATION:
            return {"TrustServerCertificate": "yes"}
        return {}

    def get_concat_operator(self):
        return "||"

    def get_connection_string(self, password: str, is_password_overwritten: bool = False):
        if self.connect_by_url:
            header = self.get_connection_string_head(password)
            return header + self.url
        return self.get_connection_string_from_fields(password, is_password_overwritten)

    @abstractmethod
    def get_connection_string_from_fields(self, password: str, is_password_overwritten: bool = False):
        raise NotImplementedError("Subclasses must implement this method")

    @abstractmethod
    def get_connection_string_head(self, password: str):
        raise NotImplementedError("Subclasses must implement this method")