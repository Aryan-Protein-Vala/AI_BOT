import pytest
from starlette.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Sorsiri Brand Workspace Agent"
    assert "protocol" in data


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "needs_configuration")
    assert data["protocol"] == "AG-UI"


def test_schema_endpoint(client):
    response = client.get("/api/brief/schema")
    assert response.status_code == 200
    data = response.json()
    assert "schema" in data
    assert "default" in data
    assert data["default"]["brandName"] == "Lumen House"


def test_validate_endpoint_valid(client):
    payload = {
        "brandName": "Nordic Living",
        "industry": "Home Goods",
        "targetAudience": "Urban apartment dwellers",
    }
    response = client.post("/api/brief/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["snapshot"]["brandName"] == "Nordic Living"


def test_validate_endpoint_preserves_completeness(client):
    payload = {
        "brandName": "Test Brand",
        "industry": "Tech",
        "targetAudience": "Engineers",
        "painPoints": "Slow tooling",
        "positioning": "Fast by default",
        "personality": "Pragmatic",
        "valueProposition": "Save 10 hours a week",
        "differentiators": "100x faster execution",
        "tone": "Direct",
        "launchObjective": "100 beta users",
    }
    response = client.post("/api/brief/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["completeness"] == 10
    assert len(data["missingFields"]) == 0


def test_agent_endpoint_requires_fields(client):
    # Sending missing threadId and runId should return 422
    response = client.post("/agent", json={"messages": []})
    assert response.status_code == 422


def test_agent_endpoint_returns_sse_stream(client):
    # Valid AG-UI payload
    payload = {
        "threadId": "test-thread-1",
        "runId": "test-run-1",
        "messages": [
            {"id": "msg-1", "role": "user", "content": "Hello, Sorsiri!"}
        ],
        "state": {
            "brandName": "Lumen House",
            "positioning": "Intimate boutique stays",
        },
    }
    response = client.post("/agent", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    # Check that events exist in the stream
    events = [line for line in response.text.split("\n") if line.startswith("data: ")]
    assert len(events) > 0
    # First event is RUN_STARTED
    assert any("RUN_STARTED" in e for e in events)
