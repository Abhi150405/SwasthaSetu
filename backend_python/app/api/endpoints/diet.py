from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Any
import google.generativeai as genai
import json
import re
from app.services.rag_service import rag_service
from app.core.config import settings

router = APIRouter()

genai.configure(api_key=settings.GOOGLE_API_KEY)

class DietRequest(BaseModel):
    age: int
    weight: float
    height: float
    conditions: Optional[List[str]] = []
    dietary_preferences: Optional[List[str]] = []
    goals: Optional[str] = ""
    gender: str
    patientId: Optional[str] = None

@router.post("/generate")
async def generate_diet_plan(request: DietRequest):
    try:
        # 1. RAG Retrieve
        conditions_str = ", ".join(request.conditions) if request.conditions else "none"
        prefs_str = ", ".join(request.dietary_preferences) if request.dietary_preferences else "none"
        query = f"Diet for {request.age} year old {request.gender}, {conditions_str}, {prefs_str}."
        
        context = await rag_service.retrieve_context(query)
        
        # 2. Construct Prompt
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
          You are an expert Nutritionist and Ayurvedic Dietician.
          
          Patient Profile:
          - Age: {request.age}
          - Gender: {request.gender}
          - Weight: {request.weight}kg
          - Conditions: {conditions_str}
          - Preferences: {prefs_str}
          - Goals: {request.goals}
          
          Relevant Medical Knowledge (Context):
          {context}

          Task: Generate a detailed 1-day diet plan (just 1 day for now) that strictly adheres to the following JSON structure.
          Do not include any markdown formatting, just the raw JSON.
          
          Target JSON Structure:
          {{
            "plan": [
              {{
                "day": 1,
                "date": "YYYY-MM-DD",
                "meals": [
                  {{
                    "type": "Breakfast",
                    "items": [
                      {{ "name": "Food Name", "quantity": "Amount", "nutritional_info": {{ "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }} }}
                    ],
                    "total_nutrition": {{ "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }}
                  }},
                   {{
                    "type": "Lunch",
                    "items": [],
                    "total_nutrition": {{}}
                  }},
                   {{
                    "type": "Dinner",
                    "items": [],
                    "total_nutrition": {{}}
                  }}
                ],
                "daily_nutrition_summary": {{ "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }},
                "daily_dosha_balance": {{ "Vata": "balanced", "Pitta": "balanced", "Kapha": "balanced" }},
                "special_recommendations": ["string"]
              }}
            ],
            "ayurvedic_analysis": {{
              "dominant_dosha": "string",
              "imbalanced_doshas": ["string"],
              "recommended_tastes": ["string"],
              "foods_to_avoid": ["string"],
              "foods_to_favor": ["string"]
            }},
            "suggestion": "General advice here"
          }}
        """

        # Generate with JSON constraint
        result = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        text = result.text
        diet_data = json.loads(text)
        
        return {{"success": True, "data": diet_data}}

    except Exception as e:
        print(f"Diet Plan Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
