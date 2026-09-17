-- Employee Management - canonical schema
-- Executed automatically by the postgres image on first init of an empty volume
-- (mounted at /docker-entrypoint-initdb.d). The API also ensures these tables
-- exist at startup, so this file is safe and idempotent.

CREATE TABLE IF NOT EXISTS employees (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    department  VARCHAR(120)  NOT NULL,
    role        VARCHAR(120)  NOT NULL DEFAULT 'Employee',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Constraints & indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS ix_employees_name       ON employees (name);
CREATE INDEX IF NOT EXISTS ix_employees_department ON employees (department);

-- Keep updated_at fresh on UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
