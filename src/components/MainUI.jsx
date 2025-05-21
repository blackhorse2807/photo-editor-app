import React from 'react';
import { motion } from 'framer-motion';

const MainUI = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "transparent",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-80 h-80 bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <motion.div
            className="w-full h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
          </motion.div>
          
          {/* Pulsating element at center bottom */}
          <motion.div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-cyan-500 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default MainUI; 
