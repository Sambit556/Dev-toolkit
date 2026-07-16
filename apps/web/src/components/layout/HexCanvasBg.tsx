'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export function HexCanvasBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });
  const offsetsRef = useRef({ x: 0, y: 0 });
  const swayRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const spacing = 26; // Spacing for grid
    const hexRadius = 3.0; // Base hexagon radius

    // Subtle drift speeds for slow automatic floating
    const driftSpeedX = 0.16;
    const driftSpeedY = 0.10;

    const drawHex = (x: number, y: number, radius: number, opacity: number, color: string, lineWidth: number = 0.7) => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${color}, ${opacity})`;
      ctx.lineWidth = lineWidth;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hexX = x + radius * Math.cos(angle);
        const hexY = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hexX, hexY);
        else ctx.lineTo(hexX, hexY);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Update automatic drift infinitely (without modulo resets to prevent layout jumps)
      const offsets = offsetsRef.current;
      offsets.x += driftSpeedX;
      offsets.y += driftSpeedY;

      // Update mouse sway (entire grid moves dynamically in direction of mouse)
      let targetSwayX = 0;
      let targetSwayY = 0;

      if (mouse.x > -500) {
        targetSwayX = (mouse.x - width / 2) * 0.08;
        targetSwayY = (mouse.y - height / 2) * 0.08;
      }

      const sway = swayRef.current;
      sway.x += (targetSwayX - sway.x) * 0.05;
      sway.y += (targetSwayY - sway.y) * 0.05;

      const isDark = resolvedTheme === 'dark';
      const rgbColor = isDark ? '59, 130, 246' : '99, 102, 241';
      // Prominent base opacity for inactive background dots
      const defaultOpacity = isDark ? 0.34 : 0.40;

      // Calculate dynamic loop range to keep screen filled as coordinates drift infinitely
      const cols = Math.ceil(width / spacing) + 4;
      const rows = Math.ceil(height / (spacing * 0.86)) + 4;

      const startCol = Math.floor(-offsets.x / spacing) - 2;
      const endCol = startCol + cols;

      const startRow = Math.floor(-offsets.y / (spacing * 0.86)) - 2;
      const endRow = startRow + rows;

      for (let c = startCol; c < endCol; c++) {
        for (let r = startRow; r < endRow; r++) {
          // Adjust alternating rows (Math.abs handles negative row indices safely)
          const gridX = c * spacing + (Math.abs(r) % 2 === 0 ? 0 : spacing / 2);
          const gridY = r * spacing * 0.86;

          // Compute final hex position including infinite drift and sway
          const x = gridX + offsets.x + sway.x;
          const y = gridY + offsets.y + sway.y;

          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180; // Extended glow radius

          let opacity = defaultOpacity;
          let radius = hexRadius;
          let lineWidth = 1.0; // Defined base line width of inactive hexagons

          if (dist < maxDist) {
            const factor = 1 - dist / maxDist; // 0 (far) to 1 (near)
            opacity = defaultOpacity + factor * 0.48; // Scales smoothly up to glow state
            radius = hexRadius + factor * 3.2; // Scale on hover
            lineWidth = 1.0 + factor * 1.0; // Thicker lines on focus

            // Draw glowing backdrop fill
            if (factor > 0.2) {
              const fillOpacity = (factor - 0.2) * 0.08;
              ctx.beginPath();
              ctx.fillStyle = `rgba(${rgbColor}, ${fillOpacity})`;
              for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hexX = x + radius * Math.cos(angle);
                const hexY = y + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(hexX, hexY);
                else ctx.lineTo(hexX, hexY);
              }
              ctx.closePath();
              ctx.fill();
            }

            // Neon shadow blur for hovered items
            ctx.shadowColor = isDark ? 'rgba(59, 130, 246, 0.45)' : 'rgba(99, 102, 241, 0.45)';
            ctx.shadowBlur = factor * 10;
          } else {
            ctx.shadowBlur = 0;
          }

          drawHex(x, y, radius, opacity, rgbColor, lineWidth);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.95 }}
    />
  );
}
