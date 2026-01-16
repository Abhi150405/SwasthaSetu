import React, { createContext, useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, XCircle } from "lucide-react";
import axios from 'axios';

// --- START: Clean Google-like UI Components ---
const Card = ({ children, className }) => (
  <div className={`rounded-3xl bg-white shadow-xl border border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className }) => (
  <div className={`p-12 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className, onClick, disabled }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    className={`h-12 w-full rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </motion.button>
);

const Input = ({ className, ...props }) => (
  <motion.input
    whileFocus={{ scale: 1.02 }}
    className={`flex h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all duration-300 ${className}`}
    {...props}
  />
);

const Label = ({ children, className }) => (
  <label className={`text-sm font-medium text-gray-700 mb-2 block ${className}`}>
    {children}
  </label>
);

const AppStateContext = createContext(null);

const AppStateProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
  }), [currentUser]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === null) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};

const ErrorModal = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
  >
    <motion.div
      initial={{ scale: 0.9, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 50 }}
      className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
    >
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">Unable to sign in</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors duration-300"
      >
        Try again
      </motion.button>
    </motion.div>
  </motion.div>
);

export function Login() {
  const { setCurrentUser } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const role = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    return r === "doctor" ? "doctor" : "patient";
  }, []);

  const API_URL = role === "doctor" ? "/api/doctor" : "/api/patient";

  async function handleLogin() {
    setError(null);
    setIsLoading(true);
    setShowModal(false);

    if (!email || !password) {
      setError("Please enter your email and password");
      setIsLoading(false);
      setShowModal(true);
      return;
    }

    try {
      const loginEndpoint = role === "doctor" ? "login-doctor" : "login-patient";
      const response = await axios.post(`${API_URL}/${loginEndpoint}`, { email, password });

      const data = response.data;
      const user = {
        id: data.data.user._id,
        name: data.data.user.name,
        email: data.data.user.email,
        role: data.data.user.role,
      };
      
      localStorage.setItem("app:currentUser", JSON.stringify(user));
      setCurrentUser(user);

      setTimeout(() => {
        if (user.role === "doctor") {
          window.location.assign("/doctor");
        } else {
          window.location.assign("/dashboard");
        }
      }, 100);

    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        setError(err.response.data.message || "Login failed. Please check your credentials.");
      } else if (err.request) {
        setError("Could not connect to the backend server. Please ensure it is running.");
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Clean gradient background */}
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {/* Brand header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Swasthasetu
              </h1>
              <p className="text-gray-500 text-sm font-light">
                स्वास्थ्य सेतु
              </p>
            </motion.div>

            <Card>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-8 text-center"
                >
                  <h2 className="text-2xl font-light text-gray-900 mb-2">
                    Welcome back
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Sign in to your {role} account
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <Label>Email address</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-8 text-center"
                >
                  <p className="text-gray-500 text-sm">
                    Don't have an account?{" "}
                    <a
                      className="text-gray-900 hover:underline font-medium transition-colors duration-300"
                      href={role === "doctor" ? "/register-doctor" : "/register-user"}
                    >
                      Create account
                    </a>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {showModal && <ErrorModal message={error} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Login />
    </AppStateProvider>
  );
}