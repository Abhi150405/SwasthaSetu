const isProduction = import.meta.env.PROD;

// Use relative paths in production to leverage Vercel proxies
const NODE_BACKEND_URL = isProduction
    ? ""
    : "http://localhost:5000";

const PYTHON_BACKEND_URL = isProduction
    ? ""
    : "http://localhost:5001";

export const API_BASE_URL = NODE_BACKEND_URL;
export const AI_API_BASE_URL = PYTHON_BACKEND_URL;

export const endpoints = {
    patient: `${NODE_BACKEND_URL}/api/patient`,
    doctor: `${NODE_BACKEND_URL}/api/doctor`,
    progress: `${NODE_BACKEND_URL}/api/progress`,
    ai: `${PYTHON_BACKEND_URL}/api/ai`,
    recipe: `${PYTHON_BACKEND_URL}/api/recipe`,
    diet: `${PYTHON_BACKEND_URL}/api/diet`,
};
