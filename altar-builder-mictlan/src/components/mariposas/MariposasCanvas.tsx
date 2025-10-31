import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Vector2D,
  SteeringBehaviors,
  createMariposa,
  updateMariposa,
  isMariposaExpired,
  type Mariposa
} from '../../utils/steering-behaviors';
import { usePlacedElements, useSettings } from '../../store/useAltarStore';

interface MariposasCanvasProps {
  enabled?: boolean;
  maxMariposas?: number;
  bounds?: { width: number; height: number };
}

export function MariposasCanvas({
  enabled = true,
  maxMariposas = 5,
  bounds
}: MariposasCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mariposasRef = useRef<Mariposa[]>([]);
  const steeringRef = useRef(new SteeringBehaviors());
  const animationRef = useRef<number>(0);
  const [fps, setFps] = useState(60);
  const lastTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);

  const settings = useSettings();
  const placedElements = usePlacedElements();

  // Get canvas bounds
  const getCanvasBounds = useCallback(() => {
    if (bounds) return bounds;
    if (!canvasRef.current) return { width: 800, height: 600 };
    return {
      width: canvasRef.current.width,
      height: canvasRef.current.height
    };
  }, [bounds]);

  // Get obstacles from placed elements
  const getObstacles = useCallback((): Vector2D[] => {
    const canvasBounds = getCanvasBounds();
    const obstacles: Vector2D[] = [];

    placedElements.forEach(element => {
      // Convert grid position to canvas coordinates
      // Assuming grid is centered in canvas
      const x = (element.position.col / 12) * canvasBounds.width;
      const y = (element.position.row / 9) * canvasBounds.height;
      obstacles.push(new Vector2D(x, y));
    });

    return obstacles;
  }, [placedElements, getCanvasBounds]);

  // Spawn new mariposas
  const spawnMariposas = useCallback(() => {
    const canvasBounds = getCanvasBounds();
    const currentCount = mariposasRef.current.length;

    if (currentCount < maxMariposas) {
      const toSpawn = maxMariposas - currentCount;

      for (let i = 0; i < toSpawn; i++) {
        const position = new Vector2D(
          Math.random() * canvasBounds.width,
          Math.random() * canvasBounds.height
        );

        // Random colors for variety
        const colors = ['#FB923C', '#F59E0B', '#FCD34D', '#FBBF24'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const mariposa = createMariposa(position, {
          color,
          maxSpeed: 1.5 + Math.random(),
          size: 15 + Math.random() * 10,
          lifespan: 60000 + Math.random() * 30000 // 60-90 seconds
        });

        mariposasRef.current.push(mariposa);
      }
    }
  }, [maxMariposas, getCanvasBounds]);

  // Remove expired mariposas
  const removeExpiredMariposas = useCallback(() => {
    mariposasRef.current = mariposasRef.current.filter(m => !isMariposaExpired(m));
  }, []);

  // Update mariposas
  const updateMariposas = useCallback(() => {
    const obstacles = getObstacles();
    const canvasBounds = getCanvasBounds();

    mariposasRef.current.forEach(mariposa => {
      // Apply steering behaviors
      steeringRef.current.applySteering(
        mariposa,
        mariposasRef.current,
        obstacles,
        canvasBounds,
        {
          wander: 1.0,
          separate: 1.5,
          avoid: 3.0,
          boundary: 5.0
        }
      );

      // Update physics
      updateMariposa(mariposa, 0.016); // ~60 FPS delta
    });
  }, [getObstacles, getCanvasBounds]);

  // Draw mariposas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each mariposa
    mariposasRef.current.forEach(mariposa => {
      ctx.save();

      // Calculate age for fade out effect
      const age = mariposa.lifespan
        ? (Date.now() - mariposa.createdAt) / mariposa.lifespan
        : 0;
      const opacity = mariposa.lifespan ? Math.max(0, 1 - age * age) : 1;

      // Move to position
      ctx.translate(mariposa.position.x, mariposa.position.y);

      // Rotate to face velocity direction
      const angle = Math.atan2(mariposa.velocity.y, mariposa.velocity.x);
      ctx.rotate(angle);

      // Draw butterfly shape
      ctx.globalAlpha = opacity;
      ctx.fillStyle = mariposa.color;

      // Simple butterfly shape using two circles
      const size = mariposa.size;

      // Top wings
      ctx.beginPath();
      ctx.ellipse(-size/4, -size/3, size/2, size/2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(-size/4, size/3, size/2, size/2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = '#1F2937'; // Dark gray
      ctx.beginPath();
      ctx.ellipse(0, 0, size/8, size/1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing details
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-size/4, -size/3, size/4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-size/4, size/3, size/4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    // FPS calculation
    frameCountRef.current++;
    const now = Date.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / elapsed));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    // Update and draw
    removeExpiredMariposas();
    spawnMariposas();
    updateMariposas();
    draw();

    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  }, [removeExpiredMariposas, spawnMariposas, updateMariposas, draw]);

  // Setup canvas and start animation
  useEffect(() => {
    if (!enabled || !settings.animationsEnabled) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      mariposasRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, settings.animationsEnabled, animate]);

  // Adjust mariposa count based on FPS
  useEffect(() => {
    if (fps < 30 && maxMariposas > 3) {
      // Performance is poor, reduce count
      const targetCount = Math.max(3, maxMariposas - 2);
      mariposasRef.current = mariposasRef.current.slice(0, targetCount);
    }
  }, [fps, maxMariposas]);

  if (!enabled || !settings.animationsEnabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
      aria-label="Mariposas decorativas"
    />
  );
}
