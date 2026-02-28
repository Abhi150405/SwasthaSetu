import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  User,
  Clock,
  Calendar,
  Activity,
  Heart,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DoctorPatients() {
  const { currentUser, doctors, requests } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

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

  type LastViewedMap = Record<string, number>;
  const lvKey = `app:patients:lastViewed:${doctorProfileId}`;
  const readLV = (): LastViewedMap => {
    try {
      return JSON.parse(localStorage.getItem(lvKey) || "{}");
    } catch {
      return {};
    }
  };
  const writeLV = (m: LastViewedMap) =>
    localStorage.setItem(lvKey, JSON.stringify(m));
  const markViewed = (id: string) => {
    const m = readLV();
    m[id] = Date.now();
    writeLV(m);
  };

  // Get all patients for this doctor
  const myPatients = useMemo(
    () => {
      console.log("DoctorPatients - Filtering patients:", {
        doctorProfileId,
        currentUserId: currentUser?.id,
        allRequests: requests.map(r => ({ id: r.id, doctorId: r.doctorId, status: r.status, patientName: r.patientName }))
      });

      return requests.filter(
        (r) => r.doctorId === doctorProfileId && r.status === "accepted",
      );
    },
    [requests, doctorProfileId, currentUser?.id],
  );

  // Calculate statistics based on available data
  const stats = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Count patients added in the last month
    const recentPatients = myPatients.filter((p) => {
      const patientDate = new Date(p.createdAt);
      return patientDate > monthAgo;
    });

    // Count patients who might need follow-up (using last viewed as a proxy)
    const needsFollowUp = myPatients.filter((p) => {
      const lastViewed = readLV()[p.id];
      if (!lastViewed) return true; // Never viewed
      const lastViewDate = new Date(lastViewed);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastViewDate < weekAgo;
    }).length;

    return {
      total: myPatients.length,
      recent: recentPatients.length,
      needsFollowUp,
    };
  }, [myPatients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lv = readLV();
    const arr = myPatients.filter((r) => {
      const name = (r.patientName || `Patient ${r.userId}`).toLowerCase();
      return q ? name.includes(q) : true;
    });
    return arr.sort((a, b) => {
      const la = lv[a.id];
      const lb = lv[b.id];
      if (la && lb) return lb - la;
      if (la && !lb) return -1;
      if (!la && lb) return 1;
      const na = (a.patientName || `Patient ${a.userId}`).toLowerCase();
      const nb = (b.patientName || `Patient ${b.userId}`).toLowerCase();
      return na.localeCompare(nb);
    });
  }, [query, myPatients]);

  useEffect(() => {
    // ensure lv exists
    if (!localStorage.getItem(lvKey)) writeLV({});
  }, [lvKey]);



  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">
            Patients
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your patients
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search patients..."
              className="pl-10 w-80 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            onClick={() => navigate("/doctor/patients/add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Clean Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total Patients
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Under your care
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Recent Additions
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  +{stats.recent}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Follow-up Needed
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.needsFollowUp}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clean Patients Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                Patient Records
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Manage and view your patients' information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="px-6 py-4 font-medium text-gray-700">
                        Patient
                      </TableHead>
                      <TableHead className="px-4 py-4 font-medium text-gray-700">
                        Last Visit
                      </TableHead>
                      <TableHead className="px-4 py-4 font-medium text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="px-6 py-4 text-right font-medium text-gray-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((patient) => (
                      <TableRow key={patient.id} className="border-b border-gray-100 hover:bg-transparent">
                        <TableCell className="px-6 py-4">
                          <div
                            className="flex items-center space-x-3 cursor-pointer group"
                            onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                          >
                            <Avatar className="h-10 w-10 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                              <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
                                {patient.patientName
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {patient.patientName || `Patient ${patient.userId}`}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Heart className="h-3 w-3 mr-1 text-gray-400" />
                                {patient.patientDosha || "No constitution data"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {new Date(patient.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge className="bg-green-50 text-green-700 border border-green-200">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm whitespace-nowrap"
                              onClick={() =>
                                navigate(`/doctor/patients/${patient.id}`)
                              }
                            >
                              View Profile
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="h-8 w-8 p-0 text-gray-500 flex items-center justify-center"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate(`/doctor/patients/${patient.id}`)}>
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/doctor/messages?patientId=${patient.id}`)}>
                                  Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/doctor/patients/${patient.id}?tab=history`)}>
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((patient) => (
                  <div key={patient.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex items-center space-x-3 flex-1 cursor-pointer group"
                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                      >
                        <Avatar className="h-12 w-12 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                          <AvatarFallback className="bg-gray-100 text-gray-700 font-medium">
                            {patient.patientName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {patient.patientName || `Patient ${patient.userId}`}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Heart className="h-3 w-3 mr-1 text-gray-400" />
                            {patient.patientDosha || "No constitution data"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {new Date(patient.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className="bg-green-50 text-green-700 border border-green-200">
                          Active
                        </Badge>
                        <button
                          className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm whitespace-nowrap"
                          onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No patients found</h3>
              <p className="mt-2 text-sm text-gray-500">
                When you accept patient requests, they'll appear here.
              </p>
              <button
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
                onClick={() => navigate("/doctor/patients/add")}
              >
                Add New Patient
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
