import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String },
  category: { type: String },
  alternatives: [String],
  ayurvedic_properties: { type: String }
}, { _id: false });

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  instruction: { type: String, required: true },
  time_minutes: { type: Number },
  temperature: { type: String },
  tips: [String]
}, { _id: false });

const nutritionSchema = new mongoose.Schema({
  calories_per_serving: Number,
  protein: Number,
  carbohydrates: Number,
  fat: Number,
  fiber: Number,
  sugar: Number,
  sodium: Number,
  vitamins: { type: Map, of: String },
  minerals: { type: Map, of: String }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  description: String,
  category: String,
  cuisine: String,
  difficulty: String,
  prep_time_minutes: Number,
  cook_time_minutes: Number,
  total_time_minutes: Number,
  servings: Number,

  ingredients: [ingredientSchema],
  instructions: [instructionSchema],
  nutrition: nutritionSchema,

  tags: [String],
  dominant_tastes: [String],

  dosha_effects: {
    Vata: { type: String, default: null },
    Pitta: { type: String, default: null },
    Kapha: { type: String, default: null }
  },
  ayurvedic_benefits: [String],


 
}, { timestamps: true });

recipeSchema.index({ name: "text", tags: 1, category: 1 });
export const Recipe= mongoose.model("Recipe", recipeSchema);
