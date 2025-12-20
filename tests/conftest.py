import pytest
import os
from dataguard.cli import STORE_PATH

@pytest.fixture(autouse=True)
def clean_env():
    """
    Automatically clean up the test environment before and after each test run.
    This ensures that the 'dataguard.db' file doesn't persist between tests.
    """
    # Teardown logic can go here if needed
    yield
    # Cleanup default db path if created by tests outside of filtered fixtures
    if os.path.exists(STORE_PATH):
        try:
            os.remove(STORE_PATH)
        except OSError:
            pass
