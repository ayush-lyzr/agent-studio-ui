import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprintUrl: string;
}

const ShareBlueprintModal: React.FC<ShareBlueprintModalProps> = ({
  isOpen,
  onClose,
  blueprintUrl
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(blueprintUrl);
      setCopied(true);
      toast.success('Blueprint URL copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast.error('Failed to copy URL to clipboard');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Blueprint - Agent Orchestration',
          text: 'Check out this blueprint I created using Agent Studio',
          url: blueprintUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy if share API fails
        handleCopyUrl();
      }
    } else {
      // Fallback to copy if Web Share API is not supported
      handleCopyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Blueprint
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blueprint-url" className="text-sm font-medium">
              Blueprint URL
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="blueprint-url"
                value={blueprintUrl}
                readOnly
                className="flex-1 bg-muted text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopyUrl}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Anyone with this link can view your blueprint and clone it to their workspace.
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Blueprint
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareBlueprintModal;