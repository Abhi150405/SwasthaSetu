import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google import genai
from google.genai import types
from beanie import PydanticObjectId

from app.services.rag_service import rag_service
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.models.dietplan import DietPlan


router = APIRouter()

class DietRequest(BaseModel):
    age: int
    weight: float
    height: float
    conditions: Optional[List[str]] = []
    dietary_preferences: Optional[List[str]] = []
    goals: Optional[str] = ""
    gender: str
    days: Optional[int] = 7
    patientId: Optional[str] = None
    force_refresh: Optional[bool] = False

def has_contraindication_overlap(food_contras: List[str], conditions: List[str]) -> bool:
    if not food_contras or not conditions:
        return False
    for contra in food_contras:
        contra_lower = str(contra).lower()
        for cond in conditions:
            cond_lower = str(cond).lower().strip()
            if cond_lower and (cond_lower in contra_lower or contra_lower in cond_lower):
                return True
    return False

def is_suitable_for_dosha(dosha_effects: dict, dosha: str) -> bool:
    if not dosha:
        return True
    dosha_clean = dosha.capitalize()
    effect = str(dosha_effects.get(dosha_clean, "")).lower()
    if not effect:
        return True
    if "increases" in effect and "decreases" not in effect and "neutral" not in effect:
        return False
    return True

DEFAULT_MEAL_NUTRITION = {
    "breakfast": {"calories": 380, "protein": 14, "carbs": 52, "fat": 10},
    "lunch": {"calories": 580, "protein": 22, "carbs": 75, "fat": 16},
    "dinner": {"calories": 480, "protein": 18, "carbs": 62, "fat": 12},
    "snack": {"calories": 210, "protein": 6, "carbs": 28, "fat": 6},
    "default": {"calories": 400, "protein": 15, "carbs": 55, "fat": 10}
}

