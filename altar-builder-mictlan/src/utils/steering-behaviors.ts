/**
 * Steering Behaviors for Mariposas (Butterflies)
 *
 * Implementation of autonomous agent behaviors including:
 * - Wander: Random exploration
 * - Flee: Move away from threats
 * - Seek: Move towards targets
 * - Avoid: Navigate around obstacles
 * - Separate: Maintain distance from other agents
 */

/**
 * 2D Vector utilities
 */
export class Vector2D {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2D {
    if (scalar === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return this.divide(mag);
  }

  limit(max: number): Vector2D {
    const mag = this.magnitude();
    if (mag > max) {
      return this.normalize().multiply(max);
    }
    return new Vector2D(this.x, this.y);
  }

  distance(v: Vector2D): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  static random(magnitude: number = 1): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }
}

/**
 * Mariposa (Butterfly) entity
 */
export interface Mariposa {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  maxSpeed: number;
  maxForce: number;
  size: number;
  color: string;
  wanderAngle: number;
  createdAt: number;
  lifespan?: number; // Optional lifespan in ms
}

/**
 * Steering behavior configuration
 */
export interface SteeringConfig {
  wanderRadius: number;
  wanderDistance: number;
  wanderJitter: number;
  fleeDistance: number;
  avoidDistance: number;
  separationDistance: number;
  boundaryPadding: number;
}

/**
 * Default steering configuration
 */
const DEFAULT_CONFIG: SteeringConfig = {
  wanderRadius: 20,
  wanderDistance: 40,
  wanderJitter: 0.3,
  fleeDistance: 100,
  avoidDistance: 50,
  separationDistance: 30,
  boundaryPadding: 50
};

/**
 * Steering Behaviors Engine
 */
export class SteeringBehaviors {
  private config: SteeringConfig;

