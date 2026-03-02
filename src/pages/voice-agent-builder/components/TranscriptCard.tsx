import { useState } from "react";
import { ChevronRight, Phone, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { TranscriptDocument } from "@/services/transcriptsService";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TranscriptCardProps {
  transcript: TranscriptDocument;
}

export function TranscriptCard({ transcript }: TranscriptCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isBrowserSession = transcript.accountSid === "browser";
  const messageCount = transcript.transcripts.length;
  const duration = formatDistanceToNow(new Date(transcript.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      {/* Session Row - Table Row */}
      <TableRow
        onClick={() => setIsDialogOpen(true)}
        className="group cursor-pointer transition-colors hover:bg-accent/50"
      >
        {/* Channel Icon - Smaller */}
        <TableCell className="w-7 px-3 py-2">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              isBrowserSession
                ? "bg-blue-100 dark:bg-blue-950"
                : "bg-green-100 dark:bg-green-950",
            )}
          >
            {isBrowserSession ? (
              <Monitor className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            )}
          </div>
        </TableCell>

        {/* Type Column */}
        <TableCell className="w-32 px-3 py-2">
          <span className="text-sm font-medium">
            {isBrowserSession ? "Browser" : "Phone"}
          </span>
        </TableCell>

        {/* Time Column */}
        <TableCell className="w-36 px-3 py-2 text-sm text-muted-foreground">
          {duration}
        </TableCell>

        {/* Messages Column */}
        <TableCell className="w-24 px-3 py-2 text-sm text-muted-foreground">
          {messageCount} msgs
        </TableCell>

        {/* Date Column */}
        <TableCell className="px-3 py-2 text-sm text-muted-foreground">
          {new Date(transcript.createdAt).toLocaleString()}
        </TableCell>

        {/* Badge */}
        <TableCell className="px-3 py-2">
          <Badge
            variant={isBrowserSession ? "default" : "secondary"}
            className="text-xs"
          >
            {isBrowserSession ? "Web" : "Twilio"}
          </Badge>
        </TableCell>

        {/* Expand Arrow */}
        <TableCell className="w-4 px-3 py-2">
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </TableCell>
      </TableRow>

      {/* Full Transcript Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isBrowserSession
                    ? "bg-blue-100 dark:bg-blue-950"
                    : "bg-green-100 dark:bg-green-950",
                )}
              >
                {isBrowserSession ? (
                  <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isBrowserSession ? "Browser Session" : "Phone Call"}
                  <Badge
                    variant={isBrowserSession ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isBrowserSession ? "Web" : "Twilio"}
                  </Badge>
                </div>
                <div className="mt-1 text-xs font-normal text-muted-foreground">
                  {new Date(transcript.createdAt).toLocaleString()} •{" "}
                  {messageCount} messages
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
            {/* Session Details */}
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Session ID:</span>
                  <code className="ml-2 font-mono text-xs">
                    {transcript.sessionId}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Call SID:</span>
                  <code className="ml-2 font-mono text-xs">
                    {transcript.callSid}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <span className="ml-2 text-xs">
                    {new Date(transcript.createdAt).toLocaleString()}
                  </span>
                </div>
                {transcript.updatedAt !== transcript.createdAt && (
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="ml-2 text-xs">
                      {new Date(transcript.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Conversation</h3>
              <div className="space-y-3">
                {transcript.transcripts.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase opacity-70">
                          {msg.role === "user" ? "User" : "Agent"}
                        </span>
                        {msg.isFinal && msg.role !== "user" && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1 py-0 text-xs"
                          >
                            Final
                          </Badge>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap break-words text-sm">
                        {msg.transcript}
                      </div>
                      <div className="mt-2 text-xs opacity-60">
                        {new Date(msg.transcriptTimestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
