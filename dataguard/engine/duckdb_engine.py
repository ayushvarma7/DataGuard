import duckdb
import pandas as pd
from typing import Optional, Any, List, Dict
from pathlib import Path

class DuckDBEngine:
    """
    Wrapper around DuckDB for executing queries and managing data.
    
    This engine handles:
    - In-memory database connections
    - Query execution
    - Loading CSV/Parquet files as virtual tables
    """
    
    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize the DuckDB engine.
        
        Args:
            db_path: Path to persistent database file, or None for in-memory.
        """
        self.db_path = db_path or ":memory:"
        self.conn = duckdb.connect(self.db_path)
    
    def execute(self, query: str, parameters: Optional[Any] = None) -> duckdb.DuckDBPyConnection:
        """
        Execute a SQL query.
        
        Args:
            query: SQL query string
            parameters: Optional parameters for identifying values
            
        Returns:
            The DuckDB connection object (for chaining)
        """
        if parameters:
            return self.conn.execute(query, parameters)
        return self.conn.execute(query)
    
    def query(self, query: str, parameters: Optional[Any] = None) -> List[tuple]:
        """
        Execute a query and return all results as a list of tuples.
        """
        return self.execute(query, parameters).fetchall()
        
    def query_df(self, query: str, parameters: Optional[Any] = None) -> pd.DataFrame:
        """
        Execute a query and return results as a Pandas DataFrame.
        """
        return self.execute(query, parameters).df()
    
    def load_file(self, file_path: str, table_name: str, replace: bool = False) -> None:
        """
        Register a CSV or Parquet file as a table in DuckDB.
        
        Args:
            file_path: Path to the data file
            table_name: Name of the table to create
            replace: If True, drop existing table with same name
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        if replace:
            self.execute(f"DROP TABLE IF EXISTS {table_name}")
            
        # Detect format based on extension
        suffix = path.suffix.lower()
        if suffix == '.csv':
            self.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{file_path}')")
        elif suffix == '.parquet':
            self.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_parquet('{file_path}')")
        else:
            raise ValueError(f"Unsupported file format: {suffix}. Supported: .csv, .parquet")

    def table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database."""
        try:
            self.execute(f"SELECT 1 FROM {table_name} LIMIT 0")
            return True
        except duckdb.CatalogException:
            return False
            
    def get_schema(self, table_name: str) -> Dict[str, str]:
        """
        Get the schema of a table.
        
        Returns:
            Dictionary mapping column names to data types.
        """
        query = f"DESCRIBE {table_name}"
        result = self.query(query)
        # result rows are (column_name, column_type, null, key, default, extra)
        return {row[0]: row[1] for row in result}

    def close(self):
        """Close the database connection."""
        self.conn.close()
