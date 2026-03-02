import React from "react";

const TypingAnimation: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div
        className="animate-typing mx-1 h-2 w-2 rounded-full bg-foreground"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="animate-typing mx-1 h-2 w-2 rounded-full bg-foreground"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className="animate-typing mx-1 h-2 w-2 rounded-full bg-foreground"
        style={{ animationDelay: "0.4s" }}
      ></div>

      <style>{`
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.5);
          }
        }
        .animate-typing {
          animation: typing 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TypingAnimation;
