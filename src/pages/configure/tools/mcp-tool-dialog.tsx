import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTools } from "./tools-service";
import useStore from "@/lib/store";
import { toast } from "sonner";

interface MCPToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  name?: string;
  description?: string;
  server_url?: string;
  auth_type?: string;
  server_type?: string;
  standard_server_id?: string;
  // id?: string;
}

export function MCPToolDialog({
  open,
  onOpenChange,
  onSuccess,
  name: propName,
  description: propDescription,
  server_url: propServerUrl,
  auth_type: propAuthType,
  server_type: propServerType,
  standard_server_id: propStandardServerId,
  // id: propId,
}: MCPToolDialogProps) {
  const apiKey = useStore((state) => state.api_key);
  const { createMCPServer, isCreatingMCPServer } = useTools({
    apiKey,
  });

  async function handleConnect() {
    try {
      await createMCPServer({
        payload: {
          config: {
            auth_type:
              (propAuthType as "no_auth" | "api_key" | "oauth") || "no_auth",
            server_url: propServerUrl,
          },
          description: propDescription || "",
          name: propName,
          server_type: propServerType,
          standard_server_id: propStandardServerId,
        },
      });
      toast.success("MCP Server added successfully");
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {propDescription || "Add MCP Server as a tool."}
        </DialogDescription>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isCreatingMCPServer}
          >
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
