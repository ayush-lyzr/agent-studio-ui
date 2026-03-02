declare module "canvas-confetti" {
  interface ConfettiConfig {
    particleCount?: number;
    spread?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    angle?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
  }

  function confetti(config?: ConfettiConfig): Promise<null>;
  export default confetti;
}
