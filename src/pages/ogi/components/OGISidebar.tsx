import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, UserPlus, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { OGI } from '../types';
import { Skeleton } from '@/components/ui/skeleton';

interface OGISidebarProps {
  ogis: OGI[];
  selectedOGI: OGI | null;
  onSelectOGI: (ogi: OGI) => void;
  onCreateOGI: () => void;
  onDeleteOGI: (ogiId: string) => void;
  onAddAgents?: () => void;
  loading: boolean;
}

export function OGISidebar({
  ogis,
  selectedOGI,
  onSelectOGI,
  onCreateOGI,
  onDeleteOGI,
  onAddAgents,
  loading,
}: OGISidebarProps) {
  return (
    <Card className={cn(
      "h-full flex flex-col rounded-2xl",
      "bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl",
      "border border-gray-200/50 dark:border-gray-700/50 shadow-2xl",
      "w-full"
    )}>
      <div className="border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">OGI Networks</h3>
            <div className="flex items-center gap-1">
              <Button size="sm" onClick={onCreateOGI}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
          {/* <p className="text-xs text-gray-500 dark:text-gray-400">
            Organizational General Intelligence
          </p> */}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))
          ) : ogis.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="text-gray-400 mb-3">
                <Plus className="h-12 w-12" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                No OGI Networks Yet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Create your first OGI network to get started
              </p>
              <Button size="sm" onClick={onCreateOGI}>
                <Plus className="h-4 w-4 mr-1" />
                Create OGI
              </Button>
            </div>
          ) : (
            // OGI list
            ogis.map((ogi) => (
              <Card
                key={ogi.ogi_id}
                onClick={() => onSelectOGI(ogi)}
                className={cn(
                  'p-3 cursor-pointer transition-all hover:shadow-md border group',
                  'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm',
                  selectedOGI?.ogi_id === ogi.ogi_id
                    ? 'border-blue-500 bg-blue-100/60 dark:bg-blue-900/30'
                    : 'hover:border-blue-400 dark:hover:border-blue-600',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate mb-1">
                      {ogi.ogi_name}
                    </div>
                   
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {onAddAgents && selectedOGI?.ogi_id === ogi.ogi_id && (
                        <>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onAddAgents();
                          }}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Agents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOGI(ogi.ogi_id);
                        }}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Network
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
