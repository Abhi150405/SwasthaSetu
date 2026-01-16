// types/user.ts

// Interface for the Address object
export interface Address {
  _id?: string;
  city?: string;
  state?: string;
  country?: string;
  isDefault?: boolean;
}

// Base User type
export interface BaseUser {
  _id: string;
  name: string;
  email: string;
  dob: string;
  gender: "male" | "female" | "prefer not to say";
  contact: string;
  address: Address[];
  role: "patient" | "doctor";
  createdAt: string;
  updatedAt: string;
}

// Patient type extending the base user with the new 'mode' field
export interface Patient extends BaseUser {
  role: "patient";
  ayurvedic_category: "vata" | "pitta" | "kapha" | "pittakapha" | "vatakapha" | "vatapitta";
  medical_history?: string[];
  diseases?: string[];
  assigned_doctor?: string;
  allergies?: string[];
  mode: "online" | "offline";
}

// Doctor type extending the base user
export interface Doctor extends BaseUser {
  role: "doctor";
  specialization: string[];
  experience?: number;
  verification_status?: boolean;
  patients?: string[]; // Array of patient IDs
}

export type AppUser = Patient | Doctor;
