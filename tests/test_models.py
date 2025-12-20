import pytest
from datetime import datetime
from dataguard.storage.models import (
    ColumnSchema, 
    TableSchema, 
    Dataset, 
    ValidationRule
)

def test_column_schema():
    """Test ColumnSchema creation."""
    col = ColumnSchema(name="age", dtype="INTEGER", nullable=False)
    assert col.name == "age"
    assert col.dtype == "INTEGER"
    assert col.nullable is False
    
    # Defaults
    col2 = ColumnSchema(name="desc", dtype="VARCHAR")
    assert col2.nullable is True
    assert col2.metadata == {}

def test_table_schema():
    """Test TableSchema and helper methods."""
    cols = [
        ColumnSchema(name="id", dtype="INTEGER"),
        ColumnSchema(name="name", dtype="VARCHAR")
    ]
    schema = TableSchema(columns=cols, primary_key=["id"])
    
    assert len(schema.columns) == 2
    assert schema.primary_key == ["id"]
    assert isinstance(schema.generated_at, datetime)
    
    # Test get_column
    assert schema.get_column("id").dtype == "INTEGER"
    assert schema.get_column("nonexistent") is None

def test_validation_rule():
    """Test ValidationRule flexibility."""
    rule = ValidationRule(
        type="in_range",
        column="age",
        params={"min": 0, "max": 120}
    )
    assert rule.type == "in_range"
    assert rule.params["max"] == 120

def test_dataset_model():
    """Test Dataset model."""
    ds = Dataset(
        name="users",
        file_path="/data/users.csv",
        format="csv"
    )
    assert ds.name == "users"
    assert ds.format == "csv"
    assert ds.current_schema is None
