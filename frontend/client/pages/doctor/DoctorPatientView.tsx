import { useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  Legend,
  Tooltip,
  LineChart as RechartsLineChart
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, HeartPulse, Stethoscope, 
  ArrowLeft, Activity, Smartphone, 
  Home, AlertCircle, Droplets, Flame, Calendar,
  Plus, Minus, Clock, Utensils, Droplet, Sun, Moon, Coffee, Scale, TrendingUp, TrendingDown
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';

// Type Definitions
interface Meal {
  time: string;
  name: string;
  calories: number;
  waterMl: number;
  type?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  dosha?: string;
  rasa?: string;
  properties?: string[];
}

interface DayPlan {
  date: string;
  meals: Meal[];
}

interface WeeklyPlan {
  days: DayPlan[];
}

interface MedicalDocument {
  id: string;
  name: string;
  type: 'report' | 'prescription' | 'scan' | 'other' | 'pdf' | 'image';
  date: string;
  fileUrl: string;
  url?: string; // For backward compatibility
  description?: string;
}

interface PatientProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  dosha?: string;
  height?: number;
  weight?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  lifestyle?: string;
  sleepPattern?: string;
  habits?: string;
  dob?: string | Date;
  documents?: MedicalDocument[];
}

interface Request {
  id: string;
  userId: string;
  patientName?: string;
  patientDosha?: string;
  status: string;
  patientProfile?: PatientProfile;
}

