"""
main.py — MedAI FastAPI Backend Entry Point
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import database_models
from routers import symptom, vision, rag, agentic, dashboard, n8n, communication
import uvicorn

# Create the database tables on startup
database_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MedAI Backend API",
    description="AI-powered clinical intelligence platform backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all. In production, restrict to your frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering all routers
app.include_router(symptom.router,   prefix="/api/symptom-checker", tags=["Symptom Checker"])
app.include_router(vision.router,    prefix="/api/vision",           tags=["Vision AI"])
app.include_router(rag.router,       prefix="/api/rag",              tags=["RAG Knowledge"])
app.include_router(agentic.router,   prefix="/api/agentic",          tags=["Agentic AI"])
app.include_router(dashboard.router, prefix="/api/dashboard",        tags=["Dashboard"])
app.include_router(n8n.router,           prefix="/api/n8n",              tags=["Automation Workflow"])
app.include_router(communication.router, prefix="/api/communication",   tags=["Communication"])

@app.get("/")
def root():
    return {"message": "MedAI API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)