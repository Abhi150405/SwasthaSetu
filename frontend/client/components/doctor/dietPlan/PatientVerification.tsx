import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

type Props = {
  requests: any[];
  patientId: string;
  setPatientId: (id: string) => void;
  onVerified: (name: string) => void;
};

export default function PatientVerification({
  requests,
  patientId,
  setPatientId,
  onVerified,
}: Props) {
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = patientId.trim().toLowerCase();
    if (!q) return [] as any[];
    const seen: Record<string, boolean> = {};
    // match by userId startsWith or name includes
    const list = requests
      .filter(
        (r) =>
          r.userId.toLowerCase().startsWith(q) ||
          (r.patientName || "").toLowerCase().includes(q),
      )
      .filter((r) => {
        if (seen[r.userId]) return false;
        seen[r.userId] = true;
        return true;
      })
      .slice(0, 8);
    return list;
  }, [patientId, requests]);

  const fetchPatient = () => {
    const q = patientId.trim().toLowerCase();
    const match = requests.find(
      (r) =>
        r.userId.toLowerCase() === q ||
        (r.patientName || "").toLowerCase() === q,
    );
    if (match) {
      setFetchedName(match.patientName || `Patient ${match.userId}`);
      setFetchError(null);
    } else {
      setFetchedName(null);
      setFetchError("No patient found. Try full ID or part of the name.");
    }
  };

  useEffect(() => {
    if (patientId && !fetchedName && !fetchError) {
      // don't auto-open dropdown on init
      fetchPatient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Input
            placeholder="Enter Patient ID or Name"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setOpen(true);
              setFetchError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchPatient();
              if (e.key === "Escape") setOpen(false);
            }}
            onFocus={() => patientId && setOpen(true)}
          />
          {open && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-sm">
              <ul className="max-h-64 overflow-auto py-1">
                {suggestions.map((s) => (
                  <li key={s.userId}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setPatientId(s.userId);
                        setFetchedName(s.patientName || `Patient ${s.userId}`);
                        setFetchError(null);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                    >
                      <User className="h-4 w-4 opacity-70" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {s.patientName || `Patient ${s.userId}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {s.userId}
                          {s.patientDosha ? ` • Dosha: ${s.patientDosha}` : ""}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Button onClick={fetchPatient}>Fetch Patient</Button>
      </div>

      {fetchedName && (
        <div className="mt-3 rounded-md border bg-secondary/30 p-3">
          <div className="font-medium">{fetchedName}</div>
          <div className="mt-2 text-sm">Is this the correct patient?</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => onVerified(fetchedName)}>
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFetchedName(null);
                setPatientId("");
                setOpen(false);
              }}
            >
              No
            </Button>
          </div>
        </div>
      )}
      {fetchError && (
        <div className="mt-3 text-sm text-destructive">{fetchError}</div>
      )}
    </div>
  );
}
