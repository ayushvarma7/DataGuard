import pytest
import pandas as pd
from dataguard.core.schema import SchemaInferer

@pytest.fixture
def inferer():
    """Create a SchemaInferer instance."""
    inf = SchemaInferer()
    yield inf
    inf.close()

def test_infer_csv(inferer, tmp_path):
    """Test inferring schema from a CSV file."""
    csv_path = tmp_path / "test.csv"
    df = pd.DataFrame({
        'name': ['Alice', 'Bob'],
        'age': [30, 25],
        'score': [9.5, 8.0]
    })
    df.to_csv(csv_path, index=False)
    
    schema = inferer.infer(str(csv_path), "test_ds")
    
    assert len(schema.columns) == 3
    
    name_col = schema.get_column("name")
    assert name_col is not None
    assert "VARCHAR" in name_col.dtype
    
    age_col = schema.get_column("age")
    assert age_col is not None
    # DuckDB often infers BIGINT for pandas int64
    assert "INT" in age_col.dtype 
    
    score_col = schema.get_column("score")
    assert score_col is not None
    assert "DOUBLE" in score_col.dtype

def test_infer_parquet(inferer, tmp_path):
    """Test inferring schema from a Parquet file."""
    pq_path = tmp_path / "test.parquet"
    df = pd.DataFrame({
        'id': [1, 2],
        'active': [True, False]
    })
    df.to_parquet(pq_path)
    
    schema = inferer.infer(str(pq_path), "test_pq")
    
    assert len(schema.columns) == 2
    
    id_col = schema.get_column("id")
    assert id_col is not None
    assert "INT" in id_col.dtype
    
    active_col = schema.get_column("active")
    assert active_col is not None
    assert "BOOLEAN" in active_col.dtype
