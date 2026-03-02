import { createContext, useContext, useState, ReactNode } from "react";

interface WorkflowContextType {
  activeTasks: Record<string, boolean>;
  taskExecutions: Record<string, TaskExecution[]>;
  setTaskActive: (taskName: string, isActive: boolean) => void;
  clearActiveTasks: () => void;
  clearTaskExecutions: () => void;
  addTaskExecution: (execution: TaskExecution) => void;
}

export interface TaskExecution {
  id: string;
  taskName: string;
  startTime?: number;
  endTime?: number;
  status: "started" | "completed" | "failed";
  eventType: string;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined,
);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [activeTasks, setActiveTasks] = useState<Record<string, boolean>>({});
  const [taskExecutions, setTaskExecutions] = useState<
    Record<string, TaskExecution[]>
  >({});

  const setTaskActive = (taskName: string, isActive: boolean) => {
    setActiveTasks((prev) => ({
      ...prev,
      [taskName]: isActive,
    }));
  };

  // Clear active tasks
  const clearActiveTasks = () => {
    setActiveTasks({});
  };

  // Clear task executions history (for timeline)
  const clearTaskExecutions = () => {
    setTaskExecutions({});
  };

  const addTaskExecution = (execution: TaskExecution) => {
    setTaskExecutions((prev) => {
      const executions = prev[execution.taskName] || [];

      // Update existing execution if this is a completion for a started task
      if (execution.status === "completed" || execution.status === "failed") {
        const updatedExecutions = executions.map((exec) => {
          if (exec.id === execution.id && exec.status === "started") {
            return {
              ...exec,
              endTime: execution.endTime,
              status: execution.status,
            };
          }
          return exec;
        });

        return {
          ...prev,
          [execution.taskName]: updatedExecutions,
        };
      }

      // Add new execution
      return {
        ...prev,
        [execution.taskName]: [...executions, execution],
      };
    });
  };

  return (
    <WorkflowContext.Provider
      value={{
        activeTasks,
        taskExecutions,
        setTaskActive,
        clearActiveTasks,
        clearTaskExecutions,
        addTaskExecution,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
};
