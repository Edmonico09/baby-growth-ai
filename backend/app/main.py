from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, child, growth, chat, analysis
from app.config import settings

app = FastAPI(title="BabyGrowth AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(child.router)
app.include_router(growth.router)
app.include_router(chat.router)
app.include_router(analysis.router)


@app.get("/")
def root():
    return {"message": "BabyGrowth AI API is running"}
