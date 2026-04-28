import React, { useEffect, useRef } from "react";

const AnimatedWaveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create gradient background
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(21, 47, 98, 0.6)");
      gradient.addColorStop(0.5, "#2B458E");
      gradient.addColorStop(1, "#304D9E");
      return gradient;
    };

    // Particle configuration
    const particles = [];
    const particleCount = 200;
    let time = 0;

    // Initialize particles in a grid-like pattern
    for (let i = 0; i < particleCount; i++) {
      const row = Math.floor(i / 20);
      const col = i % 20;
      particles.push({
        x: (col / 20) * canvas.width + Math.random() * 30,
        y: canvas.height + row * 40,
        baseX: (col / 20) * canvas.width + Math.random() * 30,
        baseY: canvas.height + row * 40,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 1 + 0.5,
        waveOffset: Math.random() * Math.PI * 2,
      });
    }

    // Animation loop
    const animate = () => {
      // Draw gradient background
      ctx.fillStyle = createGradient();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.02;

      // Draw particles flowing upward in wave pattern
      particles.forEach((particle, index) => {
        // Upward movement
        particle.y -= particle.speed;

        // Horizontal wave movement
        const waveX = Math.sin(time + particle.waveOffset + index * 0.1) * 60;
        particle.x = particle.baseX + waveX;

        // Reset position when particle goes off top
        if (particle.y < -50) {
          particle.y = canvas.height + 50;
          particle.baseX = Math.random() * canvas.width;
          particle.baseY = canvas.height + 50;
        }

        // Calculate opacity based on vertical position (fade out at top)
        const fadeDistance = 300;
        const distanceFromTop = Math.max(0, particle.y - (canvas.height - fadeDistance));
        const fadeOpacity = Math.min(1, distanceFromTop / fadeDistance);
        const finalOpacity = particle.opacity * fadeOpacity;

        // Draw particle with glow effect
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 4
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity * 0.9})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${finalOpacity * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw core dot
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
};

export default AnimatedWaveBackground;
