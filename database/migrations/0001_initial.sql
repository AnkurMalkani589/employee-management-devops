-- Migration: 0001_initial
-- Baseline migration mirroring database/init/01_schema.sql.
-- Apply with: psql "$DATABASE_URL" -f database/migrations/0001_initial.sql

BEGIN;

CREATE TABLE IF NOT EXISTS employees (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    department  VARCHAR(120)  NOT NULL,
    role        VARCHAR(120)  NOT NULL DEFAULT 'Employee',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS ix_employees_name       ON employees (name);
CREATE INDEX IF NOT EXISTS ix_employees_department ON employees (department);

COMMIT;
