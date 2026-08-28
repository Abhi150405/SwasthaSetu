import React, { useEffect, useMemo, useState, useRef } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ArrowLeft, Send, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DoctorMessages() {
  const { currentUser, doctors, requests, conversations, addMessage, setMessagingMounted, setActiveChatId } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get("patientId");
  const paramPatientName = searchParams.get("patientName");

  const [selected, setSelected] = useState<string | null>(paramPatientId || null);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiPatients, setApiPatients] = useState<any[]>([]);

  // Fetch doctor's assigned patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/doctor/patients`, { credentials: "include" });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setApiPatients(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch doctor patients for messages:", err);
      }
    };
    if (currentUser?.role === "doctor") {
      fetchPatients();
    }
  }, [currentUser]);

  // Derive complete patient list for doctor
  const myPatients = useMemo(() => {
    const patientMap = new Map<string, { id: string; name: string; email?: string; dosha?: string; plan?: any[] }>();

    // 1. Add patients from API (/api/doctor/patients)
    apiPatients.forEach((p) => {
      const pid = p.id || p._id || p.userId;
      if (pid) {
        patientMap.set(String(pid), {
          id: String(pid),
          name: p.name || p.patientName || `Patient ${String(pid).slice(-4)}`,
          email: p.email,
          dosha: p.dosha || p.ayurvedic_category,
        });
      }
    });

    // 2. Add patients from requests
    const docId = currentUser?.id;
    requests.forEach((r) => {
      if (!docId || r.doctorId === docId || r.doctorId === "d1") {
        const pid = r.userId || r.id;
        if (pid && !patientMap.has(String(pid))) {
          patientMap.set(String(pid), {
            id: String(pid),
            name: r.patientName || `Patient ${String(pid).slice(-4)}`,
            dosha: r.patientDosha,
            plan: r.plan,
          });
        }
      }
    });

    // 3. Add URL query patient if specified and not yet in list
    if (paramPatientId && !patientMap.has(paramPatientId)) {
      patientMap.set(paramPatientId, {
        id: paramPatientId,
        name: paramPatientName ? decodeURIComponent(paramPatientName) : `Patient ${paramPatientId.slice(-4)}`,
      });
    }

    let list = Array.from(patientMap.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [apiPatients, requests, currentUser, paramPatientId, paramPatientName, searchQuery]);

  // Active selected patient ID
  const activeId = selected || paramPatientId || myPatients[0]?.id || null;
  const msgs = activeId ? (conversations[activeId] || []) : [];
  const activePatient = myPatients.find((p) => p.id === activeId) || (activeId === paramPatientId ? { id: paramPatientId, name: paramPatientName ? decodeURIComponent(paramPatientName) : "Patient" } : null);

  useEffect(() => {
    setMessagingMounted(true);
    return () => setMessagingMounted(false);
  }, []);

  useEffect(() => {
    setActiveChatId(activeId);
    return () => setActiveChatId(null);
  }, [activeId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    if (!activeId || !draft.trim()) return;
    addMessage(activeId, { from: "doctor", text: draft.trim() });
    setDraft("");
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Patient Messages</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Sidebar - Patient List */}
        <Card className="md:col-span-1 border-0 shadow-sm flex flex-col h-[calc(100vh-180px)]">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-base font-semibold mb-2">Patients</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-2 overflow-y-auto flex-1">
            <div className="space-y-1">
              {myPatients.map((p) => {
                const thread = conversations[p.id] || [];
                const last = thread[thread.length - 1];
                const isSelected = activeId === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors flex items-center gap-3 border border-transparent",
                      isSelected ? "bg-primary/10 border-primary/20 text-primary font-medium" : "hover:bg-muted/60"
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {last && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(last.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {last ? last.text : "No messages yet"}
                      </div>
                    </div>
                  </button>
                );
              })}
              {myPatients.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No patients found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Panel */}
        <Card className="md:col-span-2 border-0 shadow-sm flex flex-col h-[calc(100vh-180px)]">
          <CardHeader className="p-4 border-b flex flex-row items-center gap-3">
            {activePatient ? (
              <>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {activePatient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-semibold">{activePatient.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">Active Consultation Chat</p>
                </div>
              </>
            ) : (
              <CardTitle className="text-base font-semibold">Select a Patient</CardTitle>
            )}
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
            {activeId ? (
              <div className="flex flex-col h-full justify-between">
                {/* Messages scroll container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
                  {msgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm font-medium">No messages yet with {activePatient?.name}.</p>
                      <p className="text-xs opacity-75">Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    msgs.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          m.from === "doctor" ? "justify-end" : m.from === "patient" ? "justify-start" : "justify-center"
                        )}
                      >
                        <div className="max-w-[75%] space-y-1">
                          <div className={cn("text-[10px] text-muted-foreground", m.from === "doctor" && "text-right")}>
                            {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2 text-sm shadow-sm leading-relaxed",
                              m.from === "doctor"
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : m.from === "patient"
                                ? "bg-muted text-foreground rounded-tl-none border"
                                : "bg-secondary text-secondary-foreground text-xs py-1 px-3 rounded-md"
                            )}
                          >
                            {m.text}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Controls */}
                <div className="flex items-center gap-2 border-t pt-3">
                  <Input
                    placeholder={`Message ${activePatient?.name || "patient"}...`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        send();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={send} disabled={!draft.trim()}>
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <User className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-base font-medium">Select a patient to start chatting</p>
                <p className="text-xs max-w-sm mt-1">
                  Choose a patient from the sidebar to view message history or send medical guidance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
