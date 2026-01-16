import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import PatientVerification from "@/components/doctor/dietPlan/PatientVerification";
import DietQuiz from "@/components/doctor/dietPlan/DietQuiz";
import { Progress } from "@/components/ui/progress";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, X, ArrowLeft, Leaf, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

// PDF imports
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Meal = {
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins: string[];
  ayur: { dosha?: string; rasa: string; properties: string[] };
};

type DayPlan = { day: string; meals: Meal[] };

type Food = {
  name: string;
  type: Meal["type"];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ayur: { dosha?: string; rasa: string; properties: string[] };
};

const FOOD_DB: Food[] = [
  {
    name: "Moong Dal Khichdi",
    type: "Lunch",
    calories: 450,
    protein: 18,
    carbs: 78,
    fat: 8,
    ayur: {
      dosha: "Tridoshic",
      rasa: "Madhura",
      properties: ["Light", "Sattvic"],
    },
  },
  {
    name: "Oats with Fruits",
    type: "Breakfast",
    calories: 350,
    protein: 12,
    carbs: 60,
    fat: 8,
    ayur: { dosha: "Pitta", rasa: "Madhura", properties: ["Cooling"] },
  },
  {
    name: "Grilled Paneer Salad",
    type: "Dinner",
    calories: 420,
    protein: 25,
    carbs: 30,
    fat: 18,
    ayur: { dosha: "Kapha", rasa: "Madhura", properties: ["Light"] },
  },
  {
    name: "Herbal Tea + Nuts",
    type: "Snack",
    calories: 180,
    protein: 6,
    carbs: 12,
    fat: 10,
    ayur: { dosha: "Vata", rasa: "Kashaya", properties: ["Warm"] },
  },
  {
    name: "Chicken Curry with Rice",
    type: "Lunch",
    calories: 600,
    protein: 28,
    carbs: 80,
    fat: 18,
    ayur: { dosha: "Pitta", rasa: "Madhura", properties: ["Sattvic"] },
  },
  {
    name: "Steamed Veg + Ghee",
    type: "Dinner",
    calories: 420,
    protein: 10,
    carbs: 45,
    fat: 16,
    ayur: { dosha: "Vata", rasa: "Madhura", properties: ["Grounding"] },
  },
  {
    name: "Idli Sambhar",
    type: "Breakfast",
    calories: 320,
    protein: 10,
    carbs: 60,
    fat: 6,
    ayur: { dosha: "Tridoshic", rasa: "Amla", properties: ["Light"] },
  },
  {
    name: "Curd Rice",
    type: "Lunch",
    calories: 500,
    protein: 12,
    carbs: 85,
    fat: 12,
    ayur: { dosha: "Pitta", rasa: "Amla", properties: ["Cooling"] },
  },
];

