from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional, Any
from google import genai
from google.genai import types
import json
import asyncio
from app.services.rag_service import rag_service
from app.core.config import settings
import os
from app.core.security import get_current_user, get_current_user_optional
from app.models.user import User

router = APIRouter()

class AIRequest(BaseModel):
    question: str
    patientContext: Optional[Any] = None

@router.post("/ask", summary="Ask the AI health assistant", response_description="AI-generated answer with optional action tags")
async def ask_ai(request: AIRequest, current_user: Optional[User] = Depends(get_current_user_optional)):

    if not request.question:
        raise HTTPException(status_code=400, detail="Question is required")

    api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Google Gemini API Key is not configured on the server.")

    try:
        # 1. RAG Retrieve
        try:
            context = await rag_service.retrieve_context(request.question)
        except Exception as rag_err:
            print(f"RAG Retrieval Error: {rag_err}")
            context = ""
        
        # 2. Generate Answer
        client = genai.Client(api_key=api_key)

        
        system_prompt = f"""
        You are Setu, an advanced agentic AI health assistant for the Swasthasetu platform.
        Your goal is to assist users (patients and doctors) with health advice, diet tracking, and system navigation.
        
        You have access to the following "capabilities" which you can trigger by including specific tags in your response:
        - [ACTION:MARK_WATER] or [ACTION:MARK_WATER:amount_ml]: Use this whenever the user mentions drinking water, hydrating, or logging water intake (e.g. [ACTION:MARK_WATER:250] or [ACTION:MARK_WATER:500]).

        - [ACTION:MARK_MEAL]: Use this when the user says they ate a meal.
        - [ACTION:NAVIGATE:/path]: Use this to suggest or perform navigation. Common paths: /dashboard, /recipes, /tracking, /profile, /doctor, /doctor/patients.
        - [ACTION:OPEN_PATIENT_VIEW:patientId]: Use this to open a specific patient's view (doctor only).
        
        Context from Knowledge Base:
        {context}
        
        Patient/User Context:
        {json.dumps(request.patientContext) if request.patientContext else "{{}}"}
        
        Guidelines:
        1. Be concise, warm, and professional.
        2. If you perform an action, mention it in the text (e.g., "I've logged your water intake.").
        3. Your response should be a mix of text and these [ACTION:...] tags if needed.
        4. Use Ayurvedic wisdom where appropriate.
        """

        combined_prompt = f"{system_prompt}\n\nUser Question: {request.question}"
        
        # Run synchronous call in a separate thread
        result = await asyncio.to_thread(client.models.generate_content, model="gemini-2.5-flash", contents=combined_prompt)
        
        return {"success": True, "answer": result.text}

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

import urllib.request

