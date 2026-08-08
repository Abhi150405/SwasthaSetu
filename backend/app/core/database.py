from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

# Import all models here so Beanie can register them
# We will create these shortly
from app.models.user import User, Patient, Doctor
from app.models.consultation import Consultation
from app.models.dietplan import DietPlan, FoodItem
from app.models.recipe import Recipe
from app.models.progress import ProgressTracker, NutritionTracker
from app.models.message import Message

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DB_NAME]
    
    await init_beanie(
        database=db,
        document_models=[
            User,
            Patient,
            Doctor,
            Consultation,
            DietPlan,
            FoodItem,
            Recipe,
            ProgressTracker,
            NutritionTracker,
            Message
        ],
    )
