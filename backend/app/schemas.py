"""Pydantic schemas — the API request/response contract.

These define exactly what the frontend may send and what it will receive.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class EmployeeBase(BaseModel):
    """Shared employee fields."""

    name: str = Field(..., min_length=1, max_length=120, examples=["Ankur Sharma"])
    email: EmailStr = Field(..., examples=["ankur@example.com"])
    department: str = Field(..., min_length=1, max_length=120, examples=["DevOps"])
    role: str = Field(default="Employee", min_length=1, max_length=120, examples=["Engineer"])


class EmployeeCreate(EmployeeBase):
    """Payload for creating an employee."""


class EmployeeUpdate(BaseModel):
    """Payload for updating an employee — every field is optional."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    department: str | None = Field(default=None, min_length=1, max_length=120)
    role: str | None = Field(default=None, min_length=1, max_length=120)


class Employee(EmployeeBase):
    """Employee as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class HealthResponse(BaseModel):
    """Health / readiness response."""

    status: str
    database: str
    version: str
    environment: str


class Message(BaseModel):
    """Simple message envelope."""

    message: str
