from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict

class ColumnSchema(BaseModel):
    """Represents the schema of a single column."""
    name: str
    dtype: str
    nullable: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TableSchema(BaseModel):
    """Represents the schema of a table/dataset."""
    columns: List[ColumnSchema]
    primary_key: Optional[List[str]] = None
    generated_at: datetime = Field(default_factory=datetime.now)
    
    def get_column(self, name: str) -> Optional[ColumnSchema]:
        """Get column schema by name."""
        for col in self.columns:
            if col.name == name:
                return col
        return None

class ValidationRule(BaseModel):
    """Represents a single validation rule configuration."""
    type: str  # e.g., "not_null", "unique", "in_range"
    column: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)
    
    model_config = ConfigDict(extra='allow')

class Dataset(BaseModel):
    """Represents a registered dataset."""
    name: str
    file_path: str
    description: Optional[str] = None
    format: str # e.g., "csv", "parquet"
    registered_at: datetime = Field(default_factory=datetime.now)
    
    # Track the latest known schema
    current_schema: Optional[TableSchema] = None

class ValidationResult(BaseModel):
    """Result of a single validation rule execution."""
    rule: ValidationRule
    passed: bool
    failure_count: int
    executed_query: str
    timestamp: datetime = Field(default_factory=datetime.now)

class ValidationRun(BaseModel):
    """Group of validation results for a dataset execution."""
    dataset_name: str
    results: List[ValidationResult]
    total_checks: int
    failed_checks: int
    run_at: datetime = Field(default_factory=datetime.now)