def fetch_open_food_facts(barcode: str) -> Optional[dict]:
    clean_code = "".join(c for c in barcode if c.isdigit())
    if not clean_code or len(clean_code) < 7:
        return None
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{clean_code}.json"
        req = urllib.request.Request(url, headers={'User-Agent': 'SwasthaSetuApp/1.0'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            if data.get("status") == 1 and "product" in data:
                p = data["product"]
                name = p.get("product_name") or p.get("product_name_en") or p.get("product_name_in")
                if not name:
                    return None
                brand = p.get("brands", "").strip()
                full_name = f"{brand} - {name}".strip(" -") if brand else name
                
                res_dict: dict = {"name": full_name}
                
                # Serving size / Quantity
                serving = p.get("serving_size") or p.get("quantity")
                if serving:
                    res_dict["qty"] = str(serving).strip()

                # Calories (energy-kcal)
                nutr = p.get("nutriments", {})
                kcal_val = nutr.get("energy-kcal_100g") or nutr.get("energy-kcal") or nutr.get("energy-kcal_value")
                if kcal_val is not None:
                    try:
                        res_dict["kcal"] = int(float(kcal_val))
                    except (ValueError, TypeError):
                        pass
                
                # Ingredients
                raw_ing = p.get("ingredients_text") or p.get("ingredients_text_en") or p.get("ingredients_text_in")
                if raw_ing:
                    clean_ing = raw_ing.replace("\r\n", " ").replace("\n", " ").strip()
                    if clean_ing:
                        res_dict["ingredients"] = clean_ing
                
                # Macronutrients
                protein_val = nutr.get("proteins_100g") or nutr.get("proteins")
                if protein_val is not None:
                    try:
                        res_dict["protein"] = round(float(protein_val), 1)
                    except (ValueError, TypeError):
                        pass

                carbs_val = nutr.get("carbohydrates_100g") or nutr.get("carbohydrates")
                if carbs_val is not None:
                    try:
                        res_dict["carbs"] = round(float(carbs_val), 1)
                    except (ValueError, TypeError):
                        pass

                fat_val = nutr.get("fat_100g") or nutr.get("fat")
                if fat_val is not None:
                    try:
                        res_dict["fat"] = round(float(fat_val), 1)
                    except (ValueError, TypeError):
                        pass

                # Extract real product categories as tags
                tags = []
                categories = str(p.get("categories", "")).split(",")
                for cat in categories[:4]:
                    clean_cat = cat.strip().replace("en:", "").replace("in:", "").title()
                    if clean_cat and len(clean_cat) < 25 and clean_cat not in tags:
                        tags.append(clean_cat)
                
                if tags:
                    res_dict["tags"] = tags

                return res_dict
    except Exception as e:
        print(f"OpenFoodFacts error for {barcode}: {e}")
    return None

import io
try:
    import zxingcpp
except ImportError:
    zxingcpp = None
from PIL import Image

def extract_barcode_from_image(image_bytes: bytes) -> Optional[str]:
    if zxingcpp is None:
        print("Barcode extraction unavailable: zxing-cpp module is not installed.")
        return None
    try:
        img = Image.open(io.BytesIO(image_bytes))
        barcodes = zxingcpp.read_barcodes(img)
        if barcodes and len(barcodes) > 0:
            return barcodes[0].text
    except Exception as e:
        print(f"Barcode image extraction error: {e}")
    return None

@router.post("/scan", summary="Scan food item or label image using AI Vision", response_description="Analyzed food nutrition and Ayurvedic properties")
async def scan_food_image(
    file: Optional[UploadFile] = File(None),
    code: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    image_bytes = b""
    if file:
        image_bytes = await file.read()

    extracted_code = code.strip() if code else None

    # Extract barcode directly from image bytes if image file is uploaded
    if image_bytes and not extracted_code:
        extracted_code = extract_barcode_from_image(image_bytes)

    # 1. Search Open Food Facts if code is provided or extracted from image
    if extracted_code:
        if extracted_code.startswith("{") and extracted_code.endswith("}"):
            try:
                parsed_qr = json.loads(extracted_code)
                if "name" in parsed_qr:
                    return {"success": True, "data": {
                        "name": parsed_qr.get("name"),
                        "qty": parsed_qr.get("qty", "1 serving"),
                        "kcal": int(parsed_qr.get("kcal", 200)),
                        "tags": parsed_qr.get("tags", ["Sattvic", "Tridoshic"])
                    }}
            except Exception:
                pass

        off_result = await asyncio.to_thread(fetch_open_food_facts, extracted_code)
        if off_result:
            return {"success": True, "data": off_result}
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Product barcode '{extracted_code}' was not found in the food database."
            )

    # 2. Try Gemini AI Vision for non-barcode food images if API key is configured
    if settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY != "your_google_api_key_here":
        try:
            mime_type = file.content_type if file else "image/jpeg"
            client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            
            prompt = """
            Analyze this food image, barcode, or food nutrition label.
            Identify the food item and estimate its quantity, calorie count, and Ayurvedic properties.

            Return ONLY a JSON object without any markdown formatting:
            {
              "name": "Name of the food item",
              "qty": "Estimated serving size, e.g., 100g or 1 cup",
              "kcal": 250,
              "tags": ["Warm", "Rasa: Madhura", "Pitta Pacifying"]
            }
            """

            contents = [
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ] if image_bytes else [prompt]
            
            result = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.5-flash",
                contents=contents
            )

            raw_text = result.text.strip()
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
                raw_text = raw_text.strip()

            return {"success": True, "data": json.loads(raw_text)}
        except Exception as e:
            print(f"Gemini scan fallback: {e}")

    # 3. Return explicit Not Found when item is not in database
    raise HTTPException(
        status_code=404,
        detail="Product or barcode could not be identified in the food database. Please try scanning a valid product barcode."
    )
