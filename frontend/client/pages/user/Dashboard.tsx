import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, type Doctor } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChefHat, Salad, Stethoscope, ScanLine, Bot, Droplet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

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
  } = useAppState();

  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor & {
    experience?: string;
    bio?: string;
    hospital?: string;
    location?: string;
    availability?: string;
  } | null>(null);

  const chartData = useMemo(() => ([
    {
      day: "Mon",
      water: 1200,
      meals: 2,
      calories: 1600
    },
    {
      day: "Tue",
      water: 1800,
      meals: 3,
      calories: 1950
    },
    {
      day: "Wed",
      water: 2200,
      meals: 4,
      calories: 2100
    },
    {
      day: "Thu",
      water: 2500,
      meals: 3,
      calories: 2300
    },
    {
      day: "Fri",
      water: 2000,
      meals: 3,
      calories: 1900
    },
    {
      day: "Sat",
      water: 1500,
      meals: 2,
      calories: 1750
    },
    {
      day: "Sun",
      water: 1900,
      meals: 4,
      calories: 2050
    }
  ]), []);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  // For demo purposes, show all doctors as consulted
  const consultedDoctors = [...doctors];
  
  // In a real app, you would use this logic:
  // const consultedDoctorIds = requests.map(r => r.doctorId);
  // const consultedDoctors = doctors.filter(d => consultedDoctorIds.includes(d.id));

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
      subtitle: "Track hydration",
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
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
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
                    <div className="text-sm text-muted-foreground">You have not consulted any doctors yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {consultedDoctors.map((d) => (
                        <Card 
                          key={d.id} 
                          className="p-3 bg-white/70 backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => setSelectedDoctor(d)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{d.name}</div>
                              <div className="text-xs text-muted-foreground">{d.specialty}</div>
                            </div>
                            <Badge variant="secondary">★ {d.rating}</Badge>
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
                    onClick={() => {
                      if (!currentUser) {
                        toast({
                          variant: "destructive",
                          title: "Authentication required",
                          description: "Please sign in to request a consultation."
                        });
                        return;
                      }
                      
                      const newRequest = {
                        id: `req_${Date.now()}`,
                        userId: currentUser.id,
                        doctorId: selectedDoctor.id,
                        status: "pending" as const,
                        createdAt: new Date().toISOString(),
                        patientName: currentUser.name,
                        patientDosha: currentUser.dosha
                      };
                      
                      setRequests([...requests, newRequest]);
                      setSelectedDoctor(null);
                      addNotification({
                        type: "doctor",
                        title: "Consultation requested",
                        message: `We'll connect you with Dr. ${selectedDoctor.name} shortly.`
                      });
                      toast({
                        title: "Consultation requested",
                        description: `We'll connect you with Dr. ${selectedDoctor.name} shortly. You'll see updates in Notifications.`
                      });
                    }}
                    className="px-6"
                  >
                    Request Consultation
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
                <CardHeader>
                  <CardTitle>Diet Plan for {dietPlan.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                        <tr>
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Meal</th>
                          <th className="px-3 py-2">Properties</th>
                          <th className="px-3 py-2">Calories</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dietPlan.meals.map((m, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{m.time}</td>
                            <td className="px-3 py-2">{m.name}</td>
                            <td className="px-3 py-2 flex flex-wrap gap-1">
                              {m.properties.map((p, i) => (
                                <Badge key={i} variant="secondary">{p}</Badge>
                              ))}
                            </td>
                            <td className="px-3 py-2">{m.calories}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
