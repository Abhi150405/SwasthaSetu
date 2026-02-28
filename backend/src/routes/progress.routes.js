import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getProgressByDate,
    updateWaterIntake,
    markMealTaken,
    getPatientHistory
} from "../controllers/progress.controller.js";

const router = Router();

// All progress-related routes require authentication
router.use(verifyJWT);

// GET /api/progress/today
router.get("/today", getProgressByDate);

// GET /api/progress/history?limit=7
router.get("/history", getPatientHistory);

// POST /api/progress/water { amount: 250, date: optional }
router.post("/water", updateWaterIntake);

// POST /api/progress/meal { meal_type: "breakfast", date: optional }
router.post("/meal", markMealTaken);

export default router;
