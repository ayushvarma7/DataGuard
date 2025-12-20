import streamlit as st
import pandas as pd
import json
from datetime import datetime
from dataguard.storage.metadata import MetadataStore
from dataguard.cli import STORE_PATH
import plotly.express as px

st.set_page_config(
    page_title="DataGuard Dashboard",
    page_icon="🛡️",
    layout="wide"
)

# Initialize store
@st.cache_resource
def get_store():
    return MetadataStore(STORE_PATH)

store = get_store()

# --- Sidebar ---
st.sidebar.title("🛡️ DataGuard")
st.sidebar.markdown("---")
page = st.sidebar.radio("Navigation", ["Home", "Schema Viewer", "Drift Monitor", "Lineage Graph", "Validation History", "Contract Builder"])

# --- Helper ---
def get_all_datasets():
    # We need to expose a list method in MetadataStore or query directly
    # For now, let's query directly since MetadataStore doesn't have list_datasets yet
    conn = store._get_conn()
    df = pd.read_sql("SELECT * FROM datasets", conn)
    conn.close()
    return df

# --- Pages ---

if page == "Home":
    st.title("Welcome to DataGuard")
    st.markdown("Your minimal, local data quality control center.")
    
    # metrics
    df_datasets = get_all_datasets()
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Registered Datasets", len(df_datasets))
    
    st.markdown("### Recent Datasets")
    if not df_datasets.empty:
        st.dataframe(
            df_datasets[['name', 'format', 'registered_at']].sort_values('registered_at', ascending=False),
            width="stretch"
        )
    else:
        st.info("No datasets registered yet. Use the CLI to infer a schema!")
        st.code("dataguard schema infer mydata.csv --name mydata", language="bash")

elif page == "Schema Viewer":
    st.title("Schema Viewer")
    
    df_datasets = get_all_datasets()
    
    if df_datasets.empty:
        st.warning("No datasets found.")
    else:
        selected_ds = st.selectbox("Select Dataset", df_datasets['name'])
        
        if selected_ds:
            schema = store.get_latest_schema(selected_ds)
            
            if schema:
                st.markdown(f"### Schema for `{selected_ds}`")
                st.markdown(f"**Generated at:** {schema.generated_at}")
                
                # Convert schema cols to dataframe for display
                cols_data = []
                for col in schema.columns:
                    cols_data.append({
                        "Column Name": col.name,
                        "Type": col.dtype,
                        "Nullable": "✅" if col.nullable else "❌",
                        "Metadata": str(col.metadata) if col.metadata else ""
                    })
                
                df_schema = pd.DataFrame(cols_data)
                st.dataframe(df_schema, use_container_width=True)
                
                # Visual type distribution
                st.markdown("#### Column Type Distribution")
                type_counts = df_schema['Type'].value_counts()
                fig = px.pie(values=type_counts.values, names=type_counts.index, hole=0.4)
                fig.update_layout(height=300)
                st.plotly_chart(fig)
                
            else:
                st.error("No schema found for this dataset.")

elif page == "Drift Monitor":
    st.title("Drift Monitor")
    st.info("🚧 Drift history visualization coming soon!")
    st.markdown("""
    Use the CLI to check for drift manually:
    ```bash
    dataguard schema diff <dataset_name> --file <new_file>
    ```
    """)

elif page == "Lineage Graph":
    st.title("Lineage Graph")
    
    graph = store.get_lineage_graph()
    
    if not graph:
        st.warning("No lineage data found. Use `@track_lineage` in your pipelines!")
    else:
        # Build Graphviz source
        dot = "digraph Lineage {\n"
        dot += "    rankdir=LR;\n"  # Left to right
        dot += "    node [shape=box, style=filled, fillcolor=lightblue];\n"
        
        seen_nodes = set()
        
        for src, targets in graph.items():
            if src not in seen_nodes:
                dot += f'    "{src}";\n'
                seen_nodes.add(src)
                
            for tgt in targets:
                if tgt not in seen_nodes:
                    dot += f'    "{tgt}";\n'
                    seen_nodes.add(tgt)
                dot += f'    "{src}" -> "{tgt}";\n'
                
        dot += "}"
        
        st.graphviz_chart(dot)
        
        st.json(graph)


elif page == "Validation History":
    st.title("Validation History")
    
    df_datasets = get_all_datasets()
    if df_datasets.empty:
        st.warning("No datasets found.")
    else:
        selected_ds = st.selectbox("Select Dataset", df_datasets['name'])
        
        # Fetch history
        # We need to add a method to MetadataStore to get history as DF or list
        # For now, let's query SQL directly for speed/ease in dashboard
        conn = store._get_conn()
        history_df = pd.read_sql(f"SELECT * FROM validation_runs WHERE dataset_name = '{selected_ds}' ORDER BY run_at ASC", conn)
        conn.close()
        
        if history_df.empty:
            st.info("No validation runs found for this dataset.")
        else:
            # Metrics
            total_runs = len(history_df)
            avg_failures = history_df['failed_checks'].mean()
            last_run = history_df.iloc[-1]
            last_status = "✅ PASS" if last_run['failed_checks'] == 0 else f"❌ FAIL ({last_run['failed_checks']})"
            
            c1, c2, c3 = st.columns(3)
            c1.metric("Total Runs", total_runs)
            c2.metric("Avg Failures", f"{avg_failures:.1f}")
            c3.metric("Last Status", last_status)
            
            # Chart
            st.markdown("### Trends")
            fig = px.bar(
                history_df, 
                x='run_at', 
                y='failed_checks', 
                title="Failures Over Time",
                labels={'failed_checks': 'Failed Checks', 'run_at': 'Run Time'},
                color='failed_checks',
                color_continuous_scale='RdYlGn_r' # Red for high failures, Green for low
            )
            st.plotly_chart(fig, use_container_width=True)
            
            # Table
            st.markdown("### Run Log")
            st.dataframe(
                history_df[['id', 'run_at', 'failed_checks']].sort_values('run_at', ascending=False),
                width="stretch"
            )

elif page == "Contract Builder":
    st.title("Interactive Contract Builder")
    
    df_datasets = get_all_datasets()
    if df_datasets.empty:
        st.warning("No datasets.")
    else:
        selected_ds = st.selectbox("Select Dataset", df_datasets['name'])
        
        # Load Schema
        schema = store.get_latest_schema(selected_ds)
        
        if not schema:
            st.error("No schema found.")
        else:
            st.subheader(f"Define Rules for {selected_ds}")
            
            rules_config = []
            
            with st.form("contract_form"):
                for col in schema.columns:
                    st.markdown(f"**{col.name}** ({col.dtype})")
                    c1, c2 = st.columns(2)
                    if c1.checkbox(f"Not Null", key=f"nn_{col.name}"):
                        rules_config.append({"type": "not_null", "column": col.name})
                    if c2.checkbox(f"Unique", key=f"uq_{col.name}"):
                        rules_config.append({"type": "unique", "column": col.name})
                    st.divider()
                
                submitted = st.form_submit_button("Generate Contract JSON")
                
                if submitted:
                    contract_json = json.dumps({
                        "dataset": selected_ds,
                        "rules": rules_config
                    }, indent=2)
                    st.success("Contract Generated!")
                    st.code(contract_json, language="json")



