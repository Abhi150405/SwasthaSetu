import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Leaf,
  Activity,
  Users,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Holistic Wellness",
    description: "Combine modern fitness tracking with ancient Ayurvedic wisdom for complete mind-body balance."
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get personalized recommendations based on your dosha, lifestyle, and health goals."
  },
  {
    icon: Leaf,
    title: "Ayurvedic Nutrition",
    description: "Discover foods that align with your constitution and seasonal needs for optimal health."
  },
  {
    icon: Activity,
    title: "Smart Tracking",
    description: "Monitor your progress with intuitive dashboards and meaningful health metrics."
  },
  {
    icon: Users,
    title: "Expert Guidance",
    description: "Connect with certified Ayurvedic practitioners and wellness coaches for personalized care."
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your health data is encrypted and secure, with complete control over your information."
  }
];

export const Features: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
      {/* Sophisticated background with gradient and texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-100"></div>

      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMGYwZjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAxMnY2aDZ2LTZoLTZ6bS0xMi0xOHY2aDZ2LTZoLTZ6bTAgMTJ2Nmg2di02aC02em0tMTItMTh2Nmg2di02aC02em0wIDEydjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full blur-3xl opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-200 to-green-200 rounded-full blur-3xl opacity-10 translate-x-1/2 translate-y-1/2"></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          {/* Section title with decorative elements */}
          <div className="relative inline-block mb-8">
            {/* Enhanced section title with better typography */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-thin text-green-900 tracking-[-0.02em] relative z-10 leading-[1.1]">
              Transform your
              <span className="block text-green-700 font-light mt-2">wellness journey</span>
            </h2>

            {/* Enhanced decorative elements */}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="absolute -bottom-4 left-0 h-1.5 bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 rounded-full"
            />

            {/* Side decorative lines */}
            <div className="absolute -left-12 top-1/2 w-8 h-px bg-gradient-to-r from-transparent to-green-300"></div>
            <div className="absolute -right-12 top-1/2 w-8 h-px bg-gradient-to-l from-transparent to-green-300"></div>
          </div>

          {/* Enhanced subtitle with refined typography */}
          <p className="text-base md:text-lg text-gray-600 max-w-4xl mx-auto leading-[1.6] font-light px-6 tracking-[-0.01em]">
            Discover the powerful fusion of cutting-edge technology and time-honored wisdom
            in our intelligent wellness platform, crafted to elevate your
            <span className="text-green-700 font-medium"> complete well-being</span>.
          </p>
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced three-column layout with better visual balance */}
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 lg:gap-20 xl:gap-40 items-start relative">
            {/* Left Features with enhanced spacing and vertical offset */}
            <div className="space-y-2 sm:space-y-1 lg:space-y-1">
              {features.slice(0, 3).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  className="group relative pl-8 cursor-pointer"
                >
                  {/* Subtle background glow on hover */}
                  <motion.div
                    className="absolute inset-0 -left-4 -right-4 -top-2 -bottom-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl opacity-0 blur-xl -z-10"
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  ></motion.div>
                  {/* Enhanced vertical line connector with animation */}
                  <motion.div
                    className="absolute left-0 top-8 bottom-0 w-1"
                    initial={{ height: 0 }}
                    whileInView={{ height: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  >
                    <div className="w-full h-full bg-gradient-to-b from-green-400 via-emerald-300 to-transparent rounded-full"></div>
                    <motion.div
                      className="absolute top-0 left-1/2 w-2 h-2 bg-green-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                      animate={{
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    ></motion.div>
                  </motion.div>

                  <div className="text-left">
                    {/* Enhanced Icon with sophisticated animations */}
                    <motion.div
                      className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 group-hover:from-green-100 group-hover:via-emerald-100 group-hover:to-green-100 transition-all duration-500 mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl border-2 border-green-100 group-hover:border-green-200 backdrop-blur-sm"
                      // Removed hover animations
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                        background: {
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 0.95, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-7 h-7"
                      >
                        <feature.icon className="w-full h-full text-green-700 group-hover:text-green-800 transition-colors duration-300" />
                      </motion.div>
                    </motion.div>

                    {/* Enhanced Content with refined typography */}
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-800 transition-all duration-300 leading-tight tracking-[-0.01em]">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-[1.5] font-light group-hover:text-gray-700 transition-all duration-300 tracking-[-0.005em]">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Clean Center Image without effects */}
            <div className="flex justify-center relative py-4 lg:py-8 order-2 lg:order-none">
              <img
                src="/images/image3.png"
                alt="Wellness Journey"
                className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto rounded-3xl"
              />
            </div>

            {/* Right Features with enhanced spacing and vertical offset */}
            <div className="space-y-2 sm:space-y-1 lg:space-y-1">
              {features.slice(3, 6).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  // Removed hover animations
                  className="group relative pr-8 cursor-pointer"
                >
                  {/* Subtle background glow on hover */}
                  <motion.div
                    className="absolute inset-0 -left-4 -right-4 -top-2 -bottom-2 bg-gradient-to-l from-emerald-50 to-green-50 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl -z-10"
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  ></motion.div>
                  {/* Enhanced vertical line connector with animation */}
                  <motion.div
                    className="absolute right-0 top-8 bottom-0 w-1"
                    initial={{ height: 0 }}
                    whileInView={{ height: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                  >
                    <div className="w-full h-full bg-gradient-to-b from-emerald-400 via-green-300 to-transparent rounded-full"></div>
                    <motion.div
                      className="absolute top-0 right-1/2 w-2 h-2 bg-emerald-500 rounded-full translate-x-1/2 -translate-y-1/2"
                      animate={{
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    ></motion.div>
                  </motion.div>

                  <div className="text-right">
                    {/* Enhanced Icon with sophisticated animations */}
                    <motion.div
                      className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-3xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 group-hover:from-emerald-100 group-hover:via-green-100 group-hover:to-emerald-100 transition-all duration-500 mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl border-2 border-emerald-100 group-hover:border-emerald-200 backdrop-blur-sm"
                      // Removed hover animations
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                        background: {
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }
                      }}
                    >
                      <motion.div
                        animate={{
                          rotate: [0, -5, 5, 0],
                          scale: [1, 1.05, 0.95, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-7 h-7"
                      >
                        <feature.icon className="w-full h-full text-emerald-700 group-hover:text-emerald-800 transition-colors duration-300" />
                      </motion.div>
                    </motion.div>

                    {/* Enhanced Content with refined typography */}
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-emerald-800 transition-all duration-300 leading-tight tracking-[-0.01em]">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-[1.5] font-light group-hover:text-gray-700 transition-all duration-300 tracking-[-0.005em]">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16 sm:mt-20 lg:mt-24"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-thin text-gray-900 mb-6 sm:mb-8 tracking-[-0.01em] leading-[1.2]">
            Ready to begin your
            <span className="block text-green-700 font-light mt-2">wellness journey?</span>
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-12 sm:mb-16 max-w-2xl mx-auto font-light leading-[1.6] tracking-[-0.005em]">
            Join thousands of users who have transformed their health
            with our personalized wellness approach.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.assign("/register-user")}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-400 shadow-lg hover:shadow-xl hover:shadow-green-500/25 relative overflow-hidden group"
            >
              <span className="relative z-10">Get started</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                initial={{ x: "-100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              ></motion.div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.assign("/login")}
              className="px-8 py-3 border-2 border-green-200 text-green-700 font-medium rounded-full hover:border-green-300 hover:bg-green-50 transition-all duration-400 shadow-md hover:shadow-lg hover:shadow-green-500/15 relative overflow-hidden group"
            >
              <span className="relative z-10">Sign in</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                initial={{ x: "100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              ></motion.div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;