from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, PydanticObjectId
from pymongo import IndexModel, ASCENDING

class AyurvedicProperties(BaseModel):
    rasa: List[str] = []
    virya: Optional[str] = None
    prabhava: Optional[str] = None
    dosha_effects: Dict[str, Optional[str]] = {
        "Vata": None,
        "Pitta": None,
        "Kapha": None
    }

class NutritionalInfo(BaseModel):
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    vitamins: Dict[str, str] = {}
    minerals: Dict[str, str] = {}

class FoodItemBase(BaseModel):
    name: str
    quantity: Optional[str] = None
    ayurvedic_properties: AyurvedicProperties = Field(default_factory=AyurvedicProperties)
    nutritional_info: NutritionalInfo = Field(default_factory=NutritionalInfo)
    preparation_notes: Optional[str] = None

class FoodItem(Document, FoodItemBase):
    class Settings:
        name = "fooditems"

class Meal(BaseModel):
    type: str  # "Breakfast", "Lunch", "Dinner", "Snack"
    items: List[FoodItemBase] = []
    total_nutrition: NutritionalInfo = Field(default_factory=NutritionalInfo)
    total_ayurvedic_properties: AyurvedicProperties = Field(default_factory=AyurvedicProperties)
    preparation_time: Optional[int] = None
    cooking_instructions: Optional[str] = None

class DoshaBalance(BaseModel):
    Vata: Optional[str] = None
    Pitta: Optional[str] = None
    Kapha: Optional[str] = None

class DayPlan(BaseModel):
    day: Optional[int] = None
    date: Optional[datetime] = None
    meals: List[Meal] = []
    daily_nutrition_summary: NutritionalInfo = Field(default_factory=NutritionalInfo)
    daily_dosha_balance: DoshaBalance = Field(default_factory=DoshaBalance)
    special_recommendations: List[str] = []

class AyurvedicAnalysis(BaseModel):
    dominant_dosha: Optional[str] = None
    imbalanced_doshas: List[str] = []
    recommended_tastes: List[str] = []
    foods_to_avoid: List[str] = []
    foods_to_favor: List[str] = []
    lifestyle_recommendations: List[str] = []
    seasonal_adjustments: Dict[str, str] = {}
    analysis_confidence: Optional[float] = None

class DietPlan(Document):
    patient: PydanticObjectId
    createdBy: PydanticObjectId
    plan: List[Dict] = []
    suggestion: Optional[str] = None
    ayurvedic_analysis: Optional[Dict] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "dietplans"
        indexes = [
            IndexModel([("patient", ASCENDING), ("createdBy", ASCENDING)]),
            IndexModel([("patient", ASCENDING), ("createdAt", ASCENDING)])
        ]

