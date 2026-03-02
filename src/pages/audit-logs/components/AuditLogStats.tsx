import { cn } from "@/lib/utils";
import { AuditStatsResponse } from "../types";
import {
  Activity,
  CheckCircle,
  FileText,
  XCircle,
} from "lucide-react";

interface AuditLogStatsProps {
  stats: AuditStatsResponse | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  description,
  isLoading,
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "rounded-xl border border-input p-4",
      isLoading && "shimmer bg-secondary",
      className
    )}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{title}</p>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
    {description && (
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    )}
  </div>
);

const AuditLogStats = ({ stats, isLoading }: AuditLogStatsProps) => {
  const successCount = stats?.events_by_result?.success ?? 0;
  const failureCount = stats?.events_by_result?.failure ?? 0;
  const totalEvents = stats?.total_events ?? 0;
  const successRate =
    totalEvents > 0 ? ((successCount / totalEvents) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Events"
        value={totalEvents.toLocaleString()}
        icon={<Activity className="size-4" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Successful"
        value={successCount.toLocaleString()}
        icon={<CheckCircle className="size-4 text-green-500" />}
        description={`${successRate}% success rate`}
        isLoading={isLoading}
      />
      <StatCard
        title="Failed"
        value={failureCount.toLocaleString()}
        icon={<XCircle className="size-4 text-red-500" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Resource Types"
        value={Object.keys(stats?.events_by_resource ?? {}).length}
        icon={<FileText className="size-4" />}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AuditLogStats;
