from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.utils.jwt_middleware import jwt_middleware
from app.api import location_router, auth_router, plan_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(jwt_middleware)

app.include_router(location_router)
app.include_router(auth_router)
app.include_router(plan_router)

@app.get("/")
def root():
    return {"message": "App is running"}