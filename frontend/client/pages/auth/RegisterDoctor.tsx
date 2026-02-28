import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/context/app-state";
import { CheckCircle2, Loader2, Stethoscope, Award, MapPin } from "lucide-react";
import axios from "axios";

// —— Clean Google-style UI Components ——
const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl bg-white shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-8 lg:p-12 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = "", variant = "primary", ...props }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  const variants = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5"
  };

  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const Input = ({ className = "", ...props }) => (
  <motion.input
    whileFocus={{ scale: 1.01 }}
    className={`w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 text-sm ${className}`}
    {...props}
  />
);

const Label = ({ children, className = "", ...props }) => (
  <label className={`block text-sm font-medium text-gray-700 mb-2 ${className}`} {...props}>
    {children}
  </label>
);

const Select = ({ children, value, onValueChange, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className={`w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 text-sm ${className}`}
  >
    {children}
  </select>
);

// —— Animation Variants ——
const fieldVariants = {
  initial: { opacity: 0, y: 10 },
  enter: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 }
  })
};

export default function RegisterDoctor() {
  const { setCurrentUser, setDoctorProfile } = useAppState();

  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [hospital, setHospital] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [bio, setBio] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canVerify = useMemo(() => licenseNo.trim().length >= 6, [licenseNo]);
  const canSubmit = useMemo(
    () => !!name && !!email && !!password && !!hospital && !!licenseNo && verified,
    [name, email, password, hospital, licenseNo, verified],
  );

  const onVerify = () => {
    setError(null);
    if (!canVerify) {
      setError("Please enter a valid license number (min 6 characters)");
      return;
    }
    setVerifying(true);
    // Simulate async verification
    setTimeout(() => {
      const ok = /^[A-Za-z0-9-]{6,}$/.test(licenseNo.trim());
      setVerified(ok);
      setVerifying(false);
      if (!ok)
        setError(
          "License verification failed. Check the number and try again.",
        );
    }, 1200);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!canSubmit) {
      setError("Please complete the form and verify your license.");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare the data for the API call
      const doctorData = {
        name,
        email: email.toLowerCase(),
        password,
        dob: age ? `${new Date().getFullYear() - parseInt(age)}-01-01` : new Date().toISOString().split('T')[0], // Convert age to approximate DOB
        gender: gender ? gender.toLowerCase() : 'prefer not to say',
        contact: phone || '0000000000',
        address: location ? { city: location, state: '', country: '' } : { city: '', state: '', country: '' },
        licenseNo,
        hospital,
        specialty: specialty || 'General Practice',
        phone: phone || '0000000000',
        bio: bio || ''
      };

      console.log('Sending doctor registration data:', doctorData);

      // Make API call to register doctor
      const response = await axios.post('/api/doctor/register-doctor', doctorData);

      console.log('Doctor registration response:', response.data);

      // Registration successful - show success message and redirect to login page
      console.log('Doctor registration successful:', response.data);
      setSuccess(true);

      // Show success message and redirect to login
      setTimeout(() => {
        window.location.assign("/login?role=doctor&registered=true");
      }, 2000);

    } catch (err: any) {
      console.error("Doctor registration error:", err);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Could not connect to the server. Please check your internet connection.";
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      <div className="flex h-screen">
        {/* Left Column - Full Height Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-gray-100 to-gray-50 items-center justify-center p-0 relative overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/images/Gemini_Generated_Image_uwnah8uwnah8uwna.png"
              alt="Healthcare professional illustration"
              className="w-full h-full object-cover object-center"
              style={{
                height: '100%',
                width: '100%',
                minHeight: '100vh'
              }}
            />
          </div>
        </motion.div>

        {/* Right Column - Registration Form */}
        <div className="w-full lg:w-3/5 flex items-start justify-center p-6 lg:p-12 overflow-y-auto mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-2xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-green-900 mb-3 font-serif">
                Create doctor account
              </h1>
              <p className="text-green-800/70 text-sm leading-relaxed">
                Join our network of healthcare professionals
              </p>
            </div>

            {/* Back Button */}
            <div className="flex justify-start mb-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 text-green-700 hover:text-green-900 hover:bg-green-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Button>
            </div>

            <Card className="shadow-xl border-green-100/30 bg-white/90 backdrop-blur-md rounded-2xl">
              <CardContent className="p-8 lg:p-10 space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Account created successfully!</p>
                        <p className="text-xs text-green-700 mt-1">Redirecting to login page...</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={0}
                        className="space-y-2"
                      >
                        <Label>Full name</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Dr. A. B. Sharma"
                          required
                        />
                      </motion.div>

                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={1}
                        className="space-y-2"
                      >
                        <Label>Age</Label>
                        <Input
                          type="number"
                          min={0}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="35"
                        />
                      </motion.div>

                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={2}
                        className="space-y-2"
                      >
                        <Label>Gender</Label>
                        <Select
                          value={gender}
                          onValueChange={(v: any) => setGender(v)}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Select>
                      </motion.div>

                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={3}
                        className="space-y-2"
                      >
                        <Label>Phone number</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                        />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={4}
                        className="space-y-2"
                      >
                        <Label>Email address</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@hospital.org"
                          required
                        />
                      </motion.div>

                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={5}
                        className="space-y-2"
                      >
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a secure password"
                          required
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Professional Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={6}
                        className="space-y-2"
                      >
                        <Label>Hospital/Clinic</Label>
                        <Input
                          value={hospital}
                          onChange={(e) => setHospital(e.target.value)}
                          placeholder="City Care Hospital"
                          required
                        />
                      </motion.div>

                      <motion.div
                        variants={fieldVariants}
                        initial="initial"
                        animate="enter"
                        custom={7}
                        className="space-y-2"
                      >
                        <Label>Specialty</Label>
                        <Input
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="Ayurvedic Medicine, Digestive Health"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      variants={fieldVariants}
                      initial="initial"
                      animate="enter"
                      custom={8}
                      className="space-y-2"
                    >
                      <Label>Location</Label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Bengaluru, India"
                      />
                    </motion.div>

                    <motion.div
                      variants={fieldVariants}
                      initial="initial"
                      animate="enter"
                      custom={9}
                      className="space-y-2"
                    >
                      <Label>Medical license number</Label>
                      <div className="flex gap-3">
                        <Input
                          value={licenseNo}
                          onChange={(e) => {
                            setLicenseNo(e.target.value);
                            setVerified(false);
                          }}
                          placeholder="e.g. IN-MED-123456"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={onVerify}
                          disabled={!canVerify || verifying}
                          variant={verified ? "success" : "outline"}
                          className="whitespace-nowrap"
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : verified ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Verified
                            </>
                          ) : (
                            "Verify License"
                          )}
                        </Button>
                      </div>
                      {verified && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          License verified successfully. You can now submit the form.
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div
                      variants={fieldVariants}
                      initial="initial"
                      animate="enter"
                      custom={10}
                      className="space-y-2"
                    >
                      <Label>Professional bio (optional)</Label>
                      <Input
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief description of your experience and expertise..."
                      />
                      <p className="text-xs text-gray-500">
                        This will be displayed on your profile to help patients understand your background
                      </p>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => window.history.back()}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={!canSubmit || isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create doctor account"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <a
                      href="/login?role=doctor"
                      className="text-gray-900 hover:underline font-medium transition-colors duration-300"
                    >
                      Sign in
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}