import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";
import { useAppState } from "@/context/app-state";

// Icons
import { Utensils, CalendarDays, Info } from "lucide-react";

// Meal plan types
interface Meal {
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface MealDetails {
  title: string;
  description: string;
  ayurvedicInfo: {
    dosha: string;
    qualities: string;
    benefits: string[];
    bestTime: string;
    spices: string;
  };
  modernNutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber?: string;
    omega3?: string;
    probiotics?: string;
    keyNutrients: string[];
  };
  ingredients: string[];
  instructions: string[];
}

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface MealPlan {
  day: string;
  meals: Meal;
}

interface MealPlan {
  day: string;
  meals: Meal;
}

// Sample weekly meal plan
const weeklyMealPlan: MealPlan[] = [
  { day: 'Sunday', meals: { breakfast: 'Omelet with vegetables and feta cheese', lunch: 'Grilled salmon with quinoa and roasted vegetables', dinner: 'Grilled steak with mashed potatoes and green beans' } },
  { day: 'Monday', meals: { breakfast: 'Oatmeal with berries and nuts', lunch: 'Grilled chicken salad with olive oil dressing', dinner: 'Baked salmon with quinoa and steamed vegetables' } },
  { day: 'Tuesday', meals: { breakfast: 'Scrambled eggs with whole grain toast', lunch: 'Quinoa bowl with chickpeas and vegetables', dinner: 'Grilled chicken with sweet potato and broccoli' } },
  { day: 'Wednesday', meals: { breakfast: 'Greek yogurt with granola and fruit', lunch: 'Turkey and avocado wrap with side salad', dinner: 'Stir-fried tofu with brown rice and vegetables' } },
  { day: 'Thursday', meals: { breakfast: 'Smoothie with spinach, banana, and protein powder', lunch: 'Grilled fish with quinoa and roasted vegetables', dinner: 'Lean beef with mashed cauliflower and green beans' } },
  { day: 'Friday', meals: { breakfast: 'Avocado toast with poached eggs', lunch: 'Chicken and vegetable stir-fry with brown rice', dinner: 'Baked cod with roasted sweet potatoes and asparagus' } },
  { day: 'Saturday', meals: { breakfast: 'Pancakes with fresh fruit and maple syrup', lunch: 'Grilled chicken Caesar salad', dinner: 'Homemade vegetable lasagna with side salad' } },
];

