import 'dotenv/config';
import fetch from 'node-fetch'; // If not available, we use https

async function listAllModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log("Fetching available models from API...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error Response:", JSON.stringify(data.error, null, 2));
            if (data.error.message.includes("API key not valid")) {
                console.log("\n结论: Your API key is INVALID.");
            }
        } else {
            console.log("\n--- AVAILABLE MODELS ---");
            data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
            console.log("\n结论: Your API key IS WORKING but maybe for different models.");
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

listAllModels();
