import os
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
        
        self.vector_store = InMemoryVectorStore.from_documents(
            initial_docs,
            self.embeddings
        )
        print("RAG Service: Vector Store Initialized with default knowledge.")

    async def retrieve_context(self, query: str, k: int = 3) -> str:
        if not self.vector_store:
            await self.init()
        
        try:
            results = self.vector_store.similarity_search(query, k=k)
            return "\n\n".join([doc.page_content for doc in results])
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")
            return ""

rag_service = RAGService()
