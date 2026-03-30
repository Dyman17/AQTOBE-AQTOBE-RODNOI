from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.school_db import reset_school_db
from app.substitution import reset_substitution_state


@pytest.fixture()
def client():
    reset_school_db()
    reset_substitution_state()
    with TestClient(app) as test_client:
        yield test_client
