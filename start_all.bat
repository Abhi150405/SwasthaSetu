@echo off
echo ===================================================
echo Starting SwasthaSetu Development Environment...
echo ===================================================

echo [1/2] Starting Python FastAPI Backend on port 5001...
start "Python Backend" cmd /k "cd backend && .\venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 5001"

echo [2/2] Starting Frontend Client...
start "Vite Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services have been launched in separate windows!
echo Keep those windows open while developing.
echo ===================================================

