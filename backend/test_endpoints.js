import axios from "axios";

async function testEndpoints() {
    console.log("-----------------------------------------");
    console.log(" TESTING AI HEALTH ASSISTANT ENDPOINTS");
    console.log("-----------------------------------------");

    // 1. Test General Health Chat (RAG)
    try {
        console.log("\n1. Testing /api/ai/ask (General Health Question)...");
        const chatResponse = await axios.post("http://localhost:5000/api/ai/ask", {
            question: "What foods are good for a diabetic patient?"
        });
        console.log("✅ Chat Response:", chatResponse.data.answer);
    } catch (error) {
        console.error("❌ Chat Failed:", error.response ? error.response.data : error.message);
    }

    // 2. Test Diet Plan Generator
    try {
        console.log("\n2. Testing /api/diet/generate (Diet Plan AI)...");
        console.log("   (This uses RAG + Gemini to generate a JSON plan, might take 5-10 seconds)");

        const dietResponse = await axios.post("http://localhost:5000/api/diet/generate", {
            age: 45,
            gender: "Male",
            weight: 80,
            height: 175,
            conditions: ["Diabetes Type 2", "High Blood Pressure"],
            dietary_preferences: ["Vegetarian"],
            goals: "Weight Loss and Blood Sugar Control"
        });

        console.log("✅ Diet Plan Generated Successfully!");
        console.log("   Summary Suggestion:", dietResponse.data.data.suggestion);
    } catch (error) {
        console.error("❌ Diet Gen Failed:", error.response ? error.response.data : error.message);
    }
}

testEndpoints();
