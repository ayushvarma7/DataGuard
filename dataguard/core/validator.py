from typing import List, Dict, Any, Optional
import yaml
from pathlib import Path
from pydantic import BaseModel
from dataguard.storage.models import ValidationRule, ValidationResult, ValidationRun

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

class ValidationExecutor:
    """Executes validation rules against a dataset."""
    
    def __init__(self, engine=None):
        # We import here to avoid circular dependencies if any, 
        # though DuckDBEngine is in .engine not .core
        from dataguard.engine.duckdb_engine import DuckDBEngine
        self.engine = engine or DuckDBEngine()
        self.generator = SQLGenerator()
        
    def validate(self, dataset_name: str, file_path: str, rules: List[ValidationRule]) -> ValidationRun:
        """
        Run validation rules on the given file.
        
        Args:
            dataset_name: Name of the dataset
            file_path: Path to file (CSV/Parquet)
            rules: List of rules to check
            
        Returns:
            ValidationRun object containing results
        """
        # Load file as virtual table
        table_name = "target_table"
        # We need to ensure table name is safe/unique if running parallel, 
        # but for now 'target_table' in a fresh connection is fine.
        
        # Connect & Load
        # self.engine.connect() # Engine connects on init
        self.engine.load_file(file_path, table_name)
        
        results = []
        failed_count = 0
        
        for rule in rules:
            try:
                query = self.generator.generate_query(rule, table_name)
                
                # Execute query (expecting count)
                # query_df returns a DF. We expect 1 row, 1 col = count
                df = self.engine.query_df(query)
                count = df.iloc[0, 0]
                
                passed = (count == 0)
                if not passed:
                    failed_count += 1
                    
                results.append(ValidationResult(
                    rule=rule,
                    passed=passed,
                    failure_count=int(count),
                    executed_query=query
                ))
                
            except Exception as e:
                # If SQL fails, mark as check failure/error
                # For now, let's treat exception as a failure execution
                # Ideally we'd have an error field in ValidationResult
                print(f"Error executing rule {rule}: {e}")
                results.append(ValidationResult(
                    rule=rule,
                    passed=False,
                    failure_count=-1, # Indicator of execution error
                    executed_query=f"ERROR: {str(e)}"
                ))
                failed_count += 1
        
        return ValidationRun(
            dataset_name=dataset_name,
            results=results,
            total_checks=len(rules),
            failed_checks=failed_count
        )
