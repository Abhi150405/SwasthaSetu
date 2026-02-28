import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

class RAGService {
    constructor() {
        this.vectorStore = null;
        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-embedding-001",
        });
    }

    // Initialize or reset the vector store
    async init() {
        // In a real app, you might load this from a file or DB on startup
        const initialDocs = [
            new Document({ pageContent: "A balanced diet recommends 40% carbs, 30% protein, 30% fat for maintenance." }),
            new Document({ pageContent: "Diabetic patients should avoid refined sugars and focus on complex carbohydrates like oats and whole grains." }),
            new Document({ pageContent: "High protein diets may benefit muscle gain but require hydration." }),
            new Document({ pageContent: "Ayurvedic principles suggest eating warm, cooked foods for Vata imbalance." }),
            new Document({ pageContent: "Kapha dosha benefits from spicy, bitter, and astringent foods." }),
            new Document({ pageContent: "Pitta dosha should avoid excessive chili and sour foods, favoring cooling foods like cucumber and mint." })
        ];

        this.vectorStore = await MemoryVectorStore.fromDocuments(
            initialDocs,
            this.embeddings
        );
        console.log("RAG Service: Vector Store Initialized with default knowledge.");
    }


    async addDocuments(texts) {
        if (!this.vectorStore) {
            await this.init();
        }
        const docs = texts.map(t => new Document({ pageContent: t }));
        await this.vectorStore.addDocuments(docs);
    }

    async retrieveContext(query, k = 3) {
        try {
            if (!this.vectorStore) {
                await this.init();
            }
            // Add a timeout promise to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("RAG retrieval timed out")), 15000)
            );

            const searchPromise = this.vectorStore.similaritySearch(query, k);
            const results = await Promise.race([searchPromise, timeoutPromise]);

            return results.map(doc => doc.pageContent).join("\n\n");
        } catch (error) {
            console.error("RAG Retrieval Error (Falling back to general knowledge):", error.message);
            return ""; // Return empty context so AI uses its own knowledge
        }
    }
}

export const ragService = new RAGService();
