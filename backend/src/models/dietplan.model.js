import mongoose from "mongoose";

// ---------------- Food Item ----------------
const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: String,
  ayurvedic_properties: {
    rasa: [String],  
    virya: { type: String, default: null },  
    prabhava: { type: String, default: null },
    dosha_effects: {
      Vata: { type: String, default: null },
      Pitta: { type: String, default: null },
      Kapha: { type: String, default: null }
    }
  },
  nutritional_info: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    vitamins: { type: Map, of: String },   // Flexible vitamins
    minerals: { type: Map, of: String }    // Flexible minerals
  },
  preparation_notes: { type: String, default: null }
});

// ---------------- Meal ----------------
const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
    required: true
  },
  items: [foodItemSchema],
  total_nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    vitamins: { type: Map, of: String },
    minerals: { type: Map, of: String }
  },
  total_ayurvedic_properties: {
    rasa: [String],
    virya: { type: String, default: null },
    prabhava: { type: String, default: null },
    dosha_effects: {
      Vata: { type: String, default: null },
      Pitta: { type: String, default: null },
      Kapha: { type: String, default: null }
    }
  },
  preparation_time: Number,
  cooking_instructions: { type: String, default: null }
});

// ---------------- Day Plan ----------------
const dayPlanSchema = new mongoose.Schema({
  day: Number,
  date: Date,
  meals: [mealSchema],
  daily_nutrition_summary: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    vitamins: { type: Map, of: String },
    minerals: { type: Map, of: String }
  },
  daily_dosha_balance: {
    Vata: String,
    Pitta: String,
    Kapha: String
  },
  special_recommendations: [String]
});

// ---------------- Ayurvedic Analysis ----------------
const ayurvedicAnalysisSchema = new mongoose.Schema({
  dominant_dosha: String,
  imbalanced_doshas: [String],
  recommended_tastes: [String],
  foods_to_avoid: [String],
  foods_to_favor: [String],
  lifestyle_recommendations: [String],
  seasonal_adjustments: { type: Map, of: String },
  analysis_confidence: Number
});

// ---------------- Diet Plan ----------------
const dietPlanSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  plan: [dayPlanSchema],
  suggestion: String,
  ayurvedic_analysis: ayurvedicAnalysisSchema,
}, { timestamps: true });

dietPlanSchema.index({ patient: 1, createdBy: 1 });

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);
export const FoodItem = mongoose.model("FoodItem", foodItemSchema);




// Example Response from diet plan generator
// {
//   "status": "success",
//   "data": {
//     "plan": [
//       {
//         "day": 1,
//         "date": "2025-09-23",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       },
//       {
//         "day": 2,
//         "date": "2025-09-24",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       },
//       {
//         "day": 3,
//         "date": "2025-09-25",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       },
//       {
//         "day": 4,
//         "date": "2025-09-26",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       },
//       {
//         "day": 5,
//         "date": "2025-09-27",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       },
//       {
//         "day": 6,
//         "date": "2025-09-28",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       },
//       {
//         "day": 7,
//         "date": "2025-09-29",
//         "meals": [
//           {
//             "type": "Breakfast",
//             "items": [
//               {
//                 "name": "Oatmeal with almonds",
//                 "quantity": "1 cup",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 300,
//                   "protein": 10,
//                   "carbs": 50,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 300,
//               "protein": 10,
//               "carbs": 50,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 15,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Lunch",
//             "items": [
//               {
//                 "name": "Rice with dal",
//                 "quantity": "1.5 cups",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "decrease"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 450,
//                   "protein": 18,
//                   "carbs": 75,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 450,
//               "protein": 18,
//               "carbs": 75,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 30,
//             "cooking_instructions": null
//           },
//           {
//             "type": "Dinner",
//             "items": [
//               {
//                 "name": "Vegetable soup with bread",
//                 "quantity": "1 bowl",
//                 "ayurvedic_properties": {
//                   "rasa": [
//                     "sweet",
//                     "bitter"
//                   ],
//                   "virya": null,
//                   "prabhava": null,
//                   "dosha_effects": {
//                     "Vata": "neutral"
//                   }
//                 },
//                 "nutritional_info": {
//                   "calories": 250,
//                   "protein": 8,
//                   "carbs": 40,
//                   "fat": 0,
//                   "fiber": 0,
//                   "vitamins": {},
//                   "minerals": {}
//                 },
//                 "preparation_notes": null
//               }
//             ],
//             "total_nutrition": {
//               "calories": 250,
//               "protein": 8,
//               "carbs": 40,
//               "fat": 0,
//               "fiber": 0,
//               "vitamins": {},
//               "minerals": {}
//             },
//             "total_ayurvedic_properties": {
//               "rasa": [
//                 "sweet",
//                 "bitter"
//               ],
//               "virya": null,
//               "prabhava": null,
//               "dosha_effects": {}
//             },
//             "preparation_time": 25,
//             "cooking_instructions": null
//           }
//         ],
//         "daily_nutrition_summary": {
//           "calories": 1000,
//           "protein": 36,
//           "carbs": 165,
//           "fat": 0,
//           "fiber": 0,
//           "vitamins": {},
//           "minerals": {}
//         },
//         "daily_dosha_balance": {
//           "Vata": "balanced",
//           "Pitta": "balanced",
//           "Kapha": "slightly increased"
//         },
//         "special_recommendations": [
//           "Drink warm water throughout the day",
//           "Take meals at regular intervals"
//         ]
//       }
//     ],
//     "suggestion": "Your dominant dosha is DoshaType.VATA.  Focus on warm, cooked foods and regular meal times. Consider the specific recommendations provided for optimal results. Remember to maintain regular meal times and practice mindful eating.",
//     "ayurvedic_analysis": {
//       "dominant_dosha": "Vata",
//       "imbalanced_doshas": [],
//       "recommended_tastes": [
//         "sweet",
//         "sour",
//         "salty"
//       ],
//       "foods_to_avoid": [
//         "cold foods",
//         "raw vegetables",
//         "dry foods"
//       ],
//       "foods_to_favor": [
//         "warm foods",
//         "cooked vegetables",
//         "ghee",
//         "grains"
//       ],
//       "lifestyle_recommendations": [
//         "Maintain regular meal times",
//         "Eat in a peaceful environment",
//         "Practice mindful eating",
//         "Stay hydrated with warm water"
//       ],
//       "seasonal_adjustments": {},
//       "analysis_confidence": 0.8
//     }
//   }
// }
