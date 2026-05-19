#!/bin/bash

echo "Installing backend dependencies..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Done! All dependencies installed."
