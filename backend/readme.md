**Run the app**:

python -m uvicorn app.main:app --reload


**Schema Migration**

python -m alembic revision --autogenerate -m "describe change"

python -m alembic upgrade head