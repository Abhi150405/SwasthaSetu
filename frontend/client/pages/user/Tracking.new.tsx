import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Icons
import { 
  Droplet, 
  Flame, 
  Activity, 
  Moon,
  Utensils,
  CheckCircle2,
  Clock as ClockIcon,
  TrendingUp,
  CheckCircle
} from "lucide-react";

// Recharts components
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid
} from "recharts";

// Types
type GoalStatus = 'active' | 'in-progress' | 'consistent' | 'on-track';

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: GoalStatus;
  icon: React.ReactNode;
}

interface Meal {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyData {
  day: string;
  water: number;
  calories: number;
  steps: number;
  sleep: number;
}

// Constants
const WATER_GOAL = 2500; // ml
const CALORIE_GOAL = 2000; // kCal
const STEPS_GOAL = 10000;
const SLEEP_GOAL = 8; // hours

// Color scheme
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  accent: '#8b5cf6',
} as const;

const Tracking = () => {
  // State
  const [water, setWater] = useState(1200);
  const [calories, setCalories] = useState(1450);
  const [steps, setSteps] = useState(7243);
  const [sleep, setSleep] = useState(6.5);
  const [mealsTaken, setMealsTaken] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const mealsPlanned = 3;

  // Sample data
  const goals = [
    { id: '1', title: 'Drink 8 glasses of water daily', progress: 75, status: 'on-track' as const, icon: <Droplet className="h-4 w-4" /> },
    { id: '2', title: 'Walk 10,000 steps', progress: 60, status: 'in-progress' as const, icon: <Activity className="h-4 w-4" /> },
    { id: '3', title: 'Sleep 8 hours', progress: 45, status: 'active' as const, icon: <Moon className="h-4 w-4" /> },
  ];

  // Calculate progress percentages
  const waterProgress = Math.min(Math.round((water / WATER_GOAL) * 100), 100);
  const caloriesProgress = Math.min(Math.round((calories / CALORIE_GOAL) * 100), 100);
  const stepsProgress = Math.min(Math.round((steps / STEPS_GOAL) * 100), 100);
  const sleepProgress = Math.min(Math.round((sleep / SLEEP_GOAL) * 100), 100);

  // Generate weekly data
  const week = useMemo(() => 
    Array.from({ length: 7 }).map((_, i) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      water: 1200 + Math.round(Math.random() * 1300),
      calories: 1200 + Math.round(Math.random() * 1600),
      steps: 3000 + Math.round(Math.random() * 9000),
      sleep: 4 + Math.random() * 5
    })),
    []
  );

  // Helper functions
  const updateWater = (amount: number) => {
    setWater(prev => Math.max(0, prev + amount));
  };

  const markMealAsTaken = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMealsTaken(prev => Math.min(mealsPlanned, prev + 1));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Dashboard</h1>
          <p className="text-muted-foreground">Track your daily health metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Water Intake */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
            <Droplet className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{water}ml</div>
            <p className="text-xs text-muted-foreground">
              {waterProgress}% of daily goal
            </p>
            <Progress value={waterProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Calories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calories}</div>
            <p className="text-xs text-muted-foreground">
              {caloriesProgress}% of daily goal
            </p>
            <Progress value={caloriesProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stepsProgress}% of daily goal
            </p>
            <Progress value={stepsProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep</CardTitle>
            <Moon className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sleep.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {sleepProgress}% of daily goal
            </p>
            <Progress value={sleepProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Progress */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="steps" fill="#10b981" name="Steps" />
                  <Bar dataKey="calories" fill="#f59e0b" name="Calories" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Breakfast</p>
                  <p className="text-sm text-muted-foreground">08:30 AM</p>
                </div>
                <Button size="sm" variant="outline" onClick={markMealAsTaken}>
                  Log Meal
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lunch</p>
                  <p className="text-sm text-muted-foreground">12:30 PM</p>
                </div>
                <Button size="sm" variant="outline" onClick={markMealAsTaken}>
                  Log Meal
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dinner</p>
                  <p className="text-sm text-muted-foreground">07:30 PM</p>
                </div>
                <Button size="sm" variant="outline" onClick={markMealAsTaken}>
                  Log Meal
                </Button>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Meals Logged</p>
                <p className="text-sm">
                  {mealsTaken}/{mealsPlanned}
                </p>
              </div>
              <Progress value={(mealsTaken / mealsPlanned) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Tracking;
