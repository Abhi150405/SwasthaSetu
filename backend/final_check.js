import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function finalVerify() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Final check: Is everything okay?");
        const response = await result.response;
        console.log("Gemini 2.0 Response:", response.text());
        process.exit(0);
    } catch (error) {
        console.error("Final check failed:", error);
        process.exit(1);
    }
}
finalVerify();