// MealCard component
interface MealCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const MealCard = ({ title, content, icon }: MealCardProps) => (
  <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 300 }}>
    <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            {icon}
          </div>
          <CardTitle className="text-base font-semibold text-gray-800 capitalize">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{content}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function Tracking() {
  const appState = useAppState();
  const [reminders, setReminders] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay()); // Start with today (0=Sunday, 1=Monday, etc.)
  const [selectedMeal, setSelectedMeal] = useState<{type: MealType; details: MealDetails} | null>(null);
  
  // Provide default values if appState is not available yet
  const { 
    progress = { 
      waterMl: 0, 
      waterGoalMl: 2000, 
      mealsTaken: 0, 
      mealsPlanned: 3 
    },
    updateWater = () => {},
    markMealTaken = () => {}
  } = appState || {};

  useEffect(() => {
    if (!reminders) return;
    const id = setInterval(() => {
      setNotif("Time to drink water (250ml)?");
    }, 8000);
    return () => clearInterval(id);
  }, [reminders]);

  // Meal details data with Ayurvedic and modern information
  const mealDetails: Record<MealType, MealDetails> = {
    breakfast: {
      title: "Oatmeal with Fruits",
      description: "A healthy and filling breakfast option with complex carbs and natural sugars.",
      ayurvedicInfo: {
        dosha: "Balances Vata and Pitta, increases Kapha in excess",
        qualities: "Heavy, moist, nourishing, grounding",
        benefits: [
          "Supports Ojas (vitality)",
          "Nourishes Dhatus (tissues)",
          "Promotes digestive strength (Agni)",
          "Calms the nervous system"
        ],
        bestTime: "6-10 AM (Kapha time of day)",
        spices: "Cinnamon, cardamom, nutmeg (enhance digestion)"
      },
      modernNutrition: {
        calories: 350,
        protein: "12g",
        carbs: "58g",
        fat: "6g",
        fiber: "8g",
        keyNutrients: [
          "Rich in Beta-glucan (supports heart health)",
          "High in B-vitamins (energy production)",
          "Good source of antioxidants",
          "Low glycemic index (sustained energy)"
        ]
      },
      ingredients: [
        "1/2 cup rolled oats",
        "1 cup almond milk",
        "1/2 banana, sliced",
        "1/4 cup mixed berries",
        "1 tbsp honey",
        "1 tbsp chia seeds"
      ],
      instructions: [
        "Bring almond milk to a boil in a small saucepan.",
        "Add oats and reduce heat to medium-low.",
        "Cook for 5-7 minutes, stirring occasionally.",
        "Top with banana, berries, honey, and chia seeds."
      ]
    },
    lunch: {
      title: "Quinoa Salad Bowl",
      description: "A protein-packed lunch with fresh vegetables and a light dressing.",
      ayurvedicInfo: {
        dosha: "Balances Vata and Pitta, light for Kapha",
        qualities: "Light, dry, cooling, easy to digest",
        benefits: [
          "Supports Pitta dosha with cooling ingredients",
          "Enhances digestive fire (Agni)",
          "Provides sustained energy",
          "Detoxifying properties"
        ],
        bestTime: "12-2 PM (Pitta time of day)",
        spices: "Cumin, coriander, fennel (aids digestion)"
      },
      modernNutrition: {
        calories: 420,
        protein: "18g",
        carbs: "55g",
        fat: "15g",
        fiber: "12g",
        keyNutrients: [
          "Complete plant-based protein",
          "Rich in iron and magnesium",
          "High in fiber and antioxidants",
          "Source of healthy omega-3s"
        ]
      },
      ingredients: [
        "1/2 cup cooked quinoa",
        "1 cup mixed greens",
        "1/4 avocado, diced",
        "1/4 cup cherry tomatoes, halved",
        "1/4 cup cucumber, diced",
        "2 tbsp feta cheese",
        "1 tbsp olive oil",
        "1 tbsp lemon juice"
      ],
      instructions: [
        "Combine all vegetables and quinoa in a bowl.",
        "Whisk together olive oil, lemon juice, salt, and pepper.",
        "Drizzle dressing over the salad and toss to combine.",
        "Top with feta cheese and serve."
      ]
    },
    dinner: {
      title: "Grilled Salmon with Vegetables",
      description: "A light yet satisfying dinner rich in omega-3s and fiber.",
      ayurvedicInfo: {
        dosha: "Balances Vata, good for Kapha, use in moderation for Pitta",
        qualities: "Heavy, oily, nourishing, building",
        benefits: [
          "Nourishes all Dhatus (tissues)",
          "Supports nervous system",
          "Promotes Ojas (vital essence)",
          "Strengthens reproductive system"
        ],
        bestTime: "6-8 PM (Vata time of day)",
        spices: "Turmeric, black pepper, ginger (aids digestion)"
      },
      modernNutrition: {
        calories: 480,
        protein: "35g",
        carbs: "30g",
        fat: "25g",
        omega3: "2.5g",
        keyNutrients: [
          "Excellent source of Omega-3 fatty acids",
          "High in Vitamin D and B12",
          "Rich in selenium and potassium",
          "Anti-inflammatory properties"
        ]
      },
      ingredients: [
        "1 salmon fillet (6oz)",
        "1 cup mixed vegetables (broccoli, carrots, bell peppers)",
        "1 tbsp olive oil",
        "1/2 lemon, sliced",
        "1 clove garlic, minced",
        "1/2 tsp dried herbs",
        "Salt and pepper to taste"
      ],
      instructions: [
        "Preheat grill to medium-high heat.",
        "Season salmon with salt, pepper, and herbs.",
        "Toss vegetables with olive oil, garlic, salt, and pepper.",
        "Grill salmon for 4-5 minutes per side.",
        "Grill vegetables until tender, about 8-10 minutes.",
        "Serve with lemon wedges."
      ]
    }
  };

  // Define the week data with proper typing
  const week = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const todayShort = today.toLocaleDateString('en-US', { weekday: 'short' });
    
    return days.map((day, idx) => {
      const date = new Date(today);
      // Start the week from Sunday
      const dayOffset = currentDay; // 0 = Sunday, 1 = Monday, etc.
      date.setDate(today.getDate() - dayOffset + idx);
      
      return {
        day,
        date: date.getDate(),
        month: date.getMonth() + 1,
        monthName: date.toLocaleString('default', { month: 'short' }),
        calories: 1800 + Math.round(Math.random() * 1000),
        water: 1000 + Math.round(Math.random() * 2000),
        goal: 2200,
        isToday: day === todayShort,
        fullDate: date
      };
    });
  }, []);

  // Debug: Log the chart data
  console.log('Chart data:', week);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full mx-auto space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Tracking</h1>
            <p className="text-gray-600 mt-1">Monitor your daily wellness progress</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sky-600 mb-2">{progress.waterMl}<span className="text-lg text-gray-500">/{progress.waterGoalMl} ml</span></div>
              <Progress value={Math.round(progress.waterMl / progress.waterGoalMl * 100)} className="mb-4 h-2" />
              <div className="text-sm text-emerald-600 mb-3">↑ {Math.round(progress.waterMl / progress.waterGoalMl * 100)}% of daily goal</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateWater(250)} className="text-xs">+250ml</Button>
                <Button size="sm" variant="outline" onClick={() => updateWater(500)} className="text-xs">+500ml</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 mb-2">{progress.mealsTaken}<span className="text-lg text-gray-500">/{progress.mealsPlanned}</span></div>
              <div className="text-sm text-emerald-600 mb-3">↑ {Math.round(progress.mealsTaken / progress.mealsPlanned * 100)}% completed</div>
              <Button size="sm" onClick={markMealTaken} className="bg-emerald-500 hover:bg-emerald-600">Mark Meal</Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Smart Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Switch checked={reminders} onCheckedChange={setReminders} />
                <div className="text-sm text-gray-600">Auto notifications</div>
              </div>
              {notif && (
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
                  <div className="font-medium text-sky-800">💧 Hydration Reminder</div>
                  <div className="mt-1 text-sky-700">{notif}</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => { updateWater(250); setNotif(null); }} className="bg-sky-500 hover:bg-sky-600 text-xs">Done</Button>
                    <Button size="sm" variant="outline" onClick={() => setNotif(null)} className="text-xs">Later</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Weekly Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 leading-relaxed">
                🎯 Hydration improving steadily this week. Keep warm meals and avoid iced drinks in the evening for better results.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                Daily Hydration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={week} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `${value}ml`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="water" 
                      stroke="#06b6d4" 
                      strokeWidth={2} 
                      fill="url(#waterGradient)" 
                      activeDot={{ r: 6, fill: '#0891b2' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                      formatter={(value: number) => [`${value} ml`, 'Water']}
                      labelFormatter={(label) => label}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                Daily Calorie Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Calorie Intake (Last 7 Days)</div>
                <div className="h-[calc(100%-1.5rem)] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={week} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#f97316" 
                        strokeWidth={2} 
                        fill="url(#calorieGradient)" 
                        activeDot={{ r: 6, fill: '#ea580c' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '0.5rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        formatter={(value: number) => [`${value} kcal`, 'Calories']}
                        labelFormatter={(label) => label}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-gray-600">Calories</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Diet Plan Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Weekly Diet Plan</h2>
              <p className="text-gray-500 text-sm mt-1">Your personalized meal plan for the week</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <span className="text-blue-600 text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          {/* Day Selector */}
          <div className="relative">
            <div className="flex gap-2 mb-8 pb-2 overflow-x-auto">
              {week.map(({ day, date, monthName, isToday }, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-200 min-w-[75px] relative group ${
                    selectedDayIndex === idx
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    selectedDayIndex === idx ? 'text-blue-50' : 'text-gray-500'
                  }`}>
                    {day}
                  </span>
                  <span className={`mt-0.5 text-lg font-semibold ${
                    selectedDayIndex === idx ? 'text-white' : 'text-gray-800'
                  }`}>
                    {date}
                  </span>
                  <span className={`text-xs mt-0.5 ${
                    selectedDayIndex === idx ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {monthName}
                  </span>
                  {isToday && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border-2 border-white"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Cards */}
          <motion.div 
            key={selectedDayIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              {week[selectedDayIndex].day}, {week[selectedDayIndex].monthName} {week[selectedDayIndex].date}'s Meals
            </h3>
            
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(weeklyMealPlan[selectedDayIndex].meals)
                .filter(([mealType]) => mealType !== 'snack')
                .map(([mealType, description]) => (
                <div 
                  key={mealType}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 capitalize">{mealType}</h4>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Utensils className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {description}
                    </p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        {mealType === 'breakfast' ? '8:00 AM' : 
                         mealType === 'lunch' ? '1:00 PM' : '8:00 PM'}
                      </span>
                      <button 
                        onClick={() => setSelectedMeal({ 
  type: mealType as MealType, 
  details: mealDetails[mealType as MealType] 
})}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Meal Details Modal */}
        <AnimatePresence>
          {selectedMeal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 capitalize">{selectedMeal.details.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedMeal.details.description}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedMeal(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8 mt-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Modern Nutrition
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Calories</span>
                            <span className="font-medium">{selectedMeal.details.modernNutrition.calories}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Protein</span>
                            <span className="font-medium">{selectedMeal.details.modernNutrition.protein}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Carbs</span>
                            <span className="font-medium">{selectedMeal.details.modernNutrition.carbs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fat</span>
                            <span className="font-medium">{selectedMeal.details.modernNutrition.fat}</span>
                          </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Key Nutrients:</h5>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {selectedMeal.details.modernNutrition.keyNutrients.map((nutrient: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="text-blue-500 mr-1.5">•</span>
                                {nutrient}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Ayurvedic Perspective
                        </h4>
                        <div className="bg-amber-50 rounded-lg p-4 mb-6">
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Dosha: </span>
                              <span className="text-sm text-gray-800">{selectedMeal.details.ayurvedicInfo.dosha}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Qualities: </span>
                              <span className="text-sm text-gray-800">{selectedMeal.details.ayurvedicInfo.qualities}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Best Time: </span>
                              <span className="text-sm text-gray-800">{selectedMeal.details.ayurvedicInfo.bestTime}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Recommended Spices: </span>
                              <span className="text-sm text-gray-800">{selectedMeal.details.ayurvedicInfo.spices}</span>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Benefits:</h5>
                              <ul className="text-xs text-gray-700 space-y-1">
                                {selectedMeal.details.ayurvedicInfo.benefits.map((benefit: string, i: number) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-amber-500 mr-1.5">•</span>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Ingredients
                      </h4>
                      <ul className="space-y-2">
                        {selectedMeal.details.ingredients.map((ingredient: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span className="text-gray-700">{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        Instructions
                      </h4>
                      <ol className="space-y-3">
                        {selectedMeal.details.instructions.map((step: string, i: number) => (
                          <li key={i} className="flex">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-medium mr-3">
                              {i + 1}
                            </span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
