# Travel Planner

A full-stack travel planning app with AI recommendations, interactive maps, and trip management.

---

## Prerequisites

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

---

## 1. Add the `.env` file

Create a file at `backend/.env` with the following contents:

```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AI_API_KEY=your_openrouter_api_key
```

> The app will not start correctly without this file.

---

## 2. Install dependencies

**Windows:**
```
install.bat
```

**Mac / Linux:**
```bash
bash install.sh
```

This installs Python packages into a virtual environment and runs `npm install` for the frontend.

---

## 3. Run the app

**Windows:**
```
start.bat
```

**Mac / Linux:**
```bash
bash start.sh
```

This opens two terminal windows:
- **Backend** → [http://localhost:8000](http://localhost:8000)
- **Frontend** → [http://localhost:5173](http://localhost:5173)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Set up the database (first time only)

With the backend running, open a new terminal in the `backend/` folder and run:

```bash
# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# Run migrations
alembic upgrade head
```

---

## Project structure

```
├── backend/          FastAPI + SQLAlchemy + Alembic
│   ├── app/          API routes, models, middleware
│   ├── alembic/      Database migrations
│   └── requirements.txt
├── frontend/         React + Vite + TailwindCSS
│   └── src/
├── install.bat       Install all dependencies (Windows)
├── install.sh        Install all dependencies (Mac/Linux)
├── start.bat         Start both servers (Windows)
└── start.sh          Start both servers (Mac/Linux)
```
