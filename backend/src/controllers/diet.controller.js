import { GoogleGenerativeAI } from "@google/generative-ai";
import { DietPlan } from "../models/dietplan.model.js";
import { ragService } from "../services/rag.service.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "YOUR_API_KEY");

export const generateDietPlan = async (req, res) => {
  try {
    const { age, weight, height, conditions, dietary_preferences, goals, gender } = req.body;
    const bodyPatientId = req.body.patientId;
    const currentUserId = req.user?._id;
    const targetPatientId = bodyPatientId || currentUserId;

    // 1. RAG Retrieve
    const query = `Diet for ${age} year old ${gender}, ${conditions?.join(", ")}, ${dietary_preferences?.join(", ")}.`;
    let context = "";
    try {
      context = await ragService.retrieveContext(query);
    } catch (ragErr) {
      console.warn("RAG retrieval failed, continuing without context...");
    }

    // 2. Construct Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Nutritionist and Ayurvedic Dietician.
      
      Patient Profile:
      - Age: ${age}
      - Gender: ${gender}
      - Weight: ${weight}kg
      - Conditions: ${conditions?.join(", ")}
      - Preferences: ${dietary_preferences?.join(", ")}
      - Goals: ${goals}
      
      Relevant Medical Knowledge (Context):
      ${context}

      Task: Generate a detailed 1-day diet plan (just 1 day for now) that strictly adheres to the following JSON structure.
      Do not include any markdown formatting, just the raw JSON.
      
      Target JSON Structure:
      {
        "plan": [
          {
            "day": 1,
            "date": "YYYY-MM-DD",
            "meals": [
              {
                "type": "Breakfast",
                "items": [
                  { "name": "Food Name", "quantity": "Amount", "nutritional_info": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 } }
                ],
                "total_nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
              },
               {
                "type": "Lunch",
                "items": [],
                "total_nutrition": {}
              },
               {
                "type": "Dinner",
                "items": [],
                "total_nutrition": {}
              }
            ],
            "daily_nutrition_summary": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
            "daily_dosha_balance": { "Vata": "balanced", "Pitta": "balanced", "Kapha": "balanced" },
            "special_recommendations": ["string"]
          }
        ],
        "ayurvedic_analysis": {
          "dominant_dosha": "string",
          "imbalanced_doshas": ["string"],
          "recommended_tastes": ["string"],
          "foods_to_avoid": ["string"],
          "foods_to_favor": ["string"]
        },
        "suggestion": "General advice here"
      }
    `;

    // 3. Generate
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const response = await result.response;
    const text = response.text();

    // Parse JSON
    let dietData;
    try {
      dietData = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      // Fallback: try to find JSON in the text if Gemini included markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          dietData = JSON.parse(jsonMatch[0]);
        } catch (innerE) {
          return res.status(500).json({ success: false, message: "AI generated invalid JSON (parsing failed)", raw: text });
        }
      } else {
        return res.status(500).json({ success: false, message: "AI generated invalid JSON (no JSON found)", raw: text });
      }
    }

    // 4. Save to DB
    if (targetPatientId) {
      try {
        const dietPlan = new DietPlan({
          patient: targetPatientId,
          createdBy: currentUserId || targetPatientId,
          plan: dietData.plan,
          suggestion: dietData.suggestion,
          ayurvedic_analysis: dietData.ayurvedic_analysis
        });
        await dietPlan.save();
      } catch (dbErr) {
        console.error("Failed to save diet plan to DB:", dbErr.message);
        // We still return the data even if saving fails
      }
    }

    res.status(200).json({ success: true, data: dietData });

  } catch (error) {
    console.error("Diet Plan Generation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
