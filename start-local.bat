@echo off
REM ============================================================================
REM  Employee Management - start the local development stack (Windows)
REM ============================================================================
REM  Requires: Docker Desktop running.
REM
REM  Starts PostgreSQL, the FastAPI backend, the frontend and the edge Nginx
REM  reverse proxy, then reports the URL to open.
REM
REM  Usage:  start-local.bat
REM ============================================================================

setlocal

cd /d "%~dp0"

echo.
echo ============================================================
echo  Employee Management - local stack
echo ============================================================
echo.

where docker >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Docker was not found on PATH.
    echo         Install and start Docker Desktop, then re-run this script.
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo [ERROR] The Docker daemon is not running.
    echo         Start Docker Desktop and wait for it to finish starting.
    exit /b 1
)

if not exist ".env" (
    echo [info] No .env found - creating one from .env.example
    copy /y ".env.example" ".env" >nul
)

echo [1/2] Building and starting services...
docker compose up -d --build
if errorlevel 1 (
    echo [ERROR] docker compose up failed.
    exit /b 1
)

echo.
echo [2/2] Waiting for services to become healthy...
timeout /t 8 /nobreak >nul
docker compose ps

echo.
echo ============================================================
echo  Ready. Open:  http://localhost:8080
echo.
echo  API health:    http://localhost:8080/api/health
echo  API docs:      http://localhost:8080/docs
echo.
echo  Logs:          docker compose logs -f
echo  Stop:          docker compose down
echo ============================================================
echo.

endlocal