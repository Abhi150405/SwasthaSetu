import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function DoctorMessages() {
  const { currentUser, doctors, requests, conversations, addMessage } = useAppState();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const getDoctorProfileId = () => {
    const key = `app:doctor-map:${currentUser?.id || "anon"}`;
    let mapped = localStorage.getItem(key);
    if (!mapped) {
      mapped = doctors[0]?.id || "d1";
      localStorage.setItem(key, mapped);
    }
    return mapped;
  };
  const doctorProfileId = getDoctorProfileId();
  const myPatients = useMemo(() => requests.filter(r => r.doctorId === doctorProfileId && r.status === "accepted"), [requests, doctorProfileId]);
  const activeId = selected || myPatients[0]?.id || null;
  const msgs = activeId ? (conversations[activeId] || []) : [];
  const activePatient = myPatients.find(r => r.id === activeId) || null;

  useEffect(() => {
    if (!activeId) return;
    const has = (conversations[activeId] || []).length > 0;
    if (!has) {
      const name = activePatient?.patientName || `Patient ${activePatient?.userId || ""}`;
      const dosha = activePatient?.patientDosha;
      const greeting = dosha === "Vata"
        ? "Hello doctor, I feel a bit anxious and dry lately. Can we adjust my plan?"
        : dosha === "Pitta"
        ? "Hello doctor, I’ve had some acidity and heat. Please review my meals."
        : dosha === "Kapha"
        ? "Hello doctor, I’m feeling heavy and sluggish. Any lighter options?"
        : "Hello doctor, could you review my diet plan?";
      addMessage(activeId, { from: "system", text: `Consultation started with ${name}.` });
      addMessage(activeId, { from: "patient", text: greeting });
    }
  }, [activeId]);

  const send = () => {
    if (!activeId || !draft.trim()) return;
    addMessage(activeId, { from: "doctor", text: draft.trim() });
    setDraft("");
    setTimeout(() => addMessage(activeId, { from: "patient", text: "Received. Thank you!" }), 300);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Button variant="outline" onClick={()=> navigate(-1)}>Back</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {myPatients.map((r) => {
              const last = (conversations[r.id] || [])[(conversations[r.id] || []).length - 1];
              return (
                <button key={r.id} onClick={() => setSelected(r.id)} className={cn("w-full rounded-md border p-2 text-left hover:bg-muted", activeId === r.id && "bg-muted")}> 
                  <div className="text-sm font-medium">{r.patientName || `Patient ${r.userId}`}</div>
                  <div className="text-xs text-muted-foreground truncate">{last ? `${new Date(last.ts).toLocaleTimeString()} • ${last.text}` : "No messages"}</div>
                </button>
              );
            })}
            {myPatients.length === 0 && <div className="text-sm text-muted-foreground">No active patients</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{activePatient ? `Chat • ${activePatient.patientName || `Patient ${activePatient.userId}`}` : "Chat"}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeId ? (
            <div className="flex h-[520px] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto rounded-md border p-3">
                {msgs.length === 0 && <div className="text-center text-xs text-muted-foreground">No messages yet.</div>}
                {msgs.map((m) => (
                  <div key={m.id} className={m.from === "doctor" ? "flex justify-end" : m.from === "patient" ? "flex justify-start" : "flex justify-center"}>
                    <div className="max-w-[75%]">
                      <div className={m.from === "doctor" ? "text-right text-[10px] text-muted-foreground" : "text-[10px] text-muted-foreground"}>{new Date(m.ts).toLocaleTimeString()}</div>
                      <div className={m.from === "doctor" ? "rounded-2xl bg-primary px-3 py-2 text-primary-foreground shadow-sm" : m.from === "patient" ? "rounded-2xl bg-muted px-3 py-2 shadow-sm" : "rounded-md bg-secondary px-3 py-1 text-xs text-secondary-foreground"}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input placeholder="Type a message" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } }} />
                <Button onClick={send}>Send</Button>
              </div>
              {activePatient?.plan && (
                <div className="mt-3 text-xs text-muted-foreground">Current plan: {activePatient.plan.length} items • {activePatient.plan.reduce((s,p)=>s+(p.calories||0),0)} kcal • {activePatient.plan.reduce((s,p)=>s+(p.waterMl||0),0)} ml water</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a patient to start chatting.</div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
