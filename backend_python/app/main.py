from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.endpoints import ai, recipe, diet
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
import os

# In production, CORS_ORIGIN env var should be set to your Vercel URL(s)
# e.g. "https://swasthasetu.vercel.app,https://swasthasetu-git-main.vercel.app"
# Falls back to allowing all origins if not set in production
cors_origins_env = os.getenv("CORS_ORIGIN", "")
is_production = os.getenv("NODE_ENV", "development") == "production"

if cors_origins_env:
    cors_origins = [o.strip() for o in cors_origins_env.split(",")]
elif is_production:
    cors_origins = ["*"]
else:
    cors_origins = [settings.DEV_ORIGIN]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],  # credentials not allowed with wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(recipe.router, prefix="/api/recipe", tags=["recipe"])
app.include_router(diet.router, prefix="/api/diet", tags=["diet"])

@app.get("/")
def read_root():
    return {"message": "SwasthaSetu Python Backend is running!"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
