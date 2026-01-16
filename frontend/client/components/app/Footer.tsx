import React from "react";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Documentation", href: "#docs" },
      { name: "API", href: "#api" }
    ],
    company: [
      { name: "About", href: "#about" },
      { name: "Blog", href: "#blog" },
      { name: "Careers", href: "#careers" },
      { name: "Press", href: "#press" }
    ],
    support: [
      { name: "Help Center", href: "#help" },
      { name: "Contact", href: "#contact" },
      { name: "Privacy", href: "#privacy" },
      { name: "Terms", href: "#terms" }
    ]
  };

  return (
    <footer className="bg-gradient-to-br from-green-800 via-emerald-800 to-green-900 border-t border-green-700">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-1"
          >
            <h3 className="text-xl font-light text-white mb-4">Swasthsetu</h3>
            <p className="text-green-100 leading-relaxed font-light text-sm">
              Your bridge to holistic wellness through the perfect blend 
              of ancient wisdom and modern technology.
            </p>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h4 className="text-sm font-medium text-white mb-4 capitalize">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-green-100 hover:text-white transition-colors duration-300 text-sm font-light"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="border-t border-green-700"
      >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-green-200 text-sm font-light">
              © {new Date().getFullYear()} Swasthsetu. All rights reserved.
            </div>

            {/* Additional Links */}
            <div className="flex items-center gap-6">
              <a href="#privacy" className="text-green-200 hover:text-white transition-colors duration-300 text-sm font-light">
                Privacy
              </a>
              <a href="#terms" className="text-green-200 hover:text-white transition-colors duration-300 text-sm font-light">
                Terms
              </a>
              <a href="#cookies" className="text-green-200 hover:text-white transition-colors duration-300 text-sm font-light">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
