import { motion } from "framer-motion";
import { Layers, TestTube, CheckCircle } from "lucide-react";

interface DashboardStatsProps {
  totalEnvironments: number;
  totalSimulations: number;
  totalEvaluations: number;
  loading?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalEnvironments,
  totalSimulations,
  totalEvaluations,
  loading = false,
}) => {
  const stats = [
    {
      label: "Total Environments",
      value: totalEnvironments,
      icon: Layers,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Simulations",
      value: totalSimulations,
      icon: TestTube,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Total Evaluations",
      value: totalEvaluations,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="p-6">
              <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-8 w-3/4 rounded bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="rounded-lg border border-gray-200 bg-card">
            <div className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{stat.label}</p>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
