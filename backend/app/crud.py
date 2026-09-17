"""Database access helpers (CRUD) for employees."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas


def list_employees(db: Session, skip: int = 0, limit: int = 100) -> list[models.Employee]:
    """Return a page of employees."""
    stmt = select(models.Employee).order_by(models.Employee.id).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


def get_employee(db: Session, employee_id: int) -> models.Employee | None:
    """Return a single employee or None."""
    return db.get(models.Employee, employee_id)


def get_employee_by_email(db: Session, email: str) -> models.Employee | None:
    """Return an employee by email or None."""
    stmt = select(models.Employee).where(models.Employee.email == email)
    return db.scalars(stmt).first()


def create_employee(db: Session, payload: schemas.EmployeeCreate) -> models.Employee:
    """Create and persist a new employee."""
    employee = models.Employee(**payload.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def update_employee(
    db: Session, employee: models.Employee, payload: schemas.EmployeeUpdate
) -> models.Employee:
    """Apply a partial update and persist it."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db: Session, employee: models.Employee) -> None:
    """Delete an employee."""
    db.delete(employee)
    db.commit()
