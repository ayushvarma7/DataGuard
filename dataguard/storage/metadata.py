import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from .models import Dataset, TableSchema

class MetadataStore:
    """
    Persistent metadata store for Datasets and Schema Snapshots.
    Uses SQLite as the backend.
    """
    
    def __init__(self, db_path: str = "dataguard.db"):
        self.db_path = db_path
        self._init_db()
        
    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
        
    def _init_db(self):
        """Initialize the database schema."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Table: Datasets
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS datasets (
                name TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                format TEXT NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table: Schema Snapshots
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_name TEXT NOT NULL,
                schema_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dataset_name) REFERENCES datasets(name)
            )
        """)
        
        conn.commit()
        conn.close()
        
    def register_dataset(self, dataset: Dataset) -> None:
        """Register a new dataset or update existing one."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO datasets (name, file_path, format, registered_at)
            VALUES (?, ?, ?, ?)
        """, (
            dataset.name, 
            dataset.file_path, 
            dataset.format, 
            dataset.registered_at.isoformat()
        ))
        
        conn.commit()
        conn.close()
        
    def get_dataset(self, name: str) -> Optional[Dataset]:
        """Retrieve a dataset by name."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM datasets WHERE name = ?", (name,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return Dataset(
                name=row['name'],
                file_path=row['file_path'],
                format=row['format'],
                registered_at=datetime.fromisoformat(row['registered_at'])
            )
        return None
        
    def save_schema_snapshot(self, dataset_name: str, schema: TableSchema) -> None:
        """Save a schema snapshot for a dataset."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        schema_json = schema.model_dump_json()
        
        cursor.execute("""
            INSERT INTO schema_snapshots (dataset_name, schema_json, created_at)
            VALUES (?, ?, ?)
        """, (dataset_name, schema_json, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
    def get_latest_schema(self, dataset_name: str) -> Optional[TableSchema]:
        """Get the most recent schema snapshot for a dataset."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT schema_json FROM schema_snapshots 
            WHERE dataset_name = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        """, (dataset_name,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return TableSchema.model_validate_json(row['schema_json'])
        return None
