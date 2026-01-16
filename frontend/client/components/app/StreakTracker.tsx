import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export const StreakTracker: React.FC = () => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const streak = 5;
  return (
    <Card className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Flame className="h-4 w-4 text-foreground/70" />
        Current Streak
        <span className="ml-auto text-xs text-muted-foreground">{streak} days</span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((d, i) => (
          <motion.div key={i} whileHover={{ scale: 1.03 }} className={`flex h-10 items-center justify-center rounded-lg border text-sm ${i < streak ? "bg-slate-100 dark:bg-foreground/10" : "bg-muted/40"}`}>
            {d}
          </motion.div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <Bar label="Workout" value={72} />
        <Bar label="Nutrition" value={64} />
        <Bar label="Recovery" value={58} />
      </div>
    </Card>
  );
};

const Bar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

export default StreakTracker;
