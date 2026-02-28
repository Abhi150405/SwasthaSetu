import { Router } from "express";
import { generateRecipe } from "../controllers/recipe.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Route for generating AI recipes
router.route("/generate").post(verifyJWT, generateRecipe);

export default router;