export default function DoctorDietGenerator() {
  const { requests, setRequests } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  // Get patient details from URL parameters
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || "";
  const patientName = searchParams.get("patientName")
    ? decodeURIComponent(searchParams.get("patientName") || "")
    : "";
  const dosha = searchParams.get("dosha") || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fetchedName, setFetchedName] = useState<string | null>(
    patientName || null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(!!patientId);
  const [patientQuery, setPatientQuery] = useState<string>(patientName || "");
  const [foundDosha, setFoundDosha] = useState<string>(dosha || "");

  // Auto-advance to step 2 if patient is confirmed
  useEffect(() => {
    if (confirmed && step === 1) {
      setStep(2);
    }
  }, [confirmed, step]);

  // Quiz inputs
  const [cuisine, setCuisine] = useState("Indian");
  const [veg, setVeg] = useState(true);
  const [activity, setActivity] = useState<"Low" | "Moderate" | "High">(
    "Moderate",
  );
  const [restrictions, setRestrictions] = useState<string[]>([]);

  // Plan data
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [detail, setDetail] = useState<{ di: number; mi: number } | null>(null);

  // Editing and search state
  const [editing, setEditing] = useState<{ di: number; mi: number } | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FOOD_DB.slice(0, 6);
    return FOOD_DB.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (f.ayur.dosha || "").toLowerCase().includes(q),
    ).slice(0, 10);
  }, [search]);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  // Fetch patient details from global requests when query or URL changes
  useEffect(() => {
    const q = (patientName || patientQuery || "").trim().toLowerCase();
    if (!q && !patientId) return;
    const match = requests.find(
      (r) =>
        r.id === patientId ||
        r.userId.toLowerCase() === q ||
        (r.patientName || "").toLowerCase().includes(q),
    );
    if (match) {
      setFetchedName(
        match.patientName ||
          (patientName ? decodeURIComponent(patientName) : "Patient"),
      );
      setFoundDosha((match.patientDosha as string) || foundDosha);
      setFetchError(null);
    } else if (q || patientId) {
      setFetchError("No patient found. Try full ID or part of the name.");
    }
  }, [patientId, patientName, patientQuery, requests]);

  const recommend = useMemo(() => {
    const water =
      activity === "High" ? 3000 : activity === "Moderate" ? 2500 : 2000;
    const calories =
      activity === "High" ? 2600 : activity === "Moderate" ? 2200 : 1800;
    return { water, calories };
  }, [activity]);

  const generatePlan = (): DayPlan[] => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      return {
        day: dateStr,
        meals: [
          {
            type: "Breakfast",
            name: "Oats with Fruits",
            calories: 350,
            protein: 12,
            carbs: 60,
            fat: 8,
            vitamins: ["B1", "C"],
            ayur: {
              dosha: "Pitta",
              rasa: "Madhura",
              properties: ["Light", "Cooling"],
            },
          },
          {
            type: "Lunch",
            name: veg ? "Moong Dal Khichdi" : "Chicken Curry with Rice",
            calories: veg ? 450 : 600,
            protein: veg ? 18 : 28,
            carbs: veg ? 78 : 80,
            fat: veg ? 8 : 18,
            vitamins: ["A", "B12"],
            ayur: {
              dosha: veg ? "Tridoshic" : "Pitta",
              rasa: "Madhura",
              properties: ["Sattvic"],
            },
          },
          {
            type: "Dinner",
            name: "Steamed Veg + Ghee",
            calories: 420,
            protein: 10,
            carbs: 45,
            fat: 16,
            vitamins: ["E"],
            ayur: {
              dosha: "Vata",
              rasa: "Madhura",
              properties: ["Grounding"],
            },
          },
        ],
      };
    });
  };

  const stats = useMemo(() => {
    if (!plan) return { perDay: [], avgCal: 0 };
    const perDay = plan.map((d) => ({
      date: d.day,
      calories: d.meals.reduce(
        (s: number, m: Meal) => s + (m.calories || 0),
        0,
      ),
    }));
    const avgCal = perDay.length
      ? Math.round(perDay.reduce((s, x) => s + x.calories, 0) / perDay.length)
      : 0;
    return { perDay, avgCal };
  }, [plan]);

  // PDF Export Function
  const exportToPDF = () => {
    if (!plan || !fetchedName) {
      alert('No plan or patient data available to export');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Personalized Diet Plan', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    
    // Patient Information Section
    yPosition += 25;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const patientInfo = [
      ['Patient Name:', fetchedName || 'N/A'],
      ['Dosha Type:', foundDosha || dosha || 'Not specified'],
      ['Cuisine Preference:', cuisine],
      ['Dietary Type:', veg ? 'Vegetarian' : 'Non-Vegetarian'],
      ['Activity Level:', activity],
      ['Daily Water Goal:', `${recommend.water}ml`],
      ['Daily Calorie Target:', `${recommend.calories} kcal`]
    ];

    patientInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPosition);
      yPosition += 8;
    });

    // Dietary Restrictions
    if (restrictions.length > 0) {
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Dietary Restrictions:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(restrictions.join(', '), 20, yPosition + 8);
      yPosition += 16;
    }

    // Daily Plans Section
    yPosition += 15;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Meal Plans', 20, yPosition);
    yPosition += 15;

    plan.forEach((dayPlan, dayIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Day header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(dayPlan.day, 20, yPosition);
      yPosition += 10;

      // Daily calories
      const dayCal = dayPlan.meals.reduce((sum, meal) => sum + meal.calories, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text(`Total: ${dayCal} kcal`, 20, yPosition);
      yPosition += 15;

      // Meals table
      const mealData = dayPlan.meals.map(meal => [
        meal.type,
        meal.name,
        `${meal.calories} kcal`,
        meal.ayur.dosha || 'N/A',
        meal.ayur.rasa,
        meal.ayur.properties.join(', ')
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Type', 'Meal', 'Calories', 'Dosha', 'Rasa', 'Properties']],
        body: mealData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 45 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 45 }
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    });

    // Nutrition Summary
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Nutrition Summary', 20, yPosition);
    yPosition += 15;

    // Calculate total nutrition across all days
    const totalNutrition = plan.reduce(
      (acc, day) => {
        day.meals.forEach(meal => {
          acc.calories += meal.calories;
          acc.protein += meal.protein;
          acc.carbs += meal.carbs;
          acc.fat += meal.fat;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const avgNutrition = {
      calories: Math.round(totalNutrition.calories / plan.length),
      protein: Math.round(totalNutrition.protein / plan.length),
      carbs: Math.round(totalNutrition.carbs / plan.length),
      fat: Math.round(totalNutrition.fat / plan.length)
    };

    const nutritionData = [
      ['Average Daily Calories', `${avgNutrition.calories} kcal`],
      ['Average Daily Protein', `${avgNutrition.protein}g`],
      ['Average Daily Carbohydrates', `${avgNutrition.carbs}g`],
      ['Average Daily Fat', `${avgNutrition.fat}g`]
    ];

    autoTable(doc, {
      startY: yPosition,
      body: nutritionData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 12,
        cellPadding: 5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 60 }
      },
      margin: { left: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Ayurvedic Guidelines
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ayurvedic Guidelines', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const guidelines = [
      '• Eat in a peaceful environment, free from distractions',
      '• Chew food thoroughly and eat at a moderate pace',
      '• Have your largest meal at midday when digestion is strongest',
      '• Avoid ice-cold drinks; prefer warm or room temperature water',
      '• Allow 3-4 hours between meals for proper digestion',
      '• Practice mindful eating and express gratitude for your food'
    ];

    guidelines.forEach(guideline => {
      const lines = doc.splitTextToSize(guideline, pageWidth - 40);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 6;
    });

    // Footer
    yPosition += 20;
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('This diet plan is generated based on Ayurvedic principles. Please consult with your healthcare provider before making significant dietary changes.', 
      pageWidth / 2, yPosition, { align: 'center', maxWidth: pageWidth - 40 });

    // Page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `Diet_Plan_${fetchedName?.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Diet Plan Generator
          </h1>
          <div className="w-48">
            <Progress value={progress} />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Search by Patient ID or Name to verify the patient, then proceed.
        </p>
      </div>

      {/* Patient Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
          <CardDescription>
            {fetchedName
              ? `Generating diet plan for ${fetchedName}${foundDosha || dosha ? ` (${foundDosha || dosha} dosha)` : ""}`
              : "No patient selected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmed ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Type patient name or ID and search
              </div>
              <PatientVerification
                requests={requests}
                patientId={patientQuery}
                setPatientId={setPatientQuery}
                onVerified={(name) => {
                  setFetchedName(name);
                  setConfirmed(true);
                  const match = requests.find(
                    (r) =>
                      (r.patientName || "").toLowerCase() ===
                      name.toLowerCase(),
                  );
                  if (match && match.patientDosha)
                    setFoundDosha(match.patientDosha as string);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {fetchedName || "Patient"}
                  </span>
                </div>
                {(foundDosha || dosha) && (
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Dosha: {foundDosha || dosha}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmed(false)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change Patient
                </Button>
              </div>
            </div>
          )}

          {fetchError && (
            <div className="mt-3 text-sm text-destructive bg-destructive/5 p-3 rounded-md flex items-center gap-2 border border-destructive/20">
              <X className="h-4 w-4" />
              {fetchError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1 */}
      {step === 1 && (
        <div>{/* Patient verification handled in the card above */}</div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <DietQuiz
            cuisine={cuisine}
            setCuisine={setCuisine}
            veg={veg}
            setVeg={setVeg}
            activity={activity}
            setActivity={setActivity}
            restrictions={restrictions}
            setRestrictions={setRestrictions}
          />
          <div className="flex justify-end">
            <button
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
              disabled={!confirmed}
              onClick={() => {
                setPlan(generatePlan());
                setStep(3);
              }}
            >
              Generate Diet Plan
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && plan && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Diet Plan for {fetchedName || "Patient"} • Avg {stats.avgCal}{" "}
                kcal/day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  cal: { label: "Calories", color: "hsl(var(--primary))" },
                }}
              >
                <BarChart data={stats.perDay}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="calories" fill="var(--color-cal)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-sm text-muted-foreground">
                  Click a meal to edit or replace from search.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPlan((p) =>
                        p
                          ? [...p, { day: `Day ${p.length + 1}`, meals: [] }]
                          : p,
                      )
                    }
                  >
                    Add Day
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToPDF}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => {
                      if (!plan) return;
                      // Save flat plan into matching patient request if found
                      const match = requests.find(
                        (r) =>
                          (r.patientName || "").toLowerCase() ===
                          fetchedName?.trim().toLowerCase(),
                      );
                      if (match) {
                        setRequests(
                          requests.map((r) =>
                            r.id === match.id
                              ? {
                                  ...r,
                                  plan: plan.flatMap((d) =>
                                    d.meals.map((m) => ({
                                      time:
                                        m.type === "Breakfast"
                                          ? "08:00"
                                          : m.type === "Lunch"
                                            ? "12:30"
                                            : m.type === "Snack"
                                              ? "16:00"
                                              : "19:30",
                                      name: m.name,
                                      calories: m.calories,
                                      waterMl:
                                        m.type === "Snack" ? 200 : undefined,
                                    })),
                                  ),
                                }
                              : r,
                          ),
                        );
                        alert("Plan saved to patient");
                      } else {
                        alert(
                          "No matching patient to save plan. Use exact User ID or patient name.",
                        );
                      }
                    }}
                  >
                    Save to Patient
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">kcal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.map((day, di) =>
                      day.meals.map((m, mi) => (
                        <TableRow key={`${day.day}-${mi}`}>
                          {mi === 0 && (
                            <TableCell
                              rowSpan={day.meals.length}
                              className="font-mono text-xs align-top"
                            >
                              {day.day}
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPlan((p) =>
                                      p
                                        ? p.map((d, idx) =>
                                            idx === di
                                              ? {
                                                  ...d,
                                                  meals: [
                                                    ...d.meals,
                                                    {
                                                      type: "Snack",
                                                      name: "Herbal Tea + Nuts",
                                                      calories: 180,
                                                      protein: 6,
                                                      carbs: 12,
                                                      fat: 10,
                                                      vitamins: [],
                                                      ayur: {
                                                        dosha: "Vata",
                                                        rasa: "Kashaya",
                                                        properties: ["Warm"],
                                                      },
                                                    },
                                                  ],
                                                }
                                              : d,
                                          )
                                        : p,
                                    );
                                  }}
                                >
                                  Add Meal
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <Input
                                value={m.name}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPlan((p) =>
                                    p
                                      ? p.map((d, i1) =>
                                          i1 === di
                                            ? {
                                                ...d,
                                                meals: d.meals.map((mm, i2) =>
                                                  i2 === mi
                                                    ? { ...mm, name: v }
                                                    : mm,
                                                ),
                                              }
                                            : d,
                                        )
                                      : p,
                                  );
                                }}
                              />
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="underline-offset-2 hover:underline"
                                    onClick={() => setDetail({ di, mi })}
                                  >
                                    {m.name}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-medium">{m.name}</div>
                                    <div>{m.calories} kcal</div>
                                    <div>Dosha: {m.ayur.dosha}</div>
                                    <div>Rasa: {m.ayur.rasa}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <Select
                                value={m.type}
                                onValueChange={(v) => {
                                  setPlan((p) =>
                                    p
                                      ? p.map((d, i1) =>
                                          i1 === di
                                            ? {
                                                ...d,
                                                meals: d.meals.map((mm, i2) =>
                                                  i2 === mi
                                                    ? {
                                                        ...mm,
                                                        type: v as Meal["type"],
                                                      }
                                                    : mm,
                                                ),
                                              }
                                            : d,
                                        )
                                      : p,
                                  );
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Breakfast">
                                    Breakfast
                                  </SelectItem>
                                  <SelectItem value="Lunch">Lunch</SelectItem>
                                  <SelectItem value="Snack">Snack</SelectItem>
                                  <SelectItem value="Dinner">Dinner</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              m.type
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <Input
                                className="text-right"
                                type="number"
                                value={m.calories}
                                onChange={(e) => {
                                  const v = Math.max(
                                    0,
                                    parseInt(e.target.value || "0", 10),
                                  );
                                  setPlan((p) =>
                                    p
                                      ? p.map((d, i1) =>
                                          i1 === di
                                            ? {
                                                ...d,
                                                meals: d.meals.map((mm, i2) =>
                                                  i2 === mi
                                                    ? { ...mm, calories: v }
                                                    : mm,
                                                ),
                                              }
                                            : d,
                                        )
                                      : p,
                                  );
                                }}
                              />
                            ) : (
                              m.calories
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditing(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setEditing(null)}
                                >
                                  Done
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditing({ di, mi })}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSearch("");
                                    setEditing({ di, mi });
                                    const el =
                                      document.getElementById(
                                        "food-search-input",
                                      );
                                    if (el)
                                      setTimeout(
                                        () => (el as HTMLInputElement).focus(),
                                        0,
                                      );
                                  }}
                                >
                                  Search Food
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setPlan((p) =>
                                      p
                                        ? p.map((d, i1) =>
                                            i1 === di
                                              ? {
                                                  ...d,
                                                  meals: d.meals.filter(
                                                    (_, i2) => i2 !== mi,
                                                  ),
                                                }
                                              : d,
                                          )
                                        : p,
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </div>

              {editing && plan ? (
                <div className="mt-4 rounded-lg border p-3">
                  <div className="mb-2 text-sm font-medium">
                    Search and replace meal
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
                    <Input
                      id="food-search-input"
                      placeholder="Search food (name, type, dosha)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="text-right text-sm text-muted-foreground hidden sm:block">
                      Results: {searchResults.length}
                    </div>
                    <Button variant="outline" onClick={() => setSearch("")}>
                      Clear
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {searchResults.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-md border p-2"
                      >
                        <div>
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {f.type} • {f.calories} kcal • {f.ayur.rasa} •{" "}
                            {f.ayur.properties.join(", ")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const { di, mi } = editing;
                            setPlan((p) =>
                              p
                                ? p.map((d, i1) =>
                                    i1 === di
                                      ? {
                                          ...d,
                                          meals: d.meals.map((mm, i2) =>
                                            i2 === mi
                                              ? {
                                                  ...mm,
                                                  name: f.name,
                                                  type: f.type,
                                                  calories: f.calories,
                                                  protein: f.protein,
                                                  carbs: f.carbs,
                                                  fat: f.fat,
                                                  ayur: f.ayur,
                                                }
                                              : mm,
                                          ),
                                        }
                                      : d,
                                  )
                                : p,
                            );
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Meal details modal */}
          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="sm:max-w-[560px]">
              {detail && (
                <>
                  <DialogHeader>
                    <DialogTitle>Meal Details</DialogTitle>
                    <DialogDescription>
                      Nutrition and Ayurveda properties
                    </DialogDescription>
                  </DialogHeader>
                  {(() => {
                    const m = plan[detail.di].meals[detail.mi];
                    return (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Day
                            </div>
                            <div>{plan[detail.di].day}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Type
                            </div>
                            <div>{m.type}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Calories
                            </div>
                            <div>{m.calories}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Protein (g)
                            </div>
                            <div>{m.protein}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Carbs (g)
                            </div>
                            <div>{m.carbs}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Fat (g)
                            </div>
                            <div>{m.fat}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Vitamins
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.vitamins.map((v: string) => (
                              <Badge key={v} variant="secondary">
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Dosha
                          </div>
                          <div>{m.ayur.dosha}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Rasa
                          </div>
                          <div>{m.ayur.rasa}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Properties
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.ayur.properties.map((p: string) => (
                              <Badge key={p} variant="secondary">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="mt-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}