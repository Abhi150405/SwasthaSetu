import { useEffect, useState } from "react";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function DoctorProfile() {
  const { currentUser, doctorProfile, setDoctorProfile } = useAppState();
  const navigate = useNavigate();
  const [form, setForm] = useState(doctorProfile || null);

  useEffect(() => setForm(doctorProfile || null), [doctorProfile]);

  if (!currentUser || !form) return null;

  const onChange = (key: string, value: any) =>
    setForm({ ...form, [key]: value });

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/doctor")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Doctor Dashboard
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Doctor Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Age</Label>
            <Input
              type="number"
              value={form.age ?? ""}
              onChange={(e) =>
                onChange("age", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          <div>
            <Label className="text-xs">Gender</Label>
            <Select
              value={form.gender || ""}
              onValueChange={(v) => onChange("gender", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">License No.</Label>
            <Input
              value={form.licenseNo}
              onChange={(e) => onChange("licenseNo", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Hospital/Clinic</Label>
            <Input
              value={form.hospital}
              onChange={(e) => onChange("hospital", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Specialty</Label>
            <Input
              value={form.specialty}
              onChange={(e) => onChange("specialty", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Address</Label>
            <Input
              value={form.address || ""}
              onChange={(e) => onChange("address", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Bio</Label>
            <Input
              value={form.bio || ""}
              onChange={(e) => onChange("bio", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => form && setDoctorProfile(form)}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
