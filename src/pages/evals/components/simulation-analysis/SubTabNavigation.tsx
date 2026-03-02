import React from "react";
import { Button } from "@/components/ui/button";

interface SubTabNavigationProps {
  activeTab: "overview" | "detailed";
  onTabChange: (tab: "overview" | "detailed") => void;
}

export const SubTabNavigation: React.FC<SubTabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="mb-6 flex gap-2 border-b border-gray-200">
      <Button
        variant={activeTab === "overview" ? "default" : "ghost"}
        className={`rounded-b-none`}
        onClick={() => onTabChange("overview")}
      >
        Overview
      </Button>
      <Button
        variant={activeTab === "detailed" ? "default" : "ghost"}
        className={`rounded-b-none`}
        onClick={() => onTabChange("detailed")}
      >
        Detailed Report
      </Button>
    </div>
  );
};
