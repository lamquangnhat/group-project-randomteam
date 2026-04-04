from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 👈 ADD THIS

app = FastAPI()

# 👇 ADD THIS BLOCK
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (ok for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Hello from FastAPI backend"}