from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import google.generativeai as genai
import json
import re
from app.services.rag_service import rag_service
from app.core.config import settings

router = APIRouter()

genai.configure(api_key=settings.GOOGLE_API_KEY)

class RecipeRequest(BaseModel):
    mealName: str
    patientName: Optional[str] = None
    dosha: Optional[str] = "Balanced"
    activity: Optional[str] = None

@router.post("/generate")
async def generate_recipe(request: RecipeRequest):
    if not request.mealName:
        raise HTTPException(status_code=400, detail="Meal name is required")

    try:
        # 1. RAG Retrieve
        context = await rag_service.retrieve_context(
            f"Specific recipe and Ayurvedic preparation for {request.mealName} for {request.dosha} dosha"
        )
        
        # 2. Construct Prompt
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        You are an expert Ayurvedic Chef and Nutritionist. 
        Generate a detailed, healthy, and Ayurvedic-compatible recipe for: "{request.mealName}".
        
        Target Patient Context:
        - Name: {request.patientName or "Patient"}
        - Dosha: {request.dosha or "Balanced"}
        
        Medical Context (from Knowledge Base):
        {context}

        RESPOND ONLY WITH A VALID JSON OBJECT.
        JSON structure:
        {{
          "name": "string",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
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
        
        Ensure the ingredients and preparation steps respect the patient's dosha ({request.dosha}).
        """

        result = model.generate_content(prompt)
        text = result.text
        
        # Extract JSON
        json_match = re.search(r'\{[\s\S]*\}', text)
        if not json_match:
            raise HTTPException(status_code=500, detail="AI failed to return a valid JSON recipe structure.")
            
        recipe_data = json.loads(json_match.group(0))
        
        return {{"success": True, "data": recipe_data}}

    except Exception as e:
        print(f"Recipe Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
