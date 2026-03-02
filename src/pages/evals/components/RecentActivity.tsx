import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronRight,
  Layers,
  Users,
  TestTube,
  PlayCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecentEnvironment {
  id: string;
  name: string;
  agent_id: string;
  agent_name?: string;
  personas_count: number;
  scenarios_count: number;
  simulations_count: number;
  created_at: string;
  status: string;
}

interface RecentActivityProps {
  recentEnvironments: RecentEnvironment[];
  loading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  recentEnvironments,
  loading = false,
}) => {
  const navigate = useNavigate();

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Environments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 rounded-lg bg-gray-200"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentEnvironments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Environments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p>No environments created yet</p>
            <p className="mt-1 text-sm">
              Create an environment to start testing your agents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Environments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Environment Name</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead className="text-center">Personas</TableHead>
              <TableHead className="text-center">Scenarios</TableHead>
              <TableHead className="text-center">Simulations</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentEnvironments.slice(0, 5).map((environment, index) => {
              const date = environment.created_at
                ? new Date(
                    environment.created_at.endsWith("Z") ||
                    environment.created_at.includes("+")
                      ? environment.created_at
                      : `${environment.created_at}Z`,
                  )
                : new Date();
              return (
                <motion.tr
                  key={environment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() =>
                    navigate(
                      `/agent-simulation-engine/world-model/${environment.id}?agentId=${environment.agent_id}`,
                    )
                  }
                >
                  <TableCell className="font-medium">
                    {environment.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {environment.agent_name || "N/A"}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {environment.personas_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <PlayCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {environment.scenarios_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TestTube className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {environment.simulations_count}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatTimeAgo(date.toString())}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
