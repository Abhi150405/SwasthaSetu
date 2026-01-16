import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useAppState } from "@/context/app-state"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon, UploadCloud } from "lucide-react"; // Added UploadCloud icon

// Schema for form validation
const patientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.enum(["male", "female", "prefer not to say"], {
    required_error: "Gender is required",
  }),
  dob: z.string().min(1, "Date of birth is required"),
  contact: z
    .string()
    .regex(/^\d{10}$/, "Contact number must be exactly 10 digits"),
  address: z.object({
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
  }),
  email: z.string().email("Valid email required"),
  height: z.string().optional(),
  weight: z.string().optional(),
  ayurvedic_category: z.enum(["vata", "pitta", "kapha", "pittakapha" , "vatakapha" , "vatapitta"], {
    required_error: "Ayurvedic category is required",
  }),
  allergies: z.string().optional(),
  diseases: z.string().optional(),
  medical_history: z
    .any()
    .refine((file) => !file || (file instanceof File && file.type === "application/pdf"), {
      message: "Only PDF files are allowed",
    })
    .optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

// Animation variants
const fieldVariants = {
  initial: { opacity: 0, y: 10 },
  enter: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 }
  })
};

// Form Field Components
function TextField({
  name,
  label,
  index = 0,
  ...props
}: { 
  name: keyof PatientFormValues; 
  label: string; 
  index?: number 
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PatientFormValues>();
  const error = (errors as any)[name];

  return (
    <motion.div
      variants={fieldVariants}
      initial="initial"
      animate="enter"
      custom={index}
      className="space-y-2"
    >
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...props} {...register(name as keyof PatientFormValues)} />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </motion.div>
  );
}

function SelectField({
  name,
  label,
  options,
  placeholder,
  index = 0,
}: {
  name: keyof PatientFormValues;
  label: string;
  options: { label: string; value: string }[];
  placeholder: string;
  index?: number;
}) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<PatientFormValues>();
  const value = watch(name);
  const error = (errors as any)[name];

  return (
    <motion.div
      variants={fieldVariants}
      initial="initial"
      animate="enter"
      custom={index}
      className="space-y-2"
    >
      <Label>{label}</Label>
      <Select
        value={value as string}
        onValueChange={(v) => setValue(name as any, v as any, { shouldValidate: true })}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </motion.div>
  );
}

