import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useAppState } from "@/context/app-state";
import { CalendarIcon, Loader2 } from "lucide-react";
import { QUIZ } from "@/data/Quiz";

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
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { className?: string }>(
  ({ className = "", ...props }, ref) => (
    <motion.input
      ref={ref}
      whileFocus={{ scale: 1.01 }}
      className={`w-full px-4 py-3 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-300 text-sm ${className}`}
      {...props}
    />
  )
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

// —— Schemas (unchanged) ——
const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  gender: z.enum(["male", "female", "prefer not to say"], {
    required_error: "Gender is required",
  }),
  dob: z.string().min(1, "Date of birth is required"),
  contact: z
    .string()
    .regex(/^\d{10}$/, "Contact number must be exactly 10 digits"),
  address: z.object({
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
  }),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  height: z.string().optional(),
  weight: z.string().optional(),
  answers: z.record(z.string(), z.number().min(1).max(3)),
  allergies: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
  diseases: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((s) => s.trim()) : [])),
  medical_history: z
    .custom<File | undefined>()
    .refine((file) => !file || file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// —— Animation Variants ——
const stepVariants = {
  initial: { opacity: 0, x: 20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const fieldVariants = {
  initial: { opacity: 0, y: 10 },
  enter: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 }
  })
};

// —— Form Field Components ——
function TextField({
  name,
  label,
  index = 0,
  ...props
}: { name: keyof FormValues; label: string; index?: number } & React.InputHTMLAttributes<HTMLInputElement>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();
  const error = (errors as any)[name];

  return (
    <motion.div
      variants={fieldVariants}
      initial="initial"
      animate="enter"
      custom={index}
      className="space-y-2"
    >
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...props} {...register(name)} />
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </motion.div>
  );
}

function SelectField({
  name,
  label,
  options,
  index = 0,
}: {
  name: keyof FormValues;
  label: string;
  options: { label: string; value: string }[];
  index?: number;
}) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<FormValues>();
  const value = watch(name);
  const error = (errors as any)[name];

  return (
    <motion.div
      variants={fieldVariants}
      initial="initial"
      animate="enter"
      custom={index}
      className="space-y-2"
    >
      <Label>{label}</Label>
      <Select
        value={value as string}
        onValueChange={(v) => setValue(name, v as any, { shouldValidate: true })}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </motion.div>
  );
}

