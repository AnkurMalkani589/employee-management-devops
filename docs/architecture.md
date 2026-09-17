# Architecture

## Component map

```
                        +-------------------+
                        |     Browser       |
                        +---------+---------+
                                  | HTTP :8080
                                  v
                        +-------------------+
                        |   Nginx (edge)    |
                        +--+-------------+--+
                           |             |
                 /         |             |  /api/*
                           v             v
                 +----------------+  +--------------------+
                 |  frontend:80   |  |   backend:8000     |
                 |  (React SPA)   |  |   (FastAPI)        |
                 +----------------+  +---------+----------+
                                                 |
                                                 | psycopg
                                                 v
                                       +--------------------+
                                       |  PostgreSQL 16     |
                                       |  service: db:5432  |
                                       +--------------------+
```

## Request lifecycle

1. The browser loads the SPA from nginx (`/`).
2. The SPA calls the API using the relative base `/api` (no hardcoded hosts).
3. Nginx strips `/api` and proxies to the `backend` upstream.
4. FastAPI validates the request with Pydantic, executes the SQLAlchemy operation in a
   request-scoped session, and returns a Pydantic-serialized response.
5. The middleware records metrics, logs the request with an id, and stamps `X-Request-ID`.

## Environment parity

The **same** backend image runs locally, in CI and in production. Behaviour is driven only
by environment variables:

| Concern    | Local (compose) | CI                  | Production            |
|------------|-----------------|---------------------|-----------------------|
| DB host    | `db` (service)  | `localhost` service | RDS endpoint          |
| DB creds   | `.env` defaults | service env         | secret manager / env  |
| API base   | `/api` via nginx| `/api`              | `/api` via nginx/ALB  |
| Log level  | INFO            | INFO                | INFO                  |

## Extension points

- **Add a field to Employee**: update `models.py`, `schemas.py`, and
  `database/init/01_schema.sql` + a migration; the parity test guards drift.
- **Add an endpoint**: add to `routers/`, wire in `main.py`; it appears in `/docs` and the
  frontend `api.js` automatically exposes a method for it.
- **Change the proxy path**: edit `nginx/nginx.conf`; `VITE_API_BASE_URL` stays `/api`.