  constructor(config: Partial<SteeringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Wander behavior - random exploration
   */
  wander(mariposa: Mariposa): Vector2D {
    const { wanderRadius, wanderDistance, wanderJitter } = this.config;

    // Update wander angle with random jitter
    mariposa.wanderAngle += (Math.random() - 0.5) * wanderJitter;

    // Calculate circle center in front of agent
    const circleCenter = mariposa.velocity.normalize().multiply(wanderDistance);

    // Calculate displacement on the wander circle
    const displacement = new Vector2D(
      Math.cos(mariposa.wanderAngle) * wanderRadius,
      Math.sin(mariposa.wanderAngle) * wanderRadius
    );

    // Wander force = circle center + displacement
    const wanderForce = circleCenter.add(displacement);

    return wanderForce.normalize().multiply(mariposa.maxForce);
  }

  /**
   * Flee behavior - move away from target
   */
  flee(mariposa: Mariposa, target: Vector2D): Vector2D {
    const distance = mariposa.position.distance(target);

    // Only flee if within flee distance
    if (distance > this.config.fleeDistance) {
      return new Vector2D(0, 0);
    }

    // Calculate desired velocity away from target
    const desired = mariposa.position
      .subtract(target)
      .normalize()
      .multiply(mariposa.maxSpeed);

    // Steering force = desired - current velocity
    const steer = desired.subtract(mariposa.velocity).limit(mariposa.maxForce);

    // Scale by proximity (closer = stronger force)
    const strength = 1 - distance / this.config.fleeDistance;
    return steer.multiply(strength);
  }

  /**
   * Seek behavior - move towards target
   */
  seek(mariposa: Mariposa, target: Vector2D): Vector2D {
    // Calculate desired velocity towards target
    const desired = target
      .subtract(mariposa.position)
      .normalize()
      .multiply(mariposa.maxSpeed);

    // Steering force = desired - current velocity
    return desired.subtract(mariposa.velocity).limit(mariposa.maxForce);
  }

  /**
   * Avoid behavior - navigate around obstacles
   */
  avoid(mariposa: Mariposa, obstacles: Vector2D[]): Vector2D {
    let avoidForce = new Vector2D(0, 0);

    for (const obstacle of obstacles) {
      const distance = mariposa.position.distance(obstacle);

      // Only avoid nearby obstacles
      if (distance < this.config.avoidDistance) {
        // Calculate repulsion force
        const repulsion = mariposa.position
          .subtract(obstacle)
          .normalize()
          .multiply(mariposa.maxForce);

        // Scale by proximity (closer = stronger force)
        const strength = 1 - distance / this.config.avoidDistance;
        avoidForce = avoidForce.add(repulsion.multiply(strength));
      }
    }

    return avoidForce.limit(mariposa.maxForce);
  }

  /**
   * Separation behavior - maintain distance from other agents
   */
  separate(mariposa: Mariposa, others: Mariposa[]): Vector2D {
    let separationForce = new Vector2D(0, 0);
    let count = 0;

    for (const other of others) {
      if (other.id === mariposa.id) continue;

      const distance = mariposa.position.distance(other.position);

      // Only separate from nearby agents
      if (distance < this.config.separationDistance && distance > 0) {
        // Calculate repulsion force
        const diff = mariposa.position
          .subtract(other.position)
          .normalize()
          .divide(distance); // Weight by distance

        separationForce = separationForce.add(diff);
        count++;
      }
    }

    if (count > 0) {
      separationForce = separationForce
        .divide(count)
        .normalize()
        .multiply(mariposa.maxSpeed)
        .subtract(mariposa.velocity)
        .limit(mariposa.maxForce);
    }

    return separationForce;
  }

  /**
   * Boundary force - keep agent within bounds
   */
  boundary(mariposa: Mariposa, bounds: { width: number; height: number }): Vector2D {
    const { boundaryPadding } = this.config;
    let force = new Vector2D(0, 0);

    // Left boundary
    if (mariposa.position.x < boundaryPadding) {
      force.x = mariposa.maxForce;
    }
    // Right boundary
    else if (mariposa.position.x > bounds.width - boundaryPadding) {
      force.x = -mariposa.maxForce;
    }

    // Top boundary
    if (mariposa.position.y < boundaryPadding) {
      force.y = mariposa.maxForce;
    }
    // Bottom boundary
    else if (mariposa.position.y > bounds.height - boundaryPadding) {
      force.y = -mariposa.maxForce;
    }

    return force;
  }

  /**
   * Combined steering behavior
   */
  applySteering(
    mariposa: Mariposa,
    others: Mariposa[],
    obstacles: Vector2D[],
    bounds: { width: number; height: number },
    weights: {
      wander?: number;
      flee?: number;
      avoid?: number;
      separate?: number;
      boundary?: number;
    } = {}
  ): void {
    // Default weights
    const w = {
      wander: weights.wander ?? 1.0,
      flee: weights.flee ?? 2.0,
      avoid: weights.avoid ?? 3.0,
      separate: weights.separate ?? 1.5,
      boundary: weights.boundary ?? 5.0
    };

    // Calculate all forces
    const wanderForce = this.wander(mariposa).multiply(w.wander);
    const separateForce = this.separate(mariposa, others).multiply(w.separate);
    const avoidForce = this.avoid(mariposa, obstacles).multiply(w.avoid);
    const boundaryForce = this.boundary(mariposa, bounds).multiply(w.boundary);

    // Combine all forces
    mariposa.acceleration = wanderForce
      .add(separateForce)
      .add(avoidForce)
      .add(boundaryForce);
  }
}

/**
 * Update mariposa physics
 */
export function updateMariposa(mariposa: Mariposa, deltaTime: number = 1): void {
  // Update velocity with acceleration
  mariposa.velocity = mariposa.velocity.add(mariposa.acceleration).limit(mariposa.maxSpeed);

  // Update position with velocity
  mariposa.position = mariposa.position.add(mariposa.velocity.multiply(deltaTime));

  // Reset acceleration
  mariposa.acceleration = new Vector2D(0, 0);
}

/**
 * Create a new mariposa
 */
export function createMariposa(
  position: Vector2D,
  options: Partial<Mariposa> = {}
): Mariposa {
  return {
    id: `mariposa-${Date.now()}-${Math.random()}`,
    position: position.clone(),
    velocity: Vector2D.random(1),
    acceleration: new Vector2D(0, 0),
    maxSpeed: 2,
    maxForce: 0.1,
    size: 20,
    color: '#FB923C', // Orange
    wanderAngle: Math.random() * Math.PI * 2,
    createdAt: Date.now(),
    ...options
  };
}

/**
 * Check if mariposa is expired
 */
export function isMariposaExpired(mariposa: Mariposa): boolean {
  if (!mariposa.lifespan) return false;
  return Date.now() - mariposa.createdAt > mariposa.lifespan;
}