// —— Step Components ——
function StepPersonal() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <div className="space-y-6">
      <TextField name="name" label="Full name" placeholder="Enter your full name" index={0} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          name="gender"
          label="Gender"
          options={[
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Prefer not to say", value: "prefer not to say" },
          ]}
          index={1}
        />

        <motion.div
          variants={fieldVariants}
          initial="initial"
          animate="enter"
          custom={2}
          className="space-y-2"
        >
          <Label>Date of birth</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input type="date" className="pl-10" {...register("dob")} />
          </div>
          {errors.dob && (
            <p className="text-xs text-red-600">{errors.dob.message}</p>
          )}
        </motion.div>
      </div>

      <TextField
        name="contact"
        label="Phone number"
        placeholder="10-digit mobile number"
        inputMode="numeric"
        index={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={fieldVariants}
          initial="initial"
          animate="enter"
          custom={4}
          className="space-y-2"
        >
          <Label>City</Label>
          <Input placeholder="City" {...register("address.city")} />
          {errors.address?.city && (
            <p className="text-xs text-red-600">{errors.address.city.message}</p>
          )}
        </motion.div>

        <motion.div
          variants={fieldVariants}
          initial="initial"
          animate="enter"
          custom={5}
          className="space-y-2"
        >
          <Label>State</Label>
          <Input placeholder="State" {...register("address.state")} />
          {errors.address?.state && (
            <p className="text-xs text-red-600">{errors.address.state.message}</p>
          )}
        </motion.div>

        <motion.div
          variants={fieldVariants}
          initial="initial"
          animate="enter"
          custom={6}
          className="space-y-2"
        >
          <Label>Country</Label>
          <Input placeholder="Country" {...register("address.country")} />
          {errors.address?.country && (
            <p className="text-xs text-red-600">{errors.address.country.message}</p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="height"
          label="Height (cm)"
          type="number"
          placeholder="170"
          index={7}
        />
        <TextField
          name="weight"
          label="Weight (kg)"
          type="number"
          placeholder="65"
          index={8}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          index={9}
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          index={10}
        />
      </div>
    </div>
  );
}

function StepQuiz({
  index,
  setIndex,
  onFinish,
}: {
  index: number;
  setIndex: (n: number) => void;
  onFinish: () => void;
}) {
  const { setValue, watch } = useFormContext<FormValues>();
  const start = index * 2;
  const slice = QUIZ.slice(start, start + 2);
  const answers = watch("answers") || {};
  const setAnswer = (qid: number, val: 1 | 2 | 3) =>
    setValue(`answers.${String(qid)}`, val);
  const canProceed = slice.every((q) => !!answers[String(q.id)]);

  const handleNext = () => {
    if (!canProceed) return;
    if (index < 4) setIndex(index + 1);
    else onFinish();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-normal text-gray-900 mb-2">Health assessment</h3>
        <p className="text-gray-600 text-sm">
          Questions {start + 1}–{Math.min(start + 2, QUIZ.length)} of {QUIZ.length}
        </p>
      </div>

      {slice.map((q, qIndex) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qIndex * 0.1 }}
          className="space-y-4"
        >
          <p className="font-normal text-gray-900">{q.q}</p>
          <div className="space-y-2">
            {[q.a1, q.a2, q.a3].map((label, i) => {
              const opt = (i + 1) as 1 | 2 | 3;
              const active = answers[String(q.id)] === opt;
              return (
                <Button
                  key={opt}
                  type="button"
                  variant={active ? "secondary" : "outline"}
                  className={`w-full text-left justify-start ${active ? "ring-2 ring-gray-900" : ""}`}
                  onClick={() => setAnswer(q.id, opt)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </motion.div>
      ))}

      <div className="flex items-center justify-between pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={!canProceed}>
          {index < 4 ? "Continue" : "Complete"}
        </Button>
      </div>
    </div>
  );
}

function StepMedical({
  onPdfChange,
}: {
  onPdfChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-normal text-gray-900 mb-2">Medical information</h3>
        <p className="text-gray-600 text-sm">Optional details to personalize your care</p>
      </div>

      <motion.div
        variants={fieldVariants}
        initial="initial"
        animate="enter"
        custom={0}
        className="space-y-2"
      >
        <Label>Allergies</Label>
        <Input
          placeholder="e.g., peanuts, pollen (comma-separated)"
          {...register("allergies")}
        />
        <p className="text-xs text-gray-500">Leave blank if none</p>
      </motion.div>

      <motion.div
        variants={fieldVariants}
        initial="initial"
        animate="enter"
        custom={1}
        className="space-y-2"
      >
        <Label>Medical conditions</Label>
        <Input
          placeholder="e.g., diabetes, hypertension (comma-separated)"
          {...register("diseases")}
        />
        <p className="text-xs text-gray-500">Leave blank if none</p>
      </motion.div>

      <motion.div
        variants={fieldVariants}
        initial="initial"
        animate="enter"
        custom={2}
        className="space-y-2"
      >
        <Label>Medical documents</Label>
        <Input
          type="file"
          accept="application/pdf"
          onChange={onPdfChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        <p className="text-xs text-gray-500">Upload reports or prescriptions (PDF only)</p>
        {errors.medical_history && (
          <p className="text-xs text-red-600">{errors.medical_history.message}</p>
        )}
      </motion.div>
    </div>
  );
}

// —— Main Component ——
export default function Register() {
  const { setCurrentUser, addNotification } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  const [quizScreen, setQuizScreen] = useState(0);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gender: undefined,
      dob: "",
      contact: "",
      address: { city: "", state: "", country: "" },
      email: "",
      password: "",
      height: "",
      weight: "",
      answers: {},
      allergies: "",
      diseases: "",
      medical_history: undefined,
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, setError: setFormError, setValue } = methods;

  const nextFromPersonal = async () => {
    const ok = await trigger([
      "name",
      "gender",
      "dob",
      "contact",
      "address.city",
      "address.state",
      "address.country",
      "email",
      "password"
    ]);
    if (ok) setActiveStep(1);
  };

  const determineDosha = (
    answers: Record<string, number>,
  ): "vata" | "pitta" | "kapha" => {
    const counts = { vata: 0, pitta: 0, kapha: 0 };
    Object.values(answers).forEach((v) => {
      if (v === 1) counts.vata++;
      else if (v === 2) counts.pitta++;
      else counts.kapha++;
    });
    const maxCount = Math.max(counts.vata, counts.pitta, counts.kapha);
    if (counts.vata === maxCount) return "vata";
    if (counts.pitta === maxCount) return "pitta";
    return "kapha";
  };

  const handlePdfChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0];
    setValue("medical_history", file, { shouldValidate: true });
  };

  const finalizeRegistration = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);

    // Validate required fields
    if (!values.name || !values.email || !values.password || !values.dob || !values.gender || !values.contact) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (Object.keys(values.answers).length !== QUIZ.length) {
      setFormError("answers", {
        message: `Please answer all ${QUIZ.length} quiz questions.`,
      } as any);
      setActiveStep(1);
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("dob", values.dob);
    formData.append("gender", values.gender);
    formData.append("contact", values.contact);
    formData.append("ayurvedic_category", determineDosha(values.answers));
    formData.append("mode", "online");
    formData.append("address", JSON.stringify([values.address]));

    if (values.height) {
      formData.append("height", values.height);
    }
    if (values.weight) {
      formData.append("weight", values.weight);
    }
    if (values.allergies) {
      formData.append("allergies", values.allergies);
    }
    if (values.diseases) {
      formData.append("diseases", values.diseases);
    }
    if (values.medical_history) {
      formData.append("medical_history", values.medical_history);
    }

    try {
      console.log('Submitting registration with data:', {
        name: values.name,
        email: values.email,
        gender: values.gender,
        dob: values.dob,
        contact: values.contact,
        address: values.address,
        height: values.height,
        weight: values.weight,
        ayurvedic_category: determineDosha(values.answers),
        allergies: values.allergies,
        diseases: values.diseases,
        hasFile: !!values.medical_history
      });

      const response = await axios.post(
        "/api/patient/register-patient",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Registration successful - redirect to login page
      console.log('Patient registration successful:', response.data);

      // Show success message
      addNotification({
        type: "success",
        title: "Registration successful!",
        message: "Your account has been created. Please log in to continue.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.assign("/login?role=patient&registered=true");
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred during registration.";
      setError(errorMessage);

      // Show error notification
      addNotification({
        type: "warning",
        title: "Registration failed",
        message: errorMessage,
      });
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
          className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-yellow-50 to-green-50 items-center justify-center p-0 relative overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/images/image2.png"
              alt="Wellness healthcare illustration"
              className="w-full h-full object-cover object-center"
              style={{
                height: '100%',
                width: '100%',
                minHeight: '100vh'
              }}
            />
          </div>

          {/* Optional overlay content */}
          <div className="relative z-10 max-w-sm text-center px-8">
            <h2 className="text-2xl font-light text-green-900 mb-4 font-serif">
            </h2>
          </div>
        </motion.div>

        {/* Right Column - Registration Form */}
        <div className="w-full lg:w-3/5 flex items-start justify-center p-6 lg:p-12 overflow-y-auto mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-green-900 mb-3 font-serif">
                Create account
              </h1>
              <p className="text-green-800/70 text-sm leading-relaxed">
                Begin your wellness journey with Swasthsetu
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

                {/* Progress Indicator */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    {["Personal", "Assessment", "Medical"].map((label, i) => (
                      <div key={label} className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm ${i < activeStep
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                            : i === activeStep
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 ring-2 ring-green-600 shadow-md"
                              : "bg-green-50 text-green-400"
                            }`}
                        >
                          {i + 1}
                        </div>
                        {i < 2 && (
                          <div
                            className={`w-16 h-px mx-3 transition-colors duration-300 ${i < activeStep ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-green-200"
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-green-700/70 text-center font-medium">
                    Step {activeStep + 1} of 3
                  </p>
                </div>

                <FormProvider {...methods}>
                  <form onSubmit={handleSubmit(finalizeRegistration)}>
                    <AnimatePresence mode="wait" initial={false}>
                      {activeStep === 0 && (
                        <motion.div
                          key="step-1"
                          variants={stepVariants}
                          initial="initial"
                          animate="enter"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                        >
                          <StepPersonal />
                          <div className="mt-8 flex justify-end">
                            <Button
                              type="button"
                              onClick={nextFromPersonal}
                              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-400 shadow-lg hover:shadow-xl hover:shadow-green-500/25"
                            >
                              Continue
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {activeStep === 1 && (
                        <motion.div
                          key="step-2"
                          variants={stepVariants}
                          initial="initial"
                          animate="enter"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                        >
                          <StepQuiz
                            index={quizScreen}
                            setIndex={setQuizScreen}
                            onFinish={() => setActiveStep(2)}
                          />
                        </motion.div>
                      )}

                      {activeStep === 2 && (
                        <motion.div
                          key="step-3"
                          variants={stepVariants}
                          initial="initial"
                          animate="enter"
                          exit="exit"
                          transition={{ duration: 0.3 }}
                        >
                          <StepMedical onPdfChange={handlePdfChange} />
                          <div className="mt-8 flex items-center justify-between">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setActiveStep(1)}
                              className="text-green-700/60 hover:text-green-800 hover:bg-green-50 transition-all duration-300"
                            >
                              Back
                            </Button>
                            <Button
                              type="submit"
                              disabled={isLoading}
                              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-400 shadow-lg hover:shadow-xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                              <span>{isLoading ? "Creating account..." : "Create account"}</span>
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </FormProvider>

                <div className="mt-8 text-center">
                  <p className="text-sm text-green-700/60">
                    Already have an account?{" "}
                    <a
                      href="/login"
                      className="text-green-800 hover:text-green-900 font-medium transition-colors duration-300 underline decoration-green-300 hover:decoration-green-500"
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