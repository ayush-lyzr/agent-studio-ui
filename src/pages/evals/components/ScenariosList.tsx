import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Scenario } from "../types/worldModel";

interface ScenariosListProps {
  scenarios: Scenario[];
  selectedScenarios: string[];
  onScenarioToggle: (scenarioId: string, checked: boolean) => void;
  onScenarioDelete?: (scenarioId: string) => void;
  onSelectAllScenarios?: (scenarioIds: string[]) => void;
}

const isErrorScenario = (scenarioName: string) => {
  return scenarioName.toLowerCase().includes('error') || 
         scenarioName.toLowerCase().includes('unauthorized') ||
         scenarioName.toLowerCase().includes('data leakage') ||
         scenarioName.toLowerCase().includes('breach');
};

export const ScenariosList: React.FC<ScenariosListProps> = ({
  scenarios,
  selectedScenarios,
  onScenarioToggle,
  onScenarioDelete,
  onSelectAllScenarios
}) => {
  const allSelected = scenarios.length > 0 && scenarios.every(s => {
    const scenarioId = s._id || s.id || s.name;
    return selectedScenarios.includes(scenarioId);
  });

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAllScenarios) {
      // Batch select/deselect - pass all IDs or empty array
      const allScenarioIds = checked
        ? scenarios.map(s => s._id || s.id || s.name)
        : [];
      onSelectAllScenarios(allScenarioIds);
    } else {
      // Fallback to individual toggles if batch handler not provided
      scenarios.forEach(scenario => {
        const scenarioId = scenario._id || scenario.id || scenario.name;
        if (checked !== selectedScenarios.includes(scenarioId)) {
          onScenarioToggle(scenarioId, checked);
        }
      });
    }
  };

  return (
    <div className="col-span-5 flex flex-col">
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          SCENARIOS
        </p>
      </div>

      {/* Select All */}
      {scenarios.length > 0 && (
        <div className="flex items-center space-x-3 p-3 mb-2 rounded-lg border-2 border-gray-300 bg-gray-100">
          <Checkbox
            id="select-all-scenarios"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <label
            htmlFor="select-all-scenarios"
            className="text-sm font-semibold cursor-pointer flex-1"
          >
            Select All
          </label>
        </div>
      )}

      <div className="space-y-3 flex-1">
        {scenarios.map((scenario) => {
          const scenarioId = scenario._id || scenario.id || scenario.name;
          return (
            <motion.div
              key={scenarioId}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                isErrorScenario(scenario.name)
                  ? 'border-red-200 bg-red-50'
                  : selectedScenarios.includes(scenarioId)
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Checkbox
                id={scenarioId}
                checked={selectedScenarios.includes(scenarioId)}
                onCheckedChange={(checked) => onScenarioToggle(scenarioId, !!checked)}
              />
              <label
                htmlFor={scenarioId}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {scenario.name}
              </label>
              {onScenarioDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onScenarioDelete(scenarioId)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};