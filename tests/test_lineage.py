import pytest
from dataguard.storage.metadata import MetadataStore
from dataguard.storage.models import LineageNode, LineageEdge

def test_lineage_storage():
    store = MetadataStore()
    
    # 1. Save an edge:  Raw -> Process -> Clean
    store.save_lineage_edge("raw_data.csv", "etl_job", source_type="dataset", target_type="job")
    store.save_lineage_edge("etl_job", "clean_data.csv", source_type="job", target_type="dataset")
    
    # 2. Retrieve graph
    graph = store.get_lineage_graph()
    
    # 3. Verify adjacency list
    assert "raw_data.csv" in graph
    assert "etl_job" in graph["raw_data.csv"]
    
    assert "etl_job" in graph
    assert "clean_data.csv" in graph["etl_job"]
    
    # 4. Verify Nodes auto-creation (checking internal DB state)
    conn = store._get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, type FROM lineage_nodes WHERE id = 'etl_job'")
    row = cursor.fetchone()
    assert row is not None
    assert row[1] == "job"
    assert row is not None
    assert row[1] == "job"
    conn.close()

def test_decorator_usage():
    from dataguard.core.lineage import track_lineage
    from dataguard.storage.metadata import MetadataStore
    
    # Define a decorated function
    @track_lineage(inputs=["source.csv"], outputs=["dest.csv"])
    def my_etl_process():
        return "success"
        
    # Execute it
    res = my_etl_process()
    assert res == "success"
    
    # Check DB
    store = MetadataStore()
    graph = store.get_lineage_graph()
    
    # source.csv -> my_etl_process
    assert "source.csv" in graph
    assert "my_etl_process" in graph["source.csv"]
    
    # my_etl_process -> dest.csv
    assert "my_etl_process" in graph
    assert "dest.csv" in graph["my_etl_process"]
