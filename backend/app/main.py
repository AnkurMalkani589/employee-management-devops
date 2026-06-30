from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Welcome to Employee Management API"
    }


@app.get("/employees")
def employees():
    return [
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
