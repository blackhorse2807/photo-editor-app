import { motion } from "framer-motion";

export default function ImageVariations({ variations, onSelect, selectedImage }) {
  if (!variations || variations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(255, 255, 255, 0.95)",
        padding: "20px",
        maxHeight: "40vh",
        overflowY: "auto",
        boxShadow: "0 -4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 100
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: "10px",
        padding: "10px"
      }}>
        {variations.map((variation, index) => (
          <motion.div
            key={`${variation.fileName}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
            style={{
              cursor: "pointer",
              border: selectedImage === variation.imageData ? "2px solid #40ff00" : "2px solid transparent",
              borderRadius: "4px",
              overflow: "hidden"
            }}
            onClick={() => onSelect(variation)}
          >
            <div style={{
              position: "relative",
              paddingBottom: "100%"
            }}>
              <img
                src={variation.processedImageData || ''}
                alt={`Variation ${index + 1}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0, 0, 0, 0.6)",
                color: "white",
                fontSize: "10px",
                padding: "4px",
                textAlign: "center"
              }}>
                B: {Math.round(variation.settings.b * 100)}%
                <br />
                C: {Math.round(variation.settings.c * 100)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
} 