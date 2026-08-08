const isProduction = import.meta.env.PROD;

const getBackendUrl = () => {
  const customUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (customUrl) return customUrl.replace(/\/$/, "");
  // Fallback to live Render backend in production
  if (isProduction) return "https://swasthasetu-4.onrender.com";
  // Relative URL "" lets Vite dev proxy (on port 5173) forward /api calls to local backend (port 5001)
  return "";
};

const BACKEND_URL = getBackendUrl();




export const API_BASE_URL = BACKEND_URL;
export const AI_API_BASE_URL = BACKEND_URL;

export const endpoints = {
    patient: `${BACKEND_URL}/api/patient`,
    doctor: `${BACKEND_URL}/api/doctor`,
    progress: `${BACKEND_URL}/api/progress`,
    ai: `${BACKEND_URL}/api/ai`,
    recipe: `${BACKEND_URL}/api/recipe`,
    diet: `${BACKEND_URL}/api/diet`,
    auth: `${BACKEND_URL}/api/auth`,
    files: `${BACKEND_URL}/api/files`,
};
