import { Router } from "express";
import { generateDietPlan } from "../controllers/diet.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Protect all diet routes
router.use(verifyJWT);

router.route("/generate").post(generateDietPlan);

export default router;
