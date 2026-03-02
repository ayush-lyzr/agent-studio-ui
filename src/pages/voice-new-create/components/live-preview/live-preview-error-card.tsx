import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/custom/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LivePreviewErrorCard({
  error,
  onBackToPreview,
}: {
  error: string;
  onBackToPreview: () => void;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden hover:translate-y-0 hover:border-input hover:shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Live preview</CardTitle>
            <CardDescription className="mt-1">
              Something went wrong while starting the session.
            </CardDescription>
          </div>
          <Badge variant="destructive" className="shrink-0">
            Error
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertTitle>Connection error</AlertTitle>
            <AlertDescription className="break-words">{error}</AlertDescription>
          </div>
        </Alert>
        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Quick checks
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>- Allow microphone permissions in your browser</li>
            <li>- Verify your backend session endpoint is reachable</li>
            <li>- Try again after updating the configuration</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="mt-auto border-t bg-card/50 p-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onBackToPreview}
        >
          Back to preview
        </Button>
      </CardFooter>
    </Card>
  );
}
