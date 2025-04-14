import sqlite3
from pathlib import Path

DATABASE_FILE = "connections.db"
DATABASE_PATH = Path(__file__).parent / DATABASE_FILE

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  
    try:
        yield conn
    finally:
        conn.close()

def create_tables():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            db_type TEXT NOT NULL,
            db_hostname TEXT NOT NULL,
            db_port INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            password TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


create_tables()

def create_connection(conn: sqlite3.Connection, connection: dict) -> int:
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO connections (name, description, db_type, db_hostname, db_port, user_id, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        connection['name'],
        connection.get('description'),
        connection['db_type'],
        connection['db_hostname'],
        connection['db_port'],
        connection['user_id'],
        connection['password']
    ))
    conn.commit()
    return cursor.lastrowid

def get_all_connections(conn: sqlite3.Connection) -> list:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM connections")
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

def get_connection(conn: sqlite3.Connection, connection_id: int) -> dict | None:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM connections WHERE id = ?", (connection_id,))
    row = cursor.fetchone()
    return dict(row) if row else None

def update_connection(conn: sqlite3.Connection, connection_id: int, updated_data: dict) -> bool:
    cursor = conn.cursor()
    set_clauses = []
    values = []
    for key, value in updated_data.items():
        if key != 'id':
            set_clauses.append(f"{key} = ?")
            values.append(value)
    values.append(connection_id)
    sql = f"UPDATE connections SET {', '.join(set_clauses)} WHERE id = ?"
    cursor.execute(sql, tuple(values))
    conn.commit()
    return cursor.rowcount > 0

def delete_connection(conn: sqlite3.Connection, connection_id: int) -> bool:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM connections WHERE id = ?", (connection_id,))
    conn.commit()
    return cursor.rowcount > 0