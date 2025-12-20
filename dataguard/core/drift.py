from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from dataguard.storage.models import TableSchema, ColumnSchema

class SchemaDiff(BaseModel):
    """Represents the difference between two schemas."""
    added_columns: List[ColumnSchema] = Field(default_factory=list)
    removed_columns: List[ColumnSchema] = Field(default_factory=list)
    changed_columns: List[Dict[str, Any]] = Field(default_factory=list)
    
    @property
    def has_drift(self) -> bool:
        return bool(self.added_columns or self.removed_columns or self.changed_columns)

class DriftReport(BaseModel):
    """Report containing schema drift details."""
    dataset_name: str
    drift_detected: bool
    diff: SchemaDiff
    detected_at: str # ISO timestamp

class DriftDetector:
    """
    Detects schema drift between two TableSchema objects.
    """
    
    def detect_drift(self, old_schema: TableSchema, new_schema: TableSchema) -> SchemaDiff:
        """
        Compare old and new schemas to find differences.
        
        Args:
            old_schema: The baseline schema (e.g., from metadata store)
            new_schema: The current inferred schema
            
        Returns:
            SchemaDiff object detailing the changes
        """
        diff = SchemaDiff()
        
        old_cols = {c.name: c for c in old_schema.columns}
        new_cols = {c.name: c for c in new_schema.columns}
        
        # 1. Detect removed columns (in old but not in new)
        for name, col in old_cols.items():
            if name not in new_cols:
                diff.removed_columns.append(col)
                
        # 2. Detect added columns (in new but not in old)
        for name, col in new_cols.items():
            if name not in old_cols:
                diff.added_columns.append(col)
                
        # 3. Detect changed columns (in both, but properties changed)
        for name, new_col in new_cols.items():
            if name in old_cols:
                old_col = old_cols[name]
                changes = {}
                
                # Check dtype
                if old_col.dtype != new_col.dtype:
                    changes['dtype'] = {
                        'old': old_col.dtype,
                        'new': new_col.dtype
                    }
                    
                # Check nullability
                if old_col.nullable != new_col.nullable:
                    changes['nullable'] = {
                        'old': old_col.nullable,
                        'new': new_col.nullable
                    }
                
                if changes:
                    changes['column_name'] = name
                    diff.changed_columns.append(changes)
                    
        return diff
