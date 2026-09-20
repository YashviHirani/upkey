import { useEffect, useRef } from 'react';

/**
 * LiveSkincareBackground — Interactive Fluid & Bio-Active Canvas Background
 * 
 * Creates an organic, living atmosphere for the Joyory Aura skincare experience:
 * 1. Fluid Multi-Phase Liquid Aura:
 *    - Soft undulating organic color gradients in Joyory's signature palette:
 *      Warm Terracotta (#E8633A), Botanical Sage (#467254), Cream (#FAF6F2), and Amber Gold (#E5C158).
 * 2. Interactive Cursor Physics:
 *    - Smoothly damped mouse follower that creates silky liquid light ripples
 *      and soft particle deflection like droplets on a serum surface.
 * 3. Living Bio-Lipid Diagnostic Contours:
 *    - Delicate, pulsating elliptical waves mimicking skin barrier topography
 *      and acoustic bio-resonance behind the 3D bottle.
 * 4. Micro-Active Nutrient Particle Field:
 *    - Floating essence droplets with brownian drift, gentle interactive deflection,
 *      and subtle molecular bond filaments connecting nearby active nodes.
 * 5. Scroll-Aware Atmosphere:
 *    - Gently shifts ambient tones and pulse frequencies across the 4 product chapters.
 */
