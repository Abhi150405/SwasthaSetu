from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.endpoints import ai, recipe, diet
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
origins = settings.DEV_ORIGIN.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
    uvicorn.run("app.main:app", host="0.0.0.0", port=5001, reload=True)
