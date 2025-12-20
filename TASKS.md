# DataGuard — Detailed Task Breakdown

> Each task has clear acceptance criteria. Check off as you complete.

---

## 🏁 Phase 0: Project Setup

### Task 0.1: Initialize Repository
**Time Estimate:** 30 mins

- [ ] Create GitHub repository `dataguard`
- [ ] Clone locally
- [ ] Create `.gitignore` for Python:
```
__pycache__/
*.py[cod]
.env
venv/
.venv/
*.egg-info/
dist/
build/
.pytest_cache/
.coverage
*.db
```
- [ ] Create initial folder structure:
```bash
mkdir -p dataguard/core dataguard/storage dataguard/engine dataguard/ui
mkdir -p tests examples/sports_tv docs web
touch dataguard/__init__.py dataguard/core/__init__.py
touch dataguard/storage/__init__.py dataguard/engine/__init__.py
```
- [ ] Initialize git and push

**Acceptance Criteria:** Repository exists with folder structure on GitHub.

---

### Task 0.2: Setup Python Project
**Time Estimate:** 30 mins

- [ ] Create `pyproject.toml`:
```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "dataguard"
version = "0.1.0"
description = "Data Quality Framework with Lineage Tracking"
readme = "README.md"
requires-python = ">=3.10"
license = {text = "MIT"}
authors = [
    {name = "Ayush Varma", email = "your@email.com"}
]
dependencies = [
    "duckdb>=0.9.0",
    "typer>=0.9.0",
    "rich>=13.0.0",
    "pydantic>=2.0.0",
    "pyyaml>=6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
]
ui = [
    "streamlit>=1.28.0",
]

[project.scripts]
dataguard = "dataguard.cli:app"

[tool.setuptools.packages.find]
where = ["."]
```

- [ ] Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
```

- [ ] Verify installation:
```bash
dataguard --help
```

**Acceptance Criteria:** `dataguard --help` shows CLI help text.

---

### Task 0.3: Create Sample Dataset
**Time Estimate:** 15 mins

- [ ] Create `examples/sports_tv/matches.csv`:
```csv
match_id,home_team,away_team,broadcast_date,viewer_count,league_id
1,Bayern Munich,Dortmund,2024-12-15,2450000,1
2,Leipzig,Frankfurt,2024-12-16,1820000,1
3,Stuttgart,Wolfsburg,2024-12-17,,1
4,Mainz,Freiburg,2024-12-18,-50000,99
5,Union Berlin,Koln,2024-12-19,980000,1
6,Hoffenheim,Augsburg,2024-12-20,720000,1
7,Bremen,Bochum,2024-12-21,890000,1
8,Gladbach,Heidenheim,2024-12-22,650000,1
```

- [ ] Create `examples/sports_tv/leagues.csv`:
```csv
id,name,country,tier
1,Bundesliga,Germany,1
2,2. Bundesliga,Germany,2
3,DFB Pokal,Germany,1
```

- [ ] Create `examples/sports_tv/broadcasts.csv`:
```csv
broadcast_id,match_id,channel,start_time,duration_mins,is_live
1,1,Sky Sports,2024-12-15 15:30:00,120,true
2,2,DAZN,2024-12-16 18:00:00,115,true
3,3,Sky Sports,2024-12-17 20:30:00,118,true
4,4,ARD,2024-12-18 15:30:00,125,false
```

**Acceptance Criteria:** CSV files exist with intentional data quality issues (nulls, negative values, orphan FK).

---

## 🔍 Phase 1: Schema Inference & Drift Detection

### Task 1.1: DuckDB Engine Wrapper
**Time Estimate:** 1 hour

**File:** `dataguard/engine/duckdb_engine.py`

- [ ] Create DuckDB connection manager:
```python
import duckdb
from pathlib import Path
from typing import Optional

