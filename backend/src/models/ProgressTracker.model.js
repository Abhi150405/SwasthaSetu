// models/ProgressTracker.js

import mongoose from "mongoose";

const mealLogSchema = new mongoose.Schema({
  meal_type: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "skipped"],
    default: "pending",
  },
  acknowledged_at: {
    type: Date,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem"
  }, 
});

const progressTrackerSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diet_plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DietPlan", // Assumes you have a DietPlan model
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    meal_log: [mealLogSchema],
    water_intake_ml: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

progressTrackerSchema.index(
  {
    patient: 1,
    date: 1
  }, {
    unique: true
  }
);

export const ProgressTracker = mongoose.model("ProgressTracker", progressTrackerSchema);