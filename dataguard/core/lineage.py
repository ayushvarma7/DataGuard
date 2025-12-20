import functools
import inspect
from typing import List, Union, Optional
from pathlib import Path
from dataguard.storage.metadata import MetadataStore

class LineageTracker:
    """Helper to log lineage events."""
    
    def __init__(self):
        self.store = MetadataStore()
        
    def log_process_run(self, process_name: str, inputs: List[str], outputs: List[str]):
        """
        Log a process execution.
        
        Args:
            process_name: Name of the function or job.
            inputs: List of input file paths or dataset names.
            outputs: List of output file paths or dataset names.
        """
        # Save Inputs -> Process
        for inp in inputs:
            # We treat inputs as Datasets and Process as a Job
            self.store.save_lineage_edge(
                source_id=self._normalize_name(inp),
                target_id=process_name,
                source_type="dataset",
                target_type="job"
            )
            
        # Save Process -> Outputs
        for out in outputs:
            self.store.save_lineage_edge(
                source_id=process_name,
                target_id=self._normalize_name(out),
                source_type="job",
                target_type="dataset"
            )
            
    def _normalize_name(self, path_or_name: str) -> str:
        """
        Normalize file paths to just the filename for cleaner graphs.
        If it's a full path, return stem+suffix.
        """
        return Path(path_or_name).name

def track_lineage(inputs: Union[str, List[str]], outputs: Union[str, List[str]]):
    """
    Decorator to automatically track data lineage.
    
    Usage:
        @track_lineage(inputs=["raw.csv"], outputs=["clean.csv"])
        def clean_data():
            ...
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # 1. Execute the function
            result = func(*args, **kwargs)
            
            # 2. Log Lineage (only if successful)
            try:
                tracker = LineageTracker()
                
                # Handle single string input/output convenience
                input_list = [inputs] if isinstance(inputs, str) else inputs
                output_list = [outputs] if isinstance(outputs, str) else outputs
                
                # Resolve runtime values if they are arguments? 
                # For simplicity v1: we assume static strings or file paths passed to decorator.
                # Advanced v2: could inspect *args to find matching filenames.
                
                tracker.log_process_run(
                    process_name=func.__name__,
                    inputs=input_list,
                    outputs=output_list
                )
            except Exception as e:
                print(f"Warning: Failed to log lineage for {func.__name__}: {e}")
                
            return result
        return wrapper
    return decorator