class DuckDBEngine:
    def __init__(self, db_path: Optional[str] = None):
        """Initialize DuckDB connection. In-memory if no path provided."""
        self.db_path = db_path
        self.conn = duckdb.connect(db_path or ":memory:")
    
    def execute(self, query: str, params: tuple = None):
        """Execute a query and return results."""
        pass
    
    def load_file(self, file_path: str, table_name: str) -> int:
        """Load CSV/Parquet into a table. Return row count."""
        pass
    
    def get_schema(self, table_name: str) -> list[dict]:
        """Get schema info for a table."""
        pass
    
    def close(self):
        """Close connection."""
        pass
```

- [ ] Implement `execute()` method
- [ ] Implement `load_file()` — detect CSV vs Parquet by extension
- [ ] Implement `get_schema()` using `DESCRIBE table`
- [ ] Add context manager support (`__enter__`, `__exit__`)

**Test:** `tests/test_engine.py`
```python
def test_load_csv():
    engine = DuckDBEngine()
    count = engine.load_file("examples/sports_tv/matches.csv", "matches")
    assert count == 8

def test_get_schema():
    engine = DuckDBEngine()
    engine.load_file("examples/sports_tv/matches.csv", "matches")
    schema = engine.get_schema("matches")
    assert len(schema) == 6
    assert schema[0]["column_name"] == "match_id"
```

**Acceptance Criteria:** All tests pass. Can load CSV and get schema.

---

### Task 1.2: Pydantic Data Models
**Time Estimate:** 45 mins

**File:** `dataguard/storage/models.py`

- [ ] Create schema-related models:
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class DataType(str, Enum):
    INTEGER = "INTEGER"
    BIGINT = "BIGINT"
    FLOAT = "FLOAT"
    DOUBLE = "DOUBLE"
    VARCHAR = "VARCHAR"
    BOOLEAN = "BOOLEAN"
    DATE = "DATE"
    TIMESTAMP = "TIMESTAMP"

class ColumnSchema(BaseModel):
    column_name: str
    data_type: DataType
    is_nullable: bool
    ordinal_position: int

class SchemaSnapshot(BaseModel):
    dataset_name: str
    columns: list[ColumnSchema]
    row_count: int
    captured_at: datetime
    version: int
    file_path: Optional[str] = None

class DriftType(str, Enum):
    COLUMN_ADDED = "COLUMN_ADDED"
    COLUMN_REMOVED = "COLUMN_REMOVED"
    TYPE_CHANGED = "TYPE_CHANGED"
    NULLABLE_CHANGED = "NULLABLE_CHANGED"

class SchemaDrift(BaseModel):
    column_name: str
    drift_type: DriftType
    old_value: Optional[str] = None
    new_value: Optional[str] = None
```

**Acceptance Criteria:** Models can be instantiated and serialized to JSON.

---

### Task 1.3: SQLite Metadata Store
**Time Estimate:** 1.5 hours

**File:** `dataguard/storage/metadata.py`

- [ ] Create metadata store class:
```python
import sqlite3
from pathlib import Path
from datetime import datetime
from .models import SchemaSnapshot, ColumnSchema

class MetadataStore:
    def __init__(self, db_path: str = "~/.dataguard/metadata.db"):
        """Initialize SQLite connection and create tables."""
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path))
        self._create_tables()
    
    def _create_tables(self):
        """Create schema_snapshots and columns tables."""
        pass
    
    def save_schema(self, snapshot: SchemaSnapshot) -> int:
        """Save schema snapshot. Return snapshot ID."""
        pass
    
    def get_latest_schema(self, dataset_name: str) -> Optional[SchemaSnapshot]:
        """Get most recent schema for a dataset."""
        pass
    
    def get_schema_history(self, dataset_name: str) -> list[SchemaSnapshot]:
        """Get all schema versions for a dataset."""
        pass
    
    def list_datasets(self) -> list[str]:
        """List all registered datasets."""
        pass
```

- [ ] Implement table creation:
```sql
CREATE TABLE IF NOT EXISTS schema_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_name TEXT NOT NULL,
    row_count INTEGER,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL,
    file_path TEXT
);

CREATE TABLE IF NOT EXISTS schema_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL,
    column_name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    is_nullable BOOLEAN,
    ordinal_position INTEGER,
    FOREIGN KEY (snapshot_id) REFERENCES schema_snapshots(id)
);

CREATE INDEX idx_dataset_name ON schema_snapshots(dataset_name);
```

