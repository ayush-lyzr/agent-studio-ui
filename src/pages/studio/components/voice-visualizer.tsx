import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

interface LineConfig {
  color: string;
  width: number;
  speed: number;
}

interface VisualizerProps {
  mediaStream?: MediaStream | null;
  isActive?: boolean;
  size?: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const MultiLineCircularVisualizer = forwardRef<
  HTMLCanvasElement,
  VisualizerProps
>(({ mediaStream, isActive = true, size = 64, onCanvasReady }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  useEffect(() => {
    if (!isActive || !mediaStream || !canvasRef.current) return;

    let mounted = true;

    const setupAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const source =
          audioContextRef.current.createMediaStreamSource(mediaStream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        draw();
      } catch (error) {
        console.error("Error initializing audio context:", error);
      }
    };

    const draw = () => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Black circular background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "hsl(240 3.7% 15.9%)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(centerX, centerY) - 10;

      // Visualizer lines configuration
      const lines: LineConfig[] = [
        { color: "#00ffff", width: 4, speed: 0.8 },
        { color: "#ff00ff", width: 3, speed: 1.2 },
        { color: "#00ff00", width: 2, speed: 1.5 },
      ];

      lines.forEach((lineConfig) => {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = lineConfig.width;
        ctx.strokeStyle = lineConfig.color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 0; i <= bufferLength; i++) {
          const angle =
            (i / bufferLength) * Math.PI * 2 +
            performance.now() * 0.001 * lineConfig.speed;
          const v = dataArray[i % bufferLength] / 128.0;
          const dynamicRadius = baseRadius * (0.7 + v * 0.3);

          const x = centerX + dynamicRadius * Math.cos(angle);
          const y = centerY + dynamicRadius * Math.sin(angle);

          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      });

      animationIdRef.current = requestAnimationFrame(draw);
    };

    setupAudio();

    return () => {
      mounted = false;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [mediaStream, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        borderRadius: "50%",
        background: "#000",
        boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
        cursor: "pointer",
        display: "block",
      }}
    />
  );
});

export default MultiLineCircularVisualizer;