export default function AddPatient() {
  const navigate = useNavigate();
  const { currentUser, addNotification, setRequests, requests, doctors } = useAppState() as any;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [medicalHistoryFile, setMedicalHistoryFile] = useState<File | null>(null); // New state for file name

  const getDoctorProfileId = () => {
    const key = `app:doctor-map:${currentUser?.id || "anon"}`;
    let mapped = localStorage.getItem(key);
    if (!mapped) {
      mapped = doctors[0]?.id || "d1";
      localStorage.setItem(key, mapped);
    }
    return mapped;
  };
  const doctorId = getDoctorProfileId();

  const methods = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      gender: undefined,
      dob: "",
      contact: "",
      address: { city: "", state: "", country: "" },
      email: "",
      height: "",
      weight: "",
      ayurvedic_category: undefined,
      allergies: "",
      diseases: "",
      medical_history: undefined,
    },
    mode: "onChange",
  });

  const { handleSubmit, setValue } = methods;

  // Updated handler for file input
  const handlePdfChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0] || null;
    setValue("medical_history", file, { shouldValidate: true });
    setMedicalHistoryFile(file); // Update state to display file name
  };

  const onSubmit = async (values: PatientFormValues) => {
    setIsLoading(true);
    setError(null);

    if (!values.name || !values.email || !values.contact || !values.dob || !values.gender || !values.ayurvedic_category) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (!doctorId) { 
      setError("No doctor logged in. Please log in first.");
      setIsLoading(false);
      return;
    }

    // Create new patient request
    const newPatient: any = {
      id: `req_${Date.now()}`,
      userId: `u_${Date.now()}`,
      doctorId: doctorId,
      status: "accepted",
      createdAt: new Date().toISOString(),
      acceptedDate: new Date().toISOString(),
      patientName: values.name,
      patientDosha: values.ayurvedic_category.charAt(0).toUpperCase() + values.ayurvedic_category.slice(1),
      age: values.dob ? new Date().getFullYear() - new Date(values.dob).getFullYear() : null,
      gender: values.gender === "prefer not to say" ? "Other" : values.gender.charAt(0).toUpperCase() + values.gender.slice(1),
      symptoms: values.diseases || "No specific symptoms reported",
      weight: values.weight ? parseInt(values.weight) : null,
      height: values.height ? parseInt(values.height) : null,
      emergencyContact: values.contact,
      lifestyle: "Information to be collected during consultation",
      documents: medicalHistoryFile ? [{ name: medicalHistoryFile.name, url: "#", type: "pdf" }] : [],
      patientProfile: {
        id: `P-${Date.now()}`,
        name: values.name,
        dosha: values.ayurvedic_category.charAt(0).toUpperCase() + values.ayurvedic_category.slice(1),
        age: values.dob ? new Date().getFullYear() - new Date(values.dob).getFullYear() : null,
        gender: values.gender === "prefer not to say" ? "Other" : values.gender.charAt(0).toUpperCase() + values.gender.slice(1),
        phone: values.contact,
        address: `${values.address.city}, ${values.address.state}, ${values.address.country}`,
        height: values.height ? parseInt(values.height) : null,
        weight: values.weight ? parseInt(values.weight) : null,
        lifestyle: "",
        medicalHistory: "",
        allergies: values.allergies || "",
        conditions: values.diseases || "",
        medications: "",
        habits: "",
        sleepPattern: "",
        digestion: null,
        emergencyContact: values.contact,
        notes: "",
        documents: medicalHistoryFile ? [{ name: medicalHistoryFile.name, url: "#", type: "pdf" }] : [],
      },
      plan: [
        {
          time: "08:00",
          name: "Breakfast",
          calories: 350,
          waterMl: 250,
        },
        {
          time: "13:00",
          name: "Lunch",
          calories: 500,
          waterMl: 300,
        },
        {
          time: "19:00",
          name: "Dinner",
          calories: 400,
          waterMl: 250,
        },
      ],
    };

    // Add the new patient to the requests array
    setRequests((prev: any[]) => [...prev, newPatient]);

    // Show success notification
    addNotification({
      type: "success",
      title: "Patient added successfully!",
      message: `${values.name} has been assigned to you.`,
    });

    // Navigate back to patients page
    navigate("/doctor/patients");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Add Patient</h1>
          <p className="text-sm text-gray-600 mt-1">
            Patient will be assigned to: <span className="font-medium">{currentUser?.name || "Current Doctor"}</span>
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
          <CardDescription>
            Fill in the patient's information. The patient will be automatically assigned to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField name="name" label="Full Name" placeholder="Enter patient's full name" required index={0} />
                <SelectField name="ayurvedic_category" label="Ayurvedic Category" placeholder="Select category" options={[{ label: "Vata", value: "vata" }, { label: "Pitta", value: "pitta" }, { label: "Kapha", value: "kapha" },{ label: "Pitta + Kapha", value: "pittakapha" }, { label: "Vata + Kapha", value: "vatakapha" }, { label: "Vata + Pitta", value: "vatapitta" }]} index={1} />
                <SelectField name="gender" label="Gender" placeholder="Select gender" options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Prefer not to say", value: "prefer not to say" }]} index={2} />
                <motion.div variants={fieldVariants} initial="initial" animate="enter" custom={3} className="space-y-2">
                  <Label>Date of Birth</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input type="date" className="pl-10" {...methods.register("dob")} required />
                  </div>
                  {methods.formState.errors.dob && <p className="text-xs text-red-600">{methods.formState.errors.dob.message}</p>}
                </motion.div>
                <TextField name="contact" label="Phone Number" placeholder="10-digit mobile number" inputMode="numeric" required index={4} />
                <TextField name="email" label="Email" type="email" placeholder="patient@email.com" required index={5} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div variants={fieldVariants} initial="initial" animate="enter" custom={6} className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="City" {...methods.register("address.city")} required />
                  {methods.formState.errors.address?.city && <p className="text-xs text-red-600">{methods.formState.errors.address.city.message}</p>}
                </motion.div>
                <motion.div variants={fieldVariants} initial="initial" animate="enter" custom={7} className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="State" {...methods.register("address.state")} required />
                  {methods.formState.errors.address?.state && <p className="text-xs text-red-600">{methods.formState.errors.address.state.message}</p>}
                </motion.div>
                <motion.div variants={fieldVariants} initial="initial" animate="enter" custom={8} className="space-y-2">
                  <Label>Country</Label>
                  <Input placeholder="Country" {...methods.register("address.country")} required />
                  {methods.formState.errors.address?.country && <p className="text-xs text-red-600">{methods.formState.errors.address.country.message}</p>}
                </motion.div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField name="height" label="Height (cm)" type="number" placeholder="170" index={9} />
                <TextField name="weight" label="Weight (kg)" type="number" placeholder="65" index={10} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={fieldVariants} initial="initial" animate="enter" custom={11} className="space-y-2">
                  <Label>Allergies</Label>
                  <Input placeholder="e.g., peanuts, pollen (comma-separated)" {...methods.register("allergies")} />
                  <p className="text-xs text-gray-500">Leave blank if none</p>
                </motion.div>
                <motion.div variants={fieldVariants} initial="initial" animate="enter" custom={12} className="space-y-2">
                  <Label>Medical Conditions</Label>
                  <Input placeholder="e.g., diabetes, hypertension (comma-separated)" {...methods.register("diseases")} />
                  <p className="text-xs text-gray-500">Leave blank if none</p>
                </motion.div>
              </div>

              {/* ⭐ New File Input Design ⭐ */}
              <motion.div
                variants={fieldVariants}
                initial="initial"
                animate="enter"
                custom={13}
                className="space-y-2"
              >
                <Label htmlFor="medical-documents">Medical Documents</Label>
                <div className="flex items-center gap-2">
                  {/* Hidden file input controlled by the button */}
                  <input
                    id="medical-documents"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfChange}
                  />
                  {/* Visible button that triggers the file input */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('medical-documents')?.click()}
                    className="flex items-center gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload PDF</span>
                  </Button>
                  {/* Display the selected file name */}
                  <span className="text-sm text-gray-500 truncate max-w-xs">
                    {medicalHistoryFile ? medicalHistoryFile.name : "No file selected."}
                  </span>
                </div>
                {methods.formState.errors.medical_history && (
                  <p className="text-xs text-red-600">
                    {typeof methods.formState.errors.medical_history.message === 'string'
                      ? methods.formState.errors.medical_history.message
                      : 'Error'}
                  </p>
                )}
              </motion.div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/doctor/patients")} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{isLoading ? "Adding Patient..." : "Add Patient"}</span>
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}