def ensure_nutritional_info(plan_list: list) -> list:
    if not isinstance(plan_list, list):
        return plan_list

    for day in plan_list:
        if not isinstance(day, dict):
            continue
        
        day_cals, day_protein, day_carbs, day_fat = 0.0, 0.0, 0.0, 0.0
        meals = day.get("meals", [])
        if isinstance(meals, list):
            for meal in meals:
                if not isinstance(meal, dict):
                    continue
                
                meal_type = str(meal.get("type", "")).lower()
                def_nut = DEFAULT_MEAL_NUTRITION.get(meal_type, DEFAULT_MEAL_NUTRITION["default"])
                
                # Check items first
                items = meal.get("items", [])
                item_cals, item_protein, item_carbs, item_fat = 0.0, 0.0, 0.0, 0.0
                
                if isinstance(items, list) and len(items) > 0:
                    per_item_cals = max(50, int(def_nut["calories"] / len(items)))
                    per_item_protein = max(2, int(def_nut["protein"] / len(items)))
                    per_item_carbs = max(8, int(def_nut["carbs"] / len(items)))
                    per_item_fat = max(1, int(def_nut["fat"] / len(items)))

                    for item in items:
                        if not isinstance(item, dict):
                            continue
                        info = item.get("nutritional_info", {})
                        if not isinstance(info, dict):
                            info = {}
                        
                        try: cals = float(info.get("calories") or 0)
                        except (ValueError, TypeError): cals = 0.0
                        try: prot = float(info.get("protein") or 0)
                        except (ValueError, TypeError): prot = 0.0
                        try: carb = float(info.get("carbs") or 0)
                        except (ValueError, TypeError): carb = 0.0
                        try: fat = float(info.get("fat") or 0)
                        except (ValueError, TypeError): fat = 0.0

                        if cals <= 0: cals = float(per_item_cals)
                        if prot <= 0: prot = float(per_item_protein)
                        if carb <= 0: carb = float(per_item_carbs)
                        if fat <= 0: fat = float(per_item_fat)

                        item["nutritional_info"] = {
                            "calories": round(cals, 1),
                            "protein": round(prot, 1),
                            "carbs": round(carb, 1),
                            "fat": round(fat, 1)
                        }
                        item_cals += cals
                        item_protein += prot
                        item_carbs += carb
                        item_fat += fat

                # Determine total_nutrition for meal
                tot = meal.get("total_nutrition", {})
                if not isinstance(tot, dict):
                    tot = {}
                
                try: mcals = float(tot.get("calories") or 0)
                except (ValueError, TypeError): mcals = 0.0
                try: mprot = float(tot.get("protein") or 0)
                except (ValueError, TypeError): mprot = 0.0
                try: mcarb = float(tot.get("carbs") or 0)
                except (ValueError, TypeError): mcarb = 0.0
                try: mfat = float(tot.get("fat") or 0)
                except (ValueError, TypeError): mfat = 0.0

                if mcals <= 0:
                    mcals = item_cals if item_cals > 0 else float(def_nut["calories"])
                if mprot <= 0:
                    mprot = item_protein if item_protein > 0 else float(def_nut["protein"])
                if mcarb <= 0:
                    mcarb = item_carbs if item_carbs > 0 else float(def_nut["carbs"])
                if mfat <= 0:
                    mfat = item_fat if item_fat > 0 else float(def_nut["fat"])

                meal["total_nutrition"] = {
                    "calories": round(mcals, 1),
                    "protein": round(mprot, 1),
                    "carbs": round(mcarb, 1),
                    "fat": round(mfat, 1)
                }

                day_cals += mcals
                day_protein += mprot
                day_carbs += mcarb
                day_fat += mfat

        # Daily nutrition summary
        day_sum = day.get("daily_nutrition_summary", {})
        if not isinstance(day_sum, dict):
            day_sum = {}
        
        try: dcals = float(day_sum.get("calories") or 0)
        except (ValueError, TypeError): dcals = 0.0
        try: dprot = float(day_sum.get("protein") or 0)
        except (ValueError, TypeError): dprot = 0.0
        try: dcarb = float(day_sum.get("carbs") or 0)
        except (ValueError, TypeError): dcarb = 0.0
        try: dfat = float(day_sum.get("fat") or 0)
        except (ValueError, TypeError): dfat = 0.0

        if dcals <= 0: dcals = day_cals if day_cals > 0 else 1650.0
        if dprot <= 0: dprot = day_protein if day_protein > 0 else 60.0
        if dcarb <= 0: dcarb = day_carbs if day_carbs > 0 else 215.0
        if dfat <= 0: dfat = day_fat if day_fat > 0 else 44.0

        day["daily_nutrition_summary"] = {
            "calories": round(dcals, 1),
            "protein": round(dprot, 1),
            "carbs": round(dcarb, 1),
            "fat": round(dfat, 1)
        }

    return plan_list

