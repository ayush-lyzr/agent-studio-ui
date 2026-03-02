import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface LoopResult {
  loop: number;
  label: string;
  improved: any;
  testResults: any[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

interface LoopStatisticsCardProps {
  loopResults: LoopResult[];
  currentLoop: number;
  maxLoops: number;
  isAutoHardening: boolean;
  selectedLoopIndex?: number;
  onLoopSelect?: (index: number) => void;
}

export const LoopStatisticsCard: React.FC<LoopStatisticsCardProps> = ({
  loopResults,
  currentLoop,
  maxLoops,
  isAutoHardening,
  selectedLoopIndex = 0,
  onLoopSelect
}) => {
  return (
    <Card className="p-6 bg-white border rounded-lg shadow-sm h-full">
      <div className="space-y-4">
        {/* Header with Current Loop */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Statistics</h3>
          {isAutoHardening && currentLoop > 0 && (
            <Badge className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white">
              Loop {currentLoop} of {maxLoops}
            </Badge>
          )}
        </div>

        {/* Loop Results Progression */}
        {loopResults.length > 0 && (
          <div className="space-y-2">
            {loopResults.map((loopResult, index) => {
              const passRate = loopResult.totalCount > 0
                ? Math.round((loopResult.passedCount / loopResult.totalCount) * 100)
                : 0;

              const isSelected = index === selectedLoopIndex;

              // Green if any tests passed, Red if all failed (0%)
              const isGreen = loopResult.passedCount > 0;

              return (
                <div
                  key={loopResult.loop}
                  onClick={() => onLoopSelect?.(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-md'
                      : ''
                  } ${
                    isGreen
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-red-50 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {loopResult.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          isGreen
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        {passRate}% passed
                      </Badge>
                    </div>
                    {isGreen ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-700">{loopResult.passedCount}</span> passed
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-700">
                      <span className="font-semibold text-red-700">{loopResult.totalCount - loopResult.passedCount}</span> failed
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {loopResult.totalCount} total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

       

    
      </div>
    </Card>
  );
};
