import pytest
from typer.testing import CliRunner
from dataguard.cli import app, STORE_PATH
from dataguard.storage.metadata import MetadataStore
import pandas as pd
import os

runner = CliRunner()

@pytest.fixture
def clean_db():
    """Ensure database is clean before/after tests."""
    if os.path.exists(STORE_PATH):
        os.remove(STORE_PATH)
    yield
    if os.path.exists(STORE_PATH):
        os.remove(STORE_PATH)

def test_version():
    result = runner.invoke(app, ["version"])
    assert result.exit_code == 0
    assert "DataGuard" in result.stdout

def test_schema_infer_flow(clean_db, tmp_path):
    # 1. Create dummy file
    csv_path = tmp_path / "cli_test.csv"
    pd.DataFrame({'a': [1], 'b': [2]}).to_csv(csv_path, index=False)
    
    # 2. Run infer
    result = runner.invoke(app, ["schema", "infer", str(csv_path), "--name", "cli_ds"])
    assert result.exit_code == 0
    assert "Schema inferred and saved" in result.stdout
    
    # 3. Check DB
    store = MetadataStore(STORE_PATH)
    latest = store.get_latest_schema("cli_ds")
    assert latest is not None
    assert len(latest.columns) == 2

def test_schema_show(clean_db, tmp_path):
    # Setup: infer first
    csv_path = tmp_path / "show_test.csv"
    pd.DataFrame({'col1': ['x']}).to_csv(csv_path, index=False)
    runner.invoke(app, ["schema", "infer", str(csv_path), "--name", "show_ds"])
    
    # Test show
    result = runner.invoke(app, ["schema", "show", "show_ds"])
    assert result.exit_code == 0
    assert "col1" in result.stdout
    assert "VARCHAR" in result.stdout

def test_schema_diff_no_drift(clean_db, tmp_path):
    # Setup
    csv_path = tmp_path / "diff_test.csv"
    pd.DataFrame({'a': [1]}).to_csv(csv_path, index=False)
    runner.invoke(app, ["schema", "infer", str(csv_path), "--name", "diff_ds"])
    
    # Test diff against same file
    result = runner.invoke(app, ["schema", "diff", "diff_ds", "--file", str(csv_path)])
    assert result.exit_code == 0
    assert "No Drift Detected" in result.stdout

def test_schema_diff_with_drift(clean_db, tmp_path):
    # Setup: baseline
    path1 = tmp_path / "v1.csv"
    pd.DataFrame({'a': [1]}).to_csv(path1, index=False)
    runner.invoke(app, ["schema", "infer", str(path1), "--name", "drift_ds"])
    
    # Setup: changed file (added col)
    path2 = tmp_path / "v2.csv"
    pd.DataFrame({'a': [1], 'b': [2]}).to_csv(path2, index=False)
    
    # Test diff
    result = runner.invoke(app, ["schema", "diff", "drift_ds", "--file", str(path2)])
    assert result.exit_code == 1 # Drift detected = exit 1
    assert "Drift Detected!" in result.stdout
    assert "Added columns" in result.stdout
    assert "b (BIGINT" in result.stdout or "b (LONG" in result.stdout # DuckDB type variation
