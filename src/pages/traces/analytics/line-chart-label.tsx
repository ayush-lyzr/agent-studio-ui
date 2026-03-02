"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import React from "react";

interface Props {
  title: string;
  description: string;
  data: {
    date: string;
    avg_latency_ms: number;
    total_sessions: number;
    total_agents: number;
    avg_latency: number;
    total_cost: number;
  }[];
  chartConfig: ChartConfig;
  dataKey:
    | "avg_latency_ms"
    | "total_sessions"
    | "total_agents"
    | "avg_latency"
    | "total_cost"
    | "total_traces"
    | "total_users";
  calculation: "avg" | "sum";
}

const LineChartWithLabel: React.FC<Props> = ({
  title,
  data,
  chartConfig,
  dataKey,
  calculation,
}) => {
  console.log("LineChartWithLabel", data);
  console.log("Data Key", dataKey);

  let sum = 0;
  let count = 0;

  data?.forEach((ele) => {
    console.log("current ele", ele[dataKey as keyof typeof ele]);
    sum = sum + (ele[dataKey as keyof typeof ele] as number);
    if (ele[dataKey as keyof typeof ele] !== 0) {
      count++;
    }
  });

  console.log("Sum", sum);

  let val = sum;

  if (calculation == "avg") {
    val = sum / count || 0;
  }

  if (dataKey === "avg_latency_ms") {
    val = val / 1000;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {parseFloat(val.toString()).toFixed(2)}{" "}
          {dataKey === "avg_latency_ms" ? "seconds" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data?.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center space-y-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-muted-foreground">
                No data available
              </p>
              <p className="text-sm text-muted-foreground/70">
                There are no {dataKey} records to display in this chart
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px]"
          >
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                top: 20,
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <YAxis hide domain={["dataMin", "dataMax"]} includeHidden />
              <Line
                type="monotone"
                stroke={chartConfig[dataKey].color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                }}
                // connectNulls={true}
                dataKey={dataKey}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default LineChartWithLabel;
