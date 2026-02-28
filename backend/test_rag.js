import 'dotenv/config';
import { ragService } from './src/services/rag.service.js';

async function testRAG() {
    try {
        console.log("Initializing RAG...");
        await ragService.init();
        console.log("Retrieving context...");
        const context = await ragService.retrieveContext("diabetes");
        console.log("Context:", context);
        process.exit(0);
    } catch (error) {
        console.error("RAG Error:", error);
        process.exit(1);
    }
}

testRAG();
