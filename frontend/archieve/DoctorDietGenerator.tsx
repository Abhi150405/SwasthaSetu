import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// PDF libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Minimal inline spinner (Tailwind)
const Spinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent align-middle" />
);

type Meal = {
  type: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins: string[];
  ayur: { rasa: string; virya: string; vipaka: string; guna: string[] };
};
type DayPlan = { day: string; meals: Meal[] };

export default function DoctorDietGenerator() {
  const { requests } = useAppState();
  const navigate = useNavigate();

  // Steps: 1=ID, 2=Inputs, 3=Output
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 - Patient
  const [patientId, setPatientId] = useState("");
  const search = new URLSearchParams(location.search);
  const pid = search.get("pid") || "";
  useEffect(() => {
    if (pid) setPatientId(pid);
  }, [pid]);

  useEffect(() => {
    if (pid && patientId && !fetchedName && !fetchError) {
      fetchPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, patientId]);

  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchPatient = () => {
    const q = patientId.trim().toLowerCase();
    const match = requests.find(
      (r) =>
        r.userId.toLowerCase() === q ||
        (r.patientName || "").toLowerCase().includes(q),
    );
    if (match) {
      setFetchedName(match.patientName || `Patient ${match.userId}`);
      setFetchError(null);
      setConfirmOpen(true);
    } else {
      setFetchedName(null);
      setFetchError("No patient found. Try full ID or part of the name.");
      setConfirmOpen(false);
    }
  };

  // Existing inputs
  const [cuisine, setCuisine] = useState("Indian");
  const [veg, setVeg] = useState(true);
  const [activity, setActivity] = useState<"Low" | "Moderate" | "High">(
    "Moderate",
  );
  const [restrictions, setRestrictions] = useState<string[]>([]);

  // Professional intake fields
  const [dietPattern, setDietPattern] = useState<
    "Vegetarian" | "Non-Vegetarian" | "Eggitarian" | "Vegan" | "Jain"
  >(veg ? "Vegetarian" : "Non-Vegetarian");

  const [mealFrequency, setMealFrequency] = useState<
    "2" | "3" | "4" | "variable"
  >("3");
  const [mealRegularity, setMealRegularity] = useState<"Regular" | "Irregular">(
    "Regular",
  );

  const [fluidIntakeL, setFluidIntakeL] = useState<string>("2.0");

  const [sleepQuality, setSleepQuality] = useState<"Good" | "Fair" | "Poor">(
    "Fair",
  );
  const [sleepRegularity, setSleepRegularity] = useState<
    "Consistent" | "Variable"
  >("Consistent");
  const [showSleepDetails, setShowSleepDetails] = useState(false);
  const [sleepBed, setSleepBed] = useState<string>("22:30");
  const [sleepWake, setSleepWake] = useState<string>("06:30");

  const [agni, setAgni] = useState<"Strong" | "Moderate" | "Mild" | "Variable">(
    "Moderate",
  );
  const [postprandialHeaviness, setPostprandialHeaviness] = useState(false);
  const [postprandialSomnolence, setPostprandialSomnolence] = useState(false);
  const [bowelRegularity, setBowelRegularity] = useState<
    "Regular" | "Irregular"
  >("Regular");
  const [bowelFrequency, setBowelFrequency] = useState<
    "2-3/day" | "1/day" | "<1/3days" | "Variable"
  >("1/day");

  const [notes, setNotes] = useState("");

  const onVegToggle = (v: boolean) => {
    setVeg(v);
    setDietPattern(v ? "Vegetarian" : "Non-Vegetarian");
  };

  // Recommendation
  const recommend = useMemo(() => {
    const water = activity === "High" ? 3 : activity === "Moderate" ? 2.5 : 2;
    const calories =
      activity === "High" ? 2600 : activity === "Moderate" ? 2200 : 1800;
    return { water, calories };
  }, [activity]);

  // Mock generator helpers
  const sampleByCuisine = (
    type: Meal["type"],
    isVeg: boolean,
    cui: string,
  ): string => {
    const base: Record<string, Record<string, string[]>> = {
      Indian: {
        Breakfast: ["Warm Spiced Oats", "Poha"],
        Lunch: [
          isVeg ? "Moong Dal Khichdi" : "Chicken Curry + Rice",
          "Veg Thali",
        ],
        Dinner: [
          isVeg ? "Millet Roti + Veg" : "Grilled Fish + Veg",
          "Dal + Rice",
        ],
        Snacks: ["Fruit + Nuts", "Herbal Tea"],
      },
      Mediterranean: {
        Breakfast: [
          isVeg ? "Greek Yogurt + Fruit" : "Egg Omelette",
          "Avocado Toast",
        ],
        Lunch: [
          isVeg ? "Chickpea Salad" : "Grilled Chicken Salad",
          "Pasta Primavera",
        ],
        Dinner: [isVeg ? "Veg Mezze Bowl" : "Baked Salmon", "Lentil Stew"],
        Snacks: ["Hummus + Veg", "Olives + Nuts"],
      },
      Continental: {
        Breakfast: [isVeg ? "Pancakes" : "Scrambled Eggs", "Granola Bowl"],
        Lunch: [isVeg ? "Veg Sandwich" : "Turkey Sandwich", "Tomato Soup"],
        Dinner: [isVeg ? "Veg Pasta" : "Steak + Mash", "Risotto"],
        Snacks: ["Trail Mix", "Fruit Bowl"],
      },
    };
    const pool = (base[cui] || base["Indian"])[type];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const macros = (kcal: number) => ({
    protein: Math.round((kcal * 0.2) / 4),
    carbs: Math.round((kcal * 0.55) / 4),
    fat: Math.round((kcal * 0.25) / 9),
  });

  const generatePlan = (): DayPlan[] => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d) => {
      const meals: Meal[] = ["Breakfast", "Lunch", "Dinner", "Snacks"].map(
        (t) => {
          const name = sampleByCuisine(t as Meal["type"], veg, cuisine);
          const baseKcal =
            t === "Breakfast"
              ? 400
              : t === "Lunch"
                ? 600
                : t === "Dinner"
                  ? 550
                  : 200;
          const m: Meal = {
            type: t as Meal["type"],
            name,
            calories: baseKcal,
            ...macros(baseKcal),
            vitamins: ["A", "B", "C"],
            ayur: {
              rasa: "Madhura",
              virya: "Ushna",
              vipaka: "Madhura",
              guna: ["Sattvic", "Light"],
            },
          };
          if (restrictions.includes("nuts") && /nut|nuts/i.test(name))
            m.name = name.replace(/\+?\s*\bNuts\b/i, "").trim();
          if (
            restrictions.includes("dairy") &&
            /yogurt|paneer|curd|milk/i.test(name)
          )
            m.name = "Dairy-free Bowl";
          if (!veg && /Veg\b/i.test(name))
            m.name = name.replace(/Veg\s*/i, "").trim();
          return m;
        },
      );
      return { day: d, meals };
    });
  };

  const [plan, setPlan] = useState<DayPlan[] | null>(null);

  // Loading/generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setHasGenerated(false);
    timeoutRef.current = window.setTimeout(() => {
      const newPlan = generatePlan(); // mock
      setPlan(newPlan);
      setIsGenerating(false);
      setHasGenerated(true);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // PDF export
  const exportPdf = () => {
    if (!plan) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("7-Day Diet Plan", 14, 20);

    const head = [["Day", "Breakfast", "Lunch", "Dinner", "Snacks"]];
    const body = plan.map((d) => [
      d.day,
      d.meals.find((m) => m.type === "Breakfast")?.name || "",
      d.meals.find((m) => m.type === "Lunch")?.name || "",
      d.meals.find((m) => m.type === "Dinner")?.name || "",
      d.meals.find((m) => m.type === "Snacks")?.name || "",
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    let y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("Meal Details", 14, y);
    y += 8;

    doc.setFontSize(10);

    plan.forEach((d) => {
      doc.setFont(undefined, "bold");
      doc.text(`Day ${d.day}`, 14, y);
      y += 6;

      d.meals.forEach((meal) => {
        doc.setFont(undefined, "bold");
        doc.text(`${meal.type}: ${meal.name}`, 18, y);
        y += 5;

        doc.setFont(undefined, "normal");
        doc.text(
          `Calories: ${meal.calories} kcal | Protein: ${meal.protein} g | Carbs: ${meal.carbs} g | Fat: ${meal.fat} g`,
          22,
          y,
        );
        y += 5;

        doc.text(`Vitamins: ${meal.vitamins.join(", ")}`, 22, y);
        y += 5;

        doc.text(
          `Ayur: Rasa ${meal.ayur.rasa}, Virya ${meal.ayur.virya}, Vipaka ${meal.ayur.vipaka}, Guna ${meal.ayur.guna.join(", ")}`,
          22,
          y,
        );
        y += 8;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      y += 4;
    });

    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont(undefined, "bold");
    doc.text("Recommendations", 14, y);
    y += 6;
    doc.setFont(undefined, "normal");
    doc.text(`Water Intake: ${recommend.water} liters/day`, 18, y);
    y += 5;
    doc.text(`Daily Calories: ${recommend.calories} kcal`, 18, y);

    doc.save("diet-plan.pdf");
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  // Visibility
  const showInputs = step >= 2 && !isGenerating && !hasGenerated;
  const showLoading = isGenerating;
  const showOutput = hasGenerated && plan;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Diet Plan Generator
            </h1>
            <p className="text-muted-foreground">
              Search by Patient ID or Name to verify the patient, then proceed.
            </p>
          </div>
          <div className="w-48">
            <Progress value={progress} />
          </div>
        </div>
      </div>

      {/* Patient Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Identification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="Enter Patient ID or Name"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchPatient();
              }}
              disabled={step >= 2}
            />
            <Button onClick={fetchPatient} disabled={!patientId || step >= 2}>
              Fetch Patient
            </Button>
          </div>
          {fetchError && (
            <div className="mt-3 text-sm text-destructive">{fetchError}</div>
          )}
          {fetchedName && (
            <div className="mt-3 rounded-md border bg-secondary/30 p-3">
              <div className="font-medium">{fetchedName}</div>
              <div className="mt-2 text-sm">Is this the correct patient?</div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setStep(2);
                    setConfirmOpen(false);
                  }}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFetchedName(null);
                    setPatientId("");
                    setConfirmOpen(false);
                  }}
                >
                  No
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inputs */}
      {showInputs && (
        <Card>
          <CardHeader>
            <CardTitle>Diet Plan Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">
                    Dietary profile
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Usual dietary pattern</Label>
                      <Select
                        value={dietPattern}
                        onValueChange={(v) => setDietPattern(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="Non-Vegetarian">
                            Non-Vegetarian
                          </SelectItem>
                          <SelectItem value="Eggitarian">Eggitarian</SelectItem>
                          <SelectItem value="Vegan">Vegan</SelectItem>
                          <SelectItem value="Jain">Jain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-3">
                      <Switch
                        checked={veg}
                        onCheckedChange={onVegToggle}
                        id="veg"
                      />
                      <Label htmlFor="veg" className="text-sm">
                        {veg ? "Vegetarian" : "Non-Vegetarian"}
                      </Label>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-2 block text-xs">
                      Food restrictions
                    </Label>
                    <ToggleGroup
                      type="multiple"
                      value={restrictions}
                      onValueChange={setRestrictions}
                      className="flex flex-wrap gap-2"
                    >
                      {["dairy", "gluten", "nuts", "sugar"].map((tag) => (
                        <ToggleGroupItem
                          key={tag}
                          value={tag}
                          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                          {tag}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  <div className="mt-3">
                    <Label className="mb-2 block text-xs">
                      Preferred cuisine
                    </Label>
                    <Select value={cuisine} onValueChange={setCuisine}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Mediterranean">
                          Mediterranean
                        </SelectItem>
                        <SelectItem value="Continental">Continental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">Meal pattern</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">
                        Meal frequency (per day)
                      </Label>
                      <Select
                        value={mealFrequency}
                        onValueChange={(v) => setMealFrequency(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 meals/day</SelectItem>
                          <SelectItem value="3">3 meals/day</SelectItem>
                          <SelectItem value="4">4 meals/day</SelectItem>
                          <SelectItem value="variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Meal regularity</Label>
                      <Select
                        value={mealRegularity}
                        onValueChange={(v) => setMealRegularity(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Irregular">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Aim for consistent meal timing and adequate gaps between
                    meals to support digestion.
                  </p>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">Hydration</div>
                  <Label className="text-xs">
                    Average daily fluid intake (liters)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={fluidIntakeL}
                    onChange={(e) => setFluidIntakeL(e.target.value)}
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">
                    Sleep and recovery
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Sleep quality</Label>
                      <Select
                        value={sleepQuality}
                        onValueChange={(v) => setSleepQuality(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Sleep regularity</Label>
                      <Select
                        value={sleepRegularity}
                        onValueChange={(v) => setSleepRegularity(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consistent">Consistent</SelectItem>
                          <SelectItem value="Variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSleepDetails((s) => !s)}
                    >
                      {showSleepDetails
                        ? "Hide sleep time details"
                        : "Add sleep time details"}
                    </Button>
                    {showSleepDetails && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="sleepBed" className="text-xs">
                            Habitual bedtime
                          </Label>
                          <Input
                            id="sleepBed"
                            type="time"
                            value={sleepBed}
                            onChange={(e) => setSleepBed(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sleepWake" className="text-xs">
                            Habitual wake time
                          </Label>
                          <Input
                            id="sleepWake"
                            type="time"
                            value={sleepWake}
                            onChange={(e) => setSleepWake(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-sm font-medium">
                    Gastrointestinal function
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">
                        Agni (digestive function)
                      </Label>
                      <Select
                        value={agni}
                        onValueChange={(v) => setAgni(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Agni" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Strong">Strong</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Mild">Mild</SelectItem>
                          <SelectItem value="Variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Bowel regularity</Label>
                      <Select
                        value={bowelRegularity}
                        onValueChange={(v) => setBowelRegularity(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Regular">Regular</SelectItem>
                          <SelectItem value="Irregular">Irregular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Bowel frequency</Label>
                      <Select
                        value={bowelFrequency}
                        onValueChange={(v) => setBowelFrequency(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2-3/day">2–3 times/day</SelectItem>
                          <SelectItem value="1/day">Once/day</SelectItem>
                          <SelectItem value="<1/3days">
                            Less than once/3 days
                          </SelectItem>
                          <SelectItem value="Variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="ppHeavy"
                        checked={postprandialHeaviness}
                        onCheckedChange={setPostprandialHeaviness}
                      />
                      <Label htmlFor="ppHeavy" className="text-sm">
                        Postprandial heaviness
                      </Label>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Switch
                      id="ppSleepy"
                      checked={postprandialSomnolence}
                      onCheckedChange={setPostprandialSomnolence}
                    />
                    <Label htmlFor="ppSleepy" className="text-sm">
                      Postprandial somnolence
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Additional notes</div>
              <Textarea
                placeholder="Allergies, current diagnoses, medications, weight/appetite changes, goals, cultural/religious considerations, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Consider capturing a separate 24-hour dietary recall for
                detailed intake, if required.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Generates a 7-day plan aligned with stated preferences and
                clinical context.
              </div>
              <Button className="mb-2" onClick={handleGenerate}>
                Generate Diet Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {showLoading && (
        <div className="flex h-48 items-center justify-center rounded-lg border">
          <div className="flex items-center gap-2 text-sm">
            <Spinner />
            <span>Generating...</span>
          </div>
        </div>
      )}

      {/* Output */}
      {showOutput && (
        <Card>
          <CardHeader>
            <CardTitle>Diet Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex justify-end">
              <Button variant="outline" onClick={exportPdf}>
                Export PDF
              </Button>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Breakfast</TableHead>
                    <TableHead>Lunch</TableHead>
                    <TableHead>Dinner</TableHead>
                    <TableHead>Snacks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan!.map((d, idx) => (
                    <TableRow
                      key={d.day}
                      className={idx % 2 ? "bg-muted/30" : undefined}
                    >
                      <TableCell className="font-medium">{d.day}</TableCell>
                      {["Breakfast", "Lunch", "Dinner", "Snacks"].map((t) => {
                        const meal = d.meals.find((m) => m.type === t)!;
                        return (
                          <TableCell key={t}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default rounded px-1.5 py-0.5 hover:bg-muted/60 transition-colors">
                                  {meal.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs text-xs">
                                  <div className="font-medium">{meal.name}</div>
                                  <div>Calories: {meal.calories} kcal</div>
                                  <div>
                                    Protein: {meal.protein} g • Carbs:{" "}
                                    {meal.carbs} g • Fat: {meal.fat} g
                                  </div>
                                  <div>
                                    Vitamins: {meal.vitamins.join(", ")}
                                  </div>
                                  <div>
                                    Ayur: Rasa {meal.ayur.rasa}, Virya{" "}
                                    {meal.ayur.virya}, Vipaka {meal.ayur.vipaka}
                                    , Guna {meal.ayur.guna.join(", ")}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 rounded-lg border p-4 text-sm">
              <div>
                Recommended Water Intake per Day:{" "}
                <span className="font-medium">{recommend.water} liters</span>
              </div>
              <div>
                Recommended Daily Calories:{" "}
                <span className="font-medium">{recommend.calories} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Patient confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm patient</DialogTitle>
            <DialogDescription>
              {fetchedName
                ? `Is this the correct patient: ${fetchedName}?`
                : "No patient selected."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                setStep(2);
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
