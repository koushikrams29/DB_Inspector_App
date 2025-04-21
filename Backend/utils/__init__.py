from uuid import UUID

def is_uuid4(value: str) -> bool:
    try:
        uuid = UUID(value, version=4)
    except Exception:
        return False

    return str(uuid) == value

def chunk_queries(queries: list[str], join_string: str, max_query_length: int) -> list[str]:
    full_query = join_string.join(queries)
    if len(full_query) <= max_query_length:
        return [full_query]

    queries = iter(queries)
    chunked_queries = []
    current_chunk = next(queries)
    for query in queries:
        temp_chunk = join_string.join([current_chunk, query])
        if len(temp_chunk) <= max_query_length:
            current_chunk = temp_chunk
        else:
            chunked_queries.append(current_chunk)
            current_chunk = query
    chunked_queries.append(current_chunk)

    return chunked_queries
    