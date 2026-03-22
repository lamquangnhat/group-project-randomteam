from fastapi import FastAPI
from app.utils.jwt_middleware import jwt_middleware

app = FastAPI()
app.middleware("http")(jwt_middleware)

@app.get("/")
def root():
    return {"message": "App is running"}