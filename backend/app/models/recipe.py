from typing import List, Optional, Dict
from pydantic import BaseModel
from beanie import Document
from pymongo import IndexModel, ASCENDING, TEXT

class Ingredient(BaseModel):
    name: str
    quantity: Optional[str] = None
    category: Optional[str] = None
    alternatives: List[str] = []
    ayurvedic_properties: Optional[str] = None

class Instruction(BaseModel):
    step: int
    instruction: str
    time_minutes: Optional[int] = None
    temperature: Optional[str] = None
    tips: List[str] = []

class Nutrition(BaseModel):
    calories_per_serving: Optional[float] = None
    protein: Optional[float] = None
    carbohydrates: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    vitamins: Dict[str, str] = {}
    minerals: Dict[str, str] = {}

class DoshaEffects(BaseModel):
    Vata: Optional[str] = None
    Pitta: Optional[str] = None
    Kapha: Optional[str] = None

class Recipe(Document):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    cuisine: Optional[str] = None
    difficulty: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    total_time_minutes: Optional[int] = None
    servings: Optional[int] = None

    ingredients: List[Ingredient] = []
    instructions: List[Instruction] = []
    nutrition: Optional[Nutrition] = None

    tags: List[str] = []
    dominant_tastes: List[str] = []

    dosha_effects: DoshaEffects = DoshaEffects()
    ayurvedic_benefits: List[str] = []

    class Settings:
        name = "recipes"
        indexes = [
            IndexModel([("name", TEXT)]),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("tags", ASCENDING)]),
        ]

