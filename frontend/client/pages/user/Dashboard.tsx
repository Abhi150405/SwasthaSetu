import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, type Doctor } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChefHat, Salad, Stethoscope, ScanLine, Bot, Droplet, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { endpoints } from "@/lib/api-config";

export default function Dashboard() {

  const navigate = useNavigate();
  const {
    currentUser,
    progress,
    dietPlan,
    doctors,
    requests,
    setRequests,
    notifications,
    addNotification,
    markAllRead,
    markNotificationRead,
    createConsultRequest,
    updateWater,
    markMealTaken,
  } = useAppState();


  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAskAi = async () => {
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const response = await axios.post(`${endpoints.ai}/ask`, { question: userMsg }, { withCredentials: true });


      if (response.data.success) {
        let reply = response.data.answer || "";

        // Process AI action tags (e.g. [ACTION:MARK_WATER], [ACTION:MARK_WATER:500], [ACTION:MARK_MEAL])
        const actions = reply.match(/\[ACTION:[^\]]+\]/g) || [];
        actions.forEach((actionStr: string) => {
          const action = actionStr.slice(8, -1);
          if (action.startsWith("MARK_WATER")) {
            const parts = action.split(":");
            const amount = parts[1] ? parseInt(parts[1], 10) : 250;
            updateWater(isNaN(amount) ? 250 : amount);
          } else if (action === "MARK_MEAL") {
            markMealTaken();
          } else if (action.startsWith("NAVIGATE:")) {
            const path = action.split(":")[1];
            if (path) navigate(path);
          }
        });

        // Clean action tags from the text output
        const cleanReply = reply.replace(/\[ACTION:[^\]]+\]/g, "").trim();
        setAiMessages(prev => [...prev, { role: 'bot', content: cleanReply }]);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not reach the AI assistant." });
    } finally {
      setAiLoading(false);
    }
  };


  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor & {
    experience?: string;
    bio?: string;
    hospital?: string;
    location?: string;
    availability?: string;
  } | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [myConsultations, setMyConsultations] = useState<any[]>([]);

  const fetchMyConsultations = async () => {
    try {
      const res = await axios.get("/api/consultation/patient");
      if (res.data.success) setMyConsultations(res.data.data);
    } catch (e) {
      console.error("Failed to fetch consultations:", e);
    }
  };

  React.useEffect(() => {
    if (currentUser) fetchMyConsultations();
  }, [currentUser]);

  const [history, setHistory] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("/api/progress/history?limit=7");
        if (response.data.success) {
          setHistory(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    if (currentUser) fetchHistory();
  }, [currentUser, progress.waterMl, progress.mealsTaken]);

  const chartData = useMemo(() => {
    if (history.length === 0) {
      return [
        { day: "Mon", water: 0, meals: 0, calories: 0 },
        { day: "Tue", water: 0, meals: 0, calories: 0 },
        { day: "Wed", water: 0, meals: 0, calories: 0 },
        { day: "Thu", water: 0, meals: 0, calories: 0 },
        { day: "Fri", water: 0, meals: 0, calories: 0 },
        { day: "Sat", water: 0, meals: 0, calories: 0 },
        { day: "Sun", water: 0, meals: 0, calories: 0 },
      ];
    }

    return [...history].reverse().map(item => {
      const date = new Date(item.date);
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        water: item.water_intake_ml,
        meals: item.meal_log.filter((m: any) => m.status === 'completed').length,
        calories: 2000
      };
    });
  }, [history]);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  // Show doctors the patient has actually sent consultation requests to
  const consultedDoctors = myConsultations.map((c: any) => ({
    id: c.doctorId?._id || c.doctorId,
    name: c.doctorId?.name || "Unknown Doctor",
    specialty: c.doctorId?.specialty || "General Medicine",
    hospital: c.doctorId?.hospital || "",
    rating: 4.8,
    status: c.status,
  }));

  const statCards = [
    {
      title: "Dosha",
      icon: Bot,
      value: currentUser?.dosha || "Kapha",
      subtitle: "Complete quiz to personalize",
      bgGradient: "from-emerald-500 to-teal-400",
      iconColor: "text-white"
    },
    {
      title: "Water Intake",
      icon: Droplet,
      value: `${progress.waterMl} / ${progress.waterGoalMl} ml`,
      subtitle: `👨‍⚕️ Target set by ${progress.doctorName || 'Dr. Sharma'}`,
      bgGradient: "from-blue-500 to-cyan-400",
      iconColor: "text-white"
    },
    {
      title: "Meals",
      icon: Salad,
      value: `${progress.mealsTaken}/${progress.mealsPlanned}`,
      subtitle: "Monitor meals",
      bgGradient: "from-amber-500 to-yellow-400",
      iconColor: "text-white"
    },
    {
      title: "Last Plan",
      icon: ChefHat,
      value: dietPlan ? dietPlan.date : "None",
      subtitle: "Generate a plan to get started",
      bgGradient: "from-rose-500 to-pink-400",
      iconColor: "text-white"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full mx-auto space-y-4 sm:space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((item, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.bgGradient} rounded-full -mr-12 -mt-12 opacity-10`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-slate-700">{item.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${item.bgGradient} ${item.iconColor} shadow-md`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Section: Left Hydration / Right Doctors + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
          {/* Left: Weekly Hydration */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">Weekly Hydration</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Track your daily water intake</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Droplet className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `${value}ml`}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}ml`, 'Water Intake']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="water"
                        stroke="#0ea5e9"
                        fillOpacity={1}
                        fill="url(#colorWater)"
                        strokeWidth={2.5}
                        dot={{
                          fill: 'white',
                          stroke: '#0ea5e9',
                          strokeWidth: 2,
                          r: 4,
                          strokeDasharray: '0'
                        }}
                        activeDot={{
                          fill: 'white',
                          stroke: '#0ea5e9',
                          strokeWidth: 2,
                          r: 6,
                          strokeDasharray: '0'
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Consulted Doctors on top / Quick Actions below */}
          <div className="space-y-4">
            {/* Consulted Doctors */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
              <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-800">Consulted Doctors</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">Your healthcare providers</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-emerald-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {consultedDoctors.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">You have not requested any consultations yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {consultedDoctors.map((d, idx) => (
                        <Card
                          key={`${d.id}-${idx}`}
                          className="p-3 bg-white/70 backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => setSelectedDoctor(d)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{d.name}</div>
                              <div className="text-xs text-muted-foreground">{d.specialty}</div>
                            </div>
                            <Badge variant={d.status === 'accepted' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {d.status === 'accepted' ? '✓ Accepted' : d.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {/* Connect with Doctor */}
                  <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full flex gap-2">
                        <Stethoscope className="h-4 w-4" /> Connect with Doctor
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Available Doctors</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {doctors.map((d) => (
                          <Card key={d.id} className="p-4 bg-white/70 backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => setSelectedDoctor(d)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">{d.name}</div>
                                <div className="text-xs text-muted-foreground">{d.specialty}</div>
                              </div>
                              <Badge variant="secondary" className="text-sm">
                                ★ {d.rating}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="w-full flex gap-2"
                    onClick={() => navigate('/recipes')}
                  >
                    <ChefHat className="h-4 w-4" /> Generate Recipe
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex gap-2"
                    onClick={() => navigate('/scan')}
                  >
                    <ScanLine className="h-4 w-4" /> Scan Barcode
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Doctor Details Dialog */}
        <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
          <DialogContent className="sm:max-w-2xl">
            {selectedDoctor && (
              <div className="space-y-6">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-2xl">{selectedDoctor.name}</DialogTitle>
                      <DialogDescription className="text-base">
                        {selectedDoctor.specialty}
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm px-2 py-1">
                        ★ {selectedDoctor.rating}
                      </Badge>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">ABOUT</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedDoctor.bio || 'Experienced healthcare professional with a focus on patient wellness and preventive care.'}
                      </p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">SPECIALIZATIONS</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">General Medicine</Badge>
                        {selectedDoctor.specialty && (
                          <Badge variant="outline" className="text-xs">{selectedDoctor.specialty}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">LOCATION</h4>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{selectedDoctor.hospital || 'City General Hospital'}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor.location || '123 Main St, City, Country'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">AVAILABILITY</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedDoctor.availability || 'Monday - Friday, 9:00 AM - 5:00 PM'}
                      </p>
                      {selectedDoctor.experience && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedDoctor.experience} years of experience
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDoctor(null)}
                    className="px-6"
                  >
                    Close
                  </Button>
                  <Button
                    disabled={consultationLoading}
                    onClick={async () => {
                      if (!currentUser) {
                        toast({
                          variant: "destructive",
                          title: "Authentication required",
                          description: "Please sign in to request a consultation."
                        });
                        return;
                      }

                      setConsultationLoading(true);
                      try {
                        await createConsultRequest({
                          doctorId: selectedDoctor.id,
                          patientName: currentUser.name,
                          patientDosha: currentUser.dosha,
                        });

                        setSelectedDoctor(null);
                        await fetchMyConsultations();
                        addNotification({
                          type: "doctor",
                          title: "Consultation requested",
                          message: `We'll connect you with ${selectedDoctor.name} shortly.`
                        });
                        toast({
                          title: "Consultation requested! ✅",
                          description: `Your request to ${selectedDoctor.name} has been sent. Check the status in 'My Consultations'.`
                        });
                      } catch (err: any) {
                        toast({
                          variant: "destructive",
                          title: "Request failed",
                          description: err?.response?.data?.message || "Could not send consultation request."
                        });
                      } finally {
                        setConsultationLoading(false);
                      }
                    }}
                    className="px-6"
                  >
                    {consultationLoading ? "Sending..." : "Request Consultation"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Notifications */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Notifications</CardTitle>
              <Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No notifications yet.</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="flex items-start gap-3 rounded-md border p-2 hover:bg-muted transition-colors">
                      <span className={`mt-1 inline-block h-2 w-2 rounded-full ${n.read ? 'bg-muted' : 'bg-primary'}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{n.message}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] text-muted-foreground">{new Date(n.time).toLocaleTimeString()}</div>
                        <Button variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>Mark read</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Diet Plan */}
        <AnimatePresence>
          {dietPlan && (
            <motion.div key="diet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Weekly Ayurvedic Diet Plan</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{(dietPlan as any).notes || "Prescribed Diet Plan"}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Day Tabs */}
                  {(dietPlan as any).fullPlan && (dietPlan as any).fullPlan.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 border-b">
                      {(dietPlan as any).fullPlan.map((d: any, idx: number) => {
                        const dateLabel = d.formatted_date 
                          ? d.formatted_date 
                          : d.date 
                          ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) 
                          : "";
                        return (
                          <Button
                            key={idx}
                            size="sm"
                            variant={selectedDayIdx === idx ? "default" : "outline"}
                            className="text-xs rounded-full px-3 py-1.5 shrink-0 gap-1.5"
                            onClick={() => setSelectedDayIdx(idx)}
                          >
                            <span className="font-semibold">{idx === 0 ? "Today" : `Day ${idx + 1}`}</span>
                            {dateLabel && <span className="opacity-75 font-normal">({dateLabel})</span>}
                          </Button>
                        );
                      })}
                    </div>
                  )}


                  {/* Meals table for selected day */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                        <tr>
                          <th className="px-3 py-2">Meal Type</th>
                          <th className="px-3 py-2">Items / Meal</th>
                          <th className="px-3 py-2">Nutritional Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          const activeDay = (dietPlan as any).fullPlan?.[selectedDayIdx];
                          const mealsList = activeDay?.meals || dietPlan.meals || [];
                          return mealsList.map((m: any, idx: number) => {
                            const mealType = m.type || "Meal";
                            const itemsText = Array.isArray(m.items) 
                              ? m.items.map((i: any) => i.name).join(", ") 
                              : (m.name || "Balanced Meal");
                            const mTypeLower = (m.type || "").toLowerCase();
                            const cals = m.total_nutrition?.calories || m.calories || (mTypeLower.includes("breakfast") ? 380 : mTypeLower.includes("lunch") ? 580 : mTypeLower.includes("dinner") ? 480 : 210);
                            const protein = m.total_nutrition?.protein || m.protein || (mTypeLower.includes("breakfast") ? 14 : mTypeLower.includes("lunch") ? 22 : mTypeLower.includes("dinner") ? 18 : 6);
                            const carbs = m.total_nutrition?.carbs || m.carbs || (mTypeLower.includes("breakfast") ? 52 : mTypeLower.includes("lunch") ? 75 : mTypeLower.includes("dinner") ? 62 : 28);

                            return (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-medium text-primary">{mealType}</td>
                                <td className="px-3 py-2">{itemsText}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                    <Badge variant="secondary">{cals} kcal</Badge>
                                    {protein > 0 && <Badge variant="outline">{protein}g protein</Badge>}
                                    {carbs > 0 && <Badge variant="outline">{carbs}g carbs</Badge>}
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Dosha balance for active day */}
                  {(dietPlan as any).fullPlan?.[selectedDayIdx]?.daily_dosha_balance && (
                    <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-900 flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold">Daily Dosha Balance:</span>
                      <div className="flex gap-2">
                        {Object.entries((dietPlan as any).fullPlan[selectedDayIdx].daily_dosha_balance).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="bg-white/80">{k}: {String(v)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {aiChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-[350px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Swastha AI</h4>
                    <p className="text-[10px] opacity-80">Online & Ready to help</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setAiChatOpen(false)} className="text-white hover:bg-white/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {aiMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Hello! I'm Swastha AI.</p>
                    <p className="text-xs text-slate-400">Ask me anything about your health or diet.</p>
                  </div>
                )}
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-tr-none shadow-md'
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                      }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  placeholder="Ask a health question..."
                  className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Button onClick={handleAskAi} size="icon" disabled={aiLoading || !aiInput.trim()} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => setAiChatOpen(!aiChatOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-emerald-500 to-teal-400 hover:scale-110 transition-transform duration-300 p-0"
        >
          {aiChatOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Bot className="h-7 w-7 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}
