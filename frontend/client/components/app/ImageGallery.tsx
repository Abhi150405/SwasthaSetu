import React from "react";
import { motion } from "framer-motion";

export type GalleryItem = { src: string; alt: string };

export const ImageGallery: React.FC<{ items: GalleryItem[] }> = ({ items }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((img, i) => (
        <motion.div key={i} initial={{ y: 12, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} className="overflow-hidden rounded-2xl border shadow-sm">
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            className="h-64 w-full object-cover md:h-64"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default ImageGallery;
