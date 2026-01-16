import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Props = {
  cuisine: string;
  setCuisine: (val: string) => void;
  veg: boolean;
  setVeg: (val: boolean) => void;
  activity: "Low" | "Moderate" | "High";
  setActivity: (val: "Low" | "Moderate" | "High") => void;
  restrictions: string[];
  setRestrictions: (val: string[]) => void;
};

export default function DietQuiz({ cuisine, setCuisine, veg, setVeg, activity, setActivity, restrictions, setRestrictions }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Preferred Cuisine</div>
        <Select value={cuisine} onValueChange={setCuisine}>
          <SelectTrigger><SelectValue placeholder="Select cuisine" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Indian">Indian</SelectItem>
            <SelectItem value="Mediterranean">Mediterranean</SelectItem>
            <SelectItem value="Continental">Continental</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Vegetarian</div>
        <div className="flex items-center gap-3">
          <Switch checked={veg} onCheckedChange={setVeg} id="veg" />
          <Label htmlFor="veg">{veg ? "Vegetarian" : "Non-Vegetarian"}</Label>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Daily Activity Level</div>
        <Select value={activity} onValueChange={(v) => setActivity(v as any)}>
          <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Food Restrictions</div>
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
    </div>
  );
}
