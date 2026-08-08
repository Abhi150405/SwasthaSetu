import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { endpoints } from "@/lib/api-config";


export type Role = "patient" | "doctor";


export type User = {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  role: Role;
  dosha?: "Vata" | "Pitta" | "Kapha" | null;
  lastNotificationsSeenAt?: string | null;
};

export type Progress = {
  waterMl: number;
  waterGoalMl: number;
  calorieGoalKcal?: number;
  mealsPlanned: number;
  mealsTaken: number;
  doctorName?: string;
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
  authInitialized: boolean;
  progress: Progress;
  setProgress: (p: Progress) => void;
  dietPlan: DietPlan | null;
  setDietPlan: (plan: DietPlan | null) => void;
  generateMockPlan: (overrides?: Partial<DietPlan>) => Promise<DietPlan | null>;
  fetchDietPlan: () => Promise<void>;

  doctors: Doctor[];
  requests: ConsultRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ConsultRequest[]>>;
  fetchRequests: () => Promise<void>;
  createConsultRequest: (payload: any) => Promise<any>;
  updateConsultRequestStatus: (id: string, status: string, notes?: string) => Promise<any>;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "time" | "read">) => void;
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  updateWater: (deltaMl: number) => void;
  markMealTaken: (mealType?: string) => void;
  fetchTodayProgress: () => Promise<void>;
  conversations: Record<string, ChatMessage[]>;
  addMessage: (
    requestId: string,
    msg: Omit<ChatMessage, "id" | "requestId" | "ts"> & { ts?: number },
  ) => void;
  setMessagingMounted: (mounted: boolean) => void;
  setActiveChatId: (id: string | null) => void;
  userProfile: PatientProfile | null;
  setUserProfile: (p: PatientProfile) => void;
  doctorProfile: DoctorSelfProfile | null;
  setDoctorProfile: (p: DoctorSelfProfile) => void;
};

