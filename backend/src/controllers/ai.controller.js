import { GoogleGenerativeAI } from "@google/generative-ai";
import { ragService } from "../services/rag.service.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "YOUR_API_KEY");

export const getHealthAdvice = async (req, res) => {
    try {
        const { question, patientContext } = req.body;

        if (!question) {
            return res.status(400).json({ success: false, message: "Question is required" });
        }

        // 1. RAG Retrieve
        let context = "";
        try {
            context = await ragService.retrieveContext(question);
        } catch (ragErr) {
            console.warn("RAG retrieval failed for Health Advice, using general knowledge.");
        }

        // 2. Generate Answer
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
      You are Setu, an advanced agentic AI health assistant for the Swasthasetu platform.
      Your goal is to assist users (patients and doctors) with health advice, diet tracking, and system navigation.
      
      You have access to the following "capabilities" which you can trigger by including specific tags in your response:
      - [ACTION:MARK_WATER]: Use this when the user says they drank water.
      - [ACTION:MARK_MEAL]: Use this when the user says they ate a meal.
      - [ACTION:NAVIGATE:/path]: Use this to suggest or perform navigation. Common paths: /dashboard, /recipes, /tracking, /profile, /doctor, /doctor/patients.
      - [ACTION:OPEN_PATIENT_VIEW:patientId]: Use this to open a specific patient's view (doctor only).
      
      Context from Knowledge Base:
      ${context}
      
      Patient/User Context:
      ${JSON.stringify(patientContext || {})}
      
      Guidelines:
      1. Be concise, warm, and professional.
      2. If you perform an action, mention it in the text (e.g., "I've logged your water intake.").
      3. Your response should be a mix of text and these [ACTION:...] tags if needed.
      4. Use Ayurvedic wisdom where appropriate.
    `;

        const combinedPrompt = `${systemPrompt}\n\nUser Question: ${question}`;

        const result = await model.generateContent(combinedPrompt);

        const response = await result.response;
        const text = response.text();

        res.status(200).json({ success: true, answer: text });

    } catch (error) {
        console.error("Health Advice Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
