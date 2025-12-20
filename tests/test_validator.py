import pytest
import yaml
from dataguard.core.validator import RuleParser, SQLGenerator
from dataguard.storage.models import ValidationRule

@pytest.fixture
def parser():
    return RuleParser()

@pytest.fixture
def generator():
    return SQLGenerator()

def test_parse_yaml(parser, tmp_path):
    """Test parsing a valid YAML rules file."""
    yaml_content = """
    dataset: test_ds
    validations:
      - column: age
        rules:
          - type: not_null
          - type: in_range
            min: 0
            max: 100
    """
    rule_file = tmp_path / "rules.yaml"
    with open(rule_file, "w") as f:
        f.write(yaml_content)
        
    rules = parser.parse_yaml(str(rule_file))
    
    assert len(rules) == 2
    assert rules[0].column == "age"
    assert rules[0].type == "not_null"
    
    assert rules[1].column == "age"
    assert rules[1].type == "in_range"
    assert rules[1].params['max'] == 100

def test_generate_not_null(generator):
    """Test SQL generation for not_null."""
    rule = ValidationRule(type="not_null", column="email")
    sql = generator.generate_query(rule, "users")
    assert "count(*)" in sql.lower()
    assert "users" in sql
    assert "email IS NULL" in sql

def test_generate_unique(generator):
    """Test SQL generation for unique."""
    rule = ValidationRule(type="unique", column="id")
    sql = generator.generate_query(rule, "users")
    assert "GROUP BY id" in sql
    assert "HAVING c > 1" in sql

def test_generate_in_range(generator):
    """Test SQL generation for in_range."""
    rule = ValidationRule(
        type="in_range", 
        column="score", 
        params={"min": 0, "max": 100}
    )
    sql = generator.generate_query(rule, "scores")
    assert "score < 0" in sql
    assert "score > 100" in sql

def test_generate_in_set(generator):
    """Test SQL generation for in_set."""
    rule = ValidationRule(
        type="in_set",
        column="status",
        params={"values": ["active", "inactive"]}
    )
    sql = generator.generate_query(rule, "orders")
    assert "status NOT IN" in sql
    assert "'active'" in sql
    assert "'inactive'" in sql

def test_unsupported_rule(generator):
    """Test error for unsupported rule type."""
    rule = ValidationRule(type="magic_check", column="x")
    with pytest.raises(ValueError):
        generator.generate_query(rule, "t")

def test_executor_run(tmp_path):
    """Test full execution flow."""
    from dataguard.core.validator import ValidationExecutor
    import pandas as pd
    
    # 1. Create dummy data
    # id: unique, age: range(0,100), email: not_null
    df = pd.DataFrame({
        'id': [1, 2, 2],       # Duplicate '2' -> should fail unique
        'age': [25, 150, 30],  # 150 -> should fail max 100
        'email': ['a@b.com', None, 'c@d.com'] # None -> should fail not_null
    })
    csv_path = tmp_path / "data.csv"
    df.to_csv(csv_path, index=False)
    
    # 2. Define Rules
    rules = [
        ValidationRule(type="unique", column="id"),
        ValidationRule(type="in_range", column="age", params={"max": 100}),
        ValidationRule(type="not_null", column="email")
    ]
    
    # 3. Execute
    executor = ValidationExecutor()
    run = executor.validate("test_ds", str(csv_path), rules)
    
    # 4. Assertions
    assert run.dataset_name == "test_ds"
    assert run.total_checks == 3
    assert run.failed_checks == 3 # All 3 configured rules should fail on this data
    
    # Check details
    # unique fail
    assert run.results[0].passed == False
    assert run.results[0].failure_count == 1 # one duplicate group (id=2)
    
    # range fail
    assert run.results[1].passed == False
    assert run.results[1].failure_count == 1 # one value > 100
    
    # null fail
    assert run.results[2].passed == False
    assert run.results[2].failure_count == 1 # one null

def test_history_storage():
    """Test saving ValidationRun to metadata store."""
    from dataguard.storage.metadata import MetadataStore
    from dataguard.storage.models import ValidationRun, ValidationRule, ValidationResult, Dataset
    from datetime import datetime
    
    store = MetadataStore()
    
    # Need a dataset first (FK constraint)
    ds = Dataset(name="hist_ds", file_path="p", format="csv")
    store.register_dataset(ds)
    
    # Create dummy run
    run = ValidationRun(
        dataset_name="hist_ds",
        total_checks=1,
        failed_checks=0,
        results=[
             ValidationResult(
                 rule=ValidationRule(type="not_null", column="a"),
                 passed=True,
                 failure_count=0,
                 executed_query="SELECT..."
             )
        ]
    )
    
    store.save_validation_run(run)
    
    # Retrieve
    history = store.get_validation_history("hist_ds")
    assert len(history) == 1
    assert history[0].dataset_name == "hist_ds"
    assert history[0].total_checks == 1