- [ ] Implement all CRUD methods
- [ ] Add `close()` method

**Test:** `tests/test_metadata.py`
```python
def test_save_and_retrieve_schema():
    store = MetadataStore(":memory:")
    snapshot = SchemaSnapshot(...)
    store.save_schema(snapshot)
    retrieved = store.get_latest_schema("matches")
    assert retrieved.dataset_name == "matches"
```

**Acceptance Criteria:** Can save/retrieve schemas from SQLite.

---

### Task 1.4: Schema Inference Logic
**Time Estimate:** 1 hour

**File:** `dataguard/core/schema.py`

- [ ] Create schema inference function:
```python
from ..engine.duckdb_engine import DuckDBEngine
from ..storage.models import SchemaSnapshot, ColumnSchema
from datetime import datetime

def infer_schema(file_path: str, dataset_name: str) -> SchemaSnapshot:
    """
    Infer schema from a data file.
    
    1. Load file into DuckDB
    2. Get column info via DESCRIBE
    3. Get row count
    4. Return SchemaSnapshot
    """
    pass
```

- [ ] Handle CSV and Parquet files
- [ ] Map DuckDB types to our DataType enum
- [ ] Calculate additional stats (optional): null count per column, unique count

**Test:**
```python
def test_infer_schema_csv():
    snapshot = infer_schema("examples/sports_tv/matches.csv", "matches")
    assert snapshot.dataset_name == "matches"
    assert len(snapshot.columns) == 6
    assert snapshot.row_count == 8
```

**Acceptance Criteria:** Can infer schema from CSV with correct types.

---

### Task 1.5: Drift Detection Algorithm
**Time Estimate:** 1 hour

**File:** `dataguard/core/schema.py` (add to existing)

- [ ] Create drift detection function:
```python
from ..storage.models import SchemaSnapshot, SchemaDrift, DriftType

def detect_drift(
    baseline: SchemaSnapshot, 
    current: SchemaSnapshot
) -> list[SchemaDrift]:
    """
    Compare two schemas and return list of drifts.
    
    Checks:
    1. Columns added (in current but not baseline)
    2. Columns removed (in baseline but not current)
    3. Type changes (same column, different type)
    4. Nullable changes (same column, different nullable)
    """
    drifts = []
    
    baseline_cols = {c.column_name: c for c in baseline.columns}
    current_cols = {c.column_name: c for c in current.columns}
    
    # Check for added columns
    # Check for removed columns
    # Check for type/nullable changes
    
    return drifts
```

**Test:**
```python
def test_detect_added_column():
    baseline = SchemaSnapshot(columns=[col_a, col_b], ...)
    current = SchemaSnapshot(columns=[col_a, col_b, col_c], ...)
    drifts = detect_drift(baseline, current)
    assert len(drifts) == 1
    assert drifts[0].drift_type == DriftType.COLUMN_ADDED
```

**Acceptance Criteria:** Correctly detects all 4 drift types.

---

### Task 1.6: CLI Commands for Schema
**Time Estimate:** 1.5 hours

**File:** `dataguard/cli.py`

- [ ] Setup Typer app:
```python
import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(help="DataGuard - Data Quality Framework")
console = Console()

@app.command()
def version():
    """Show version."""
    console.print("DataGuard v0.1.0")

# Schema subcommand group
schema_app = typer.Typer(help="Schema operations")
app.add_typer(schema_app, name="schema")

@schema_app.command("infer")
def schema_infer(
    file_path: str = typer.Argument(..., help="Path to data file"),
    name: str = typer.Option(..., "--name", "-n", help="Dataset name"),
):
    """Infer and store schema from a data file."""
    # 1. Call infer_schema()
    # 2. Save to metadata store
    # 3. Print success with rich table
    pass

@schema_app.command("show")
def schema_show(
    name: str = typer.Argument(..., help="Dataset name"),
):
    """Show current schema for a dataset."""
    pass

@schema_app.command("diff")
def schema_diff(
    name: str = typer.Argument(..., help="Dataset name"),
    file_path: str = typer.Option(None, "--file", "-f", help="Compare against file"),
):
    """Check for schema drift."""
    # If file provided: compare stored vs file
    # Else: compare last two versions
    pass

@schema_app.command("history")
def schema_history(
    name: str = typer.Argument(..., help="Dataset name"),
):
    """Show schema version history."""
    pass

if __name__ == "__main__":
    app()
```

