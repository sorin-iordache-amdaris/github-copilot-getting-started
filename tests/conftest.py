import copy
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT_DIR / "src"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from app import app, activities  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture(autouse=True)
def reset_activities():
    """Ensure in-memory activities are pristine for every test."""
    original_state = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original_state))


@pytest.fixture()
def client():
    """Provide a FastAPI test client."""
    with TestClient(app) as test_client:
        yield test_client
