import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function verifyDetailed() {
    console.log("Starting detailed Gemini Verification...");
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("CRITICAL: GOOGLE_API_KEY is missing from .env");
        return;
    }
    console.log("Key found (starts with):", key.substring(0, 7) + "...");

    const genAI = new GoogleGenerativeAI(key);

    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const modelName of modelsToTry) {
        try {
            console.log(`\nTesting model: ${modelName} ...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Respond with only the word 'ACTIVE'");
            const response = await result.response;
            const text = response.text().trim();
            console.log(`SUCCESS: ${modelName} returned: "${text}"`);
            console.log(`Confirmed: Your Gemini Key is WORKING for ${modelName}.`);
            return; // Exit on first success
        } catch (error) {
            console.error(`FAILED: ${modelName} - Status: ${error.status || 'Unknown'}`);
            console.error(`Message: ${error.message}`);
        }
    }

    console.error("\n--- SUMMARY ---");
    console.error("All models failed. This usually means:");
    console.error("1. The API key is invalid or restricted.");
    console.error("2. Your project doesn't have the Generative AI API enabled.");
    console.error("3. You are in a region where this key/service is not supported.");
}

verifyDetailed();
