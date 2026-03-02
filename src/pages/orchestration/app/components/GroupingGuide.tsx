import React from 'react';
import { Group, MousePointer, Edit2, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GroupingGuide: React.FC = () => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Group className="h-4 w-4 text-blue-500" />
          Node Grouping
        </CardTitle>
        <CardDescription className="text-xs">
          Organize your workflow with visual groups
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MousePointer className="h-3 w-3 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Select nodes</p>
              <p className="text-muted-foreground">Click and drag to select 2+ nodes</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Group className="h-3 w-3 mt-0.5 text-blue-500" />
            <div>
              <p className="font-medium">Create group</p>
              <p className="text-muted-foreground">Click the group button in toolbar</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Edit2 className="h-3 w-3 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Edit group</p>
              <p className="text-muted-foreground">Click group title to rename</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Palette className="h-3 w-3 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Change color</p>
              <p className="text-muted-foreground">Select group and use color picker</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupingGuide;