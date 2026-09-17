"""Employee CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.logging_config import get_logger

router = APIRouter(prefix="/employees", tags=["employees"])
logger = get_logger(__name__)


@router.get("", response_model=list[schemas.Employee])
def list_employees(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[schemas.Employee]:
    """Return a paginated list of employees."""
    return crud.list_employees(db, skip=skip, limit=limit)


@router.get("/{employee_id}", response_model=schemas.Employee)
def get_employee(employee_id: int, db: Session = Depends(get_db)) -> schemas.Employee:
    """Return one employee by id."""
    employee = crud.get_employee(db, employee_id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {employee_id} not found",
        )
    return employee


@router.post("", response_model=schemas.Employee, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: schemas.EmployeeCreate, db: Session = Depends(get_db)
) -> schemas.Employee:
    """Create a new employee. Rejects duplicate emails with 409."""
    if crud.get_employee_by_email(db, payload.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An employee with email {payload.email} already exists",
        )
    employee = crud.create_employee(db, payload)
    logger.info("Created employee id=%s email=%s", employee.id, employee.email)
    return employee


@router.put("/{employee_id}", response_model=schemas.Employee)
def update_employee(
    employee_id: int,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
) -> schemas.Employee:
    """Update an employee (partial update)."""
    employee = crud.get_employee(db, employee_id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {employee_id} not found",
        )
    if payload.email is not None and payload.email != employee.email:
        existing = crud.get_employee_by_email(db, payload.email)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An employee with email {payload.email} already exists",
            )
    employee = crud.update_employee(db, employee, payload)
    logger.info("Updated employee id=%s", employee.id)
    return employee


@router.patch("/{employee_id}", response_model=schemas.Employee)
def patch_employee(
    employee_id: int,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
) -> schemas.Employee:
    """Alias of PUT — a partial update."""
    return update_employee(employee_id, payload, db)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)) -> None:
    """Delete an employee."""
    employee = crud.get_employee(db, employee_id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {employee_id} not found",
        )
    crud.delete_employee(db, employee)
    logger.info("Deleted employee id=%s", employee_id)
