import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Agent {
  _id: string;
  name: string;
  agent_role?: string;
  description?: string;
}

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAgents: (agentIds: string[]) => Promise<void>;
  availableAgents: Agent[];
  existingAgentIds: string[];
}

export function AddAgentModal({
  isOpen,
  onClose,
  onAddAgents,
  availableAgents,
  existingAgentIds,
}: AddAgentModalProps) {
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Filter out agents that are already in the OGI
  const agentsNotInOGI = availableAgents.filter(
    (agent) => !existingAgentIds.includes(agent._id)
  );

  console.log('Available agents:', availableAgents.length);
  console.log('Existing agent IDs:', existingAgentIds);
  console.log('Agents not in OGI:', agentsNotInOGI.length);

  // Filter agents based on search query
  const filteredAgents = agentsNotInOGI.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.agent_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleAgent = (agentId: string) => {
    console.log('Toggling agent:', agentId);
    setSelectedAgentIds((prev) => {
      const newSelection = prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId];
      console.log('Selected agent IDs:', newSelection);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedAgentIds.length === filteredAgents.length) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(filteredAgents.map((agent) => agent._id));
    }
  };

  const handleSubmit = async () => {
    if (selectedAgentIds.length === 0) return;

    setIsAdding(true);
    try {
      await onAddAgents(selectedAgentIds);
      setSelectedAgentIds([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Failed to add agents:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      setSelectedAgentIds([]);
      setSearchQuery('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Agents to OGI</DialogTitle>
          <DialogDescription>
            Select agents to add to this OGI network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={isAdding}
            />
          </div>

          {/* Select All */}
          {filteredAgents.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={
                  filteredAgents.length > 0 &&
                  selectedAgentIds.length === filteredAgents.length
                }
                onCheckedChange={handleSelectAll}
                disabled={isAdding}
              />
              <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({filteredAgents.length})
              </Label>
            </div>
          )}

          {/* Agent List */}
          <ScrollArea className="h-[300px] pr-4">
            {filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-500">
                  {agentsNotInOGI.length === 0
                    ? 'All agents are already in this OGI'
                    : 'No agents found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAgents.map((agent) => (
                  <div
                    key={agent._id}
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all",
                      selectedAgentIds.includes(agent._id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onClick={() => handleToggleAgent(agent._id)}
                  >
                    <Checkbox
                      id={agent._id}
                      checked={selectedAgentIds.includes(agent._id)}
                      disabled={isAdding}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {agent.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selected count */}
          {selectedAgentIds.length > 0 && (
            <div className="text-sm text-gray-500">
              {selectedAgentIds.length} agent{selectedAgentIds.length !== 1 ? 's' : ''}{' '}
              selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedAgentIds.length === 0 || isAdding}
          >
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selectedAgentIds.length > 0 ? `(${selectedAgentIds.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
