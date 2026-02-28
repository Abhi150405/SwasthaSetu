import Hero from "@/components/app/Hero";
import Footer from "@/components/app/Footer";
import Features from "@/components/app/Features";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Index() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    // Close mobile menu if open
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-green-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-serif font-light text-green-900">Swasthasetu</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {[
                { name: 'Home', id: 'hero', active: true },
                { name: 'Features', id: 'features', active: false }
              ].map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 ${item.active
                    ? 'text-green-900'
                    : 'text-green-700/70 hover:text-green-900'
                    }`}
                >
                  {item.name}
                  {item.active && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                onClick={() => window.location.assign("/login?role=patient")}
                className="px-4 py-2 text-green-700 hover:text-green-900 font-medium text-sm transition-colors duration-200 border border-green-100 rounded-lg hover:bg-green-50"
              >
                Patient Sign In
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
                onClick={() => window.location.assign("/login?role=doctor")}
                className="px-4 py-2 text-emerald-700 hover:text-emerald-900 font-medium text-sm transition-colors duration-200 border border-emerald-100 rounded-lg hover:bg-emerald-50"
              >
                Doctor Sign In
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                onClick={() => window.location.assign("/register-user")}
                className="ml-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-green-700 hover:bg-green-50 transition-colors duration-200"
            >
              <div className="w-6 h-6 relative">
                <span className={`absolute top-1 left-0 w-6 h-0.5 bg-green-700 transition-all duration-300 ${isMenuOpen ? 'rotate-45 top-3' : ''}`}></span>
                <span className={`absolute top-3 left-0 w-6 h-0.5 bg-green-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute top-5 left-0 w-6 h-0.5 bg-green-700 transition-all duration-300 ${isMenuOpen ? '-rotate-45 top-3' : ''}`}></span>
              </div>
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isMenuOpen ? 1 : 0,
              height: isMenuOpen ? 'auto' : 0
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden overflow-hidden"
          >
            <div className="py-4 space-y-2 border-t border-green-100">
              {[
                { name: 'Home', id: 'hero', active: true },
                { name: 'Features', id: 'features', active: false }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${item.active
                    ? 'bg-green-50 text-green-900'
                    : 'text-green-700/70 hover:bg-green-50 hover:text-green-900'
                    }`}
                >
                  {item.name}
                </button>
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-green-100 mt-4">
                <button
                  onClick={() => window.location.assign("/login?role=patient")}
                  className="w-full px-4 py-3 text-left text-green-700 hover:bg-green-50 font-medium text-sm transition-colors duration-200 rounded-lg"
                >
                  Sign In as Patient
                </button>
                <button
                  onClick={() => window.location.assign("/login?role=doctor")}
                  className="w-full px-4 py-3 text-left text-emerald-700 hover:bg-emerald-50 font-medium text-sm transition-colors duration-200 rounded-lg"
                >
                  Sign In as Doctor
                </button>
                <button
                  onClick={() => window.location.assign("/register-user")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium text-sm rounded-lg transition-all duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Add generous spacing between navbar and hero section */}
      <div className="pt-16 lg:pt-20 -mt-8 lg:-mt-12"></div>
      {/* Hero Section with Enhanced Background */}
      <div id="hero" className="min-h-screen w-full bg-white relative overflow-hidden">


        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/80"></div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(128,128,128,0.05)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(128,128,128,0.03)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-grid-gray-100/[0.02] bg-[length:60px_60px]"></div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -30, 0],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-32 h-32 bg-gray-200/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 40, 0],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-20 right-10 w-40 h-40 bg-gray-200/08 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 20, 0],
              opacity: [0.03, 0.05, 0.03]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
            className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-200/05 rounded-full blur-2xl"
          />
        </div>

        <div className="relative z-30 flex min-h-screen flex-col lg:flex-row">
          {/* Left side - Hero content */}
          <div className="flex-1 flex items-center min-h-[60vh] lg:min-h-screen p-0 bg-transparent">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-full max-w-4xl mr-auto px-4 sm:px-6 lg:px-12"
            >
              <Hero
                onLoginPatient={() => window.location.assign("/login?role=patient")}
                onLoginDoctor={() => window.location.assign("/login?role=doctor")}
                onRegisterUser={() => window.location.assign("/register-user")}
                onRegisterDoctor={() => window.location.assign("/register-doctor")}
              />
            </motion.div>
          </div>

          {/* Right side - Image */}
          <div className="flex-1 flex items-start justify-start min-h-[60vh] lg:min-h-screen p-0 bg-transparent">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 -mt-8 lg:-mt-12"
            >
              <img
                src="/images/image6.png"
                alt="Wellness healthcare illustration"
                className="w-full h-auto object-cover scale-125"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features">
        <Features />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
