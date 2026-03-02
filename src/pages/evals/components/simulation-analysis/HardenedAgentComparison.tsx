import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';

interface ImprovedConfig {
  role: string;
  goal: string;
  instructions: string;
  changeSummary: string[];
}

interface HardenedAgentComparisonProps {
  sourceAgent: any;
  improvedConfig: ImprovedConfig | null;
  modelName?: string;
  onApplyChanges?: () => void;
  onDiscard?: () => void;
}

export const HardenedAgentComparison: React.FC<HardenedAgentComparisonProps> = ({
  sourceAgent,
  improvedConfig,
  modelName = 'Source Model',
  onApplyChanges,
  onDiscard
}) => {
  // If no improved config, don't show anything
  if (!improvedConfig) {
    return null;
  }

  return (
    <Card className="p-6 border-2 border-green-200 bg-green-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-sm font-semibold text-green-900">Hardened Agent Configuration</h3>
        </div>
        <Badge variant="outline" className="text-xs bg-white">
          {modelName}
        </Badge>
      </div>

      {/* Change Summary */}
      {improvedConfig.changeSummary && improvedConfig.changeSummary.length > 0 && (
        <div className="mb-4 p-3 bg-white rounded-md">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Key Changes:</h4>
          <ul className="list-disc list-inside space-y-1">
            {improvedConfig.changeSummary.map((change, idx) => (
              <li key={idx} className="text-sm text-gray-700">{change}</li>
            ))}
          </ul>
        </div>
      )}

      <Separator className="my-4" />

      {/* Role Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Current Role</label>
          <div className="mt-1 p-3 bg-red-50 rounded-md border border-red-200">
            <p className="text-sm whitespace-pre-wrap">{sourceAgent?.agent_role || 'Not specified'}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Improved Role</label>
          <div className="mt-1 p-3 bg-green-50 rounded-md border-2 border-green-300">
            <p className="text-sm font-medium whitespace-pre-wrap">{improvedConfig.role}</p>
          </div>
        </div>
      </div>

      {/* Goal Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Current Goal</label>
          <div className="mt-1 p-3 bg-red-50 rounded-md border border-red-200">
            <p className="text-sm whitespace-pre-wrap">{sourceAgent?.agent_goal || 'Not specified'}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Improved Goal</label>
          <div className="mt-1 p-3 bg-green-50 rounded-md border-2 border-green-300">
            <p className="text-sm font-medium whitespace-pre-wrap">{improvedConfig.goal}</p>
          </div>
        </div>
      </div>

      {/* Instructions Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Current Instructions</label>
          <div className="mt-1 p-3 bg-red-50 rounded-md border border-red-200 max-h-60 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{sourceAgent?.agent_instructions || 'Not specified'}</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Improved Instructions</label>
          <div className="mt-1 p-3 bg-green-50 rounded-md border-2 border-green-300 max-h-60 overflow-y-auto">
            <p className="text-sm font-medium whitespace-pre-wrap">{improvedConfig.instructions}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(onApplyChanges || onDiscard) && (
        <div className="flex items-center gap-3 justify-end">
          {onDiscard && (
            <Button variant="outline" onClick={onDiscard}>
              Discard Changes
            </Button>
          )}
          {onApplyChanges && (
            <Button onClick={onApplyChanges}>
              Push to Production
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