export default function LiveSkincareBackground({ scrollProgress = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Damped mouse coordinates for silky inertia
    const mouse = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      isMoving: false,
      speed: 0
    };

    // Handle high-DPI window resizing
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Track mouse / pointer movement
    let lastMouseMoveTime = 0;
    const handlePointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isMoving = true;
      lastMouseMoveTime = performance.now();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Generate bio-active floating serum particles
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const type = i % 4;
      let color = 'rgba(232, 99, 58, 0.45)'; // Terracotta
      if (type === 1) color = 'rgba(70, 114, 84, 0.4)';  // Botanical Sage
      if (type === 2) color = 'rgba(229, 193, 88, 0.5)'; // Amber Gold
      if (type === 3) color = 'rgba(215, 180, 155, 0.35)'; // Pearl Sand

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        originX: Math.random() * width,
        originY: Math.random() * height,
        radius: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02,
        color
      };
    });

    let time = 0;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // =========================================================================
    // MAIN RENDER LOOP (60FPS Frame-Optimized)
    // =========================================================================
    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.012;

      // Inertia damping for mouse position
      mouse.x += (mouse.targetX - mouse.x) * 0.055;
      mouse.y += (mouse.targetY - mouse.y) * 0.055;

      // Fade out motion speed after mouse stops
      if (performance.now() - lastMouseMoveTime > 300) {
        mouse.isMoving = false;
      }

      // Base warm studio canvas clear
      ctx.clearRect(0, 0, width, height);

      // -----------------------------------------------------------------------
      // 1. Organic Living Liquid Fluid Blobs (Layer 1: Soft Ambient Wash)
      // -----------------------------------------------------------------------
      // Blob 1: Warm Terracotta Aura (Upper left to center)
      const blob1X = width * 0.3 + Math.sin(time * 0.7) * 90 + (mouse.x - width * 0.5) * 0.06;
      const blob1Y = height * 0.35 + Math.cos(time * 0.6) * 70 + (mouse.y - height * 0.5) * 0.06;
      const blob1Radius = Math.min(width, height) * 0.42 + Math.sin(time * 0.9) * 35;

      const grad1 = ctx.createRadialGradient(blob1X, blob1Y, 10, blob1X, blob1Y, blob1Radius);
      // Subtly shift opacity based on scroll chapter
      const terracottaAlpha = 0.2 + (1 - scrollProgress) * 0.08;
      grad1.addColorStop(0, `rgba(232, 99, 58, ${terracottaAlpha})`);
      grad1.addColorStop(0.55, 'rgba(245, 175, 145, 0.09)');
      grad1.addColorStop(1, 'rgba(246, 239, 233, 0)');

      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(blob1X, blob1Y, blob1Radius, 0, Math.PI * 2);
      ctx.fill();

      // Blob 2: Botanical Emerald/Sage Aura (Right center to lower)
      const blob2X = width * 0.72 + Math.cos(time * 0.55) * 85 - (mouse.x - width * 0.5) * 0.05;
      const blob2Y = height * 0.52 + Math.sin(time * 0.8) * 80 - (mouse.y - height * 0.5) * 0.05;
      const blob2Radius = Math.min(width, height) * 0.38 + Math.cos(time * 0.75) * 30;

      const grad2 = ctx.createRadialGradient(blob2X, blob2Y, 10, blob2X, blob2Y, blob2Radius);
      // Sage intensifies during Diagnostic & Dupe sections
      const sageAlpha = 0.14 + Math.sin(scrollProgress * Math.PI) * 0.09;
      grad2.addColorStop(0, `rgba(70, 114, 84, ${sageAlpha})`);
      grad2.addColorStop(0.5, 'rgba(110, 155, 125, 0.06)');
      grad2.addColorStop(1, 'rgba(246, 239, 233, 0)');

      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(blob2X, blob2Y, blob2Radius, 0, Math.PI * 2);
      ctx.fill();

      // Blob 3: Golden Sunlit Amber Core (Behind the center bottle stage)
      const centerOffsetX = (scrollProgress < 0.33)
        ? (scrollProgress / 0.33) * -120
        : (scrollProgress < 0.66)
          ? -120 + ((scrollProgress - 0.33) / 0.33) * 240
          : 120 - ((scrollProgress - 0.66) / 0.34) * 120;

      const blob3X = width * 0.5 + centerOffsetX + Math.sin(time * 0.5) * 30;
      const blob3Y = height * 0.48 + Math.cos(time * 0.65) * 25;
      const blob3Radius = Math.min(width, height) * 0.32 + Math.sin(time * 1.1) * 20;

      const grad3 = ctx.createRadialGradient(blob3X, blob3Y, 0, blob3X, blob3Y, blob3Radius);
      grad3.addColorStop(0, 'rgba(255, 252, 245, 0.75)');
      grad3.addColorStop(0.4, 'rgba(255, 235, 215, 0.28)');
      grad3.addColorStop(0.75, 'rgba(245, 215, 185, 0.08)');
      grad3.addColorStop(1, 'rgba(246, 239, 233, 0)');

      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.arc(blob3X, blob3Y, blob3Radius, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------------------
      // 2. Interactive Liquid Cursor Ripple Spotlight
      // -----------------------------------------------------------------------
      const cursorRadius = Math.min(width, height) * 0.24;
      const cursorGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        cursorRadius
      );
      cursorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
      cursorGrad.addColorStop(0.35, 'rgba(250, 220, 205, 0.12)');
      cursorGrad.addColorStop(1, 'rgba(246, 239, 233, 0)');

      ctx.fillStyle = cursorGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, cursorRadius, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------------------
      // 3. Living Bio-Lipid / Topographic Skin-Barrier Waves
      // -----------------------------------------------------------------------
      // Concentric pulsating organic elliptical contour rings behind the bottle
      const contourCenterY = height * 0.48;
      const contourCount = 3;

      for (let i = 0; i < contourCount; i++) {
        const ringBaseRadius = (i + 1) * (Math.min(width, height) * 0.14);
        const ringPulse = Math.sin(time * 0.8 + i * 1.4) * 8;
        const currentRadius = ringBaseRadius + ringPulse;

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        // Subtle gold/sage gradient stroke
        const strokeAlpha = 0.12 + Math.sin(time * 0.6 + i) * 0.05;
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(232, 99, 58, ${strokeAlpha})`
          : `rgba(70, 114, 84, ${strokeAlpha * 0.85})`;

        // Draw slightly deformed organic ellipse using bezier harmonics
        const points = 8;
        for (let p = 0; p <= points; p++) {
          const angle = (p / points) * Math.PI * 2;
          const deform = Math.sin(angle * 3 + time * 1.2 + i) * 6;
          const px = blob3X + Math.cos(angle) * (currentRadius * 1.15 + deform);
          const py = contourCenterY + Math.sin(angle) * (currentRadius * 0.72 + deform * 0.6);

          if (p === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.closePath();
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // 4. Bio-Active Nutrient Particles & Filament Connections
      // -----------------------------------------------------------------------
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];

        // Organic brownian movement + drift
        pt.phase += pt.pulseSpeed;
        pt.x += pt.vx + Math.sin(pt.phase + time) * 0.35;
        pt.y += pt.vy + Math.cos(pt.phase * 0.8 + time) * 0.35;

        // Screen wrap-around
        if (pt.x < -20) pt.x = width + 20;
        if (pt.x > width + 20) pt.x = -20;
        if (pt.y < -20) pt.y = height + 20;
        if (pt.y > height + 20) pt.y = -20;

        // Interactive mouse deflection: gentle surface tension parting
        const dx = mouse.x - pt.x;
        const dy = mouse.y - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 110;

        if (dist < repelRadius && dist > 1) {
          const force = (1 - dist / repelRadius) * 2.2;
          pt.x -= (dx / dist) * force;
          pt.y -= (dy / dist) * force;
        }

        // Draw particle dot with soft halo
        const currentRadius = pt.radius + Math.sin(pt.phase) * 0.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();

        // Connect nearby active particles with ultra-delicate molecular filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distNodes = Math.hypot(pt.x - p2.x, pt.y - p2.y);
          const maxConnectDist = 72;

          if (distNodes < maxConnectDist) {
            const alpha = (1 - distNodes / maxConnectDist) * 0.09;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(180, 150, 130, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up animation frame and listeners on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  );
}
