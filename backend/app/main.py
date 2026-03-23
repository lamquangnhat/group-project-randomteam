from fastapi import FastAPI
from app.utils.jwt_middleware import jwt_middleware
from app.api import location_router

app = FastAPI()
app.middleware("http")(jwt_middleware)

app.include_router(location_router)

@app.get("/")
def root():
    return {"message": "App is running"}