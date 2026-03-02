import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";

export function LivePreviewLoadingCard() {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-3 p-6 hover:translate-y-0 hover:border-input hover:shadow-none">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium">Connecting</span>
      </div>
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Creating a LiveKit session and requesting microphone access.
      </p>
    </Card>
  );
}
