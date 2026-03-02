import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { WorldModel } from "../types/worldModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorldModelCardProps {
  worldModel: WorldModel;
  agentId: string;
  index?: number;
}

const cardVariants = {
  hidden: () => ({
    opacity: 0,
    x: -20,
    scale: 1,
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.5,
      delay: index / 10,
    },
  }),
};

export const WorldModelCard: React.FC<WorldModelCardProps> = ({
  worldModel,
  agentId,
  index = 0,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/agent-simulation-engine/world-model/${worldModel._id}?agentId=${agentId}`);
  };
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "created":
  //       return "bg-green-100 text-green-800";
  //     case "processing":
  //       return "bg-yellow-100 text-yellow-800";
  //     case "failed":
  //       return "bg-red-100 text-red-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      transition={{
        delay: index / 20,
      }}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      layout
    >
      <Card
        className="relative z-10 h-[180px] cursor-pointer space-y-4 border p-4 transition-all hover:border-primary"
        onClick={handleClick}
      >
        <CardHeader className="p-0 pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-2 text-lg">
              {worldModel.name}
            </CardTitle>
            {/* <Badge className={getStatusColor(worldModel.status)}>
              {worldModel.status}
            </Badge> */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {worldModel.scenarios_count}
              </div>
              <div className="text-xs text-gray-500">Scenarios</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {worldModel.personas_count}
              </div>
              <div className="text-xs text-gray-500">Personas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {worldModel.test_cases_count}
              </div>
              <div className="text-xs text-gray-500">Simulations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
