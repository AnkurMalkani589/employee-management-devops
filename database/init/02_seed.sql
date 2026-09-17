-- Employee Management - reproducible seed data
-- Runs once, right after 01_schema.sql, when the PostgreSQL volume is new.
-- ON CONFLICT keeps this idempotent if it is ever re-run.

INSERT INTO employees (name, email, department, role) VALUES
    ('Ankur Sharma', 'ankur@example.com', 'DevOps', 'Platform Engineer'),
    ('Rahul Verma',  'rahul@example.com', 'HR',     'HR Manager')
ON CONFLICT (email) DO NOTHING;
