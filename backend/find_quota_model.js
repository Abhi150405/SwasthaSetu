import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function findWorkingModel() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const candidateModels = [
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-8b",
        "gemini-pro"
    ];

    console.log("Searching for a model with available quota...");

    for (const name of candidateModels) {
        try {
            process.stdout.write(`Testing ${name}... `);
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("ping");
            const response = await result.response;
            console.log("SUCCESS!");
            console.log(`\n结论: Use model "${name}"`);
            process.exit(0);
        } catch (error) {
            if (error.status === 429) {
                console.log("RATE LIMITED (429)");
            } else if (error.status === 404) {
                console.log("NOT FOUND (404)");
            } else {
                console.log(`ERROR: ${error.message.substring(0, 50)}...`);
            }
        }
    }
    console.log("\n结论: All models are currently rate-limited or unavailable.");
    process.exit(1);
}

findWorkingModel();
