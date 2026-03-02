import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AuditLogResponse,
  AuditResult,
  AuditChangeResponse,
  GuardrailViolationResponse,
} from "../types";

interface AuditLogDetailProps {
  log: AuditLogResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const getResultBadgeVariant = (
  result: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (result) {
    case AuditResult.SUCCESS:
      return "default";
    case AuditResult.FAILURE:
      return "destructive";
    case AuditResult.PARTIAL:
      return "secondary";
    default:
      return "outline";
  }
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
  </div>
);

const ChangeItem = ({ change }: { change: AuditChangeResponse }) => (
  <div className="rounded-md border p-3">
    <p className="mb-2 text-sm font-medium">{change.field}</p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Old Value</p>
        <pre className="mt-1 overflow-auto rounded bg-secondary p-2">
          {JSON.stringify(change.old_value, null, 2) ?? "null"}
        </pre>
      </div>
      <div>
        <p className="text-muted-foreground">New Value</p>
        <pre className="mt-1 overflow-auto rounded bg-secondary p-2">
          {JSON.stringify(change.new_value, null, 2) ?? "null"}
        </pre>
      </div>
    </div>
  </div>
);

const ViolationItem = ({
  violation,
}: {
  violation: GuardrailViolationResponse;
}) => (
  <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        {violation.violation_type}
      </p>
      <Badge variant="destructive" className="text-xs">
        {violation.severity}
      </Badge>
    </div>
    {violation.details && (
      <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs dark:bg-red-900/30">
        {JSON.stringify(violation.details, null, 2)}
      </pre>
    )}
  </div>
);

const AuditLogDetail = ({ log, isOpen, onClose }: AuditLogDetailProps) => {
  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Full details for audit log entry {log._id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold">General Information</h4>
              <div className="rounded-md border p-4">
                <DetailRow label="Log ID" value={log._id} />
                <Separator />
                <DetailRow label="Timestamp" value={formatDate(log.timestamp)} />
                <Separator />
                <DetailRow
                  label="Action"
                  value={
                    <Badge variant="outline" className="capitalize">
                      {log.action.replace("_", " ")}
                    </Badge>
                  }
                />
                <Separator />
                <DetailRow
                  label="Result"
                  value={
                    <Badge
                      variant={getResultBadgeVariant(log.result)}
                      className="capitalize"
                    >
                      {log.result}
                    </Badge>
                  }
                />
                {log.error_message && (
                  <>
                    <Separator />
                    <DetailRow
                      label="Error Message"
                      value={
                        <span className="text-red-500">{log.error_message}</span>
                      }
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Actor Information</h4>
              <div className="rounded-md border p-4">
                <DetailRow
                  label="User ID"
                  value={log.actor.user_id ?? "System"}
                />
                <Separator />
                <DetailRow label="Organization ID" value={log.actor.org_id} />
                {log.actor.ip_address && (
                  <>
                    <Separator />
                    <DetailRow label="IP Address" value={log.actor.ip_address} />
                  </>
                )}
                {log.actor.user_agent && (
                  <>
                    <Separator />
                    <DetailRow
                      label="User Agent"
                      value={
                        <span className="break-all text-xs">
                          {log.actor.user_agent}
                        </span>
                      }
                    />
                  </>
                )}
                {log.actor.api_key_hash && (
                  <>
                    <Separator />
                    <DetailRow
                      label="API Key Hash"
                      value={log.actor.api_key_hash}
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Target Resource</h4>
              <div className="rounded-md border p-4">
                <DetailRow
                  label="Resource Type"
                  value={log.target.resource_type.replace("_", " ")}
                />
                {log.target.resource_id && (
                  <>
                    <Separator />
                    <DetailRow
                      label="Resource ID"
                      value={log.target.resource_id}
                    />
                  </>
                )}
                {log.target.resource_name && (
                  <>
                    <Separator />
                    <DetailRow
                      label="Resource Name"
                      value={log.target.resource_name}
                    />
                  </>
                )}
              </div>
            </div>

            {(log.session_id || log.request_id || log.permission_required) && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Request Details</h4>
                <div className="rounded-md border p-4">
                  {log.session_id && (
                    <>
                      <DetailRow label="Session ID" value={log.session_id} />
                      <Separator />
                    </>
                  )}
                  {log.request_id && (
                    <>
                      <DetailRow label="Request ID" value={log.request_id} />
                      <Separator />
                    </>
                  )}
                  {log.permission_required && (
                    <DetailRow
                      label="Permission Required"
                      value={log.permission_required}
                    />
                  )}
                </div>
              </div>
            )}

            {log.changes && log.changes.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Changes</h4>
                <div className="space-y-2">
                  {log.changes.map((change, index) => (
                    <ChangeItem key={index} change={change} />
                  ))}
                </div>
              </div>
            )}

            {log.guardrail_violations && log.guardrail_violations.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">
                  Guardrail Violations
                </h4>
                <div className="space-y-2">
                  {log.guardrail_violations.map((violation, index) => (
                    <ViolationItem key={index} violation={violation} />
                  ))}
                </div>
              </div>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Metadata</h4>
                <pre className="overflow-auto rounded-md border bg-secondary p-4 text-xs">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetail;
