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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateOGIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOGI: (name: string) => Promise<void>;
}

export function CreateOGIModal({
  isOpen,
  onClose,
  onCreateOGI,
}: CreateOGIModalProps) {
  const [ogiName, setOgiName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ogiName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateOGI(ogiName.trim());
      setOgiName('');
      onClose();
    } catch (error) {
      console.error('Failed to create OGI:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setOgiName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New OGI Network</DialogTitle>
          <DialogDescription>
            Create a new Organizational General Intelligence network to manage
            your AI agents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">OGI Name</Label>
              <Input
                id="name"
                placeholder="Enter OGI name..."
                value={ogiName}
                onChange={(e) => setOgiName(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!ogiName.trim() || isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create OGI
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
