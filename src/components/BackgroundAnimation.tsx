import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

interface DataStream {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  width: number;
}

const COLORS = [
  '56, 189, 248',   // sky-400
  '34, 211, 238',   // cyan-400
  '129, 140, 248',  // indigo-400
  '96, 165, 250',   // blue-400
  '192, 132, 252',  // purple-400
];

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let dataStreams: DataStream[] = [];
    const maxConnections = 4;
    const connectionDistance = 160;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      // 增加粒子密度
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 3.5 + 1.2,
          opacity: Math.random() * 0.7 + 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.03 + 0.015,
        });
      }
    };

    const createDataStreams = () => {
      dataStreams = [];
      const count = Math.floor(canvas.width / 80);
      for (let i = 0; i < count; i++) {
        dataStreams.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 200,
          speed: Math.random() * 2.5 + 1,
          length: Math.random() * 80 + 40,
          opacity: Math.random() * 0.45 + 0.2,
          width: Math.random() * 2.5 + 1,
        });
      }
    };

    const drawGlow = (x: number, y: number, radius: number, color: string, opacity: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
      gradient.addColorStop(0.5, `rgba(${color}, ${opacity * 0.3})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制底部上升的数据流光带
      dataStreams.forEach((stream) => {
        stream.y -= stream.speed;
        if (stream.y + stream.length < 0) {
          stream.y = canvas.height + Math.random() * 100;
          stream.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createLinearGradient(stream.x, stream.y + stream.length, stream.x, stream.y);
        gradient.addColorStop(0, `rgba(56, 189, 248, 0)`);
        gradient.addColorStop(0.5, `rgba(56, 189, 248, ${stream.opacity})`);
        gradient.addColorStop(1, `rgba(34, 211, 238, ${stream.opacity * 1.5})`);

        ctx.beginPath();
        ctx.moveTo(stream.x, stream.y + stream.length);
        ctx.lineTo(stream.x, stream.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = stream.width;
        ctx.stroke();
      });

      // 更新和绘制粒子
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        const pulseOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        const pulseSize = p.size * (0.8 + 0.2 * Math.sin(p.pulse));

        // 外发光
        drawGlow(p.x, p.y, pulseSize * 12, p.color, pulseOpacity * 0.25);

        // 内发光
        drawGlow(p.x, p.y, pulseSize * 5, p.color, pulseOpacity * 0.5);

        // 核心粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${pulseOpacity})`;
        ctx.fill();
      });

      // 绘制连线
      for (let i = 0; i < particles.length; i++) {
        let connections = 0;
        for (let j = i + 1; j < particles.length; j++) {
          if (connections >= maxConnections) break;

          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            connections++;
            const opacity = (1 - dist / connectionDistance) * 0.45;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    createDataStreams();
    draw();

    const handleResize = () => {
      resize();
      createParticles();
      createDataStreams();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
