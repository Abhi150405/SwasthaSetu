import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';


const app = express();

// CORS configuration
// In production, set CORS_ORIGIN env var on Render to your Vercel URL(s)
// e.g. "https://swasthasetu.vercel.app"
const corsOriginEnv = process.env.CORS_ORIGIN || process.env.PROD_ORIGIN || "";
const isProduction = process.env.NODE_ENV === "production";

let allowedOrigins;
if (corsOriginEnv) {
  allowedOrigins = corsOriginEnv.split(",").map(o => o.trim());
} else if (isProduction) {
  allowedOrigins = "*";  // fallback: allow all if no origin is explicitly set
} else {
  allowedOrigins = (process.env.DEV_ORIGIN || "http://localhost:8080").split(",");
}

app.use(cors({
  origin: allowedOrigins,
  credentials: allowedOrigins !== "*",  // credentials not allowed with wildcard
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))

app.use(cookieParser())


import patientRouter from './routes/patient.routes.js'
import doctorRouter from './routes/doctor.routes.js'
import aiRouter from './routes/ai.routes.js'
import dietRouter from './routes/diet.routes.js'
import recipeRouter from './routes/recipe.routes.js'
import progressRouter from './routes/progress.routes.js'

app.use('/api/patient', patientRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/ai', aiRouter);
app.use('/api/diet', dietRouter);
app.use('/api/recipe', recipeRouter);
app.use('/api/progress', progressRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", err);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export { app }