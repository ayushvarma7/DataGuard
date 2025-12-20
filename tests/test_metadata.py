import pytest
import sqlite3
from datetime import datetime
from dataguard.storage.metadata import MetadataStore
from dataguard.storage.models import Dataset, TableSchema, ColumnSchema

@pytest.fixture
def store(tmp_path):
    """Create a MetadataStore with a temporary database file."""
    db_file = tmp_path / "test.db"
    return MetadataStore(str(db_file))

def test_init_db(store):
    """Test that tables are created."""
    conn = sqlite3.connect(store.db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    assert "datasets" in tables
    assert "schema_snapshots" in tables

def test_register_and_get_dataset(store):
    """Test registering and retrieving a dataset."""
    ds = Dataset(
        name="test_ds", 
        file_path="/tmp/test.csv", 
        format="csv"
    )
    store.register_dataset(ds)
    
    retrieved = store.get_dataset("test_ds")
    assert retrieved is not None
    assert retrieved.name == "test_ds"
    assert retrieved.file_path == "/tmp/test.csv"
    assert retrieved.format == "csv"

def test_get_nonexistent_dataset(store):
    """Test retrieving a dataset that doesn't exist."""
    assert store.get_dataset("ghost") is None

def test_save_and_get_schema(store):
    """Test saving and retrieving schema snapshots."""
    # 1. Register dataset
    ds = Dataset(name="sales", file_path="sales.parquet", format="parquet")
    store.register_dataset(ds)
    
    # 2. Create schema
    schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER"),
        ColumnSchema(name="amount", dtype="DOUBLE")
    ])
    
    # 3. Save snapshot
    store.save_schema_snapshot("sales", schema)
    
    # 4. Retrieve latest
    latest = store.get_latest_schema("sales")
    assert latest is not None
    assert len(latest.columns) == 2
    assert latest.get_column("id").dtype == "INTEGER"

def test_schema_versioning(store):
    """Test that get_latest_schema returns the most recent snapshot."""
    store.register_dataset(Dataset(name="v_test", file_path="v.csv", format="csv"))
    
    schema_v1 = TableSchema(columns=[ColumnSchema(name="col1", dtype="INT")])
    store.save_schema_snapshot("v_test", schema_v1)
    
    schema_v2 = TableSchema(columns=[
        ColumnSchema(name="col1", dtype="INT"),
        ColumnSchema(name="col2", dtype="TEXT")
    ])
    store.save_schema_snapshot("v_test", schema_v2)
    
    latest = store.get_latest_schema("v_test")
    assert len(latest.columns) == 2
    assert latest.get_column("col2") is not None
