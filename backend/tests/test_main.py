from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Welcome to Employee Management API"
}


def test_employees():
    response = client.get("/employees")

    assert response.status_code == 200

    assert response.json() == [
        {
            "id": 1,
            "name": "Ankur",
            "department": "DevOps"
        },
        {
            "id": 2,
            "name": "Rahul",
            "department": "HR"
        }
    ]
