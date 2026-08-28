"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/app-state";
import { API_BASE_URL } from "@/lib/api-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Clock,
  CheckCircle,
  Users,
  FileText,
  Activity,
  Calendar,
  ArrowLeft
} from "lucide-react";

type ConsultationRecord = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  patientName: string;
  patientDosha: string;
  symptoms: string;
  createdAt: string;
  updatedAt?: string;
  acceptedDate?: string;
  patientId?: { name: string; dosha?: string; age?: number; gender?: string; phone?: string };
};

export default function DoctorDashboard() {
  const { currentUser, updateConsultRequestStatus } = useAppState();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<ConsultationRecord | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConsultations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/consultation/doctor`, {
        withCredentials: true,
      });
      if (res.data.success) {
        const mapped = res.data.data.map((c: any) => ({
          id: c._id || c.id,
          status: c.status,
          patientName: c.patientName || c.patientDetails?.name || (typeof c.patientId === "object" ? c.patientId?.name : undefined) || "Unknown",
          patientDosha: c.patientDosha || c.patientDetails?.dosha || (typeof c.patientId === "object" ? c.patientId?.dosha : undefined) || "N/A",
          symptoms: c.symptoms || "No symptoms provided",
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          acceptedDate: c.status === "accepted" ? c.updatedAt : undefined,
          patientId: c.patientDetails || (typeof c.patientId === "object" ? c.patientId : undefined),
        }));
        setConsultations(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch doctor consultations:", e);
    }
  };

  useEffect(() => {
    if (currentUser) fetchConsultations();
  }, [currentUser]);

  const pendingRequests = useMemo(() =>
    consultations.filter(c => c.status === "pending"),
    [consultations]
  );

  const stats = useMemo(() => ({
    pending: consultations.filter(c => c.status === "pending").length,
    active: consultations.filter(c => c.status === "accepted").length,
    consulted: consultations.filter(c => c.status === "completed").length,
    total: consultations.length,
  }), [consultations]);

  const getPatientName = (r: ConsultationRecord) => r.patientName;
  const getPatientDosha = (r: ConsultationRecord) => r.patientDosha;
  const getPatientAge = (r: ConsultationRecord) => r.patientId?.age || 0;
  const getPatientGender = (r: ConsultationRecord) => r.patientId?.gender || "N/A";
  const getPatientSymptoms = (r: ConsultationRecord) => r.symptoms;
  const getPatientWeight = (_r: ConsultationRecord) => null;
  const getPatientHeight = (_r: ConsultationRecord) => null;
  const getPatientEmergencyContact = (_r: ConsultationRecord) => "Contact via platform";
  const getPatientLifestyle = (_r: ConsultationRecord) => "Not provided";
  const getPatientDocuments = (_r: ConsultationRecord) => [];

  const handleSelectPatient = (request: ConsultationRecord) => {
    setSelectedPatient(request);
    setSearchParams({ patient: request.id });
  };

  const handleUpdateStatus = async (id: string, status: "accepted" | "rejected") => {
    setActionLoading(id + status);
    try {
      await updateConsultRequestStatus(id, status);
      await fetchConsultations();
      if (selectedPatient?.id === id) {
        setSelectedPatient(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      console.error("Failed to update consultation status:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = (id: string) => handleUpdateStatus(id, "accepted");
  const handleRejectRequest = (id: string) => handleUpdateStatus(id, "rejected");

  // Load selected patient from URL on mount
  useEffect(() => {
    const patientId = searchParams.get("patient");
    if (patientId) {
      const record = consultations.find(c => c.id === patientId);
      if (record) setSelectedPatient(record);
    }
  }, [searchParams, consultations]);

  // If a patient is selected, show patient details
  if (selectedPatient) {
    return (
      <div className="p-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPatient(null);
              setSearchParams({});
            }}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Header Card */}
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-semibold text-blue-700">
                      {getPatientName(selectedPatient)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{getPatientName(selectedPatient)}</h2>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{getPatientGender(selectedPatient)}, {getPatientAge(selectedPatient)} years</span>
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {getPatientDosha(selectedPatient)} Constitution
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/doctor/patients/${selectedPatient.id}`)}
                      >
                        View Full Profile
                      </Button>
                    </div>
                    <div className="mt-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-orange-800">Chief Complaint:</span> {getPatientSymptoms(selectedPatient)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-gray-900">Patient Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Physical Metrics</label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Weight:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getPatientWeight(selectedPatient) ? `${getPatientWeight(selectedPatient)} kg` : "Not provided"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Height:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {getPatientHeight(selectedPatient) ? `${getPatientHeight(selectedPatient)} cm` : "Not provided"}
                          </span>
                        </div>
                        {getPatientWeight(selectedPatient) && getPatientHeight(selectedPatient) && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">BMI:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {(Number(getPatientWeight(selectedPatient)) / Math.pow(Number(getPatientHeight(selectedPatient)) / 100, 2)).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Information</label>
                      <div className="mt-2">
                        <p className="text-sm text-gray-900">
                          {getPatientEmergencyContact(selectedPatient)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lifestyle & Background</label>
                      <p className="mt-2 text-sm text-gray-900 leading-relaxed">
                        {getPatientLifestyle(selectedPatient)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Documents */}
                {getPatientDocuments(selectedPatient).length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Medical Documents ({getPatientDocuments(selectedPatient).length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {getPatientDocuments(selectedPatient).map((doc: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                          </div>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Consultation Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-gray-900">Consultation Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${selectedPatient.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : selectedPatient.status === 'accepted'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-gray-50 text-gray-800 border border-gray-200'
                      }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${selectedPatient.status === 'pending' ? 'bg-yellow-500' :
                        selectedPatient.status === 'accepted' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                    </div>
                  </div>

                  {selectedPatient.status === "pending" && (
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleAcceptRequest(selectedPatient.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Consultation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectRequest(selectedPatient.id)}
                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Decline Request
                      </Button>
                    </div>
                  )}

                  {selectedPatient.status === "accepted" && (
                    <div className="text-center text-sm text-gray-600">
                      <p>Consultation accepted on</p>
                      <p className="font-medium text-gray-900">
                        {selectedPatient.acceptedDate
                          ? new Date(selectedPatient.acceptedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : 'Date not available'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Patient Timeline */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-medium text-gray-900">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Request Submitted</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedPatient.createdAt || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {selectedPatient.acceptedDate && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Consultation Accepted</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedPatient.acceptedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="p-6">
      {/* Clean Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        {/* Pending Card */}
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        {/* Active Card */}
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Active
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Under treatment
            </p>
          </CardContent>
        </Card>

        {/* Completed Card */}
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.consulted}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Consultations done
            </p>
          </CardContent>
        </Card>

        {/* Total Card */}
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Total
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              All patients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clean Consultation Requests */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">
                Consultation Requests
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Review and manage patient requests
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <span className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200">
                {pendingRequests.length} pending
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No pending requests</h3>
              <p className="text-sm text-gray-500">
                All consultation requests have been reviewed
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingRequests.map((request, index) => (
                <div
                  key={request.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex space-x-4 cursor-pointer group"
                      onClick={() => handleSelectPatient(request)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                        <span className="text-sm font-medium text-gray-700">
                          {getPatientName(request)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {getPatientName(request)}
                          </h4>
                          <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200">
                            {getPatientDosha(request)}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500 space-x-4">
                          <span>{getPatientGender(request)?.toLowerCase() || 'N/A'}, {getPatientAge(request)} years</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(request.createdAt || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Chief complaint:</span> {getPatientSymptoms(request)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectPatient(request)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!actionLoading}
                        onClick={() => handleRejectRequest(request.id)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {actionLoading === request.id + "rejected" ? "..." : "Decline"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={!!actionLoading}
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {actionLoading === request.id + "accepted" ? "..." : "Accept"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
