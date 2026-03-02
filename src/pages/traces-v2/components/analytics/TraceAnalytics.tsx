import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { BarChart3, Clock, AlertCircle, Coins, Zap } from 'lucide-react';
import { getTraceDashboard, AnalyticsFilters } from '../../trace.service';
import { CREDITS_DIVISOR } from '@/lib/constants';

interface TraceAnalyticsProps {
  apiKey: string;
  filters?: AnalyticsFilters;
}

const TraceAnalytics: React.FC<TraceAnalyticsProps> = ({ apiKey, filters }) => {
  const { data, loading } = getTraceDashboard(apiKey, filters);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No data available</p>
          <p className="text-sm text-muted-foreground/70">
            Analytics will appear here once data is available
          </p>
        </div>
      </div>
    );
  }

  // Extracting credits and divided by 100 for simplify credits
  const dailyMetricsWithCredits = (data.daily_metrics || []).map((metric) => ({
    ...metric,
    credits_consumed: (metric.credits_consumed ?? 0) / CREDITS_DIVISOR,
  }));

  // Transform latency data from milliseconds to seconds
  const dailyMetricsWithSeconds = (data.daily_metrics || []).map((metric) => ({
    ...metric,
    avg_latency_s: metric.avg_latency_ms / 1000,
    p95_latency_s: metric.p95_latency_ms / 1000,
  }));

  // Chart configurations
  const creditsChartConfig: ChartConfig = {
    credits_consumed: {
      label: "Credits",
      color: "hsl(var(--chart-1))",
    },
  };

  const latencyChartConfig: ChartConfig = {
    avg_latency_s: {
      label: "Avg Latency (s)",
      color: "hsl(var(--chart-2))",
    },
    p95_latency_s: {
      label: "P95 Latency (s)",
      color: "hsl(var(--chart-3))",
    },
  };

  const errorRateChartConfig: ChartConfig = {
    error_rate: {
      label: "Error Rate (%)",
      color: "hsl(var(--destructive))",
    },
  };

  const tokenChartConfig: ChartConfig = {
    total_input_tokens: {
      label: "Input Tokens",
      color: "hsl(var(--chart-4))",
    },
    total_output_tokens: {
      label: "Output Tokens",
      color: "hsl(var(--chart-5))",
    },
  };

  // Calculate average cost per trace
  const avgCostPerTrace =
    data.total_traces > 0
      ? (
          (data.total_credits_consumed || 0) /
          data.total_traces /
          CREDITS_DIVISOR
        ).toFixed(4)
      : "0.0000";

  // Calculate average tokens per trace
  const avgTokensPerTrace =
    data.total_traces > 0
      ? Math.round(
          ((data.total_input_tokens || 0) + (data.total_output_tokens || 0)) /
            data.total_traces,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Coins className="h-4 w-4 text-muted-foreground" />
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.total_credits_consumed || 0) / CREDITS_DIVISOR).toFixed(
                2,
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Avg per trace: {avgCostPerTrace}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.avg_latency_ms || 0) / 1000).toFixed(2)}s
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.total_traces || 0} total traces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Token Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgTokensPerTrace.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Avg tokens per trace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Lines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Credits Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Credits Consumed</CardTitle>
            <CardDescription>Daily credit usage trend</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.daily_metrics || []).length === 0 ? (
              <div className="flex h-[250px] flex-col items-center justify-center space-y-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">
                    No data available
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Credits data will appear here
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={creditsChartConfig}
                className="aspect-auto h-[250px]"
              >
                <LineChart
                  data={dailyMetricsWithCredits}
                  margin={{ top: 20, left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="credits_consumed"
                    stroke={creditsChartConfig.credits_consumed.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Latency Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Latency Trends</CardTitle>
            <CardDescription>
              Average and P95 latency over time (seconds)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(data.daily_metrics || []).length === 0 ? (
              <div className="flex h-[250px] flex-col items-center justify-center space-y-4">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">
                    No data available
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Latency data will appear here
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={latencyChartConfig}
                className="aspect-auto h-[250px]"
              >
                <LineChart
                  data={dailyMetricsWithSeconds}
                  margin={{ top: 20, left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_latency_s"
                    stroke={latencyChartConfig.avg_latency_s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="p95_latency_s"
                    stroke={latencyChartConfig.p95_latency_s.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Error Rate Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Error Rate</CardTitle>
            <CardDescription>Error rate percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.daily_metrics || []).length === 0 ? (
              <div className="flex h-[250px] flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">
                    No data available
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Error rate data will appear here
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={errorRateChartConfig}
                className="aspect-auto h-[250px]"
              >
                <LineChart
                  data={data.daily_metrics}
                  margin={{ top: 20, left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                  <YAxis hide domain={[0, "dataMax"]} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="error_rate"
                    stroke={errorRateChartConfig.error_rate.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Token Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
            <CardDescription>Input and output tokens over time</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.daily_metrics || []).length === 0 ? (
              <div className="flex h-[250px] flex-col items-center justify-center space-y-4">
                <Zap className="h-12 w-12 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">
                    No data available
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Token usage data will appear here
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={tokenChartConfig}
                className="aspect-auto h-[250px]"
              >
                <LineChart
                  data={data.daily_metrics}
                  margin={{ top: 20, left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_input_tokens"
                    stroke={tokenChartConfig.total_input_tokens.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_output_tokens"
                    stroke={tokenChartConfig.total_output_tokens.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TraceAnalytics;
