<<<<<<< HEAD
import { motion } from "framer-motion";

export default function ImageBox({ src, loading, magentaGlow }) {
  return (
    <motion.div
      className={`w-48 h-48 mx-auto mt-12 rounded-lg flex items-center justify-center bg-white shadow-lg border-4 ${magentaGlow ? "border-pink-500 animate-pulse" : "border-cyan-200"}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {loading ? (
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <img src={src} alt="Selected" className="object-cover w-full h-full rounded-md" />
      )}
    </motion.div>
  );
}
=======
import { motion } from "framer-motion";

export default function ImageBox({ src, loading, magentaGlow }) {
  return (
    <motion.div
      className={`w-48 h-48 mx-auto mt-12 rounded-lg flex items-center justify-center bg-white shadow-lg border-4 ${magentaGlow ? "border-pink-500 animate-pulse" : "border-cyan-200"}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {loading ? (
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <img src={src} alt="Selected" className="object-cover w-full h-full rounded-md" />
      )}
    </motion.div>
  );
}
>>>>>>> 9039fd2 (Initial commit)
