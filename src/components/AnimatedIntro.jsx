<<<<<<< HEAD
import { motion } from "framer-motion";

export default function AnimatedIntro({ onComplete }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
    >
      <motion.h1
        className="text-4xl md:text-6xl font-light text-purple-500 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        style<br />your<br />picture!
      </motion.h1>
    </motion.div>
  );
=======
import { motion } from "framer-motion";

export default function AnimatedIntro({ onComplete }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
    >
      <motion.h1
        className="text-4xl md:text-6xl font-light text-purple-500 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        style<br />your<br />picture!
      </motion.h1>
    </motion.div>
  );
>>>>>>> 9039fd2 (Initial commit)
}