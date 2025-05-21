<<<<<<< HEAD
import { motion } from "framer-motion";

export default function PulsatingIcon({ onClick, cue }) {
  return (
    <motion.button
      className="absolute bottom-8 left-1/2 -translate-x-1/2 outline-none"
      onClick={onClick}
      aria-label="Open image picker"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
      style={{ background: "none", border: "none" }}
    >
      <div className={`w-16 h-16 bg-white rounded-full border-4 ${cue ? "border-pink-500" : "border-cyan-400"} flex items-center justify-center shadow-lg`}>
        <span role="img" aria-label="face" className="text-3xl text-cyan-700">👤</span>
      </div>
      {cue && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-pink-500 animate-bounce">
          Tap to start!
        </div>
      )}
    </motion.button>
  );
=======
import { motion } from "framer-motion";

export default function PulsatingIcon({ onClick, cue }) {
  return (
    <motion.button
      className="absolute bottom-8 left-1/2 -translate-x-1/2 outline-none"
      onClick={onClick}
      aria-label="Open image picker"
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 1.2 }}
      style={{ background: "none", border: "none" }}
    >
      <div className={`w-16 h-16 bg-white rounded-full border-4 ${cue ? "border-pink-500" : "border-cyan-400"} flex items-center justify-center shadow-lg`}>
        <span role="img" aria-label="face" className="text-3xl text-cyan-700">👤</span>
      </div>
      {cue && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-pink-500 animate-bounce">
          Tap to start!
        </div>
      )}
    </motion.button>
  );
>>>>>>> 9039fd2 (Initial commit)
}