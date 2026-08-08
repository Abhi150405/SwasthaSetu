from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
import os

from app.api.endpoints import ai, recipe, diet, auth, files, doctor, progress, patient, consultation, messages
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Beanie on startup
    await init_db()
    yield
    # Cleanup on shutdown if needed

tags_metadata = [
    {
        "name": "auth",
        "description": "Authentication endpoints for patient and doctor login/registration."
    },
    {
        "name": "ai",
        "description": (
            "🤖 **Agentic AI Health Assistant — Setu**\n\n"
            "Powered by **Gemini 2.5 Flash** with Retrieval-Augmented Generation (RAG).\n\n"
            "The AI responds with natural text and optional **action tags** that the frontend "
            "can interpret to automate actions:\n"
            "- `[ACTION:MARK_WATER]` — logs water intake\n"
            "- `[ACTION:MARK_MEAL]` — logs a meal\n"
            "- `[ACTION:NAVIGATE:/path]` — navigates the user\n\n"
            "Supports patient health context for personalized responses."
        ),
    },
    {
        "name": "recipe",
        "description": (
            "🍲 **Ayurvedic Recipe Generator**\n\n"
            "Generates detailed, healthy recipes tailored to a patient's **Dosha** (Vata / Pitta / Kapha).\n\n"
            "Returns structured JSON with:\n"
            "- Macro-nutrients (calories, protein, carbs, fat)\n"
            "- Ayurvedic properties (Rasa, Virya, Vipaka, Guna)\n"
            "- Ingredients and step-by-step preparation"
        ),
    },
    {
        "name": "diet",
        "description": (
            "🥗 **AI Diet Plan Generator**\n\n"
            "Generates a multi-day structured diet plan using the patient's physical profile.\n\n"
            "Returns:\n"
            "- Breakfast, Lunch, Dinner for each day\n"
            "- Daily nutritional summary\n"
            "- Dosha balance (Vata / Pitta / Kapha)\n"
            "- Ayurvedic analysis with foods to favor / avoid\n\n"
            "Defaults to **7 days** if `days` is not specified."
        ),
    },
]

app = FastAPI(
    title="SwasthaSetu Backend",
    description=(
        "# SwasthaSetu FastAPI Unified Backend 🌿\n\n"
        "This is the single **Python FastAPI** backend running on **port 5001** that powers authentication, health records, progress tracking, AI, recipes, and diet plans for the SwasthaSetu platform.\n\n"
        "---\n\n"
        "## Architecture\n\n"
        "| Service | Port | Responsibility |\n"
        "|---|---|---|\n"
        "| **Python / FastAPI** | **5001** | **Auth, Patients, Doctors, Progress, AI, Recipes, Diet Plans** |\n"
        "| React Frontend | 5173 | UI |\n\n"
        "---\n\n"
        "## Features & AI Stack\n"
        "- **Framework:** FastAPI with Beanie (MongoDB async ODM)\n"
        "- **AI Model:** Google Gemini\n"
        "- **RAG:** LangChain + Vector Store with Google Embeddings\n\n"
        "## Authentication\n"
        "Endpoints support JWT authentication via secure cookies and access tokens."
    ),
    version="1.0.0",
    openapi_tags=tags_metadata,
    contact={"name": "SwasthaSetu Dev Team"},
    license_info={"name": "MIT"},
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Set up CORS
cors_origins_env = os.getenv("CORS_ORIGIN") or os.getenv("ALLOWED_ORIGINS")

if cors_origins_env:
    cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip() and o.strip() != "*"]
else:
    cors_origins = [settings.DEV_ORIGIN]

if "http://localhost:5173" not in cors_origins:
    cors_origins.append("http://localhost:5173")
if "http://192.168.1.111:5173" not in cors_origins:
    cors_origins.append("http://192.168.1.111:5173")
if "https://swastha-setu-seven.vercel.app" not in cors_origins:
    cors_origins.append("https://swastha-setu-seven.vercel.app")

# Regex to match all Vercel deployment domains (*.vercel.app), localhost, and local Wi-Fi subnets
allow_origin_regex = r"https?://([a-zA-Z0-9-]+\.vercel\.app|localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?"


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(recipe.router, prefix="/api/recipe", tags=["recipe"])
app.include_router(diet.router, prefix="/api/diet", tags=["diet"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(doctor.router, prefix="/api/doctor", tags=["doctor"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(patient.router, prefix="/api/patient", tags=["patient"])
app.include_router(consultation.router, prefix="/api/consultation", tags=["consultation"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])


from fastapi.requests import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print("GLOBAL EXCEPTION HANDLER CAUGHT AN ERROR:\n", error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": error_msg}
    )

@app.get("/")
def read_root():
    return {"message": "SwasthaSetu Python Backend is running!"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