- [ ] Implement each command with Rich formatting
- [ ] Add color-coded output for drifts (red=removed, green=added, yellow=changed)

**Acceptance Criteria:** 
```bash
dataguard schema infer ./examples/sports_tv/matches.csv --name matches
# Shows success + schema table

dataguard schema show matches
# Shows stored schema

dataguard schema diff matches
# Shows "No drift detected" or drift details
```

---

### Task 1.7: Phase 1 Tests & Documentation
**Time Estimate:** 1 hour

- [ ] Ensure all unit tests pass: `pytest tests/ -v`
- [ ] Add docstrings to all public functions
- [ ] Update README with Phase 1 completion
- [ ] Create `docs/getting-started.md` with basic usage

**Acceptance Criteria:** 100% test pass rate, documentation updated.

---

## ✅ Phase 2: Validation Rules Engine

### Task 2.1: Validation Models
**Time Estimate:** 30 mins

**File:** `dataguard/storage/models.py` (add to existing)

- [ ] Add validation-related models:
```python
class RuleType(str, Enum):
    NOT_NULL = "not_null"
    UNIQUE = "unique"
    IN_RANGE = "in_range"
    IN_SET = "in_set"
    REGEX_MATCH = "regex_match"
    FRESHNESS = "freshness"
    REFERENTIAL_INTEGRITY = "referential_integrity"
    ROW_COUNT = "row_count"
    CUSTOM_SQL = "custom_sql"

class ValidationRule(BaseModel):
    column: Optional[str] = None  # None for table-level rules
    rule_type: RuleType
    params: dict = {}

class ValidationResult(BaseModel):
    rule: ValidationRule
    passed: bool
    failed_count: int = 0
    failed_samples: list[dict] = []
    message: str

class ValidationReport(BaseModel):
    dataset_name: str
    executed_at: datetime
    total_rules: int
    passed: int
    failed: int
    results: list[ValidationResult]
```

---

### Task 2.2: YAML Rule Parser
**Time Estimate:** 45 mins

**File:** `dataguard/core/validator.py`

- [ ] Create rule parser:
```python
import yaml
from pathlib import Path
from ..storage.models import ValidationRule, RuleType

def parse_rules_file(file_path: str) -> tuple[str, list[ValidationRule]]:
    """
    Parse YAML rules file.
    Returns (dataset_name, list of rules)
    """
    with open(file_path) as f:
        config = yaml.safe_load(f)
    
    dataset = config["dataset"]
    rules = []
    
    for validation in config.get("validations", []):
        column = validation.get("column")
        for rule_def in validation.get("rules", []):
            # Handle both string ("not_null") and dict ({"type": "in_range", "min": 0})
            pass
    
    return dataset, rules
```

- [ ] Create example rules file `examples/sports_tv/rules.yaml`

**Acceptance Criteria:** Can parse YAML into list of ValidationRule objects.

---

### Task 2.3: SQL Query Generator
**Time Estimate:** 2 hours

**File:** `dataguard/core/validator.py` (add to existing)

- [ ] Create SQL generators for each rule type:
```python
def generate_validation_sql(
    table_name: str, 
    rule: ValidationRule
) -> str:
    """Generate SQL query that returns failing rows."""
    
    if rule.rule_type == RuleType.NOT_NULL:
        return f"""
            SELECT * FROM {table_name}
            WHERE {rule.column} IS NULL
        """
    
    elif rule.rule_type == RuleType.UNIQUE:
        return f"""
            SELECT {rule.column}, COUNT(*) as cnt
            FROM {table_name}
            GROUP BY {rule.column}
            HAVING COUNT(*) > 1
        """
    
    elif rule.rule_type == RuleType.IN_RANGE:
        min_val = rule.params.get("min", "NULL")
        max_val = rule.params.get("max", "NULL")
        conditions = []
        if min_val != "NULL":
            conditions.append(f"{rule.column} < {min_val}")
        if max_val != "NULL":
            conditions.append(f"{rule.column} > {max_val}")
        where = " OR ".join(conditions)
        return f"SELECT * FROM {table_name} WHERE {where}"
    
    # ... implement for other rule types
```

