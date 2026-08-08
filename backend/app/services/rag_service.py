import os
import json
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.documents import Document
from app.core.config import settings

class RAGService:
    def __init__(self):
        self.vector_store = None
        self.embeddings = GoogleGenerativeAIEmbeddings(
            google_api_key=settings.GOOGLE_API_KEY,
            model="models/gemini-embedding-001"
        )
        
    async def init(self):
        initial_docs = [
            Document(page_content="A balanced diet recommends 40% carbs, 30% protein, 30% fat for maintenance."),
            Document(page_content="Diabetic patients should avoid refined sugars and focus on complex carbohydrates like oats and whole grains."),
            Document(page_content="High protein diets may benefit muscle gain but require hydration."),
            Document(page_content="Ayurvedic principles suggest eating warm, cooked foods for Vata imbalance."),
            Document(page_content="Kapha dosha benefits from spicy, bitter, and astringent foods."),
            Document(page_content="Pitta dosha should avoid excessive chili and sour foods, favoring cooling foods like cucumber and mint.")
        ]
        
        json_path = os.path.join(os.path.dirname(__file__), "..", "data", "ayurvedic_foods.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if data.get("_reviewed_by_practitioner") is False:
                print("WARNING: ayurvedic_foods.json has not been reviewed by a qualified practitioner (_reviewed_by_practitioner is False). Use with caution.")

            foods = data.get("foods", [])
            for food in foods:
                name = food.get("name", "")
                rasa_val = food.get("rasa", [])
                rasa = ", ".join(rasa_val) if isinstance(rasa_val, list) else str(rasa_val)
                virya = food.get("virya", "")
                vipaka = food.get("vipaka", "")
                dosha_effects = food.get("dosha_effects", {})
                v_eff = dosha_effects.get("Vata", "")
                p_eff = dosha_effects.get("Pitta", "")
                k_eff = dosha_effects.get("Kapha", "")
                guna_val = food.get("guna", [])
                guna = ", ".join(guna_val) if isinstance(guna_val, list) else str(guna_val)
                contra_val = food.get("contraindications", [])
                contra = ", ".join(contra_val) if isinstance(contra_val, list) else str(contra_val)
                if not contra:
                    contra = "none"
                notes = food.get("notes", "")

                desc = (
                    f"{name}: rasa {rasa}, virya {virya}, vipaka {vipaka}. "
                    f"Effects - Vata: {v_eff}, Pitta: {p_eff}, Kapha: {k_eff}. "
                    f"Guna: {guna}. Contraindications: {contra}. Notes: {notes}"
                )
                initial_docs.append(Document(page_content=desc))
        
        self.vector_store = InMemoryVectorStore.from_documents(
            initial_docs,
            self.embeddings
        )
        print(f"RAG Service: Vector Store Initialized with {len(initial_docs)} documents.")

    async def retrieve_context(self, query: str, k: int = 5) -> str:
        if not self.vector_store:
            await self.init()
        
        try:
            results = self.vector_store.similarity_search(query, k=k)
            return "\n\n".join([doc.page_content for doc in results])
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")
            return ""

rag_service = RAGService()