const AppStateContext = createContext<AppState | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [progress, setProgress] = useState<Progress>(() =>
    load<Progress>("app:progress", {
      waterMl: 0,
      waterGoalMl: 2500,
      mealsPlanned: 3,
      mealsTaken: 0,
    }),
  );
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/doctor/all");
        const result = await response.json();
        
        if (result.success && result.data) {
          const registeredDoctors = result.data.map((d: any) => ({
            id: d._id,
            name: d.name,
            specialty: d.specialty || "General Medicine",
            rating: 4.8, // Default rating as backend doesn't store this yet
            hospital: d.hospital,
            bio: d.bio,
            experience: d.experience
          }));
          setDoctors(registeredDoctors);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      }
    };
    fetchDoctors();
  }, [currentUser]);

  const [requests, setRequests] = useState<ConsultRequest[]>([]);

  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      const endpoint = currentUser.role === "doctor" ? "/api/consultation/doctor" : "/api/consultation/patient";
      const response = await fetch(endpoint);
      const result = await response.json();
      if (result.success && result.data) {
        const mapped = result.data.map((c: any) => ({
          ...c,
          userId: c.patientId,
        }));
        setRequests(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser]);

  const createConsultRequest = async (payload: any) => {
    try {
      const response = await fetch("/api/consultation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRequests();
      }
      return result;
    } catch (err) {
      console.error("Failed to create request:", err);
      return { success: false, error: err };
    }
  };

  const updateConsultRequestStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/consultation/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRequests();
      }
      return result;
    } catch (err) {
      console.error("Failed to update status:", err);
      return { success: false, error: err };
    }
  };

  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [lastSeenTime, setLastSeenTime] = useState<number>(0);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [messagingMounted, setMessagingMounted] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.lastNotificationsSeenAt) {
      setLastSeenTime(new Date(currentUser.lastNotificationsSeenAt).getTime());
    } else {
      setLastSeenTime(0);
    }
  }, [currentUser?.lastNotificationsSeenAt]);

  const backendNotifications = useMemo<Notification[]>(() => {
    if (!currentUser) return [];
    const notifs: Notification[] = [];
    
    // Derived from requests
    requests.forEach(r => {
      const ts = r.acceptedDate ? new Date(r.acceptedDate).getTime() : (r.createdAt ? new Date(r.createdAt).getTime() : 0);
      if (ts > lastSeenTime) {
        if (currentUser.role === 'patient') {
          if (r.status === 'accepted') {
            notifs.push({ id: `req_${r.id}`, type: "success", title: "Consultation Accepted", message: "Your request was accepted.", time: new Date(ts).toISOString(), read: false });
          } else if (r.status === 'rejected') {
            notifs.push({ id: `req_${r.id}`, type: "warning", title: "Consultation Rejected", message: "Your request was rejected.", time: new Date(ts).toISOString(), read: false });
          }
        } else if (currentUser.role === 'doctor') {
          if (r.status === 'pending') {
            notifs.push({ id: `req_${r.id}`, type: "info", title: "New Consultation Request", message: "You have a new patient request.", time: new Date(ts).toISOString(), read: false });
          }
        }
      }
    });

    // Derived from unread messages
    Object.values(conversations).forEach(thread => {
      thread.forEach(msg => {
        if (msg.ts > lastSeenTime && msg.from !== (currentUser.role === 'doctor' ? 'doctor' : 'patient') && msg.from !== 'system') {
          notifs.push({ id: `msg_${msg.id}`, type: "info", title: "New Message", message: "You have received a new message.", time: new Date(msg.ts).toISOString(), read: false });
        }
      });
    });

    return notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [requests, conversations, currentUser, lastSeenTime]);

  const notifications = useMemo(() => {
    return [...localNotifications, ...backendNotifications].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);
  }, [localNotifications, backendNotifications]);

  const getOtherUserId = (reqId: string) => {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return reqId; // Fallback to using the passed ID directly
    return currentUser?.role === "doctor" ? req.userId : req.doctorId;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (messagingMounted) {
      const fetchConversationsList = async () => {
        try {
          await fetch("/api/messages/conversations");
        } catch (e) {
          console.error("Failed to fetch conversations list:", e);
        }
      };
      fetchConversationsList();
      interval = setInterval(fetchConversationsList, 9000);
    }
    return () => clearInterval(interval);
  }, [messagingMounted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeChatId) {
      const otherUserId = getOtherUserId(activeChatId);
      if (!otherUserId) return;

      const fetchChatHistory = async () => {
        try {
          const res = await fetch(`/api/messages/${otherUserId}`);
          const result = await res.json();
          if (result.success) {
            setConversations((prev) => ({
              ...prev,
              [activeChatId]: result.data.map((m: any) => ({
                id: m.id,
                requestId: activeChatId,
                from: m.sender,
                text: m.text,
                ts: new Date(m.createdAt).getTime(),
              })),
            }));
          }
        } catch (e) {
          console.error("Failed to fetch chat history:", e);
        }
      };

      fetch(`/api/messages/${otherUserId}/read`, { method: "PUT" }).catch(console.error);
      fetchChatHistory();
      interval = setInterval(fetchChatHistory, 3500);
    }
    return () => clearInterval(interval);
  }, [activeChatId, requests, currentUser]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        let response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        // If access token expired (401), attempt auto-refresh via refresh token cookie
        if (response.status === 401) {
          try {
            const refreshRes = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });
            if (refreshRes.ok) {
              response = await fetch("/api/auth/me", {
                credentials: "include",
              });
            }
          } catch (e) {
            console.error("Token auto-refresh failed:", e);
          }
        }

        if (!response.ok) return;

        const result = await response.json();
        if (result?.id) {
          setCurrentUser({
            id: result.id,
            name: result.name,
            email: result.email,
            role: result.role,
            dosha: result.dosha ?? result.ayurvedic_category ?? null,
          });
          if (result.role === 'doctor') {
            _setDoctorProfile({
              id: result.id,
              name: result.name,
              age: result.dob ? new Date().getFullYear() - new Date(result.dob).getFullYear() : null,
              gender: result.gender || null,
              licenseNo: result.licenseNo || "",
              hospital: result.hospital || "",
              specialty: result.specialty || "",
              phone: result.phone || result.contact || "",
              email: result.email,
              address: result.address?.[0]?.city || result.address?.[0] || "",
              bio: result.bio || "",
            });
          } else {
            fetch(`/api/patient/profile/${result.id}`, { credentials: "include" })
              .then(res => res.json())
              .then(data => {
                 if (data.success) {
                    const dbUser = data.data;
                    _setUserProfile({
                        id: dbUser.id,
                        name: dbUser.name,
                        dosha: dbUser.ayurvedic_category || dbUser.dosha || null,
                        age: dbUser.dob ? new Date().getFullYear() - new Date(dbUser.dob).getFullYear() : null,
                        gender: dbUser.gender || null,
                        phone: dbUser.phone || dbUser.contact || "",
                        address: dbUser.address?.[0]?.city || dbUser.address?.[0] || "",
                        height: dbUser.height || null,
                        weight: dbUser.weight || null,
                        lifestyle: dbUser.lifestyle || "",
                        medicalHistory: dbUser.medicalHistory || "",
                        allergies: dbUser.allergies ? (Array.isArray(dbUser.allergies) ? dbUser.allergies.join(", ") : dbUser.allergies) : "",
                        conditions: dbUser.diseases ? (Array.isArray(dbUser.diseases) ? dbUser.diseases.join(", ") : dbUser.diseases) : "",
                        medications: dbUser.medications || "",
                        habits: dbUser.habits || "",
                        sleepPattern: dbUser.sleepPattern || "",
                        digestion: dbUser.digestion || null,
                        emergencyContact: dbUser.emergencyContact || "",
                        notes: "",
                        documents: []
                    });
                 }
              })
              .catch(console.error);
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setAuthInitialized(true);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => save("app:progress", progress), [progress]);
  // useEffect(() => save("app:dietPlan", dietPlan), [dietPlan]);
  // useEffect(() => save("app:requests", requests), [requests]);
  // useEffect(() => save("app:notifications", notifications), [notifications]);
  // useEffect(() => save("app:conversations", conversations), [conversations]);

  const [userProfile, _setUserProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, _setDoctorProfile] = useState<DoctorSelfProfile | null>(null);

  const setUserProfile = async (p: PatientProfile) => {
    _setUserProfile(p);
    try {
      await fetch(`/api/patient/profile/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
    } catch (error) {
      console.error("Failed to update patient profile:", error);
    }
  };

  const setDoctorProfile = async (p: DoctorSelfProfile) => {
    _setDoctorProfile(p);
    try {
      await fetch(`/api/doctor/profile/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
    } catch (error) {
      console.error("Failed to update doctor profile:", error);
    }
  };

  const addNotification = (n: Omit<Notification, "id" | "time" | "read">) => {
    setLocalNotifications((prev) =>
      [
        { id: uid("ntf"), time: new Date().toISOString(), read: false, ...n },
        ...prev,
      ].slice(0, 50),
    );
  };
  const markAllRead = async () => {
    setLocalNotifications([]);
    if (currentUser) {
      setLastSeenTime(Date.now());
      try {
        await fetch("/api/auth/notifications-seen", { method: "PUT" });
      } catch (error) {
        console.error("Failed to mark notifications seen:", error);
      }
    }
  };
  const markNotificationRead = (id: string) => {
    setLocalNotifications((prev) => prev.filter((x) => x.id !== id));
  };

  const fetchTodayProgress = async () => {
    if (!currentUser || currentUser.role !== "patient") return;
    try {
      const response = await fetch("/api/progress/today", { credentials: "include" });
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        setProgress({
          waterMl: data.water_intake_ml || 0,
          waterGoalMl: data.target_water_ml || 2500,
          calorieGoalKcal: data.target_calories || 2000,
          mealsPlanned: 3,
          mealsTaken: data.meal_log?.filter((m: any) => m.status === "completed").length || 0,
          doctorName: data.doctor_name || "Dr. Sharma",
        });
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  };

  // Fetch Diet Plan helper using axios and fallback patientId
  const fetchDietPlan = async () => {
    if (!currentUser) return;
    const patientId = (currentUser as any).id || (currentUser as any)._id;
    if (!patientId) return;

    try {
      const response = await axios.get(`${endpoints.diet}/patient/${patientId}`, { withCredentials: true });
      const result = response.data;
      if (result.success && result.data && result.data.length > 0) {
        const latestPlan = result.data[0];
        if (latestPlan.plan && latestPlan.plan.length > 0) {
          const day1 = latestPlan.plan[0];
          setDietPlan({
            date: day1.day ? `Day ${day1.day}` : new Date().toISOString().slice(0, 10),
            notes: latestPlan.suggestion || "Personalized Ayurvedic Plan",
            ayurvedic_analysis: latestPlan.ayurvedic_analysis,
            fullPlan: latestPlan.plan,
            meals: (day1.meals || []).map((m: any) => ({
              time: m.type === "Breakfast" ? "08:00" : m.type === "Lunch" ? "13:00" : m.type === "Dinner" ? "19:00" : "16:00",
              name: (m.items || []).map((i: any) => i.name).join(", ") || "Healthy Meal",
              calories: m.total_nutrition?.calories || 0,
              properties: [m.type]
            }))
          } as any);
        }
      }
    } catch (error) {
      console.error("Failed to fetch diet plans:", error);
    }
  };

  useEffect(() => {
    fetchTodayProgress();
    fetchDietPlan();
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
        credentials: "include",
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
        credentials: "include",
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

  const generateMockPlan = async (overrides?: Partial<DietPlan>): Promise<DietPlan | null> => {
    if (!currentUser) return null;
    try {
      const response = await fetch("/api/diet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentUser.id,
          age: userProfile?.age || 30,
          weight: userProfile?.weight || 70,
          height: userProfile?.height || 170,
          conditions: userProfile?.conditions ? userProfile.conditions.split(",").map(c => c.trim()) : [],
          dietary_preferences: ["Indian", "Vegetarian"],
          goals: "Holistic wellness and Ayurvedic balance",
          gender: userProfile?.gender || "Male",
          days: 7
        })
      });
      const result = await response.json();
      if (result.success && result.data && result.data.plan && result.data.plan.length > 0) {
        const day1 = result.data.plan[0];
        const plan: DietPlan = {
          date: day1.date || new Date().toISOString().slice(0, 10),
          notes: result.data.suggestion || "Personalized Ayurvedic plan",
          meals: day1.meals.map((m: any) => ({
            time: m.type === "Breakfast" ? "08:00" : m.type === "Lunch" ? "13:00" : m.type === "Dinner" ? "19:00" : "16:00",
            name: m.items.map((i: any) => i.name).join(", "),
            calories: m.total_nutrition?.calories || 0,
            properties: [m.type]
          })),
          ...overrides
        };
        setDietPlan(plan);
        addNotification({
          type: "diet",
          title: "Diet plan generated",
          message: `7-day plan for ${plan.date} created.`,
        });
        return plan;
      }
    } catch (error) {
      console.error("Failed to generate diet plan:", error);
    }
    return null;
  };

  const addMessage: AppState["addMessage"] = async (requestId, msg) => {
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

    if (msg.from !== "system" && msg.from === (currentUser?.role === "doctor" ? "doctor" : "patient")) {
      const otherUserId = getOtherUserId(requestId);
      if (otherUserId) {
        try {
          await fetch(`/api/messages/${otherUserId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: msg.text }),
          });
        } catch (e) {
          console.error("Failed to send message:", e);
        }
      }
    }
  };

  const value = useMemo<AppState>(
    () => ({
      currentUser,
      setCurrentUser,
      authInitialized,
      progress,
      setProgress,
      dietPlan,
      setDietPlan,
      doctors,
      requests,
      setRequests,
      fetchRequests,
      createConsultRequest,
      updateConsultRequestStatus,
      notifications,
      addNotification,
      markAllRead,
      markNotificationRead,
      updateWater,
      markMealTaken,
      fetchTodayProgress,
      generateMockPlan,
      fetchDietPlan,
      conversations,

      addMessage,
      setMessagingMounted,
      setActiveChatId,
      userProfile,
      setUserProfile,
      doctorProfile,
      setDoctorProfile,
    }),
    [
      currentUser,
      authInitialized,
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