- [ ] Implement for: NOT_NULL, UNIQUE, IN_RANGE, IN_SET, REGEX_MATCH
- [ ] Implement for: REFERENTIAL_INTEGRITY (requires join)
- [ ] Implement for: ROW_COUNT (table-level)
- [ ] Implement for: FRESHNESS (date comparison)
- [ ] Implement for: CUSTOM_SQL (user provides query)

**Test:**
```python
def test_generate_not_null_sql():
    rule = ValidationRule(column="viewer_count", rule_type=RuleType.NOT_NULL)
    sql = generate_validation_sql("matches", rule)
    assert "IS NULL" in sql
```

---

### Task 2.4: Validation Executor
**Time Estimate:** 1.5 hours

**File:** `dataguard/core/validator.py` (add to existing)

- [ ] Create validation executor:
```python
from ..engine.duckdb_engine import DuckDBEngine
from ..storage.models import ValidationRule, ValidationResult, ValidationReport
from datetime import datetime

def run_validation(
    engine: DuckDBEngine,
    table_name: str,
    rule: ValidationRule,
    sample_limit: int = 5
) -> ValidationResult:
    """Run a single validation rule and return result."""
    sql = generate_validation_sql(table_name, rule)
    
    # Get count of failures
    count_sql = f"SELECT COUNT(*) FROM ({sql}) t"
    count = engine.execute(count_sql).fetchone()[0]
    
    # Get sample of failures
    sample_sql = f"{sql} LIMIT {sample_limit}"
    samples = engine.execute(sample_sql).fetchall()
    
    return ValidationResult(
        rule=rule,
        passed=count == 0,
        failed_count=count,
        failed_samples=[...],
        message=f"Found {count} violations" if count > 0 else "Passed"
    )

def run_validations(
    file_path: str,
    rules: list[ValidationRule],
    dataset_name: str
) -> ValidationReport:
    """Run all validations and return report."""
    engine = DuckDBEngine()
    engine.load_file(file_path, dataset_name)
    
    results = []
    for rule in rules:
        result = run_validation(engine, dataset_name, rule)
        results.append(result)
    
    return ValidationReport(
        dataset_name=dataset_name,
        executed_at=datetime.now(),
        total_rules=len(results),
        passed=sum(1 for r in results if r.passed),
        failed=sum(1 for r in results if not r.passed),
        results=results
    )
```

---

### Task 2.5: CLI Command for Validate
**Time Estimate:** 1 hour

**File:** `dataguard/cli.py` (add to existing)

- [ ] Add validate command:
```python
@app.command()
def validate(
    file_path: str = typer.Argument(..., help="Path to data file"),
    rules: str = typer.Option(..., "--rules", "-r", help="Path to rules YAML"),
    output: str = typer.Option(None, "--output", "-o", help="Output JSON report"),
):
    """Run validations against a data file."""
    # 1. Parse rules
    # 2. Run validations
    # 3. Print rich table with results
    # 4. Optionally save JSON report
```

- [ ] Color-code output: green=pass, red=fail
- [ ] Show summary stats at top
- [ ] Show failed samples for each failure

**Acceptance Criteria:**
```bash
dataguard validate ./examples/sports_tv/matches.csv --rules ./examples/sports_tv/rules.yaml
# Shows validation report with pass/fail for each rule
```

---

### Task 2.6: Store Validation History
**Time Estimate:** 45 mins

**File:** `dataguard/storage/metadata.py` (add to existing)