export default function DoctorPatientView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests } = useAppState();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  
  // Sample documents data - in a real app, this would come from an API
  const sampleDocuments: MedicalDocument[] = [
    {
      id: 'doc1',
      name: 'Blood Test Report - CBC & Lipid Profile',
      type: 'report',
      date: '2023-10-15',
      fileUrl: 'https://example.com/reports/cbc_lipid_oct2023.pdf',
      description: 'Complete Blood Count and Lipid Profile - Fasting'
    },
    {
      id: 'doc2',
      name: 'Chest X-Ray - PA View',
      type: 'scan',
      date: '2023-09-28',
      fileUrl: 'https://example.com/scans/chest_xray_sep2023.png',
      description: 'Posteroanterior chest radiograph - No active disease'
    },
    {
      id: 'doc3',
      name: 'Prescription - Dr. Sharma',
      type: 'prescription',
      date: '2023-11-02',
      fileUrl: 'https://example.com/prescriptions/prescription_nov2023.pdf',
      description: 'Follow-up medication and instructions for next visit'
    },
    {
      id: 'doc4',
      name: 'ECG Report',
      type: 'report',
      date: '2023-08-15',
      fileUrl: 'https://example.com/reports/ecg_aug2023.pdf',
      description: '12-lead Electrocardiogram - Normal sinus rhythm'
    },
    {
      id: 'doc5',
      name: 'MRI Brain - With Contrast',
      type: 'scan',
      date: '2023-07-20',
      fileUrl: 'https://example.com/scans/mri_brain_jul2023.dcm',
      description: 'MRI Brain with and without contrast - Unremarkable findings'
    },
    {
      id: 'doc6',
      name: 'Discharge Summary',
      type: 'other',
      date: '2023-06-10',
      fileUrl: 'https://example.com/other/discharge_summary_jun2023.pdf',
      description: 'Hospital discharge summary - General Medicine Department'
    }
  ];

  // Generate sample data for the last 7 days
  const generateChartData = useCallback(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, index) => {
      // Generate random but realistic data
      const baseHydration = Math.floor(Math.random() * 500) + 1500; // 1500-2000ml
      const baseCalories = Math.floor(Math.random() * 500) + 1800; // 1800-2300 kcal
      
      return {
        name: day,
        hydration: baseHydration + (Math.random() > 0.5 ? 200 : -100),
        calories: baseCalories + (Math.random() > 0.5 ? 300 : -200),
        targetHydration: 2500,
        targetCalories: 2000
      };
    });
  }, []);
  
  const chartData = useMemo(() => generateChartData(), [generateChartData]);

  // Find the current request
  const req = useMemo(() => requests.find((r) => r.id === id), [requests, id]);
  
  // Normalize patient profile
  const profile = useMemo<PatientProfile | null>(() => {
    if (!req?.patientProfile) return null;
    
    // Create a new patient profile with default values
    const p: PatientProfile = {
      ...req.patientProfile,
      // Always use our sample documents for now
      documents: [...sampleDocuments]
    };
    
    // Calculate age from DOB if available
    if (p.dob) {
      try {
        const dob = new Date(p.dob);
        if (!isNaN(dob.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
          p.age = age;
        }
      } catch (e) {
        console.error('Error calculating age:', e);
      }
    }
    
    return p;
  }, [req]);


  // Calculate weekly averages
  const weeklyHydration = useMemo(() => {
    const total = chartData.reduce((sum, day) => sum + day.hydration, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);
  
  const weeklyCalories = useMemo(() => {
    const total = chartData.reduce((sum, day) => sum + day.calories, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  if (!req || !profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-muted-foreground">Patient not found</h2>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      <div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </Button>
      </div>
      
      {/* Patient Header */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                    {profile.dosha || 'No Dosha Data'}
                  </Badge>
                  {profile.gender && (
                    <Badge variant="secondary">{profile.gender}</Badge>
                  )}
                  {profile.age && (
                    <span className="text-sm text-muted-foreground">
                      {profile.age} years
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                onClick={() => navigate(`/doctor/generator/diet?patientId=${id}&patientName=${encodeURIComponent(profile.name)}&dosha=${profile.dosha || ''}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385V4.804zM11 15.384c1.282-.875 2.831-1.385 4.5-1.385 1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0015.5 4c-1.67 0-3.218.51-4.5 1.385v9.999z" />
                </svg>
                Generate Diet Plan
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 whitespace-nowrap"
                onClick={() => navigate(`/doctor/generator/recipes?patientId=${id}&patientName=${encodeURIComponent(profile.name)}&dosha=${profile.dosha || ''}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Generate Recipe
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 whitespace-nowrap"
                onClick={() => navigate(`/doctor/messages?patientId=${id}&patientName=${encodeURIComponent(profile.name)}`)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM8 7a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1zm5 1a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                </svg>
                Message
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Health Stats */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                    <HeartPulse className="h-5 w-5 text-rose-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Health Stats</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Height</span>
                      <span className="font-medium">
                        {profile.height ? `${profile.height} cm` : '--'}
                      </span>
                    </div>
                    <Progress 
                      value={profile.height ? Math.min(100, (profile.height / 200) * 100) : 0} 
                      className="h-2" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weight</span>
                      <span className="font-medium">
                        {profile.weight ? `${profile.weight} kg` : '--'}
                      </span>
                    </div>
                    <Progress 
                      value={profile.weight ? Math.min(100, (profile.weight / 150) * 100) : 0} 
                      className="h-2" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">BMI</span>
                      <span className="font-medium">
                        {profile.height && profile.weight 
                          ? (profile.weight / ((profile.height/100) ** 2)).toFixed(1)
                          : '--'}
                      </span>
                    </div>
                    <Progress 
                      value={
                        profile.height && profile.weight 
                          ? Math.min(100, (profile.weight / ((profile.height/100) ** 2)) * 3.33)
                          : 0
                      } 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Medical Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Medical History</h4>
                  <p className="text-sm">
                    {profile.medicalHistory || 'No medical history provided'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Allergies</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies ? (
                      profile.allergies.split(',').map((allergy, i) => (
                        <Badge key={i} variant="outline" className="text-amber-700 bg-amber-50 border-amber-100">
                          {allergy.trim()}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No known allergies</span>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Medications</h4>
                  <p className="text-sm">
                    {profile.medications || 'No current medications'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Tracking */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Weekly Tracking</CardTitle>
                      <p className="text-sm text-muted-foreground">Last 7 days of activity</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-8">
                  {/* Hydration Chart */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20">
                          <Droplets className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">Hydration</span>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        Avg: {weeklyHydration}ml
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="hydrationColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12 }}
                            domain={[1000, 3000]}
                            tickFormatter={(value: number) => `${value}ml`}
                          />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <RechartsTooltip 
                            formatter={(value: any) => [`${value}ml`, 'Hydration']}
                            labelFormatter={(label) => `Day: ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="hydration"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#hydrationColor)"
                          />
                          <Area
                            type="monotone"
                            dataKey="targetHydration"
                            stroke="#3b82f6"
                            strokeDasharray="5 5"
                            strokeOpacity={0.5}
                            fill="none"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Calorie Chart */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20">
                          <Flame className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium">Calorie Intake</span>
                      </div>
                      <div className="text-sm font-medium text-orange-600">
                        Avg: {weeklyCalories}kcal
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="calorieColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12 }}
                            domain={[1500, 3000]}
                            tickFormatter={(value: number) => `${value}kcal`}
                          />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <RechartsTooltip 
                            formatter={(value: any) => [`${value}kcal`, 'Calories']}
                            labelFormatter={(label) => `Day: ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="calories"
                            stroke="#f97316"
                            fillOpacity={1}
                            fill="url(#calorieColor)"
                          />
                          <Area
                            type="monotone"
                            dataKey="targetCalories"
                            stroke="#f97316"
                            strokeDasharray="5 5"
                            strokeOpacity={0.5}
                            fill="none"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Lifestyle Information */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Lifestyle</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Daily Routine</h4>
                  <p className="text-sm">
                    {profile.lifestyle || 'No information provided'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Sleep Pattern</h4>
                  <p className="text-sm">
                    {profile.sleepPattern || 'No information provided'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Dietary Habits</h4>
                  <p className="text-sm">
                    {profile.habits || 'No information provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg font-semibold">Medical Documents</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.documents?.length ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {profile.documents.map((doc) => (
                      <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 mt-0.5">
                          {doc.type === 'report' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v2a1 1 0 102 0v-2zm2-3a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm4-1a1 1 0 10-2 0v5a1 1 0 102 0V8z" clipRule="evenodd" />
                            </svg>
                          ) : doc.type === 'prescription' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                          ) : doc.type === 'scan' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(doc.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            <span className="mx-1">•</span>
                            {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                              setShowDocumentViewer(true);
                            }}
                            title="View document"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="Download document"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto h-12 w-12 text-muted-foreground mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">No documents found</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" /> Upload Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 mt-0.5">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 mt-0.5">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.address || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 mt-0.5">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Emergency Contact</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.emergencyContact || 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Card>

      {/* Document Viewer Modal */}
      <Dialog open={showDocumentViewer} onOpenChange={setShowDocumentViewer}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <span>{new Date(selectedDocument.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedDocument.type}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-auto border rounded-lg mt-4">
                {selectedDocument.type === 'scan' || selectedDocument.type === 'other' ? (
                  <img 
                    src={selectedDocument.fileUrl} 
                    alt={selectedDocument.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">{selectedDocument.name}</h3>
                    {selectedDocument.description && (
                      <p className="text-muted-foreground mb-4">{selectedDocument.description}</p>
                    )}
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        This is a preview of the document. To view the full document, please download it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDocumentViewer(false)}>
                  Close
                </Button>
                <Button asChild>
                  <a 
                    href={selectedDocument.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                  >
                    Download
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
