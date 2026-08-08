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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, FileText, ExternalLink, Download } from "lucide-react";
import axios from "axios";

import { endpoints } from "@/lib/api-config";

export default function UserProfile() {
  const { currentUser, userProfile, setUserProfile } = useAppState();
  const navigate = useNavigate();
  const [form, setForm] = useState<PatientProfile | null>(userProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDoc, setSelectedDoc] = useState<{ name: string; url: string; type?: string } | null>(null);
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

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
        console.log("Fetching profile for user:", currentUser.id);
        
        const response = await axios.get(
          `${endpoints.patient}/profile/${currentUser.id}`,
          {
            withCredentials: true
          }
        );
        
        console.log("API Response:", response.data);
        
        const fetchedProfile = response.data.data;
        
        const formattedProfile = {
          id: fetchedProfile._id,
          name: fetchedProfile.name,
          gender: fetchedProfile.gender,
          age: fetchedProfile.dob ? new Date().getFullYear() - new Date(fetchedProfile.dob).getFullYear() : null,
          dosha: fetchedProfile.ayurvedic_category,
          phone: fetchedProfile.contact,
          address: typeof fetchedProfile.address === 'object' && fetchedProfile.address !== null 
                   ? `${fetchedProfile.address.city || ''}, ${fetchedProfile.address.state || ''}` 
                   : fetchedProfile.address || "",
          height: fetchedProfile.height || null,
          weight: fetchedProfile.weight || null,
          medicalHistory: Array.isArray(fetchedProfile.medical_history) ? fetchedProfile.medical_history.join(", ") : (fetchedProfile.medical_history || ""),
          allergies: Array.isArray(fetchedProfile.allergies) ? fetchedProfile.allergies.join(", ") : (fetchedProfile.allergies || ""),
          conditions: Array.isArray(fetchedProfile.diseases) ? fetchedProfile.diseases.join(", ") : (fetchedProfile.diseases || ""),
          medications: "",
          sleepPattern: "",
          digestion: "",
          notes: "",
          documents: fetchedProfile.documents || [],
          medical_history_url: fetchedProfile.medical_history_url || null,
          lifestyle: "",
          habits: "",
          emergencyContact: "",
        };

        setForm(formattedProfile as any);
        setUserProfile(formattedProfile as any);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Failed to fetch user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const onChange = (field: keyof PatientProfile, val: any) => {
    if (!form) return;
    setForm({ ...form, [field]: val });
  };

  const handleSave = async () => {
    if (!form || !currentUser?.id) return;
    
    try {
      setIsLoading(true);

      const updatePayload = {
        name: form.name,
        contact: form.phone,
        gender: form.gender,
        height: form.height,
        weight: form.weight,
        ayurvedic_category: form.dosha,
        documents: form.documents,
        allergies: form.allergies,
        diseases: form.conditions,
        medical_history: form.medicalHistory,
        medical_history_url: (form as any).medical_history_url,
      };

      const response = await axios.put(
        `${endpoints.patient}/profile/${currentUser.id}`,
        updatePayload,
        { withCredentials: true }
      );

      if (response.data.success) {
        setUserProfile(form);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/files/upload", formData, { withCredentials: true });
      if (res.data?.url) {
        const docType = file.type.includes("pdf") ? "pdf" : "image";
        const next = [
          ...((form.documents as any[]) || []),
          { name: file.name, url: res.data.url, type: docType, date: new Date().toISOString() },
        ];
        setForm({ ...form, documents: next });
      }
    } catch (err) {
      console.error("Failed to upload document:", err);
      alert("Failed to upload document file.");
    } finally {
      setIsUploadingDoc(false);
      e.target.value = "";
    }
  };

  const addDocument = () => {
    if (!form) return;
    const next = [
      ...((form.documents as {
        name: string;
        url: string;
        type?: "pdf" | "image";
      }[]) || []),
      { name: "New Document", url: "", type: "pdf" as const },
    ];
    setForm({ ...form, documents: next });
  };

  const removeDocument = (idx: number) => {
    if (!form) return;
    const next = [...(form.documents || [])];
    next.splice(idx, 1);
    setForm({ ...form, documents: next });
  };

  const canEdit = useMemo(
    () =>
      (currentUser?.role as string) === "user" ||
      currentUser?.role === "patient" ||
      currentUser?.role === "doctor",
    [currentUser]
  );

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
          <CardContent className="p-6 text-center text-red-700">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
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
        </CardContent>
      </Card>

      {/* Vitals & History */}
      <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vitals & History</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">Height (cm)</Label>
            <Input
              type="number"
              value={form.height ?? ""}
              onChange={(e) =>
                onChange(
                  "height",
                  e.target.value ? Number(e.target.value) : null
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
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Label className="text-xs">Conditions</Label>
            <Input
              placeholder="e.g. Hypertension, Diabetes"
              value={form.conditions}
              onChange={(e) => onChange("conditions", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label className="text-xs">Allergies</Label>
            <Input
              placeholder="e.g. Peanuts, Dust"
              value={form.allergies}
              onChange={(e) => onChange("allergies", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <Label className="text-xs">Medical History</Label>
            <Textarea
              placeholder="Past surgeries, chronic illness, family history..."
              value={form.medicalHistory}
              onChange={(e) => onChange("medicalHistory", e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical Documents */}
      <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Medical Documents</span>
            {isUploadingDoc && <span className="text-xs text-primary animate-pulse font-normal">Uploading file...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Upload medical PDFs, lab reports, or scan images.
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  disabled={isUploadingDoc}
                  className="max-w-[240px]"
                />
                <Button size="sm" onClick={addDocument} disabled={isUploadingDoc}>
                  Add Link
                </Button>
              </div>
            )}
          </div>

          {/* Primary Medical History File if present */}
          {(userProfile as any)?.medical_history_url && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Uploaded Medical History Report</p>
                  <p className="text-xs text-muted-foreground">Primary Registration PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => {
                    setSelectedDoc({
                      name: "Uploaded Medical History Report",
                      url: (userProfile as any).medical_history_url,
                      type: "pdf"
                    });
                    setShowDocViewer(true);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" /> View PDF
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={(userProfile as any).medical_history_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {(form.documents || []).map((doc, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-md border bg-white/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px] sm:flex-1 sm:items-center">
                  <Input
                    placeholder="Document Name"
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
                    placeholder="https://... URL"
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
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {doc.url && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => {
                          setSelectedDoc({
                            name: doc.name || `Document ${idx + 1}`,
                            url: doc.url,
                            type: doc.type || "pdf"
                          });
                          setShowDocViewer(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" /> View PDF
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </>
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

            {!form.documents?.length && !(userProfile as any)?.medical_history_url && (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                No medical documents uploaded yet. Select a PDF or image file above to upload.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Sticky actions */}
      {canEdit && (
        <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-xl border bg-white/90 p-3 shadow-lg backdrop-blur">
          <Button variant="outline" onClick={() => setForm(userProfile)}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}

      {/* Document Viewer Modal */}
      <Dialog open={showDocViewer} onOpenChange={setShowDocViewer}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDoc.name}</DialogTitle>
                <DialogDescription>
                  Document Viewer ({selectedDoc.type?.toUpperCase() || "PDF"})
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-auto border rounded-lg mt-4 bg-muted/20 flex items-center justify-center p-2">
                {selectedDoc.url && (selectedDoc.url.toLowerCase().includes(".pdf") || selectedDoc.type === "pdf") ? (
                  <iframe
                    src={selectedDoc.url}
                    title={selectedDoc.name}
                    className="w-full h-[60vh] rounded-md border"
                  />
                ) : selectedDoc.url ? (
                  <img
                    src={selectedDoc.url}
                    alt={selectedDoc.name}
                    className="max-h-[60vh] max-w-full object-contain rounded-md"
                  />
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No preview available for this document.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDocViewer(false)}>
                  Close
                </Button>
                <Button asChild>
                  <a href={selectedDoc.url} target="_blank" rel="noreferrer" download>
                    Open in New Tab / Download
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}