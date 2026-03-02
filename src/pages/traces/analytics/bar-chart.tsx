"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  YAxis,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface BarChartData {
  agent_usages: number;
  agent_name: string;
  agent_id: string;
}

interface Props {
  data: BarChartData[];
}

const chartConfig = {
  count: {
    label: "Usage Count",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function BarChartWithLabel({ data }: Props) {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Used Agents</CardTitle>
          <CardDescription>Agent usage statistics</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = data.map((item) => ({
    name: item.agent_name,
    count: item.agent_usages,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Used Agents</CardTitle>
        <CardDescription>Agent usage statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px]">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 30,
              right: 30,
              left: 30,
              bottom: 5,
            }}
            barCategoryGap={30}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="font-medium">Agent:</span>
                        <span className="font-medium text-primary">
                          {payload[0].payload.name}
                        </span>
                        <span className="font-medium">Usage:</span>
                        <span className="font-medium text-primary">
                          {payload[0].value} times
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            >
              {/* <LabelList
                dataKey="name"
                position="insideBottom"
                angle={-45}
                offset={10}
                className="fill-foreground text-xs"
                fontSize={11}
              /> */}
              <LabelList
                dataKey="count"
                position="top"
                offset={10}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
