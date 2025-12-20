import pytest
import pandas as pd
from pathlib import Path
from dataguard.engine.duckdb_engine import DuckDBEngine

@pytest.fixture
def engine():
    """Create an in-memory DuckDB engine for testing."""
    db = DuckDBEngine()
    yield db
    db.close()

def test_connection(engine):
    """Test that the engine initializes and connects."""
    result = engine.query("SELECT 1")
    assert result == [(1,)]

def test_execute_query(engine):
    """Test executing a simple query."""
    engine.execute("CREATE TABLE test (id INTEGER, name VARCHAR)")
    engine.execute("INSERT INTO test VALUES (1, 'Alice'), (2, 'Bob')")
    
    result = engine.query("SELECT * FROM test ORDER BY id")
    assert len(result) == 2
    assert result[0] == (1, 'Alice')
    assert result[1] == (2, 'Bob')

def test_query_df(engine):
    """Test querying results as a DataFrame."""
    engine.execute("CREATE TABLE test_df (val INTEGER)")
    engine.execute("INSERT INTO test_df VALUES (10), (20)")
    
    df = engine.query_df("SELECT * FROM test_df ORDER BY val")
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 2
    assert df.iloc[0]['val'] == 10

def test_load_csv(engine, tmp_path):
    """Test loading a CSV file."""
    csv_path = tmp_path / "data.csv"
    df = pd.DataFrame({'a': [1, 2], 'b': ['x', 'y']})
    df.to_csv(csv_path, index=False)
    
    engine.load_file(str(csv_path), "loaded_csv")
    
    assert engine.table_exists("loaded_csv")
    result = engine.query("SELECT * FROM loaded_csv ORDER BY a")
    assert len(result) == 2
    assert result[0] == (1, 'x')

def test_load_parquet(engine, tmp_path):
    """Test loading a Parquet file."""
    pq_path = tmp_path / "data.parquet"
    df = pd.DataFrame({'col1': [100, 200]})
    df.to_parquet(pq_path)
    
    engine.load_file(str(pq_path), "loaded_pq")
    
    assert engine.table_exists("loaded_pq")
    result = engine.query("SELECT * FROM loaded_pq")
    assert len(result) == 2

def test_file_not_found(engine):
    """Test loading a non-existent file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError):
        engine.load_file("nonexistent.csv", "table")

def test_unsupported_format(engine, tmp_path):
    """Test that unsupported file extensions raise ValueError."""
    txt_path = tmp_path / "data.txt"
    txt_path.touch()
    
    with pytest.raises(ValueError, match="Unsupported file format"):
        engine.load_file(str(txt_path), "table")

def test_get_schema(engine):
    """Test retrieving table schema."""
    engine.execute("CREATE TABLE schema_test (id INTEGER, score DOUBLE)")
    schema = engine.get_schema("schema_test")
    
    assert "id" in schema
    assert "score" in schema
    # DuckDB type names can vary slightly by version, but usually INTEGER/DOUBLE
    assert "INTEGER" in schema["id"]
    assert "DOUBLE" in schema["score"]
