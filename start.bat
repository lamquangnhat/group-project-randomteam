@echo off

echo Starting backend server...
start cmd /k "cd backend && call venv\Scripts\activate && python -m uvicorn app.main:app --reload"

echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"
