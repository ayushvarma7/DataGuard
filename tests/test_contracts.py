import pytest
from dataguard.storage.models import DataContract, TableSchema, ColumnSchema, ValidationRule
import json

def test_contract_model():
    """Test DataContract instantiation and serialization."""
    
    # 1. Setup components
    schema = TableSchema(columns=[
        ColumnSchema(name="id", dtype="INTEGER"),
        ColumnSchema(name="email", dtype="VARCHAR")
    ])
    
    rules = [
        ValidationRule(type="not_null", column="id"),
        ValidationRule(type="unique", column="email")
    ]
    
    # 2. Create Contract
    contract = DataContract(
        dataset_name="users_prod",
        schema=schema,
        rules=rules,
        slo={"freshness": "24h"}
    )
    
    # 3. Assertions
    assert contract.dataset_name == "users_prod"
    assert len(contract.rules) == 2
    assert contract.schema_snap.columns[0].name == "id"
    assert contract.slo["freshness"] == "24h"
    
    # 4. Serialization (Crucial for YAML export)
    json_str = contract.model_dump_json(by_alias=True)
    data = json.loads(json_str)
    
    assert "schema" in data # alias check
    assert "rules" in data
    assert "slo" in data
