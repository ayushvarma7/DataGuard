from typing import List, Dict, Any, Optional
import yaml
from pathlib import Path
from pydantic import BaseModel
from dataguard.storage.models import ValidationRule

class ValidationConfig(BaseModel):
    """Represents the top-level structure of a rules.yaml file."""
    dataset: str
    description: Optional[str] = None
    validations: List[Dict[str, Any]]

class RuleParser:
    """Parses YAML rule files into ValidationRule objects."""
    
    @staticmethod
    def parse_yaml(file_path: str) -> List[ValidationRule]:
        """
        Parse a YAML file and extract all validation rules.
        
        Returns:
            List of ValidationRule objects.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Rules file not found: {file_path}")
            
        with open(path, 'r') as f:
            data = yaml.safe_load(f)
            
        config = ValidationConfig(**data)
        rules = []
        
        for item in config.validations:
            column = item.get('column')
            rule_defs = item.get('rules', [])
            
            for rule_def in rule_defs:
                # Separate type from params
                rule_type = rule_def.get('type')
                params = {k: v for k, v in rule_def.items() if k != 'type'}
                
                rules.append(ValidationRule(
                    type=rule_type,
                    column=column,
                    params=params
                ))
                
        return rules

class SQLGenerator:
    """Generates DuckDB SQL queries for validation rules."""
    
    def generate_query(self, rule: ValidationRule, table_name: str) -> str:
        """
        Generate a SQL query that returns FAILED rows or a failure count.
        For simplicity, we'll generate queries that return the COUNT of failures.
        If count > 0, the rule failed.
        """
        col = rule.column
        
        match rule.type:
            case "not_null":
                return f"SELECT COUNT(*) FROM {table_name} WHERE {col} IS NULL"
                
            case "unique":
                return f"SELECT COUNT(*) FROM (SELECT {col}, COUNT(*) as c FROM {table_name} GROUP BY {col} HAVING c > 1)"
                
            case "in_range":
                min_val = rule.params.get('min')
                max_val = rule.params.get('max')
                conditions = []
                if min_val is not None:
                    conditions.append(f"{col} < {min_val}")
                if max_val is not None:
                    conditions.append(f"{col} > {max_val}")
                
                where_clause = " OR ".join(conditions)
                return f"SELECT COUNT(*) FROM {table_name} WHERE {where_clause}"
                
            case "in_set":
                values = rule.params.get('values', [])
                values_str = ", ".join([f"'{v}'" if isinstance(v, str) else str(v) for v in values])
                return f"SELECT COUNT(*) FROM {table_name} WHERE {col} NOT IN ({values_str})"
            
            case _:
                raise ValueError(f"Unsupported rule type: {rule.type}")
