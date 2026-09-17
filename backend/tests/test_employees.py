"""Full CRUD + validation tests for the /employees resource."""

from fastapi.testclient import TestClient


def test_list_employees_empty(client: TestClient) -> None:
    response = client.get("/employees")
    assert response.status_code == 200
    assert response.json() == []


def test_create_employee(client: TestClient, sample_employee: dict) -> None:
    response = client.post("/employees", json=sample_employee)
    assert response.status_code == 201
    body = response.json()
    assert body["id"] > 0
    assert body["name"] == sample_employee["name"]
    assert body["email"] == sample_employee["email"]
    assert "created_at" in body


def test_create_then_list(client: TestClient, sample_employee: dict) -> None:
    client.post("/employees", json=sample_employee)
    response = client.get("/employees")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_employee_by_id(client: TestClient, sample_employee: dict) -> None:
    created = client.post("/employees", json=sample_employee).json()
    response = client.get(f"/employees/{created['id']}")
    assert response.status_code == 200
    assert response.json()["email"] == sample_employee["email"]


def test_get_missing_employee_returns_404(client: TestClient) -> None:
    response = client.get("/employees/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_employee_put(client: TestClient, sample_employee: dict) -> None:
    created = client.post("/employees", json=sample_employee).json()
    response = client.put(
        f"/employees/{created['id']}", json={"department": "Platform"}
    )
    assert response.status_code == 200
    assert response.json()["department"] == "Platform"
    # untouched fields remain
    assert response.json()["name"] == sample_employee["name"]


def test_update_employee_patch(client: TestClient, sample_employee: dict) -> None:
    created = client.post("/employees", json=sample_employee).json()
    response = client.patch(f"/employees/{created['id']}", json={"role": "Staff"})
    assert response.status_code == 200
    assert response.json()["role"] == "Staff"


def test_update_missing_employee_returns_404(client: TestClient) -> None:
    response = client.put("/employees/424242", json={"name": "Ghost"})
    assert response.status_code == 404


def test_delete_employee(client: TestClient, sample_employee: dict) -> None:
    created = client.post("/employees", json=sample_employee).json()
    response = client.delete(f"/employees/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/employees/{created['id']}").status_code == 404


def test_delete_missing_employee_returns_404(client: TestClient) -> None:
    assert client.delete("/employees/777").status_code == 404


def test_duplicate_email_returns_409(client: TestClient, sample_employee: dict) -> None:
    client.post("/employees", json=sample_employee)
    response = client.post("/employees", json=sample_employee)
    assert response.status_code == 409


def test_create_validation_errors(client: TestClient) -> None:
    # Missing required field
    assert client.post("/employees", json={"name": "No Email"}).status_code == 422
    # Invalid email
    bad = {
        "name": "Bad",
        "email": "not-an-email",
        "department": "X",
        "role": "Y",
    }
    assert client.post("/employees", json=bad).status_code == 422
    # Empty name
    empty = {
        "name": "",
        "email": "e@example.com",
        "department": "X",
        "role": "Y",
    }
    assert client.post("/employees", json=empty).status_code == 422


def test_pagination(client: TestClient) -> None:
    for i in range(5):
        client.post(
            "/employees",
            json={
                "name": f"Emp {i}",
                "email": f"emp{i}@example.com",
                "department": "QA",
                "role": "Tester",
            },
        )
    response = client.get("/employees?skip=1&limit=2")
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["email"] == "emp1@example.com"
