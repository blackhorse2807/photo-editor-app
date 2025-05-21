import React, { useRef, useEffect, useState } from "react";

function getCanvasSize(boxed) {
  if (boxed) {
    // Fixed box size for boxed mode
    return 320;
  }
  // Responsive: 36% of viewport width, clamp between 260px and 480px
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.36;
  return Math.max(260, Math.min(size, 480));
}

export default function HexagonParticlesDesktop({ boxed = false, style = {}, className = "" }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize(boxed));

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => setCanvasSize(getCanvasSize(boxed));
    if (!boxed) {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [boxed]);

  // Particle hexagon animation
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
    const hexRadius = canvasSize * 0.38;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    for (let i = 0; i < 500; i++) {
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
          color: `rgba(${130 + Math.random()*80},${120 + Math.random()*100},255,0.7)`
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
        ctx.arc(p.x, p.y, Math.max(1.2, canvasSize / 180), 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      frame++;
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [canvasSize]);

  if (boxed) {
    return (
      <div
        className={className}
        style={{
          width: 340,
          height: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // background: "white",
          boxShadow: "0 2px 24px 0 rgba(50, 80, 120, 0.08)",
          borderRadius: 0,
          ...style
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            background: "transparent",
            display: "block",
            width: 320,
            height: 320
          }}
        />
      </div>
    );
  }

  // Fullscreen mode
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(to bottom, #fff 54%, #8ee6ff 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          marginTop: "10vh",
          flex: "none"
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            background: "transparent",
            display: "block",
            borderRadius: 0,
            width: "100%",
            height: "100%"
          }}
        />
      </div>
    </div>
  );
}
