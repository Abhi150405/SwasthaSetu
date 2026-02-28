from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
import google.generativeai as genai
import json
from app.services.rag_service import rag_service
from app.core.config import settings

router = APIRouter()

genai.configure(api_key=settings.GOOGLE_API_KEY)

class AIRequest(BaseModel):
    question: str
    patientContext: Optional[Any] = None

@router.post("/ask")
async def ask_ai(request: AIRequest):
    if not request.question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        # 1. RAG Retrieve
        context = await rag_service.retrieve_context(request.question)
        
        # 2. Generate Answer
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        system_prompt = f"""
        You are Setu, an advanced agentic AI health assistant for the Swasthasetu platform.
        Your goal is to assist users (patients and doctors) with health advice, diet tracking, and system navigation.
        
        You have access to the following "capabilities" which you can trigger by including specific tags in your response:
        - [ACTION:MARK_WATER]: Use this when the user says they drank water.
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
        
        # Run in a separate thread if genai is synchronous, 
        # but the latest google-generativeai supports async conceptually or can be run in executor
        # For simplicity in this conversion:
        result = model.generate_content(combined_prompt)
        
        return {"success": True, "answer": result.text}

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
