#!/bin/bash

echo "Starting backend server..."
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload &
cd ..

echo "Starting frontend server..."
cd frontend
npm run dev &
cd ..

echo "Both servers are running. Press Ctrl+C to stop."
wait
