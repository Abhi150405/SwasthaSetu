import 'dotenv/config';

async function findEmbed() {
    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const embeddingModels = data.models.filter(m => m.supportedGenerationMethods.includes("embedContent"));

        console.log("--- EMBEDDING MODELS ---");
        embeddingModels.forEach(m => console.log(`- ${m.name}`));

        const genModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        console.log("\n--- GENERATION MODELS (First 5) ---");
        genModels.slice(0, 5).forEach(m => console.log(`- ${m.name}`));
    } catch (err) {
        console.error(err);
    }
}
findEmbed();
