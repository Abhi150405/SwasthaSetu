import 'dotenv/config';

async function check15() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const models = data.models.map(m => m.name);

        console.log("Checking for gemini-1.5-flash...");
        if (models.includes("models/gemini-1.5-flash")) {
            console.log("Found: models/gemini-1.5-flash");
        } else {
            console.log("NOT FOUND: models/gemini-1.5-flash");
            console.log("Available models include:", models.slice(0, 10));
        }
    } catch (err) {
        console.error(err);
    }
}
check15();
