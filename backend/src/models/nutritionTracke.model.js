// models/NutritionTracker.js  // daily totals (can be created/updated when user logs a meal)
import mongoose from "mongoose";

const nutritionTrackerSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }, // normalized to 00:00:00 (start of day)
  consumedCalories: { type: Number, default: 0 },
  consumedProtein: { type: Number, default: 0 },
  consumedCarbs: { type: Number, default: 0 },
  consumedFat: { type: Number, default: 0 },
  targetCalories: Number,
  // optional: reference to dietPlan for that day
  dietPlanId: { type: mongoose.Schema.Types.ObjectId, ref: "DietPlan" }
}, { timestamps: true });

nutritionTrackerSchema.index({ patient: 1, date: 1 }, { unique: true });
export const NutritionTracker=mongoose.model("NutritionTracker", nutritionTrackerSchema);
