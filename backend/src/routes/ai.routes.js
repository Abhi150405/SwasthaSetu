import { Router } from "express";
import { getHealthAdvice } from "../controllers/ai.controller.js";
// import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Optional: protect if desired, public for now for easier testing
// router.use(verifyJWT);

router.route("/ask").post(getHealthAdvice);

export default router;
