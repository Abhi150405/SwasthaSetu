import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "patient" | "doctor";

export type User = {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  role: Role;
  dosha?: "Vata" | "Pitta" | "Kapha" | null;
};

export type Progress = {
  waterMl: number;
  waterGoalMl: number;
  mealsPlanned: number;
  mealsTaken: number;
};

export type Meal = {
  time: string;
  name: string;
  calories: number;
  properties: string[];
};

export type DietPlan = {
  date: string;
  notes?: string;
  meals: Meal[];
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
};

export type DoctorSelfProfile = {
  id: string;
  name: string;
  age: number | null;
  gender: "Male" | "Female" | "Other" | null;
  licenseNo: string;
  hospital: string;
  specialty: string;
  phone: string;
  email: string;
  address?: string;
  bio?: string;
};

export type PatientProfile = {
  id: string;
  name: string;
  dosha: "Vata" | "Pitta" | "Kapha" | null;
  age: number | null;
  gender: "Male" | "Female" | "Other" | null;
  phone: string;
  address: string;
  height: number | null;
  weight: number | null;
  lifestyle: string;
  medicalHistory: string;
  allergies: string;
  conditions: string;
  medications: string;
  habits: string;
  sleepPattern: string;
  digestion: "Poor" | "Normal" | "Strong" | string | null;
  emergencyContact: string;
  notes: string;
  documents?: { name: string; url: string; type?: "pdf" | "image" }[];
};

// Keep this for reference but don't use it as a fallback
export const samplePatientProfile: PatientProfile = {
  id: "P-2025001",
  name: "John Doe",
  dosha: "Pitta",
  age: 32,
  gender: "Male",
  phone: "+91 98765 43210",
  address: "123, MG Road, Bengaluru, India",
  height: 178,
  weight: 72,
  lifestyle: "Non-smoker, occasional alcohol, daily yoga, vegetarian diet",
  medicalHistory: "Hypertension, seasonal allergies, mild acidity",
  allergies: "Penicillin",
  conditions: "",
  medications: "",
  habits: "",
  sleepPattern: "",
  digestion: null,
  emergencyContact: "Jane Doe (+91 91234 56789)",
  notes: "",
  documents: [
    { name: "Blood Test Report.pdf", url: "/mock/blood-test.pdf", type: "pdf" },
    { name: "X-Ray Scan.pdf", url: "/mock/xray.pdf", type: "pdf" },
    { name: "Prescription.pdf", url: "/mock/prescription.pdf", type: "pdf" },
  ],
};

// Helper function to create a basic patient profile from minimal data
const createBasicPatientProfile = (
  id: string,
  name: string,
  dosha?: "Vata" | "Pitta" | "Kapha" | null,
): PatientProfile => ({
  id: id,
  name: name,
  dosha: dosha || null,
  age: null,
  gender: null,
  phone: "",
  address: "",
  height: null,
  weight: null,
  lifestyle: "",
  medicalHistory: "",
  allergies: "",
  conditions: "",
  medications: "",
  habits: "",
  sleepPattern: "",
  digestion: null,
  emergencyContact: "",
  notes: "",
  documents: [],
});

export type ConsultRequest = {
  id: string;
  userId: string;
  doctorId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  acceptedDate?: string;
  patientName?: string;
  patientDosha?: User["dosha"];
  patientProfile?: PatientProfile;
  plan?: { time: string; name: string; calories: number; waterMl?: number }[];
  // Additional fields for easier access
  age?: number;
  gender?: "Male" | "Female" | "Other";
  symptoms?: string;
  weight?: number;
  height?: number;
  emergencyContact?: string;
  lifestyle?: string;
  documents?: { name: string; url: string; type?: "pdf" | "image" }[];
};

export type Notification = {
  id: string;
  type: "info" | "success" | "warning" | "doctor" | "diet" | "water";
  title: string;
  message: string;
  time: string;
  read?: boolean;
};