- [ ] Add tables for validation history:
```sql
CREATE TABLE validation_runs (
    id INTEGER PRIMARY KEY,
    dataset_name TEXT,
    executed_at TIMESTAMP,
    total_rules INTEGER,
    passed INTEGER,
    failed INTEGER
);

CREATE TABLE validation_results (
    id INTEGER PRIMARY KEY,
    run_id INTEGER,
    column_name TEXT,
    rule_type TEXT,
    passed BOOLEAN,
    failed_count INTEGER,
    FOREIGN KEY (run_id) REFERENCES validation_runs(id)
);
```

- [ ] Add methods: `save_validation_report()`, `get_validation_history()`

---

### Task 2.7: Phase 2 Tests
**Time Estimate:** 1 hour

- [ ] Test YAML parsing
- [ ] Test SQL generation for each rule type
- [ ] Test validation execution
- [ ] Test with sample data (should catch the intentional issues)

---

## 🔗 Phase 3: Lineage Tracking

### Task 3.1: Lineage Models
**Time Estimate:** 30 mins

**File:** `dataguard/storage/models.py`

```python
class LineageNode(BaseModel):
    dataset: str
    column: str
    node_type: str  # "source", "transform", "output"

class LineageEdge(BaseModel):
    source: LineageNode
    target: LineageNode
    transformation: Optional[str] = None  # SQL or description

class LineageGraph(BaseModel):
    nodes: list[LineageNode]
    edges: list[LineageEdge]
```

---

### Task 3.2: Lineage Storage
**Time Estimate:** 1 hour

- [ ] Add SQLite tables for lineage
- [ ] Implement CRUD for lineage edges
- [ ] Implement graph traversal queries (upstream/downstream)

---

### Task 3.3: Lineage Decorator
**Time Estimate:** 1 hour

```python
from functools import wraps

def lineage(inputs: list[str], outputs: list[str], sql: str = None):
    """Decorator to capture lineage from transformations."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Record lineage before execution
            result = func(*args, **kwargs)
            # Store lineage edges
            return result
        return wrapper
    return decorator

# Usage:
@lineage(
    inputs=["matches.viewer_count", "leagues.name"],
    outputs=["revenue_report.total_revenue"]
)
def calculate_revenue(matches_df, leagues_df):
    ...
```

---

### Task 3.4: Mermaid Diagram Generator
**Time Estimate:** 45 mins

```python
def generate_mermaid(graph: LineageGraph) -> str:
    """Generate Mermaid diagram from lineage graph."""
    lines = ["graph LR"]
    for edge in graph.edges:
        src = f"{edge.source.dataset}.{edge.source.column}"
        tgt = f"{edge.target.dataset}.{edge.target.column}"
        lines.append(f"    {src} --> {tgt}")
    return "\n".join(lines)
```

---

### Task 3.5: CLI Commands for Lineage
**Time Estimate:** 1 hour

```bash
dataguard lineage add --from matches.viewer_count --to report.total_viewers
dataguard lineage show report.total_viewers --upstream
dataguard lineage show matches.viewer_count --downstream
dataguard lineage export --format mermaid > lineage.md
```

---

## 📄 Phase 4: Data Contracts & Polish

### Task 4.1: Contract Generator
### Task 4.2: Contract Validator
### Task 4.3: Streamlit Dashboard
### Task 4.4: Documentation Site

---

## 🌐 Phase 5: Browser Demo

### Task 5.1: React App Setup
### Task 5.2: DuckDB-WASM Integration
### Task 5.3: File Upload Component
### Task 5.4: Schema Inference in Browser
### Task 5.5: Validation in Browser
### Task 5.6: Deploy to GitHub Pages

---

## 📊 Progress Tracker

| Phase | Status | Tasks Done | Total Tasks |
|-------|--------|------------|-------------|
| Phase 0: Setup | 🔄 | 0 | 3 |
| Phase 1: Schema | ⏳ | 0 | 7 |
| Phase 2: Validation | ⏳ | 0 | 7 |
| Phase 3: Lineage | ⏳ | 0 | 5 |
| Phase 4: Contracts | ⏳ | 0 | 4 |
| Phase 5: Browser | ⏳ | 0 | 6 |

**Legend:** ✅ Complete | 🔄 In Progress | ⏳ Not Started