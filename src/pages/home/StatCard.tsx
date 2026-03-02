import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/spinner";

interface StatCardProps {
  title: string;
  value: number;
  isLoading?: boolean;
  onClick?: () => void;
}

export const StatCard = ({
  title,
  value,
  isLoading,
  onClick,
}: StatCardProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isLoading) return;

    const targetValue = value || 0;
    setCount(0);

    if (targetValue === 0) {
      setCount(0);
      return;
    }

    const duration = 1000;
    let startValue = 0;
    const steps = 20;
    const interval = duration / steps;
    const increment = targetValue / steps;

    const counter = setInterval(() => {
      startValue += increment;
      setCount(Math.round(startValue > targetValue ? targetValue : startValue));

      if (startValue >= targetValue) {
        clearInterval(counter);
      }
    }, interval);

    return () => clearInterval(counter);
  }, [value, isLoading]);

  return (
    <Card
      className="relative cursor-pointer border transition-all hover:border-primary"
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          {isLoading ? (
            <div className="flex h-9 items-center">
              <LoadingSpinner />
            </div>
          ) : (
            <p className="text-xl font-bold tracking-tight">
              {count?.toLocaleString()}
            </p>
          )}
          <p className="text-right text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
};
