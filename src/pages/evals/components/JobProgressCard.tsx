import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { JobStatusResponse } from "../utils/worldModelApi";
import {
  getSimulationJobStatus,
  SimulationJobStatus,
  cancelSimulationJob,
} from "../services/environmentApi";
import { useToast } from "@/components/ui/use-toast";

interface JobProgressCardProps {
  jobId: string;
  worldModelId: string; // Required for new environment API
  apiKey: string;
  onComplete?: (jobStatus: JobStatusResponse) => void;
  onCancel?: (jobId: string) => void;
  onError?: (jobId: string, error: string) => void;
  pollInterval?: number; // milliseconds, default 2000
  autoHide?: boolean; // auto-hide when completed
  autoHideDelay?: number; // delay before auto-hiding, default 3000ms
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({
  jobId,
  worldModelId,
  apiKey,
  onComplete,
  onCancel,
  onError,
  pollInterval = 2000,
  autoHide = false,
  autoHideDelay = 3000,
}) => {
  const [jobStatus, setJobStatus] = useState<SimulationJobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  // Poll job status
  useEffect(() => {
    if (!isPolling || !jobId || !worldModelId) return;

    const poll = async () => {
      try {
        const status = await getSimulationJobStatus(
          worldModelId,
          jobId,
          apiKey,
        );
        setJobStatus(status);

        // Check if job is completed (all tasks done)
        const isCompleted =
          status.summary.pending === 0 && status.summary.running === 0;
        const hasFailed = status.summary.failed > 0;

        if (isCompleted) {
          setIsPolling(false);

          // Transform new format to old format for callback compatibility
          const legacyStatus: JobStatusResponse = {
            job_id: status.job_id,
            type: "test_case_generation",
            world_model_id: status.environment_id,
            status: hasFailed ? "failed" : "completed",
            progress: {
              current: status.summary.completed + status.summary.failed,
              total: status.summary.total,
              current_item: null,
            },
            results: {
              created_ids:
                status.tasks
                  .filter((t) => t.simulation_id)
                  .map((t) => t.simulation_id!) || [],
              failed_items: status.tasks
                .filter((t) => t.state === "FAILURE")
                .map((t) => ({
                  combination: `${t.scenario_name} × ${t.persona_name}`,
                  error: "Generation failed",
                })),
            },
            error: hasFailed ? `${status.summary.failed} tasks failed` : null,
            created_at: status.created_at,
            started_at: status.tasks[0]?.started_at || null,
            completed_at:
              status.tasks[status.tasks.length - 1]?.completed_at || null,
          };

          console.log({ legacyStatus });
          // Call appropriate callback
          if (onComplete) {
            onComplete(legacyStatus);
          }

          if (hasFailed && onError) {
            onError(jobId, legacyStatus.error!);
          }

          // Auto-hide if enabled and successful
          if (autoHide && !hasFailed) {
            setTimeout(() => {
              setIsVisible(false);
            }, autoHideDelay);
          }
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
        setIsPolling(false);
        if (onError) {
          onError(jobId, "Failed to fetch job status");
        }
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    const intervalId = setInterval(poll, pollInterval);

    return () => clearInterval(intervalId);
  }, [
    jobId,
    worldModelId,
    apiKey,
    isPolling,
    pollInterval,
    onComplete,
    onCancel,
    onError,
    autoHide,
    autoHideDelay,
  ]);

  const handleCancel = async () => {
    if (!jobStatus || isCancelling || !worldModelId) return;

    try {
      setIsCancelling(true);

      const result = await cancelSimulationJob(worldModelId, jobId, apiKey);

      toast({
        title: "Job Cancelled",
        description: `Cancelled job successfully. ${result.summary.revoked} tasks were revoked, ${result.summary.already_completed} were already completed.`,
      });

      setIsPolling(false);

      if (onCancel) {
        onCancel(jobId);
      }
    } catch (error: any) {
      console.error("Failed to cancel job:", error);
      toast({
        title: "Cancellation Failed",
        description:
          error?.response?.data?.detail ||
          "Failed to cancel the job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = () => {
    if (!jobStatus) return null;

    const isRunning =
      jobStatus.summary.running > 0 || jobStatus.summary.pending > 0;
    const isCompleted =
      jobStatus.summary.pending === 0 && jobStatus.summary.running === 0;
    const hasFailed = jobStatus.summary.failed > 0;

    let config;
    if (isRunning) {
      config = {
        icon: Loader2,
        label: "Running",
        variant: "default" as const,
      };
    } else if (isCompleted && hasFailed) {
      config = {
        icon: XCircle,
        label: "Completed with Failures",
        variant: "destructive" as const,
      };
    } else if (isCompleted) {
      config = {
        icon: CheckCircle2,
        label: "Completed",
        variant: "success" as const,
      };
    } else {
      config = {
        icon: Clock,
        label: "Queued",
        variant: "secondary" as const,
      };
    }

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${isRunning ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
  };

  const getJobTypeLabel = () => {
    return "Simulation Generation";
  };

  const calculateProgress = () => {
    if (!jobStatus || jobStatus.summary.total === 0) return 0;
    const completed = jobStatus.summary.completed + jobStatus.summary.failed;
    return (completed / jobStatus.summary.total) * 100;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    // Ensure the date is treated as UTC if no timezone is specified
    const normalizedDateString =
      dateString.endsWith("Z") || dateString.includes("+")
        ? dateString
        : `${dateString}Z`;
    const date = new Date(normalizedDateString);
    return date.toLocaleTimeString();
  };

  const getElapsedTime = () => {
    if (!jobStatus || jobStatus.tasks.length === 0) return null;

    const normalize = (d: string) =>
      d.endsWith("Z") || d.includes("+") ? d : `${d}Z`;

    const firstStarted = jobStatus.tasks
      .filter((t) => t.started_at)
      .sort(
        (a, b) =>
          new Date(normalize(a.started_at!)).getTime() -
          new Date(normalize(b.started_at!)).getTime(),
      )[0];

    if (!firstStarted || !firstStarted.started_at) return null;

    const startTime = new Date(normalize(firstStarted.started_at)).getTime();

    const lastCompleted = jobStatus.tasks
      .filter((t) => t.completed_at)
      .sort(
        (a, b) =>
          new Date(normalize(b.completed_at!)).getTime() -
          new Date(normalize(a.completed_at!)).getTime(),
      )[0];

    const endTime = lastCompleted?.completed_at
      ? new Date(normalize(lastCompleted.completed_at)).getTime()
      : Date.now();

    const elapsedSeconds = Math.floor((endTime - startTime) / 1000);

    if (elapsedSeconds < 60) return `${elapsedSeconds}s`;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!jobStatus || jobStatus.summary.running === 0) {
      return null;
    }

    const completedTasks = jobStatus.tasks.filter(
      (t) => t.completed_at && t.started_at,
    );
    if (completedTasks.length === 0) return null;

    const normalize = (d: string) =>
      d.endsWith("Z") || d.includes("+") ? d : `${d}Z`;

    // Calculate average time per task
    const totalTime = completedTasks.reduce((sum, task) => {
      const start = new Date(normalize(task.started_at!)).getTime();
      const end = new Date(normalize(task.completed_at!)).getTime();
      return sum + (end - start);
    }, 0);

    const avgTimePerTask = totalTime / completedTasks.length;
    const remainingTasks =
      jobStatus.summary.pending + jobStatus.summary.running;
    const estimatedRemainingMs = avgTimePerTask * remainingTasks;

    const seconds = Math.floor(estimatedRemainingMs / 1000);
    if (seconds < 60) return `~${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    return `~${minutes}m remaining`;
  };

  if (!isVisible || !jobStatus) return null;

  return (
    <Card className="w-full border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {getJobTypeLabel()}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(jobStatus.summary.running > 0 || jobStatus.summary.pending > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {jobStatus.summary.completed + jobStatus.summary.failed} /{" "}
                {jobStatus.summary.total}
              </span>
              <span className="text-muted-foreground">
                {Math.round(calculateProgress())}%
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}

        {/* Task Summary */}
        {jobStatus.summary.running > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Running: </span>
            <span className="font-medium">
              {jobStatus.summary.running} tasks
            </span>
          </div>
        )}

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {jobStatus.created_at && (
            <div>
              <span className="text-muted-foreground">Started: </span>
              <span>{formatTime(jobStatus.created_at)}</span>
            </div>
          )}
          {getElapsedTime() && (
            <div>
              <span className="text-muted-foreground">Elapsed: </span>
              <span>{getElapsedTime()}</span>
            </div>
          )}
        </div>

        {/* Estimated Time Remaining */}
        {getEstimatedTimeRemaining() && (
          <div className="text-sm text-muted-foreground">
            {getEstimatedTimeRemaining()}
          </div>
        )}

        {/* Results Summary */}
        {jobStatus.summary.pending === 0 && jobStatus.summary.running === 0 && (
          <div
            className={`rounded-md p-3 text-sm ${
              jobStatus.summary.failed > 0
                ? "bg-orange-50 dark:bg-orange-950"
                : "bg-green-50 dark:bg-green-950"
            }`}
          >
            <div
              className={`flex items-center gap-2 ${
                jobStatus.summary.failed > 0
                  ? "text-orange-700 dark:text-orange-300"
                  : "text-green-700 dark:text-green-300"
              }`}
            >
              {jobStatus.summary.failed > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span className="font-medium">
                Successfully created {jobStatus.summary.completed} simulations
              </span>
            </div>
            {jobStatus.summary.failed > 0 && (
              <div className="mt-2 text-orange-700 dark:text-orange-300">
                {jobStatus.summary.failed} tasks failed
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {(jobStatus.summary.running > 0 || jobStatus.summary.pending > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Cancel Job"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
