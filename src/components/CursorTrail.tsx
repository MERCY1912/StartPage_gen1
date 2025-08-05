import React, { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  size: number;
}

export const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailPointsRef = useRef<TrailPoint[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Add new trail points
      for (let i = 0; i < 3; i++) {
        trailPointsRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          age: 0,
          size: Math.random() * 3 + 1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw trail points
      trailPointsRef.current = trailPointsRef.current.filter(point => {
        point.age += 1;
        point.y -= 0.5; // Float upward
        point.x += (Math.random() - 0.5) * 0.5; // Slight horizontal drift

        const maxAge = 60;
        const opacity = Math.max(0, (maxAge - point.age) / maxAge) * 0.6;
        
        if (opacity > 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
          const colors = ['196, 181, 253', '244, 114, 182', '52, 211, 153'];
          const colorIndex = Math.floor(Math.random() * colors.length);
          ctx.fillStyle = `rgba(${colors[colorIndex]}, ${opacity})`;
          ctx.fill();
          
          // Add a subtle glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244, 114, 182, ${opacity * 0.3})`;
          ctx.fill();
          
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  );
};