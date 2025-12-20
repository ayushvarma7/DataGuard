import pytest
from dataguard.core.drift import DriftDetector
from dataguard.storage.models import TableSchema, ColumnSchema

def test_no_drift():
    """Test when schemas are identical."""
    schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER"),
        ColumnSchema(name="name", dtype="VARCHAR")
    ])
    
    detector = DriftDetector()
    diff = detector.detect_drift(schema, schema)
    
    assert not diff.has_drift
    assert len(diff.added_columns) == 0
    assert len(diff.removed_columns) == 0
    assert len(diff.changed_columns) == 0

def test_added_column():
    """Test detecting an added column."""
    old_schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER")
    ])
    new_schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER"),
        ColumnSchema(name="age", dtype="INTEGER")
    ])
    
    detector = DriftDetector()
    diff = detector.detect_drift(old_schema, new_schema)
    
    assert diff.has_drift
    assert len(diff.added_columns) == 1
    assert diff.added_columns[0].name == "age"
    assert len(diff.removed_columns) == 0

def test_removed_column():
    """Test detecting a removed column."""
    old_schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER"),
        ColumnSchema(name="temp", dtype="DOUBLE")
    ])
    new_schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER")
    ])
    
    detector = DriftDetector()
    diff = detector.detect_drift(old_schema, new_schema)
    
    assert diff.has_drift
    assert len(diff.removed_columns) == 1
    assert diff.removed_columns[0].name == "temp"

def test_changed_column_type():
    """Test detecting a data type change."""
    old_schema = TableSchema(columns=[
        ColumnSchema(name="score", dtype="INTEGER")
    ])
    new_schema = TableSchema(columns=[
        ColumnSchema(name="score", dtype="DOUBLE")
    ])
    
    detector = DriftDetector()
    diff = detector.detect_drift(old_schema, new_schema)
    
    assert diff.has_drift
    assert len(diff.changed_columns) == 1
    change = diff.changed_columns[0]
    assert change['column_name'] == "score"
    assert change['dtype']['old'] == "INTEGER"
    assert change['dtype']['new'] == "DOUBLE"

def test_complex_drift():
    """Test mixed added, removed, and changed columns."""
    old_schema = TableSchema(columns=[
        ColumnSchema(name="a", dtype="INT"),  # Changed
        ColumnSchema(name="b", dtype="INT")   # Removed
    ])
    new_schema = TableSchema(columns=[
        ColumnSchema(name="a", dtype="VARCHAR"),
        ColumnSchema(name="c", dtype="INT")   # Added
    ])
    
    detector = DriftDetector()
    diff = detector.detect_drift(old_schema, new_schema)
    
    assert diff.has_drift
    assert len(diff.added_columns) == 1 # c
    assert len(diff.removed_columns) == 1 # b
    assert len(diff.changed_columns) == 1 # a
