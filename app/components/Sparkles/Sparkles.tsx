"use client";
import { useEffect, useRef } from "react";
import styles from "./Sparkles.module.css";

const PARTICLE_COUNT_FULL = 80;
const PARTICLE_COUNT_MOBILE = 30;
const RESIZE_DEBOUNCE_MS = 250;

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

class Particle {
  x = 0;
  y = 0;
  size = 0;
  speedX = 0;
  speedY = 0;
  wobble = 0;
  wobbleSpeed = 0;
  maxOpacity = 0;
  opacity = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {
    this.init();
  }

  init() {
    this.x = Math.random() * this.canvas.width;
    this.y = this.canvas.height + Math.random() * 100;
    this.size = Math.random() * 4 + 0.5;
    this.speedX = Math.random() * 1 - 0.5;
    this.speedY = Math.random() * -1.2 - 0.3;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.03 + 0.01;
    this.maxOpacity = Math.random() * 0.6 + 0.2;
  }

  update() {
    this.y += this.speedY;
    this.x += Math.sin(this.wobble) * 0.4;
    this.wobble += this.wobbleSpeed;
    this.opacity = (this.y / this.canvas.height) * this.maxOpacity;

    if (this.y < -20 || this.opacity <= 0.01) {
      this.init();
    }
  }

  draw() {
    const gradient = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    gradient.addColorStop(0, `rgba(255, 150, 0, ${this.opacity})`);
    gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

const Sparkles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    let paused = false;

    const isMobile = () => window.innerWidth < 768;
    const particleCount = () => (isMobile() ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_FULL);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount(); i++) {
        particles.push(new Particle(canvas, ctx));
      }
    };

    const animate = () => {
      if (paused) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleVisibility = () => {
      paused = document.hidden;
    };

    const debouncedResize = debounce(() => {
      resizeCanvas();
      createParticles();
    }, RESIZE_DEBOUNCE_MS);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", debouncedResize);
    resizeCanvas();
    createParticles();
    animate();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", debouncedResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.sparklesContainer} />;
};

export default Sparkles;