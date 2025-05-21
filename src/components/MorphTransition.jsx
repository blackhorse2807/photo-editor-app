import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Helper for responsive canvas size
function getCanvasSize() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.5;
  return Math.max(220, Math.min(size, 340));
}

const SplashScreen = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());

  useEffect(() => {
    const handleResize = () => setCanvasSize(getCanvasSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Generate points in a hexagonal cloud
    const points = [];
    const hexRadius = canvasSize * 0.35;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.sqrt(Math.random()) * hexRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const dx = Math.abs(x - centerX);
      const dy = Math.abs(y - centerY);
      if (dx * 0.866 + dy <= hexRadius) {
        points.push({
          x,
          y,
          baseX: x,
          baseY: y,
          color: `rgba(${100 + Math.random()*100},${100 + Math.random()*100},255,0.7)`
        });
      }
    }

    let frame = 0;
    let animationId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points.forEach(p => {
        const t = frame / 40;
        p.x = p.baseX + Math.sin(t + p.baseY) * (canvasSize / 170);
        p.y = p.baseY + Math.cos(t + p.baseX) * (canvasSize / 170);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.5, canvasSize / 170), 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      frame++;
      if (frame < 180) {
        animationId = requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    }
    animate();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [canvasSize, onComplete]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom, #4a6a89 0%, #7ec6e6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Phone/Card Container */}
      <motion.div
        style={{
          width: 'min(95vw, 420px)',
          height: 'min(95vh, 820px)',
          background: 'linear-gradient(to bottom, #fff 60%, #8ee6ff 100%)',
          borderRadius: '38px',
          boxShadow: '0 8px 40px 0 rgba(50, 80, 120, 0.18)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Left-aligned text */}
        <div style={{
          position: 'absolute',
          left: 24,
          top: 80,
          width: 180,
          color: '#8fd6f9',
          fontSize: '1.1rem',
          fontWeight: 400,
          lineHeight: 1.6,
          textAlign: 'left',
          opacity: 0.93,
          zIndex: 2,
          pointerEvents: 'none'
        }}>
          Translating an animation of the idea.<br /><br />
          The user gets a gist of this app.
        </div>
        {/* Centered hexagon animation */}
        <canvas
          ref={canvasRef}
          style={{
            margin: '0 auto',
            marginTop: '22vh',
            width: `${canvasSize}px`,
            height: `${canvasSize}px`,
            background: "transparent",
            borderRadius: "18px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
          }}
        />
      </motion.div>
    </div>
  );
};

export default SplashScreen;
