import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/user/Dashboard.tsx";
import DoctorDashboard from "./pages/doctor/DoctorDashboard.tsx";
// import DoctorDashboard from "./pages/doctor/NewDoctorDashboard.tsx";
import DoctorPatients from "./pages/doctor/DoctorPatients.tsx";
import AddPatient from "./pages/doctor/AddPatient.tsx";
import DoctorPatientView from "./pages/doctor/DoctorPatientView.tsx";
import DoctorDietGenerator from "./pages/doctor/DoctorDietGenerator";
import DoctorRecipeGenerator from "./pages/doctor/DoctorRecipeGenerator.tsx";
import DoctorProfile from "./pages/doctor/DoctorProfile.tsx";
import Tracking from "./pages/user/Tracking.tsx";
import Recipes from "./pages/user/Recipes.tsx";
import Scan from "./pages/user/Scan.tsx";
import UserProfile from "./pages/user/UserProfile.tsx";
import { AppLayout } from "./components/app/Layout";
import { AppStateProvider, useAppState } from "@/context/app-state";
import { lazy, Suspense } from "react";
import RegisterUser from "./pages/auth/RegisterUser.tsx";
import RegisterDoctor from "./pages/auth/RegisterDoctor.tsx";
import Login from "./pages/auth/Login.tsx";
import TestRegistration from "./pages/auth/TestRegistration.tsx";
const DoctorMessagesLazy = lazy(
  () => import("./pages/doctor/DoctorMessages.tsx"),
);

const MessagesPageLazy = lazy(() => import("./pages/messages"));
const DoctorChatLazy = lazy(() => import("./pages/messages/[doctorId]"));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAppState();
  if (!currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const UserGuard: React.FC = () => {
  const { currentUser } = useAppState();
  if (currentUser?.role !== "patient") return <Navigate to="/doctor" replace />;
  return <Outlet />;
};

const DoctorGuard: React.FC = () => {
  const { currentUser } = useAppState();
  if (currentUser?.role !== "doctor")
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register-user" element={<RegisterUser />} />
    <Route path="/register-doctor" element={<RegisterDoctor />} />
    <Route path="/test-registration" element={<TestRegistration />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route element={<UserGuard />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/scan" element={<Scan />} />
        <Route
          path="/messages"
          element={
            <Suspense fallback={null}>
              <MessagesPageLazy />
            </Suspense>
          }
        />
        <Route
          path="/messages/:doctorId"
          element={
            <Suspense fallback={null}>
              <DoctorChatLazy />
            </Suspense>
          }
        />
      </Route>
      <Route element={<DoctorGuard />}>
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/patients" element={<DoctorPatients />} />
        <Route path="/doctor/patients/add" element={<AddPatient />} />
        <Route path="/doctor/patients/:id" element={<DoctorPatientView />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route
          path="/doctor/generator/diet"
          element={<DoctorDietGenerator />}
        />
        <Route
          path="/doctor/generator/recipes"
          element={<DoctorRecipeGenerator />}
        />
        <Route
          path="/doctor/messages"
          element={
            <Suspense fallback={null}>
              <DoctorMessagesLazy />
            </Suspense>
          }
        />
      </Route>
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <AppStateProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppStateProvider>
  </TooltipProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
