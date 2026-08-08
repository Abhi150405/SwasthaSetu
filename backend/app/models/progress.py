from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, PydanticObjectId
from pymongo import IndexModel, ASCENDING

class MealLog(BaseModel):
    meal_type: str  # "breakfast", "lunch", "dinner", "snack"
    status: str = "pending"  # "pending", "completed", "skipped"
    acknowledged_at: Optional[datetime] = None
    item: Optional[PydanticObjectId] = None  # Reference to FoodItem

class ProgressTracker(Document):
    patient: PydanticObjectId
    diet_plan: PydanticObjectId
    date: datetime
    meal_log: List[MealLog] = []
    water_intake_ml: float = 0
    target_water_ml: float = 2500
    target_calories: float = 2000
    water_updated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Settings:
        name = "progresstrackers"
        indexes = [
            IndexModel([("patient", ASCENDING), ("date", ASCENDING)], unique=True)
        ]

class NutritionTracker(Document):
    patient: PydanticObjectId
    date: datetime
    consumedCalories: float = 0
    consumedProtein: float = 0
    consumedCarbs: float = 0
    consumedFat: float = 0
    targetCalories: Optional[float] = None
    dietPlanId: Optional[PydanticObjectId] = None

    class Settings:
        name = "nutritiontrackers"
        indexes = [
            IndexModel([("patient", ASCENDING), ("date", ASCENDING)], unique=True)
        ]
