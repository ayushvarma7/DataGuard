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
