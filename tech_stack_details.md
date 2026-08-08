# 🏗️ SwasthaSetu: Tech Stack Analysis

SwasthaSetu is a high-performance, AI-driven healthcare platform architected with a modern React frontend and a Python FastAPI backend for core logic, authentication, data persistence, and generative AI features.

---

## 🎨 1. Frontend: The Patient & Doctor Interface
The frontend is a modern **Single Page Application (SPA)** built with **React** and **Vite**, prioritizing performance and accessibility.

### **Core Framework & Runtime**
- **React 18**: Utilizing modern features like React Hooks and concurrent rendering.
- **Vite**: Ultra-fast build tool and dev server.
- **TypeScript**: Ensuring type safety across all components and API layers.
- **PNPM**: High-efficiency package management.

### **UI & Styling System**
- **Tailwind CSS 3**: Utility-first CSS for rapid, responsive UI development.
- **Radix UI**: Unstyled, accessible UI primitives (Accordion, Dialog, Select, etc.) forming the backbone of the UI system.
- **Shadcn UI**: The project follows the Radix-Tailwind component pattern for premium aesthetic and accessibility.
- **Framer Motion**: Smooth, high-fidelity animations and transitions.
- **Lucide React**: Vector icons for clear visual hierarchy.
- **Next Themes**: Seamless light/dark mode transitions.

### **Graphics & Visualization**
- **Three.js**: Integrated via `@react-three/fiber` and `@react-three/drei` for 3D medical visualizations or interactive elements.
- **Recharts**: D3-based charting for patient vitals and health analytics.

### **State & Data Management**
- **TanStack Query (React Query) v5**: Powerful asynchronous state management for data fetching and caching.
- **Axios**: Promised-based HTTP client for API interactions.
- **React Hook Form**: Performant form management.
- **Zod**: Schema-based validation for all forms and API data.

---

## 🤖 2. Backend Service (Python/FastAPI)
The Python FastAPI backend serves as the unified service handling authentication, medical records, AI tasks, and data management.

### **Service Architecture**
- **FastAPI**: Modern, high-performance async Python framework.
- **Uvicorn**: ASGI server implementation for FastAPI.
- **Pydantic**: Data validation and settings management using Python type hints.

### **AI & LLM Integration**
- **LangChain**: Framework for building context-aware applications using LLMs.
- **Google Generative AI (Gemini)**: Powers medical report analysis, personalized diet plans, and recipe generation.
- **LangChain Google GenAI**: Integration for Google's Gemini models.

### **Database & Security**
- **Motor / Beanie / PyMongo**: Asynchronous Python ODM/driver for MongoDB.
- **Passlib & Bcrypt**: Password hashing and authentication verification.
- **Python-jose / JWT**: Token-based authentication and secure session management.

---

## 🌉 4. Shared Utilities & Infrastructure
- **Vercel**: Primarily used for frontend hosting and edge functions.
- **Render**: Utilized for hosting long-running backend services.
- **PostCSS & Autoprefixer**: CSS post-processing for browser compatibility.
- **Prettier & Vitest**: Ensuring code quality and automated testing.
- **jspdf & jspdf-autotable**: Client-side generation of health reports and certificates in PDF format.
