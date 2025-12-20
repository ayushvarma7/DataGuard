import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from .models import Dataset, TableSchema, ValidationRun

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

        # Table: Validation Runs (Task 2.6)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS validation_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_name TEXT NOT NULL,
                run_json TEXT NOT NULL,
                run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                failed_checks INTEGER NOT NULL,
                FOREIGN KEY (dataset_name) REFERENCES datasets(name)
            )
        """)
        
        # Table: Lineage Nodes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lineage_nodes (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                name TEXT NOT NULL
            )
        """)
        
        # Table: Lineage Edges
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lineage_edges (
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_type TEXT,
                target_type TEXT,
                FOREIGN KEY (source_id) REFERENCES lineage_nodes(id),
                FOREIGN KEY (target_id) REFERENCES lineage_nodes(id)
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

    def save_validation_run(self, run: ValidationRun) -> None:
        """Save a new validation run."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        run_json = run.model_dump_json()
        
        cursor.execute("""
            INSERT INTO validation_runs (dataset_name, run_json, failed_checks, run_at)
            VALUES (?, ?, ?, ?)
        """, (
            run.dataset_name,
            run_json,
            run.failed_checks,
            run.run_at.isoformat()
        ))
        
        conn.commit()
        conn.close()

    def get_validation_history(self, dataset_name: str, limit: int = 10) -> List[ValidationRun]:
        """Get past validation runs for a dataset."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT run_json FROM validation_runs
            WHERE dataset_name = ?
            ORDER BY run_at DESC
            LIMIT ?
        """, (dataset_name, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [ValidationRun.model_validate_json(r['run_json']) for r in rows]

    def save_lineage_edge(self, source_id: str, target_id: str, source_type: str = "dataset", target_type: str = "dataset"):
        """Save a lineage dependency."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Upsert Nodes (simplistic: ignore name updates for now)
        cursor.execute("INSERT OR IGNORE INTO lineage_nodes (id, type, name) VALUES (?, ?, ?)", (source_id, source_type, source_id))
        cursor.execute("INSERT OR IGNORE INTO lineage_nodes (id, type, name) VALUES (?, ?, ?)", (target_id, target_type, target_id))
        
        # Insert Edge
        cursor.execute("""
            INSERT INTO lineage_edges (source_id, target_id, source_type, target_type, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (source_id, target_id, source_type, target_type, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()

    def get_lineage_graph(self) -> Dict[str, List[str]]:
        """Get naive adjacency list of the graph."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT source_id, target_id FROM lineage_edges")
        rows = cursor.fetchall()
        
        graph = {}
        for row in rows:
            src, tgt = row[0], row[1]
            if src not in graph:
                graph[src] = []
            graph[src].append(tgt)
            
        conn.close()
        return graph
