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
page = st.sidebar.radio("Navigation", ["Home", "Schema Viewer", "Drift Monitor"])

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
            use_container_width=True
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
