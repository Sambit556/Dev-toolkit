'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export function HexCanvasBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

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

    const spacing = 22;
    const hexRadius = 2.5;

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
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      const isDark = resolvedTheme === 'dark';
      // Primary color mapping: warm purple in light, glowing cyan-blue in dark mode
      const rgbColor = isDark ? '59, 130, 246' : '99, 102, 241';
      const defaultOpacity = isDark ? 0.12 : 0.16;

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / (spacing * 0.86)) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing + (r % 2 === 0 ? 0 : spacing / 2);
          const y = r * spacing * 0.86;

          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 110;

          let opacity = defaultOpacity;
          let radius = hexRadius;
          let lineWidth = 0.7;

          if (dist < maxDist) {
            const factor = 1 - dist / maxDist; // 0 (far) to 1 (near)
            opacity = defaultOpacity + factor * 0.42;
            radius = hexRadius + factor * 1.5;
            lineWidth = 0.7 + factor * 0.8;
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
