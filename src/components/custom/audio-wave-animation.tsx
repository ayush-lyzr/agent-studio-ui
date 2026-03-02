const AudioWave = () => {
  return (
    <div className="flex h-40 w-full items-center justify-center bg-white p-8">
      <div className="flex items-center gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-2 rounded-full bg-black"
            style={{
              animation: "wave 1s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes wave {
            0%, 100% {
              transform: scaleY(0.2);
            }
            50% {
              transform: scaleY(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default AudioWave;
