import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export default function NumericCard(props: {
  title: string;
  description: string;
  targetValue: number;
  initialValue: number;
  icon: LucideIcon;
  numberPrefix: string;
  numberSuffix: string;
  speed: number;
}) {
  const [count, setCount] = useState(props.initialValue);
  const duration = 5; // 2 seconds

  useEffect(() => {
    let startValue = props.initialValue;
    const interval = duration / (props.targetValue - props.initialValue);

    const counter = setInterval(() => {
      startValue += props.speed ? props.speed : 50;
      setCount(startValue);

      if (startValue > props.targetValue) {
        setCount(props.targetValue);
      }

      if (startValue == props.targetValue) {
        clearInterval(counter);
      }
    }, interval);

    return () => {
      clearInterval(counter);
    };
  }, [props.targetValue, props.initialValue]);

  return (
    <Card x-chunk="">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        {/*<ChevronsUp className="h-4 w-4 text-muted-foreground"/>*/}
        <props.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {props.numberPrefix}
          {count}
          {props.numberSuffix}
        </div>
        <p className="text-xs text-muted-foreground">{props.description}</p>
      </CardContent>
    </Card>
  );
}
