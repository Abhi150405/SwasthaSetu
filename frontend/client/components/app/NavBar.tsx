import React from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";

export const NavBar: React.FC<{
  onGetStarted?: () => void;
  onSignIn?: () => void;
}> = ({ onGetStarted, onSignIn }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute top-0 left-0 right-0 z-50 w-full bg-yellow-50/80 backdrop-blur-md border-b border-green-100/50"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo - Clean & Minimal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-green-900"
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-light tracking-tight text-green-900">Swasthsetu</h1>
          </motion.div>

          {/* Navigation Links - Clean */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center gap-6 lg:gap-8"
          >
            <a href="#features" className="text-green-800/70 hover:text-green-900 transition-colors duration-300 font-light text-sm sm:text-base">
              Features
            </a>
            <a href="#about" className="text-green-800/70 hover:text-green-900 transition-colors duration-300 font-light text-sm sm:text-base">
              About
            </a>
            <a href="#contact" className="text-green-800/70 hover:text-green-900 transition-colors duration-300 font-light text-sm sm:text-base">
              Contact
            </a>
          </motion.div>

          {/* Action Buttons - Minimal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-4 sm:gap-6"
          >
            <button
              onClick={onSignIn}
              className="hidden sm:block text-green-800/70 hover:text-green-900 transition-colors duration-300 font-light text-sm sm:text-base"
            >
              Sign in
            </button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium text-sm sm:text-base rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/25"
            >
              Get started
            </motion.button>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-green-800/70 hover:text-green-900 transition-colors duration-300">
              <Menu className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </nav>
    </motion.header>
  );
};

export default NavBar;
