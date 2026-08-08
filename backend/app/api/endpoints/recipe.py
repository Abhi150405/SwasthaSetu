import os
import json
import re
import asyncio
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google import genai

from app.services.rag_service import rag_service
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.models.recipe import Recipe

router = APIRouter()

class RecipeRequest(BaseModel):
    mealName: str
    patientName: Optional[str] = None
    dosha: Optional[str] = "Balanced"
    activity: Optional[str] = None

def get_matching_foods(meal_name: str, dosha: Optional[str], limit: int = 15) -> List[dict]:
    json_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ayurvedic_foods.json")
    if not os.path.exists(json_path):
        return []

    with open(json_path, "r", encoding="utf-8") as f:
        food_db = json.load(f)

    raw_foods = food_db.get("foods", [])
    meal_terms = set(re.findall(r'\w+', meal_name.lower()))
    dosha_clean = (dosha or "").strip().capitalize()

    scored_foods = []
    for food in raw_foods:
        score = 0
        fname = food.get("name", "").lower()
        fcat = food.get("category", "").lower()

        # Match meal terms against food name/category
        for term in meal_terms:
            if len(term) > 2 and (term in fname or term in fcat):
                score += 3

        # Match dosha suitability
        dosha_eff = food.get("dosha_effects", {})
        if dosha_clean in ["Vata", "Pitta", "Kapha"]:
            eff = str(dosha_eff.get(dosha_clean, "")).lower()
            if "decreases" in eff or "balanced" in eff:
                score += 2
            elif "neutral" in eff:
                score += 1
            elif "increases" in eff and "decreases" not in eff:
                score -= 2

        scored_foods.append((score, food))

    # Sort descending by score
    scored_foods.sort(key=lambda x: x[0], reverse=True)
    return [food for score, food in scored_foods[:limit]]

@router.post("/generate", summary="Generate and save an Ayurvedic recipe")
async def generate_recipe(request: RecipeRequest, current_user: User = Depends(get_current_user)):
    if not request.mealName:
        raise HTTPException(status_code=400, detail="Meal name is required")

    try:
        # 1. RAG Retrieval
        context = await rag_service.retrieve_context(
            f"Specific recipe and Ayurvedic preparation for {request.mealName} for {request.dosha} dosha"
        )

        # 2. Retrieve matching foods from dataset for grounded Ayurvedic properties
        matching_foods = get_matching_foods(request.mealName, request.dosha, limit=12)
        food_ref_table = []
        for f in matching_foods:
            name = f.get("name", "")
            rasa_val = f.get("rasa", [])
            rasa = ", ".join(rasa_val) if isinstance(rasa_val, list) else str(rasa_val)
            virya = f.get("virya", "")
            vipaka = f.get("vipaka", "")
            guna_val = f.get("guna", [])
            guna = ", ".join(guna_val) if isinstance(guna_val, list) else str(guna_val)
            dosha_eff = f.get("dosha_effects", {})
            dosha_str = f"Vata: {dosha_eff.get('Vata')}, Pitta: {dosha_eff.get('Pitta')}, Kapha: {dosha_eff.get('Kapha')}"

            food_ref_table.append(
                f"- {name} | Rasa: {rasa} | Virya: {virya} | Vipaka: {vipaka} | Guna: {guna} | Effects: [{dosha_str}]"
            )

        matching_foods_text = "\n".join(food_ref_table) if food_ref_table else "None specified"
        
        api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Gemini API Key is not configured on the server.")
        client = genai.Client(api_key=api_key)

        
        prompt = f"""
        You are an expert Ayurvedic Chef and Nutritionist. 
        Generate a detailed, healthy, and Ayurvedic-compatible recipe for: "{request.mealName}".
        
        Target Patient Context:
        - Name: {request.patientName or "Patient"}
        - Target Dosha: {request.dosha or "Balanced"}
        
        Medical & Culinary Knowledge Context:
        {context}

        Grounded Ayurvedic Foods Reference (Real Rasa, Virya, Vipaka, Guna & Dosha Effects):
        {matching_foods_text}

        Instruction for Grounded Ayurvedic Properties ("ayur"):
        Base the "ayur" object values (rasa, virya, vipaka, guna) strictly on the real Ayurvedic food data provided in the reference list above for the primary ingredients used in the recipe. Do not invent ungrounded properties.

        RESPOND ONLY WITH A VALID JSON OBJECT.
        JSON structure:
        {{
          "name": "string",
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0,
          "vitamins": ["string"],
          "ayur": {{
            "rasa": "string",
            "virya": "string",
            "vipaka": "string",
            "guna": ["string"]
          }},
          "ingredients": ["string"],
          "steps": ["string"]
        }}
        
        Ensure the ingredients and preparation steps respect the patient's target dosha ({request.dosha}).
        """

        result = await asyncio.to_thread(client.models.generate_content, model="gemini-2.5-flash", contents=prompt)
        text = result.text
        
        # Extract JSON
        json_match = re.search(r'\{[\s\S]*\}', text)
        if not json_match:
            raise HTTPException(status_code=500, detail="AI failed to return a valid JSON recipe structure.")
            
        recipe_data = json.loads(json_match.group(0))
        
        # 4. Save to DB
        try:
            recipe = Recipe(
                name=recipe_data.get("name", request.mealName),
                description=f"Ayurvedic recipe for {request.dosha} dosha",
                ingredients=[{"name": ing} for ing in recipe_data.get("ingredients", [])],
                instructions=[{"step": i+1, "instruction": step} for i, step in enumerate(recipe_data.get("steps", []))],
                nutrition={
                    "calories_per_serving": recipe_data.get("calories"),
                    "protein": recipe_data.get("protein"),
                    "carbohydrates": recipe_data.get("carbs"),
                    "fat": recipe_data.get("fat")
                },
                dosha_effects={"Vata": "balanced", "Pitta": "balanced", "Kapha": "balanced"}
            )
            await recipe.insert()
        except Exception as db_err:
            print(f"Failed to save recipe to DB: {db_err}")
        
        return {"success": True, "data": recipe_data}

    except Exception as e:
        print(f"Recipe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all", summary="Get all recipes")
async def get_all_recipes(current_user: User = Depends(get_current_user)):
    recipes = await Recipe.find_all().to_list()
    return {"success": True, "data": recipes}
