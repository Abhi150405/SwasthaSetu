import { GoogleGenerativeAI } from "@google/generative-ai";
import { ragService } from "../services/rag.service.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const generateRecipe = async (req, res) => {
    try {
        const { mealName, patientName, dosha, activity } = req.body;

        if (!mealName) {
            return res.status(400).json({ success: false, message: "Meal name is required" });
        }

        // 1. RAG Retrieve for context if available
        let context = "";
        try {
            context = await ragService.retrieveContext(`Specific recipe and Ayurvedic preparation for ${mealName} for ${dosha} dosha`);
        } catch (err) {
            console.warn("RAG retrieval failed for recipe, using general knowledge.");
        }

        // 2. Construct Prompt
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an expert Ayurvedic Chef and Nutritionist. 
      Generate a detailed, healthy, and Ayurvedic-compatible recipe for: "${mealName}".
      
      Target Patient Context:
      - Name: ${patientName || "Patient"}
      - Dosha: ${dosha || "Balanced"}
      
      Medical Context (from Knowledge Base):
      ${context}

      RESPOND ONLY WITH A VALID JSON OBJECT.
      JSON structure:
      {
        "name": "string",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "vitamins": ["string"],
        "ayur": {
          "rasa": "string",
          "virya": "string",
          "vipaka": "string",
          "guna": ["string"]
        },
        "ingredients": ["string"],
        "steps": ["string"]
      }
      
      Ensure the ingredients and preparation steps respect the patient's dosha (${dosha}).
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON using regex (more robust than startsWith)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI failed to return a valid JSON recipe structure.");
        }

        const recipeData = JSON.parse(jsonMatch[0]);

        return res.status(200).json({
            success: true,
            data: recipeData
        });

    } catch (error) {
        console.error("Recipe Generation Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate recipe"
        });
    }
};
