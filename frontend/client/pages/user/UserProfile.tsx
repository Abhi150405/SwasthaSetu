import { useEffect, useMemo, useState } from "react";
import { useAppState, PatientProfile } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

export default function UserProfile() {
  const { currentUser, userProfile, setUserProfile } = useAppState();
  const navigate = useNavigate();
  const [form, setForm] = useState<PatientProfile | null>(userProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser?.id) {
        setError("No current user found. Please log in again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching profile for user:", currentUser.id); // Debug log
        
        const response = await axios.get(
          `/api/patient/profile/68d3090af8634f295f7d17ac`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}` // Add auth header if needed
            }
          }
        );
        
        console.log("API Response:", response.data); // Debug log
        
        const fetchedProfile = response.data.data;
        
        // Map backend data to frontend PatientProfile type
        const formattedProfile = {
          id: fetchedProfile._id,
          name: fetchedProfile.name,
          gender: fetchedProfile.gender,
          age: fetchedProfile.dob ? new Date().getFullYear() - new Date(fetchedProfile.dob).getFullYear() : null,
          dosha: fetchedProfile.ayurvedic_category,
          phone: fetchedProfile.contact,
          address: fetchedProfile.address?.[0]?.city || fetchedProfile.address?.[0] || "", // Handle both object and string
          height: null, // These fields are not in your schema
          weight: null,
          lifestyle: "",
          medicalHistory: fetchedProfile.medical_history?.[0] || "",
          allergies: fetchedProfile.allergies?.[0] || "",
          conditions: fetchedProfile.diseases?.[0] || "",
          medications: "",
          sleepPattern: "",
          digestion: "",
          notes: "",
          documents: [],
          habits: "", // Add default value
          emergencyContact: "", // Add default value
        };

        console.log("Formatted profile:", formattedProfile); // Debug log
        
        setForm(formattedProfile);
        setUserProfile(formattedProfile);
        
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        
        // Better error handling
        if (err.response) {
          // Server responded with error status
          const errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
          setError(errorMessage);
        } else if (err.request) {
          // Network error
          setError("Network error. Please check your connection and try again.");
        } else {
          // Other error
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Always fetch if we don't have a userProfile or if we have a currentUser
    if (!userProfile && currentUser) {
      fetchUserProfile();
    } else if (userProfile) {
      setIsLoading(false);
    }
  }, [currentUser, userProfile, setUserProfile]);

  useEffect(() => {
    setForm(userProfile);
  }, [userProfile]);

  const onChange = <K extends keyof PatientProfile>(
    key: K,
    value: PatientProfile[K],
  ) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const addDocument = () => {
    if (!form) return;
    setForm({
      ...form,
      documents: [
        ...(form.documents || []),
        { name: "New Document", url: "", type: "pdf" },
      ],
    });
  };

  const removeDocument = (idx: number) => {
    if (!form) return;
    const next = [...(form.documents || [])];
    next.splice(idx, 1);
    setForm({ ...form, documents: next });
  };

  const canEdit = useMemo(() => currentUser?.role === "user" || currentUser?.role === "patient" || currentUser?.role === "doctor", [currentUser]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-600 mb-4">
              <h3 className="font-semibold">Error Loading Profile</h3>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No current user
  if (!currentUser) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Please log in to view your profile.</p>
            <Button onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No form data
  if (!form) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">No profile found. Please create your profile first.</p>
            <Button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
      
      {/* Profile Information */}
      <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">Patient ID</Label>
            <Input
              value={form.id}
              onChange={(e) => onChange("id", e.target.value)}
              disabled
            />
          </div>
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Gender</Label>
            <Select
              value={form.gender || ""}
              onValueChange={(v) => onChange("gender", (v || null) as any)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Age</Label>
            <Input
              type="number"
              value={form.age ?? ""}
              onChange={(e) =>
                onChange("age", e.target.value ? Number(e.target.value) : null)
              }
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Dosha</Label>
            <Select
              value={form.dosha || ""}
              onValueChange={(v) => onChange("dosha", (v || null) as any)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dosha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vata">Vata</SelectItem>
                <SelectItem value="pitta">Pitta</SelectItem>
                <SelectItem value="kapha">Kapha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-xs">Address</Label>
            <Input
              value={form.address}
              onChange={(e) => onChange("address", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Height (cm)</Label>
            <Input
              type="number"
              value={form.height ?? ""}
              onChange={(e) =>
                onChange(
                  "height",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Weight (kg)</Label>
            <Input
              type="number"
              value={form.weight ?? ""}
              onChange={(e) =>
                onChange(
                  "weight",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Health Details */}
      <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Health Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Lifestyle</Label>
            <Textarea
              rows={2}
              value={form.lifestyle}
              onChange={(e) => onChange("lifestyle", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Medical History</Label>
            <Textarea
              rows={2}
              value={form.medicalHistory}
              onChange={(e) => onChange("medicalHistory", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Allergies</Label>
            <Input
              value={form.allergies}
              onChange={(e) => onChange("allergies", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Conditions</Label>
            <Input
              value={form.conditions}
              onChange={(e) => onChange("conditions", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Medications</Label>
            <Input
              value={form.medications}
              onChange={(e) => onChange("medications", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Sleep Pattern</Label>
            <Input
              value={form.sleepPattern}
              onChange={(e) => onChange("sleepPattern", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Digestion</Label>
            <Select
              value={(form.digestion as any) || ""}
              onValueChange={(v) => onChange("digestion", (v || null) as any)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Poor">Poor</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Strong">Strong</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Documents */}
      <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Upload PDFs/images or add links.
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !form) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = String(reader.result || "");
                      const type = file.type.includes("pdf")
                        ? ("pdf" as const)
                        : ("image" as const);
                      const next = [
                        ...((form.documents as {
                          name: string;
                          url: string;
                          type?: "pdf" | "image";
                        }[]) || []),
                        { name: file.name, url: dataUrl, type },
                      ];
                      setForm({ ...form, documents: next });
                    };
                    reader.readAsDataURL(file);
                    e.currentTarget.value = "";
                  }}
                  className="max-w-[240px]"
                />
                <Button size="sm" onClick={addDocument}>
                  Add Empty
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {(form.documents || []).map((doc, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-md border bg-white/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px] sm:flex-1 sm:items-center">
                  <Input
                    placeholder="Name"
                    value={doc.name}
                    onChange={(e) => {
                      if (!canEdit) return;
                      const next = [...(form.documents || [])];
                      next[idx] = { ...doc, name: e.target.value };
                      setForm({ ...form, documents: next });
                    }}
                    disabled={!canEdit}
                  />
                  <Input
                    placeholder="https://... or data URL"
                    value={doc.url}
                    onChange={(e) => {
                      if (!canEdit) return;
                      const next = [...(form.documents || [])];
                      next[idx] = { ...doc, url: e.target.value };
                      setForm({ ...form, documents: next });
                    }}
                    disabled={!canEdit}
                  />
                  <Select
                    value={doc.type || "pdf"}
                    onValueChange={(v) => {
                      if (!canEdit) return;
                      const next = [...(form.documents || [])];
                      next[idx] = { ...doc, type: v as any };
                      setForm({ ...form, documents: next });
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">pdf</SelectItem>
                      <SelectItem value="image">image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  {doc.url && (
                    <a
                      className="text-sm text-primary underline"
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  )}
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocument(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Sticky actions */}
      {canEdit && (
        <div className="sticky bottom-0 inset-x-0 z-10 bg-white/80 backdrop-blur border-t p-3 flex justify-end">
          <Button onClick={() => form && setUserProfile(form)}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}