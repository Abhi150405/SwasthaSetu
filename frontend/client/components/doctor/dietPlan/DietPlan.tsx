import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Meal = { type: string; name: string; calories: number; protein: number; carbs: number; fat: number; vitamins: string[]; ayur: any };
type DayPlan = { day: string; meals: Meal[] };

type Props = {
  patientName: string;
  plan: DayPlan[] | null;
  generatePlan: () => DayPlan[];
  recommend: { water: number; calories: number };
};

export default function DietPlan({ patientName, plan, generatePlan, recommend }: Props) {
  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<DayPlan[] | null>(plan);

  const exportPdf = () => {
    if (!dietPlan) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("7-Day Diet Plan", 14, 20);

    const head = [["Day", "Breakfast", "Lunch", "Dinner", "Snacks"]];
    const body = dietPlan.map((d) => [
      d.day,
      d.meals.find((m) => m.type === "Breakfast")?.name || "",
      d.meals.find((m) => m.type === "Lunch")?.name || "",
      d.meals.find((m) => m.type === "Dinner")?.name || "",
      d.meals.find((m) => m.type === "Snacks")?.name || "",
    ]);

    autoTable(doc, { head, body, startY: 28, styles: { fontSize: 10, cellPadding: 3 }, headStyles: { fillColor: [22, 163, 74] } });

    doc.save("diet-plan.pdf");
  };

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setDietPlan(generatePlan());
      setLoading(false);
    }, 1000);
  };

  if (!dietPlan) {
    return <Button onClick={handleGenerate}>{loading ? "Generating..." : "Generate Diet Plan"}</Button>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{patientName}</h2>
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
          {dietPlan.map((d, idx) => (
            <TableRow key={d.day} className={idx % 2 ? "bg-muted/30" : undefined}>
              <TableCell>{d.day}</TableCell>
              {["Breakfast", "Lunch", "Dinner", "Snacks"].map((t) => {
                const meal = d.meals.find((m) => m.type === t)!;
                return (
                  <TableCell key={t}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{meal.name}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          Calories: {meal.calories} kcal | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
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
      <div className="flex justify-end gap-2">
        <Button onClick={exportPdf}>Export PDF</Button>
      </div>
      <div>
        Recommended Water: {recommend.water}L | Daily Calories: {recommend.calories} kcal
      </div>
    </div>
  );
}
