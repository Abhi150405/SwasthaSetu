import React from "react";
import { motion } from "framer-motion";

// Updated Hero Component - v2.0

export const Hero: React.FC<{
  onLoginUser?: () => void;
  onRegisterUser?: () => void;
  onRegisterDoctor?: () => void;
}> = ({ onLoginUser, onRegisterUser, onRegisterDoctor }) => {

  return (
    <section
      key="hero-v2"
      aria-label="Hero"
      className="relative min-h-[60vh] lg:min-h-screen w-full flex items-end pt-16 lg:pt-20 overflow-hidden"
    >

      {/* Content positioned at bottom-left */}
      <div className="w-full px-6 sm:px-8 lg:px-16 pb-16 sm:pb-20 lg:pb-28">
        <div className="w-full">

          {/* Brand Name - With striking Marathi background effect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-10 lg:mb-12 relative"
          >
            {/* Marathi text - Large background with stroke effect */}
            <motion.div
              initial={{ opacity: 0, scale: 1.2, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              className="absolute -inset-8 flex items-center justify-center overflow-hidden"
            >
              <div
                className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light select-none pointer-events-none transform -rotate-3"
                style={{
                  WebkitTextStroke: '1px rgba(21, 128, 59, 0.3)',
                  color: 'transparent',
                  textShadow: '0 0 30px rgba(21, 128, 59, 0.2)'
                }}
              >
                स्वास्थ्य सेतु
              </div>
            </motion.div>

            {/* Marathi text - Glowing effect layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              className="absolute -inset-8 flex items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light select-none pointer-events-none transform -rotate-3 text-green-600/30 blur-sm"
              >
                स्वास्थ्य सेतु
              </motion.div>
            </motion.div>

            {/* Marathi text - Animated particles effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
              className="absolute -inset-8 flex items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light select-none pointer-events-none transform -rotate-3"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(21, 128, 59, 0.15) 50%, transparent 70%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                स्वास्थ्य सेतु
              </motion.div>
            </motion.div>

            {/* Main brand name with enhanced styling */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="relative z-10 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-light leading-tight"
              style={{
                color: '#15803b',
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(21, 128, 61, 0.1)'
              }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                className="inline-block"
              >
                Swasthasetu
              </motion.span>
            </motion.h1>

            {/* Enhanced accent elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1, ease: "easeOut" }}
              className="relative z-10 mt-6 flex items-center space-x-4"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60px" }}
                transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
                className="h-px bg-gradient-to-r from-green-800/60 to-transparent"
              />
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-green-800/60 rounded-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "40px" }}
                transition={{ duration: 1, delay: 1.4, ease: "easeOut" }}
                className="h-px bg-gradient-to-r from-green-800/40 to-transparent"
              />
            </motion.div>
          </motion.div>

          {/* Main Message - Clean sans-serif */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-xl sm:text-2xl lg:text-3xl text-green-900/90 mb-10 lg:mb-14 font-sans font-light leading-relaxed max-w-3xl"
          >
            Your bridge to holistic wellness through ancient Ayurvedic wisdom
          </motion.p>

          {/* Action Buttons - Clean minimal design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8"
          >
            {/* Patient Button - Clean white design */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              whileHover={{ x: 8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRegisterUser}
              className="group w-full sm:w-auto flex items-center justify-between bg-green-900/90 backdrop-blur-sm hover:bg-green-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-800/30"
            >
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="text-left">
                  <div className="font-sans font-semibold text-base sm:text-lg text-white">Get Started</div>
                  <div className="font-sans text-xs sm:text-sm text-gray-100">Begin your wellness journey</div>
                </div>
              </div>
              <div className="text-gray-200 group-hover:text-white transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>

            {/* Doctor Button - Subtle glass design */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              whileHover={{ x: 8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRegisterDoctor}
              className="group w-full sm:w-auto flex items-center justify-between bg-green-800/10 backdrop-blur-md hover:bg-green-800/20 text-green-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-700/20"
            >
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-900/80 rounded-full"></div>
                <div className="text-left">
                  <div className="font-sans font-semibold text-base sm:text-lg text-green-900">Join as Doctor</div>
                  <div className="font-sans text-xs sm:text-sm text-green-800/70">Share your expertise</div>
                </div>
              </div>
              <div className="text-green-800/60 group-hover:text-green-900/90 transition-colors duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.button>
          </motion.div>

          {/* Enhanced Login Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
            className="relative group"
          >
            <motion.button
              onClick={onLoginUser}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-50/50 to-gray-100/50 hover:from-gray-100/70 hover:to-gray-200/70 rounded-full border border-gray-200/30 hover:border-gray-300/50 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {/* Decorative left icon */}
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 opacity-60"
              />
              
              {/* Text content */}
              <div className="flex items-center space-x-2">
                <span className="text-green-700/80 font-sans text-sm font-medium">Already have an account?</span>
                <motion.span
                  className="text-green-900 font-sans text-sm font-semibold relative"
                  whileHover={{ color: "#15803b" }}
                >
                  Sign in 
                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </motion.span>
              </div>
              
              {/* Decorative right arrow */}
              <motion.svg
                className="w-4 h-4 text-green-600/60 group-hover:text-green-700 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </motion.svg>
            </motion.button>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full bg-gradient-to-r from-gray-400/10 to-gray-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 bg-white" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
