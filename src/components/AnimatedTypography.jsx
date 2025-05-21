// Updated AnimatedTypography.jsx with animation and onComplete callback
import React, { useEffect } from "react";
import { motion } from "framer-motion";

function AnimatedTypography({ onComplete }) {
  useEffect(() => {
    // Trigger onComplete after animation duration (reduced from 3s to 1.5s)
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      style={{
        // height: "60vh",
        // width: "60vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // background: "linear-gradient(to bottom, #fff 50%, #7eefff 100%)",
        boxSizing: "border-box",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        style={{
          color: "#a17ee4",
          fontFamily: "'Montserrat', 'Arial', sans-serif",
          fontWeight: "150",
          fontSize: "clamp(2rem, 5vw, 5rem)",
          letterSpacing: "1px",
          textAlign: "center",
          whiteSpace: "nowrap",
          margin: 0,
          padding: 0,
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.2,
          duration: 0.8,
          ease: "easeOut"
        }}
      >
        style your images
      </motion.div>
    </motion.div>
  );
}

export default AnimatedTypography;
