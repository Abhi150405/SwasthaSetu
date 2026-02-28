import 'dotenv/config';
console.log("PORT:", process.env.PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "EXISTS" : "MISSING");
console.log("Raw Key Start:", process.env.GOOGLE_API_KEY?.substring(0, 10));
