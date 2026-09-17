# Employee Management - DevOps
A complete, reproducible, end-to-end DevOps project: a **React** frontend talking to a
**FastAPI** backend backed by **PostgreSQL**, containerized with **Docker**, fronted by
**Nginx**, tested in **CI**, released through a **CD** pipeline with health checks and
rollback, and provisioned with **Terraform**, **Ansible** and **Kubernetes**.

```
Developer -> Git -> Feature branch -> Pull Request -> CI (lint, test, security, build,
  docker) -> registry -> deploy -> health check -> (rollback on failure) -> Nginx ->
  Frontend -> Backend API -> PostgreSQL
```

---

## Table of contents
1. [Project overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology stack](#3-technology-stack)
4. [Local setup](#4-local-setup)
5. [Environment variables](#5-environment-variables)
6. [Docker setup](#6-docker-setup)
7. [Database setup](#7-database-setup)
8. [API usage](#8-api-usage)
9. [Testing](#9-testing)
10. [CI](#10-ci)
11. [CD](#11-cd)
12. [Deployment](#12-deployment)
13. [Rollback](#13-rollback)
14. [AWS](#14-aws)
15. [Terraform](#15-terraform)
16. [Ansible](#16-ansible)
17. [Kubernetes](#17-kubernetes)
18. [Monitoring](#18-monitoring)
19. [Security](#19-security)
20. [Backup / restore](#20-backup--restore)
21. [Troubleshooting](#21-troubleshooting)
22. [Repository structure](#22-repository-structure)
23. [External prerequisites](#23-external-prerequisites)

---

## 1. Project overview

The application manages employees (CRUD). It exists to demonstrate a **fully connected**
DevOps lifecycle rather than isolated pieces:

- The frontend **actually calls** the backend API (same routes, verified).
- The backend **actually uses** PostgreSQL (same schema/models, verified against a real
  PostgreSQL).
- Nginx **actually proxies** `/api` to the backend and `/` to the frontend.
- CI **actually runs** the tests, linters, security scans and Docker builds.
- CD **actually verifies health** after deploy and **rolls back** on failure.

---

## 2. Architecture
### Request flow (local / Compose)

```
Browser
  |
  v
Nginx  (edge, published on :8080)
  |-- /            --> frontend:80   (React SPA, served by nginx)
  |-- /api/...     --> backend:8000  (FastAPI, /api prefix stripped)
  |-- /health,/docs,/metrics --> backend:8000
                              |
                              v
                          PostgreSQL (service "db":5432)
```

### Request flow (production / AWS)

```
DNS -> Elastic IP -> EC2 host
                       |-- Docker Compose: nginx -> frontend + backend
                       |-- backend -> RDS PostgreSQL (private subnet, SG-restricted)
                       |-- CloudWatch: logs + metrics + alarms
```

---

## 3. Technology stack
| Layer        | Technology                                   |
|--------------|----------------------------------------------|
| Frontend     | React 18, Vite 7, Vitest, nginx              |
| Backend      | FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn  |
| Database     | PostgreSQL 16                                |
| Containers   | Docker, Docker Compose                       |
| Proxy        | Nginx                                        |
| CI/CD        | GitHub Actions, GHCR                         |
| IaC          | Terraform (AWS), Ansible                     |
| Orchestration| Kubernetes (manifests provided)              |
| Observability| Prometheus, Grafana, `/metrics`, health probes|
| Security     | Trivy, gitleaks, pip-audit, npm audit, ruff  |

---

## 4. Local setup
### Option A - Docker Compose (recommended, everything)

```bash
git clone <repo-url>
cd employee-management-devops
cp .env.example .env          # adjust values if you like
docker compose up -d --build
# open http://localhost:8080
```

That single command brings up PostgreSQL, the API, the frontend and nginx.

### Option B - Run components directly
**Backend**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   Unix: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
# point at a running PostgreSQL
export DATABASE_URL="postgresql+psycopg://employee:employee@localhost:5432/employees"
uvicorn app.main:app --reload
# -> http://localhost:8000/docs
```

**Frontend**

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to localhost:8000)
```

---

## 5. Environment variables
Copy `.env.example` to `.env`. See the file for the full list. Key variables:

| Variable             | Default       | Used by       | Notes                                   |
|----------------------|---------------|---------------|-----------------------------------------|
| `DATABASE_URL`       | -             | backend       | Full DSN; overrides the `POSTGRES_*` set |
| `POSTGRES_USER`      | `employee`    | db, backend   |                                          |
| `POSTGRES_PASSWORD`  | `employee`    | db, backend   | **Change in real environments**          |
| `POSTGRES_DB`        | `employees`   | db, backend   |                                          |
| `POSTGRES_HOST`      | `localhost`   | backend       | Compose sets this to the service `db`    |
| `POSTGRES_PORT`      | `5432`        | db, backend   |                                          |
| `SEED_ON_STARTUP`    | `true`        | backend       | Insert sample rows when table empty      |
| `ENVIRONMENT`        | `development` | backend       |                                          |
| `LOG_LEVEL`          | `INFO`        | backend       |                                          |
| `CORS_ORIGINS`       | (empty)       | backend       | Comma-separated; empty = allow all       |
| `VITE_API_BASE_URL`  | `/api`        | frontend      | Baked in at build time                   |
| `NGINX_HTTP_PORT`    | `8080`        | nginx         | Host port for the edge proxy             |

No secrets are committed. Real secrets come from environment variables / CI secrets /
cloud secret managers.

---

## 6. Docker setup
Services (`docker-compose.yml`):

| Service   | Image / build            | Port          | Healthcheck        |
|-----------|--------------------------|---------------|--------------------|
| `db`      | `postgres:16-alpine`     | `5432`        | `pg_isready`       |
| `backend` | built from `backend/`    | internal 8000 | `curl /health`     |
| `frontend`| built from `frontend/`   | internal 80   | `wget /`           |
| `nginx`   | `nginx:1.27-alpine`      | `8080`        | `wget /nginx-health`|

Notes:

- Persistent volume `db_data` for PostgreSQL.
- All services share the `app_net` bridge network; discovery is by service name.
- Containers run as non-root where practical (backend uses `appuser`).
- `depends_on` + healthchecks gate startup order.

**Observability overlay** (optional):

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d
# Prometheus: http://localhost:9090   Grafana: http://localhost:3000 (admin/admin)
```

---

## 7. Database setup
- **Initialization**: `database/init/01_schema.sql` and `02_seed.sql` are mounted into
  `/docker-entrypoint-initdb.d` and run automatically on a fresh volume.
- **Self-healing**: the API also runs `Base.metadata.create_all` at startup, so it works
  against an existing volume or a bare database.
- **Migrations**: `database/migrations/0001_initial.sql` is the baseline. Apply with:

  ```bash
  psql "$DATABASE_URL" -f database/migrations/0001_initial.sql
  ```

- **Schema**: `employees(id PK, name, email UNIQUE, department, role, created_at, updated_at)`
  with indexes on `name`, `department` and a unique index on `email`; a trigger keeps
  `updated_at` fresh.

### Database lifecycle
```bash
docker compose down -v      # destroy data (drop volume)
docker compose up -d        # recreate + re-run init SQL + seed
```

---

## 8. API usage
Base URL (through nginx): `http://localhost:8080/api`

| Method | Path               | Description                | Success |
|--------|--------------------|----------------------------|---------|
| GET    | `/`                | Service banner             | 200     |
| GET    | `/health`          | Liveness (+ DB status)     | 200     |
| GET    | `/ready`           | Readiness (503 if DB down) | 200     |
| GET    | `/metrics`         | Prometheus metrics         | 200     |
| GET    | `/employees`       | List (`?skip=&limit=`)     | 200     |
| GET    | `/employees/{id}`  | Get one                    | 200     |
| POST   | `/employees`       | Create                     | 201     |
| PUT    | `/employees/{id}`  | Update (partial)           | 200     |
| PATCH  | `/employees/{id}`  | Update (partial)           | 200     |
| DELETE | `/employees/{id}`  | Delete                     | 204     |

Interactive docs: `http://localhost:8080/docs`.

Examples:

```bash
# list
curl http://localhost:8080/api/employees
# create
curl -X POST http://localhost:8080/api/employees \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"jane@example.com","department":"Eng","role":"Engineer"}'

# update
curl -X PUT http://localhost:8080/api/employees/1 \
  -H 'Content-Type: application/json' -d '{"department":"Platform"}'

# delete
curl -X DELETE http://localhost:8080/api/employees/1
```

---

## 9. Testing
**Backend** (pytest, ~26 tests):

```bash
cd backend
python -m pytest -v                 # unit + API + validation + error + schema parity
python -m ruff check app tests      # lint
```

- API tests run against an isolated SQLite database (no external dependency).
- `tests/test_db_integration.py` runs against **real PostgreSQL** when
  `POSTGRES_TEST_DSN` is set (CI does this).
- Schema/model parity is locked down in `tests/test_schema_parity.py`.

**Frontend** (Vitest, 11 tests):

```bash
cd frontend
npm run lint
npm run test
npm run build
```

**Real PostgreSQL verification** (no Docker needed):

```bash
pip install pgserver
python scripts/verify_postgres_integration.py
```

This boots an embedded real PostgreSQL, applies `database/init`, and drives the full CRUD
API against it - proving the Backend <-> PostgreSQL integration end to end.

**End-to-end smoke test** (against a running stack):

```bash
BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
```

---

## 10. CI
`.github/workflows/ci.yml`, triggered on push/PR to `main`/`develop`/`feature/**`:

1. **backend** - setup Python 3.12, install deps, `ruff`, start a **PostgreSQL service**,
   apply the schema, run `pytest` with coverage.
2. **frontend** - setup Node 22, `npm ci`, `eslint`, `vitest`, `vite build`, upload artifact.
3. **security** - `gitleaks` (secrets), `pip-audit`, `npm audit`, Trivy IaC scan.
4. **docker** - build both images (Buildx + GHA cache), Trivy image scans.

No job references a file that doesn't exist; all paths match the repo layout.

---

## 11. CD
`.github/workflows/cd.yml`, triggered on push to `main`/tags and after a successful CI run:

1. **build-and-push** - build backend + frontend images, push to **GHCR** tagged with the
   commit SHA *and* `latest`.
2. **deploy** - SSH to the target host and run `scripts/deploy.sh`, which:
   - records the currently running tag,
   - pulls the new images,
   - brings the stack up,
   - waits for `/api/health` to report `status: ok`,
   - **rolls back** to the previous tag if health fails,
   - exits non-zero if the new version did not become healthy.
3. **post-deploy smoke test** - re-checks health from the runner.

If deploy secrets are not configured, the deploy job **skips cleanly** (the build and
registry steps still succeed) instead of failing.

---

## 12. Deployment
### Prerequisites
- A host with Docker + Docker Compose and a checkout of this repo
  (Terraform + Ansible provide exactly this).

### Manual deploy
```bash
export IMAGE_TAG=<git-sha>
export BACKEND_IMAGE=ghcr.io/<owner>/<repo>/backend
export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>/frontend
./scripts/deploy.sh
```

### Automated deploy
Push to `main`. CI runs, CD builds/pushes images and deploys. See section 11.

---

## 13. Rollback
Rollback is built into `scripts/deploy.sh` and is **automatic**:

```
new images -> up -> health FAIL -> restore previous tag -> up -> health
                                                        |-- OK  -> exit 1 (deploy reported failed)
                                                        |-- FAIL-> dump logs, exit 1 (manual action)
```

State is tracked in `.deployed_tag` (last good) and `.previous_image_tag` (rollback target)
on the deploy host. To roll back manually:

```bash
export IMAGE_TAG=$(cat .deployed_tag)
export BACKEND_IMAGE=ghcr.io/<owner>/<repo>/backend
export FRONTEND_IMAGE=ghcr.io/<owner>/<repo>/frontend
./scripts/deploy.sh
```

---

## 14. AWS
Terraform provisions:

- **VPC** with a public subnet (app host) and private subnets (RDS).
- **Security groups**: app SG (80/443 public, 22 restricted) and DB SG (5432 only from the
  app SG - the database is never publicly reachable).
- **EC2** app host (Ubuntu 22.04, IMDSv2 enforced, encrypted gp3 root) with an **Elastic IP**.
- **ECR** repositories (backend + frontend) with scan-on-push and lifecycle policies.
- **IAM**: an instance role (ECR pull + SSM + CloudWatch agent) and an optional GitHub OIDC
  role for keyless CI/CD deploys.
- **RDS PostgreSQL** (optional, `create_rds = true`): private, encrypted, Multi-AZ in prod.
- **CloudWatch**: log group, dashboard and an instance status alarm.

No AWS credentials are stored in the repo.

---

## 15. Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # edit as needed
# provide the DB password out-of-band (never in tfvars committed to git)
export TF_VAR_db_password="<strong-password>"   # PowerShell: $env:TF_VAR_db_password="..."

terraform init -backend=false     # or configure the S3 backend in versions.tf
terraform fmt
terraform validate
terraform plan
terraform apply
```

Outputs include `app_public_ip`, `app_url`, ECR URLs and the RDS endpoint.

**Remote state**: configured but commented out in `versions.tf`. Create an S3 bucket +
DynamoDB lock table and uncomment before team use.

---

## 16. Ansible
Configures the server **runtime** (distinct from Terraform's infrastructure role):

```bash
cd ansible
cp inventory.example.ini inventory.ini         # set the host from `terraform output app_public_ip`
ansible-galaxy collection install -r requirements.yml
ansible-playbook -i inventory.ini playbook.yml --syntax-check
ansible-playbook -i inventory.ini playbook.yml
```

Installs Docker + the Compose plugin, creates the deploy directory and backup directory,
adds the deploy user to the `docker` group, and verifies `docker compose` is available.
The playbook is idempotent.

---

## 17. Kubernetes
Manifests in `k8s/` (validate with `kubectl apply --dry-run=client -f <file>`):

| File                       | Contents                                                        |
|----------------------------|-----------------------------------------------------------------|
| `01-config.yaml`           | Namespace, ConfigMap, Secret (placeholder password)             |
| `02-postgres.yaml`         | PVC, Postgres Deployment, headless Service                      |
| `03-backend-frontend.yaml` | Backend + frontend Deployments and Services (probes, limits)    |
| `04-ingress.yaml`          | Ingress: `/api` -> backend, `/` -> frontend                     |

```bash
kubectl apply -f k8s/01-config.yaml
kubectl -n employee-management create secret generic app-secrets \
  --from-literal=POSTGRES_USER=employee \
  --from-literal=POSTGRES_PASSWORD='<strong-password>' --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/
```

Probes map to the real endpoints: backend readiness `/ready`, liveness `/health`.
Backend pods carry `prometheus.io/scrape` annotations.

---

## 18. Monitoring
- **Health**: `/health` (liveness) and `/ready` (readiness) on the backend, consumed by
  Docker healthchecks, Kubernetes probes and the CD pipeline.
- **Metrics**: `/metrics` (Prometheus format) exposes request counts, latency histogram,
  in-flight requests and a `db_up` gauge.
- **Logs**: structured stdout logs (request-id tagged) from the API; nginx access/error
  logs; all captured by `docker compose logs` and shipped to CloudWatch on AWS.
- **Prometheus + Grafana**: `docker-compose.observability.yml` adds both, with a
  provisioned datasource and dashboard (`observability/grafana/...`).

---

## 19. Security
- **No secrets in the repo** - gitleaks runs in CI; `.env` is gitignored; `.env.example`
  carries only non-secret defaults.
- **Dependency scans**: `pip-audit` (Python) and `npm audit --audit-level=high` (Node) in CI.
- **Container/IaC scans**: Trivy scans images and Terraform/K8s config (`trivy.yaml`).
- **Linting**: `ruff` (backend), `eslint` (frontend).
- **Image hygiene**: non-root backend user, slim base images, multi-stage builds.
- **Nginx**: security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- **Least privilege**: DB security group only reachable from the app SG; app IAM role limited
  to ECR pull + SSM + CloudWatch; optional GitHub OIDC role instead of long-lived keys.
- **Pinned dependencies**: exact versions in `requirements.txt` and `package.json`.

The frontend dependency tree was upgraded to Vite 7 / Vitest 4 to clear advisories;
`npm audit` now reports **0 vulnerabilities**.

---

## 20. Backup / restore
**Backup** (`scripts/backup_db.sh`): timestamped custom-format `pg_dump`, compressed,
integrity-verified with `pg_restore --list`, and pruned by `BACKUP_RETENTION_DAYS`.

```bash
PGHOST=localhost PGUSER=employee PGPASSWORD=employee ./scripts/backup_db.sh
```

**Restore** (`scripts/restore_db.sh`):

```bash
./scripts/restore_db.sh                            # latest backup
./scripts/restore_db.sh /backups/employees_X.dump  # specific backup
```

`pg_restore --clean --if-exists` restores objects cleanly. A backup that cannot be
restored is not considered complete - verify with `pg_restore --list` (the backup script
does this automatically).

For AWS, prefer RDS automated backups (enabled via `backup_retention_period`).

---

## 21. Troubleshooting
| Symptom                                   | Cause / fix                                                          |
|-------------------------------------------|----------------------------------------------------------------------|
| `docker compose up` - backend restarts    | DB not ready yet; the API retries (`DB_CONNECT_RETRIES`). Check `docker compose logs db`. |
| `/api/health` returns `database: unavailable` | Wrong `POSTGRES_*` / DB down. Inside Compose `POSTGRES_HOST` must be `db`. |
| Port 8080 in use                          | Set `NGINX_HTTP_PORT=8081` in `.env` and retry.                       |
| Frontend shows network error              | Check nginx upstreams and that `VITE_API_BASE_URL=/api` was used at build. |
| CD deploy step skipped                    | `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY` secrets not set.         |
| CD deploy fails after health check        | New image unhealthy; rollback ran automatically - inspect logs and `.previous_image_tag`. |

---

## 22. Repository structure
```
employee-management-devops/
├── backend/                  # FastAPI app + tests + Dockerfile
│   ├── app/                  # config, database, models, schemas, crud, routers, metrics
│   ├── tests/                # unit, API, validation, parity, integration
│   ├── Dockerfile
│   ├── requirements.txt / requirements-dev.txt
│   ├── pytest.ini / ruff.toml
├── frontend/                 # React + Vite app + tests + Dockerfile
│   ├── src/                  # App, components, api client, validation, styles
│   ├── src/test/             # vitest tests
│   ├── Dockerfile / nginx.conf
├── database/
│   ├── init/                 # 01_schema.sql, 02_seed.sql
│   └── migrations/           # 0001_initial.sql
├── nginx/nginx.conf          # edge reverse proxy
├── observability/            # prometheus + grafana provisioning
├── scripts/                  # ci, deploy, smoke_test, backup_db, restore_db, verify_*, validate_yaml
├── terraform/                # AWS IaC (VPC, EC2, ECR, RDS, IAM, CloudWatch)
├── ansible/                  # server configuration playbook
├── k8s/                      # Kubernetes manifests
├── docs/                     # additional documentation
├── .github/workflows/        # ci.yml, cd.yml
├── docker-compose.yml
├── docker-compose.observability.yml
├── .env.example
├── trivy.yaml
└── README.md
```

---

## 23. External prerequisites
Everything is implemented locally. The following require **your** accounts/credentials and
cannot be created here:

| Item | Needed for | How |
|------|-----------|-----|
| AWS account + credentials | `terraform apply` | `aws configure` or `AWS_*` env vars |
| SSH key pair | EC2 access | `var.key_name` |
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` GitHub secrets | automated CD | Repo → Settings → Secrets |
| GitHub Container Registry | image push in CD | Uses the built-in `GITHUB_TOKEN` (no extra secret) |
| Domain / DNS record | public HTTPS | Point an A record at `terraform output app_public_ip` |
| TLS certificate | HTTPS | Add a cert (e.g. certbot) on the host or use an ALB |

Once these exist, the pipelines run end to end without further code changes.
