from dataguard.core.lineage import track_lineage
import time

# Mock process
@track_lineage(inputs=["users_v1.csv"], outputs=["users_cleaned.csv"])
def clean_users():
    print("  -> Cleaning users... (simulated)")
    time.sleep(0.5)

@track_lineage(inputs=["users_cleaned.csv", "transactions.csv"], outputs=["user_stats.parquet"])
def calculate_user_stats():
    print("  -> Calculating stats... (simulated)")
    time.sleep(0.5)

if __name__ == "__main__":
    print("running ETL pipeline...")
    clean_users()
    calculate_user_stats()
    print("Done! Lineage logged to dataguard.db")
