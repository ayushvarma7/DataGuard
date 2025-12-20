from typing import Dict, Any, List, Optional
from pathlib import Path
from dataguard.engine.duckdb_engine import DuckDBEngine
from dataguard.storage.models import TableSchema, ColumnSchema

class SchemaInferer:
    """
    Infers schema from data files using DuckDB.
    """
    
    def __init__(self, engine: Optional[DuckDBEngine] = None):
        """
        Initialize the inferer.
        
        Args:
            engine: Optional existing engine to use. If None, creates a new in-memory one.
        """
        self.engine = engine or DuckDBEngine()
        self._owns_engine = engine is None

    def infer(self, file_path: str, dataset_name: str) -> TableSchema:
        """
        Infer schema from a file.
        
        Args:
            file_path: Path to the data file
            dataset_name: Name to use for the temporary table and schema generation
            
        Returns:
            TableSchema object populated with inferred columns
        """
        # Create a unique temporary table name to avoid conflicts
        temp_table = f"infer_{dataset_name}_{abs(hash(file_path))}"
        
        try:
            # Load file into a temporary table to inspect it
            self.engine.load_file(file_path, temp_table, replace=True)
            
            # Get schema from engine
            # engine.get_schema returns Dict[col_name, col_type]
            raw_schema = self.engine.get_schema(temp_table)
            
            columns = []
            for name, dtype in raw_schema.items():
                columns.append(ColumnSchema(
                    name=name,
                    dtype=dtype,
                    # We assume nullable=True by default during inference
                    # as checking for nulls requires a full scan which we might do later
                    nullable=True 
                ))
            
            return TableSchema(columns=columns)
            
        finally:
            # Clean up
            if self.engine.table_exists(temp_table):
                self.engine.execute(f"DROP TABLE {temp_table}")
    
    def close(self):
        """Close the engine if we own it."""
        if self._owns_engine:
            self.engine.close()