@router.post("/generate", summary="Generate and save a multi-day Ayurvedic diet plan")
async def generate_diet_plan(request: DietRequest, current_user: User = Depends(get_current_user)):
    target_patient_id = request.patientId or str(current_user.id)
    if current_user.role == "patient" and request.patientId and request.patientId != str(current_user.id):
        raise HTTPException(status_code=403, detail="Patients can only generate diet plans for themselves")

    # 0. Return existing saved diet plan from DB if available and force_refresh is False
    if not request.force_refresh and target_patient_id:
        try:
            existing_plan = await DietPlan.find(
                {"patient": PydanticObjectId(target_patient_id)}
            ).sort("-createdAt").first_or_none()

            if existing_plan and existing_plan.plan:
                plan_list = ensure_nutritional_info(existing_plan.plan)
                created_dt = getattr(existing_plan, "createdAt", None) or datetime.now()
                for idx, day_item in enumerate(plan_list):
                    if isinstance(day_item, dict):
                        p_date = created_dt + timedelta(days=idx)
                        day_item["date"] = p_date.strftime("%Y-%m-%d")
                        day_item["formatted_date"] = p_date.strftime("%a, %b %d")
                        day_item["generation_date"] = created_dt.strftime("%Y-%m-%d")

                return {
                    "success": True,
                    "from_db": True,
                    "data": {
                        "plan": plan_list,
                        "suggestion": existing_plan.suggestion,
                        "ayurvedic_analysis": existing_plan.ayurvedic_analysis
                    }
                }
        except Exception as db_ex:
            print(f"Error checking existing diet plan in DB: {db_ex}")


    try:
        # Fetch target patient details for Ayurvedic category / dominant dosha
        patient_user = None
        if target_patient_id:
            try:
                patient_user = await User.get(PydanticObjectId(target_patient_id), with_children=True)
            except Exception:
                patient_user = None

        patient_dosha = ""
        if patient_user:
            patient_dosha = (getattr(patient_user, "dosha", None) or getattr(patient_user, "ayurvedic_category", None) or "").strip()

        # 1. RAG Context Retrieval
        conditions_str = ", ".join(request.conditions) if request.conditions else "none"
        prefs_str = ", ".join(request.dietary_preferences) if request.dietary_preferences else "none"
        query = f"Diet for {request.age} year old {request.gender}, dosha: {patient_dosha}, conditions: {conditions_str}, preferences: {prefs_str}."
        
        context = await rag_service.retrieve_context(query)

        # 2. Filter ayurvedic_foods.json for Preferred Foods Reference Table
        preferred_foods_table = []
        json_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "ayurvedic_foods.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                food_db = json.load(f)

            raw_foods = food_db.get("foods", [])
            patient_conds = request.conditions or []

            filtered_foods = []
            for food in raw_foods:
                contras = food.get("contraindications", [])
                if has_contraindication_overlap(contras, patient_conds):
                    continue

                dosha_eff = food.get("dosha_effects", {})
                if patient_dosha and not is_suitable_for_dosha(dosha_eff, patient_dosha):
                    continue

                filtered_foods.append(food)

            if not filtered_foods:
                filtered_foods = [f for f in raw_foods if not has_contraindication_overlap(f.get("contraindications", []), patient_conds)]

            for food in filtered_foods:
                name = food.get("name", "")
                rasa_val = food.get("rasa", [])
                rasa = ", ".join(rasa_val) if isinstance(rasa_val, list) else str(rasa_val)
                virya = food.get("virya", "")
                dosha_eff = food.get("dosha_effects", {})
                dosha_str = f"Vata: {dosha_eff.get('Vata')}, Pitta: {dosha_eff.get('Pitta')}, Kapha: {dosha_eff.get('Kapha')}"
                contras = food.get("contraindications", [])
                contra_str = ", ".join(contras) if isinstance(contras, list) else str(contras)
                is_contested = food.get("contested", False)

                item_str = f"- {name} | Rasa: {rasa} | Virya: {virya} | Effects: [{dosha_str}] | Contraindications: {contra_str or 'none'}"
                if is_contested:
                    item_str += " | [CONTESTED: true - note uncertainty if used]"
                preferred_foods_table.append(item_str)

        preferred_foods_text = "\n".join(preferred_foods_table) if preferred_foods_table else "None specified"

        api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Gemini API Key is not configured on the server.")
        client = genai.Client(api_key=api_key)

        
        prompt = f"""
          You are an expert Nutritionist and Ayurvedic Dietician.
          
          Patient Profile:
          - Age: {request.age}
          - Gender: {request.gender}
          - Weight: {request.weight}kg
          - Height: {request.height}cm
          - Dominant Dosha / Ayurvedic Category: {patient_dosha or 'Not specified'}
          - Conditions: {conditions_str}
          - Dietary Preferences: {prefs_str}
          - Goals: {request.goals}
          
          Relevant Medical Knowledge (Context):
          {context}

          Preferred Foods (Reference Table filtered for this patient):
          {preferred_foods_text}

          Strict Rules for Preferred Foods & Constraints:
          1. Primarily build the diet plan using items from the "Preferred Foods" reference table provided above.
          2. Strictly avoid any food whose contraindications overlap the patient's conditions ({conditions_str}).
          3. If any food marked [CONTESTED: true] is included in the plan, flag it as lower-confidence and explicitly note the uncertainty in the "special_recommendations" field for that day.

          Task: Generate a detailed {request.days}-day diet plan that strictly adheres to the following JSON structure.
          Do not include any markdown formatting, just the raw JSON.
          The "plan" array MUST contain exactly {request.days} objects (one for each day, e.g. "day": 1, "day": 2, ..., "day": {request.days}).
          
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
                      {{ "name": "Food Name", "quantity": "Amount", "nutritional_info": {{ "calories": 380, "protein": 14, "carbs": 52, "fat": 10 }} }}
                    ],
                    "total_nutrition": {{ "calories": 380, "protein": 14, "carbs": 52, "fat": 10 }}
                  }},
                   {{
                    "type": "Lunch",
                    "items": [],
                    "total_nutrition": {{ "calories": 580, "protein": 22, "carbs": 75, "fat": 16 }}
                  }},
                   {{
                    "type": "Dinner",
                    "items": [],
                    "total_nutrition": {{ "calories": 480, "protein": 18, "carbs": 62, "fat": 12 }}
                  }}
                ],
                "daily_nutrition_summary": {{ "calories": 1640, "protein": 54, "carbs": 189, "fat": 38 }},
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

        # 4. Generate content
        result = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        text = result.text
        diet_data = json.loads(text)
        
        # Ensure non-zero nutritional info across all generated days and meals
        if diet_data.get("plan") and isinstance(diet_data["plan"], list):
            diet_data["plan"] = ensure_nutritional_info(diet_data["plan"])

        # Attach sequential dates starting from today for 7 days
        start_dt = datetime.now()
        if diet_data.get("plan") and isinstance(diet_data["plan"], list):
            for idx, day_item in enumerate(diet_data["plan"]):
                if isinstance(day_item, dict):
                    p_date = start_dt + timedelta(days=idx)
                    day_item["date"] = p_date.strftime("%Y-%m-%d")
                    day_item["formatted_date"] = p_date.strftime("%a, %b %d")

        # 5. Save newly generated plan to DB
        if target_patient_id:
            try:
                diet_plan = DietPlan(
                    patient=PydanticObjectId(target_patient_id),
                    createdBy=current_user.id,
                    plan=diet_data.get("plan", []),
                    suggestion=diet_data.get("suggestion", ""),
                    ayurvedic_analysis=diet_data.get("ayurvedic_analysis")
                )
                await diet_plan.insert()
            except Exception as db_err:
                print(f"Failed to save diet plan to DB: {db_err}")
        
        return {"success": True, "from_db": False, "data": diet_data}

    except Exception as e:
        print(f"Diet Plan Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/{patient_id}", summary="Get diet plans for a patient")
async def get_patient_diet_plans(patient_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role == "patient" and str(current_user.id) != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this patient's diet plan")

    plans = await DietPlan.find({"patient": PydanticObjectId(patient_id)}).sort("-createdAt").to_list()
    plans_dicts = []
    for plan_doc in plans:
        p_dict = plan_doc.model_dump()
        created_dt = getattr(plan_doc, "createdAt", None) or datetime.now()
        if p_dict.get("plan") and isinstance(p_dict["plan"], list):
            p_dict["plan"] = ensure_nutritional_info(p_dict["plan"])
            for idx, day_item in enumerate(p_dict["plan"]):
                if isinstance(day_item, dict):
                    p_date = created_dt + timedelta(days=idx)
                    day_item["date"] = p_date.strftime("%Y-%m-%d")
                    day_item["formatted_date"] = p_date.strftime("%a, %b %d")
                    day_item["generation_date"] = created_dt.strftime("%Y-%m-%d")

        plans_dicts.append(p_dict)

    return {"success": True, "data": plans_dicts}

