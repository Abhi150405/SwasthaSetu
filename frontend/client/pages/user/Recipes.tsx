import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Leaf, ChefHat, Clock, Utensils, Flame, Droplets, LeafyGreen, Soup } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Recipes() {
  const [mealName, setMealName] = useState("");
  
  type Recipe = {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    vitamins: string[];
    ayur: { rasa: string; virya: string; vipaka: string; guna: string[] };
    ingredients: string[];
    steps: string[];
  };

  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const macros = (kcal: number) => ({
    protein: Math.round((kcal * 0.2) / 4),
    carbs: Math.round((kcal * 0.55) / 4),
    fat: Math.round((kcal * 0.25) / 9),
  });

  const generateSingle = (meal: string): Recipe => {
    const base = 400 + Math.floor(Math.random() * 300);
    return {
      name: meal,
      calories: base,
      ...macros(base),
      vitamins: ["A", "B", "C"],
      ayur: {
        rasa: "Madhura",
        virya: "Ushna",
        vipaka: "Madhura",
        guna: ["Sattvic", "Light"],
      },
      ingredients: [
        `${meal} base ingredient`,
        "Seasonal vegetables",
        "Spices (cumin, turmeric, coriander)",
        "Ghee or oil",
        "Herbs (coriander/parsley)",
      ],
      steps: [
        "Prepare and wash ingredients.",
        "Heat pan and temper spices.",
        `Add ingredients to create ${meal}.`,
        "Simmer until cooked and flavors blend.",
        "Garnish and serve warm.",
      ],
    };
  };

  const onGenerate = () => {
    if (!mealName.trim()) return;
    setRecipe(generateSingle(mealName.trim()));
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <Card className="bg-amber-50/50 border-amber-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ChefHat className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Ayurvedic Recipe Generator</CardTitle>
              <CardDescription className="text-amber-800/80">Create balanced, dosha-friendly recipes with ancient wisdom</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Utensils className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-700" />
              <Input
                className="pl-10 py-5 border-amber-200 focus-visible:ring-amber-300"
                placeholder="Enter meal name (e.g., Moong Dal Khichdi)"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
              />
            </div>
            <Button 
              onClick={onGenerate} 
              className="bg-amber-600 hover:bg-amber-700 text-white py-5 px-6 transition-colors"
              disabled={!mealName.trim()}
            >
              Generate Recipe
            </Button>
          </div>
        </CardContent>
      </Card>

      {recipe && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recipe Header */}
          <div className="md:col-span-3">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-amber-50/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-amber-800/80">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        30-40 mins
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4" />
                        {recipe.calories} kcal
                      </span>
                      <span className="flex items-center gap-1">
                        <Leaf className="h-4 w-4" />
                        {recipe.ayur.guna.join(" • ")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ingredients */}
          <div className="md:col-span-1">
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="border-b bg-amber-50/50">
                <div className="flex items-center gap-2">
                  <LeafyGreen className="h-5 w-5 text-amber-700" />
                  <CardTitle className="text-lg font-semibold">Ingredients</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {recipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="px-6 py-3 hover:bg-amber-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-1.5 w-1.5 mt-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-gray-700">{ing}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recipe Steps */}
          <div className="md:col-span-2">
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="border-b bg-amber-50/50">
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-amber-700" />
                  <CardTitle className="text-lg font-semibold">Preparation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ol className="space-y-4">
                  {recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-medium flex-shrink-0">
                          {idx + 1}
                        </div>
                        {idx < recipe.steps.length - 1 && (
                          <div className="h-full w-0.5 bg-amber-200 my-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-gray-700">{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Nutrition & Ayurveda */}
          <div className="md:col-span-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-amber-50/50">
                <CardTitle className="text-lg font-semibold">Nutrition & Ayurvedic Properties</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Nutritional Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories</span>
                        <span className="font-medium">{recipe.calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein</span>
                        <span className="font-medium">{recipe.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carbohydrates</span>
                        <span className="font-medium">{recipe.carbs}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fats</span>
                        <span className="font-medium">{recipe.fat}g</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Ayurvedic Properties</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rasa (Taste)</span>
                        <span className="font-medium">{recipe.ayur.rasa}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Virya (Energy)</span>
                        <span className="font-medium">{recipe.ayur.virya}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vipaka (Post-digestive effect)</span>
                        <span className="font-medium">{recipe.ayur.vipaka}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guna (Qualities)</span>
                        <span className="font-medium">{recipe.ayur.guna.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
