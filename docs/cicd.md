# CI/CD

## CI (`.github/workflows/ci.yml`)

Triggered on push/PR to `main`, `develop`, `feature/**`.

```
checkout
  |
  +--> backend job:      setup python -> install -> ruff -> postgres service -> schema -> pytest(coverage)
  +--> frontend job:     setup node   -> npm ci -> eslint -> vitest -> vite build -> upload artifact
  +--> security job:     gitleaks -> pip-audit -> npm audit -> trivy iac
  +--> docker job:       buildx build backend+frontend -> trivy image scan
```

Backend and frontend run in parallel; the docker job waits for both.

## CD (`.github/workflows/cd.yml`)

Triggered on push to `main`/tags and on successful CI completion for `main`.

```
build-and-push (GHCR)
  backend:<sha>, backend:latest
  frontend:<sha>, frontend:latest
        |
        v
deploy (SSH -> scripts/deploy.sh)
  record current tag
  pull new images
  docker compose up -d
  wait for /api/health == ok
    OK   -> write .deployed_tag, success
    FAIL -> restore previous images -> up -> verify
                 OK   -> exit 1 (new deploy reported failed, service restored)
                 FAIL -> dump logs, exit 1 (manual intervention)
        |
        v
post-deploy smoke test (from runner)
```

## Required secrets

| Secret           | Purpose                              |
|------------------|--------------------------------------|
| `DEPLOY_HOST`    | Target host (IP or DNS)              |
| `DEPLOY_USER`    | SSH user                             |
| `DEPLOY_SSH_KEY` | Private key (PEM contents)           |

`GITHUB_TOKEN` (built-in) is used to push images to GHCR. If the deploy secrets are absent,
the deploy job skips cleanly; CI and image publishing still succeed.

## Image tagging

Images are tagged with the 12-char commit SHA **and** `latest`. Deployment always pins to
the SHA tag, so rollback can reference the exact previous version.
