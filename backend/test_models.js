import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // There isn't a direct listModels in the simple SDK, usually we just try names.
        // But we can try to hit the models endpoint.
        console.log("Testing gemini-pro...");
        const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
        const resultPro = await modelPro.generateContent("hello");
        console.log("gemini-pro works!");
        process.exit(0);
    } catch (error) {
        console.error("gemini-pro failed:", error.message);

        try {
            console.log("Testing gemini-1.0-pro...");
            const model10 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result10 = await model10.generateContent("hello");
            console.log("gemini-1.0-pro works!");
            process.exit(0);
        } catch (err2) {
            console.error("gemini-1.0-pro failed:", err2.message);
            process.exit(1);
        }
    }
}

listModels();
