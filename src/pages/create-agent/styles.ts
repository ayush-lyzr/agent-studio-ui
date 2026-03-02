export const styles = `
  @keyframes shine {
    0% {
      background-position: 200% center;
    }
    100% {
      background-position: -200% center;
    }
  }

  .animate-shine {
    background-size: 200% auto;
    animation: shine 3s linear infinite;
  }

  .success-border {
    border-color: rgb(var(--success-color));
    box-shadow: 0 0 0 1px rgba(var(--success-color), 0.2);
  }

  .success-glow {
    box-shadow: 0 0 15px rgba(var(--success-color), 0.2);
    border-radius: inherit;
  }

  :root {
    --success-color: 34, 197, 94;
  }

  [data-theme='dark'] {
    --success-color: 74, 222, 128;
  }
`;