export type ChatMessage = {
  id: string;
  requestId: string;
  from: "doctor" | "patient" | "system";
  text: string;
  ts: number;
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export type AppState = {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  progress: Progress;
  setProgress: (p: Progress) => void;
  dietPlan: DietPlan | null;
  setDietPlan: (p: DietPlan | null) => void;
  doctors: Doctor[];
  requests: ConsultRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ConsultRequest[]>>;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  updateWater: (deltaMl: number) => void;
  markMealTaken: (mealType?: string) => void;
  fetchTodayProgress: () => Promise<void>;
  generateMockPlan: (overrides?: Partial<DietPlan>) => DietPlan;
  conversations: Record<string, ChatMessage[]>;
  addMessage: (
    requestId: string,
    msg: Omit<ChatMessage, "id" | "requestId" | "ts"> & { ts?: number },
  ) => void;
  userProfile: PatientProfile | null;
  setUserProfile: (p: PatientProfile) => void;
  doctorProfile: DoctorSelfProfile | null;
  setDoctorProfile: (p: DoctorSelfProfile) => void;
};

const AppStateContext = createContext<AppState | null>(null);

function makePlan(
  meals?: Partial<ConsultRequest["plan"]>,
): { time: string; name: string; calories: number; waterMl?: number }[] {
  return meals && Array.isArray(meals) && meals.length
    ? (meals as any)
    : [
      {
        time: "08:00",
        name: "Warm Spiced Oats",
        calories: 320,
        waterMl: 250,
      },
      {
        time: "12:30",
        name: "Moong Dal Khichdi",
        calories: 450,
        waterMl: 300,
      },
      {
        time: "19:30",
        name: "Steamed Veg + Ghee",
        calories: 420,
        waterMl: 250,
      },
    ];
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    load<User | null>("app:currentUser", null),
  );
  const [progress, setProgress] = useState<Progress>(() =>
    load<Progress>("app:progress", {
      waterMl: 0,
      waterGoalMl: 2500,
      mealsPlanned: 3,
      mealsTaken: 0,
    }),
  );
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(() =>
    load<DietPlan | null>("app:dietPlan", null),
  );
  const [doctors] = useState<Doctor[]>([
    {
      id: "d0",
      name: "Dr. Victor Doom",
      specialty: "Metabolic Care",
      rating: 4.9,
    },
    {
      id: "d1",
      name: "Dr. Anaya Verma",
      specialty: "Ayurvedic Diet",
      rating: 4.9,
    },
    {
      id: "d2",
      name: "Dr. Rohan Mehta",
      specialty: "Digestive Health",
      rating: 4.7,
    },
    {
      id: "d3",
      name: "Dr. Kavya Iyer",
      specialty: "Metabolic Care",
      rating: 4.8,
    },
  ]);

  const [requests, setRequests] = useState<ConsultRequest[]>(() => {
    const loaded = load<ConsultRequest[]>("app:requests", []);
    if (loaded && loaded.length) return loaded;

    // Create seed data with multiple patients, each with their own profile
    const seed: ConsultRequest[] = [
      {
        id: "req_1001",
        userId: "u1001",
        doctorId: "d1",
        status: "accepted",
        createdAt: new Date().toISOString(),
        acceptedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        patientName: "Riya Sharma",
        patientDosha: "Pitta",
        age: 29,
        gender: "Female",
        symptoms: "Frequent acidity and heartburn after meals",
        weight: 58,
        height: 165,
        emergencyContact: "Raj Sharma (+91 98765 11111)",
        lifestyle: "Early riser, yoga 5 days a week, vegetarian diet",
        documents: [
          { name: "Blood Test Report.pdf", url: "/mock/blood-test.pdf", type: "pdf" },
          { name: "Endoscopy Report.pdf", url: "/mock/endoscopy.pdf", type: "pdf" },
        ],
        patientProfile: {
          ...createBasicPatientProfile("P-1001", "Riya Sharma", "Pitta"),
          age: 29,
          gender: "Female",
          phone: "+91 98765 00001",
          address: "Delhi, India",
          height: 165,
          weight: 58,
          allergies: "Peanuts",
          conditions: "Acid reflux",
          lifestyle: "Early riser, yoga 5 days a week",
          medicalHistory: "Acidity issues",
          sleepPattern: "7 hrs/night, deep sleep",
          digestion: "Normal",
          notes: "Often feels acidity post lunch",
        },
        plan: makePlan(),
      },
      {
        id: "req_1002",
        userId: "u1002",
        doctorId: "",
        status: "pending",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        patientName: "Neha Gupta",
        patientDosha: "Vata",
        age: 25,
        gender: "Female",
        symptoms: "Chronic anxiety, insomnia, and digestive issues",
        weight: 52,
        height: 160,
        emergencyContact: "Priya Gupta (+91 98765 22222)",
        lifestyle: "Software engineer, irregular schedule, high stress",
        documents: [
          { name: "Anxiety Assessment.pdf", url: "/mock/anxiety.pdf", type: "pdf" },
        ],
        patientProfile: {
          ...createBasicPatientProfile("P-1002", "Neha Gupta", "Vata"),
          age: 25,
          gender: "Female",
          phone: "+91 98765 00002",
          address: "Mumbai, India",
          height: 160,
          weight: 52,
          allergies: "Shellfish",
          conditions: "Anxiety, Insomnia",
          lifestyle: "Software engineer, irregular schedule",
          medicalHistory: "Anxiety disorders, sleep issues",
          sleepPattern: "5-6 hrs/night, disturbed sleep",
          digestion: "Poor",
          notes: "High stress levels, poor eating habits",
        },
      },
      {
        id: "req_1003",
        userId: "u1003",
        doctorId: "d3",
        status: "accepted",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        acceptedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        patientName: "Arjun Patel",
        patientDosha: "Kapha",
        age: 35,
        gender: "Male",
        symptoms: "Weight gain, low energy, and slow metabolism",
        weight: 85,
        height: 175,
        emergencyContact: "Meera Patel (+91 98765 33333)",
        lifestyle: "Sedentary job, minimal exercise, irregular eating",
        documents: [
          { name: "Metabolic Panel.pdf", url: "/mock/metabolic.pdf", type: "pdf" },
          { name: "Thyroid Test.pdf", url: "/mock/thyroid.pdf", type: "pdf" },
        ],
        patientProfile: {
          ...createBasicPatientProfile("P-1003", "Arjun Patel", "Kapha"),
          age: 35,
          gender: "Male",
          phone: "+91 98765 00003",
          address: "Ahmedabad, India",
          height: 175,
          weight: 85,
          allergies: "Dairy",
          conditions: "Obesity, Pre-diabetes",
          lifestyle: "Sedentary job, minimal exercise",
          medicalHistory: "Family history of diabetes",
          sleepPattern: "8-9 hrs/night, heavy sleep",
          digestion: "Slow",
          notes: "Weight management needed, low energy",
        },
        plan: makePlan(),
      },
      {
        id: "req_1004",
        userId: "u1004",
        doctorId: "",
        status: "pending",
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        patientName: "Priya Singh",
        patientDosha: "Pitta",
        age: 28,
        gender: "Female",
        symptoms: "Severe migraines and irregular menstrual cycles",
        weight: 55,
        height: 162,
        emergencyContact: "Amit Singh (+91 98765 44444)",
        lifestyle: "Marketing professional, high stress, irregular sleep",
        documents: [
          { name: "Hormone Panel.pdf", url: "/mock/hormones.pdf", type: "pdf" },
          { name: "MRI Scan.pdf", url: "/mock/mri.pdf", type: "pdf" },
        ],
        patientProfile: {
          ...createBasicPatientProfile("P-1004", "Priya Singh", "Pitta"),
          age: 28,
          gender: "Female",
          phone: "+91 98765 00004",
          address: "Bangalore, India",
          height: 162,
          weight: 55,
          allergies: "None",
          conditions: "Migraine, PCOS",
          lifestyle: "Marketing professional, high stress",
          medicalHistory: "Hormonal imbalances, frequent headaches",
          sleepPattern: "6-7 hrs/night, light sleep",
          digestion: "Strong",
          notes: "Irregular periods, stress-related issues",
        },
      },
    ];
    return seed;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() =>
    load<Notification[]>("app:notifications", []),
  );
  const [conversations, setConversations] = useState<
    Record<string, ChatMessage[]>
  >(() => load<Record<string, ChatMessage[]>>("app:conversations", {}));

  useEffect(() => save("app:currentUser", currentUser), [currentUser]);
  useEffect(() => save("app:progress", progress), [progress]);
  useEffect(() => save("app:dietPlan", dietPlan), [dietPlan]);
  useEffect(() => save("app:requests", requests), [requests]);
  useEffect(() => save("app:notifications", notifications), [notifications]);
  useEffect(() => save("app:conversations", conversations), [conversations]);

  const getUserProfileKey = () =>
    `app:userProfile:${currentUser?.id || "anon"}`;
  const getDoctorProfileKey = () =>
    `app:doctorProfile:${currentUser?.id || "anon"}`;

  const [userProfile, _setUserProfile] = useState<PatientProfile | null>(() => {
    const cu = load<User | null>("app:currentUser", null);
    const key = `app:userProfile:${cu?.id || "anon"}`;
    return load<PatientProfile | null>(key, null);
  });
  const [doctorProfile, _setDoctorProfile] = useState<DoctorSelfProfile | null>(
    () => {
      const cu = load<User | null>("app:currentUser", null);
      const key = `app:doctorProfile:${cu?.id || "anon"}`;
      const fallback =
        cu && cu.role === "doctor"
          ? {
            id: cu.id,
            name: cu.name,
            age: null,
            gender: null,
            licenseNo: "",
            hospital: "",
            specialty: "",
            phone: "",
            email: cu.email,
            address: "",
            bio: "",
          }
          : null;
      return load<DoctorSelfProfile | null>(key, fallback);
    },
  );

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "patient" && !userProfile) {
      _setUserProfile(
        createBasicPatientProfile(
          `P-${currentUser.id}`,
          currentUser.name,
          currentUser.dosha || null,
        ),
      );
    }
    if (currentUser.role === "doctor" && !doctorProfile) {
      _setDoctorProfile({
        id: currentUser.id,
        name: currentUser.name,
        age: null,
        gender: null,
        licenseNo: "",
        hospital: "",
        specialty: "",
        phone: "",
        email: currentUser.email,
        address: "",
        bio: "",
      });
    }
  }, [currentUser]);

  useEffect(() => {
    save(getUserProfileKey(), userProfile);
  }, [userProfile, currentUser]);
  useEffect(() => {
    save(getDoctorProfileKey(), doctorProfile);
  }, [doctorProfile, currentUser]);

  const setUserProfile = (p: PatientProfile) => _setUserProfile(p);
  const setDoctorProfile = (p: DoctorSelfProfile) => _setDoctorProfile(p);

  const addNotification = (n: Omit<Notification, "id" | "time" | "read">) => {
    setNotifications((prev) =>
      [
        { id: uid("ntf"), time: new Date().toISOString(), read: false, ...n },
        ...prev,
      ].slice(0, 50),
    );
  };
  const markAllRead = () => setNotifications([]);
  const markNotificationRead = (id: string) =>
    setNotifications((prev) => prev.filter((x) => x.id !== id));

  const fetchTodayProgress = async () => {
    if (!currentUser || currentUser.role !== "patient") return;
    try {
      const response = await fetch("/api/progress/today");
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        setProgress({
          waterMl: data.water_intake_ml || 0,
          waterGoalMl: 2500, // Or fetch from profile/settings
          mealsPlanned: 3,
          mealsTaken: data.meal_log?.filter((m: any) => m.status === "completed").length || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  };

  useEffect(() => {
    fetchTodayProgress();
  }, [currentUser]);

  const updateWater = async (deltaMl: number) => {
    // Optimistic update
    setProgress((p) => ({
      ...p,
      waterMl: Math.max(0, Math.min(p.waterGoalMl, p.waterMl + deltaMl)),
    }));

    try {
      await fetch("/api/progress/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: deltaMl }),
      });

      addNotification({
        type: "water",
        title: "Hydration logged",
        message: `+${deltaMl}ml water added.`,
      });
    } catch (error) {
      console.error("Failed to sync water intake:", error);
    }
  };

  const markMealTaken = async (mealType?: string) => {
    // If no type provided, try to guess based on current meals taken
    const type = mealType || (progress.mealsTaken === 0 ? "breakfast" : progress.mealsTaken === 1 ? "lunch" : "dinner");

    // Optimistic update
    setProgress((p) => ({
      ...p,
      mealsTaken: Math.min(p.mealsPlanned, p.mealsTaken + 1),
    }));

    try {
      await fetch("/api/progress/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_type: type }),
      });

      addNotification({
        type: "diet",
        title: "Meal recorded",
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} marked as taken.`,
      });
    } catch (error) {
      console.error("Failed to sync meal taken:", error);
    }
  };

  const generateMockPlan = (overrides?: Partial<DietPlan>): DietPlan => {
    const base: DietPlan = {
      date: new Date().toISOString().slice(0, 10),
      notes: "Personalized as per dosha balance with sattvic emphasis",
      meals: [
        {
          time: "08:00",
          name: "Warm Spiced Oats",
          calories: 320,
          properties: ["Warm", "Rasa: Madhura", "Sattvic"],
        },
        {
          time: "12:30",
          name: "Moong Dal Khichdi",
          calories: 450,
          properties: ["Light", "Tridoshic", "Sattvic"],
        },
        {
          time: "16:00",
          name: "Herbal Tea + Nuts",
          calories: 180,
          properties: ["Warm", "Rasa: Kashaya"],
        },
        {
          time: "19:30",
          name: "Steamed Veg + Ghee",
          calories: 420,
          properties: ["Light", "Grounding"],
        },
      ],
    };
    const plan = { ...base, ...overrides };
    setDietPlan(plan);
    addNotification({
      type: "diet",
      title: "Diet plan generated",
      message: `7-day plan for ${plan.date} created.`,
    });
    return plan;
  };

  const addMessage: AppState["addMessage"] = (requestId, msg) => {
    setConversations((prev) => {
      const next = { ...prev };
      const list = next[requestId] ? [...next[requestId]] : [];
      list.push({
        id: uid("msg"),
        requestId,
        from: msg.from,
        text: msg.text,
        ts: msg.ts ?? Date.now(),
      });
      next[requestId] = list.slice(-200);
      return next;
    });
  };

  const value = useMemo<AppState>(
    () => ({
      currentUser,
      setCurrentUser,
      progress,
      setProgress,
      dietPlan,
      setDietPlan,
      doctors,
      requests,
      setRequests,
      notifications,
      addNotification,
      markAllRead,
      markNotificationRead,
      updateWater,
      markMealTaken,
      fetchTodayProgress,
      generateMockPlan,
      conversations,
      addMessage,
      userProfile,
      setUserProfile,
      doctorProfile,
      setDoctorProfile,
    }),
    [
      currentUser,
      progress,
      dietPlan,
      doctors,
      requests,
      notifications,
      conversations,
      userProfile,
      doctorProfile,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
