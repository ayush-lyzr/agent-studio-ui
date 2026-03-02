import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ChevronLeftIcon,
  EditIcon,
  ClipboardCopyIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IAEPPolicy } from "../types";
import { useAEPPolicies } from "../aep.service";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PolicyEditor from "./policy-editor";

interface PolicyDetailsProps {
  policy: IAEPPolicy;
  onBack: () => void;
}

export default function PolicyDetails({ policy, onBack }: PolicyDetailsProps) {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [jsonCopied, setJsonCopied] = useState(false);

  const { updatePolicy, isUpdatingPolicy } = useAEPPolicies(token);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(policy, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleSaveChanges = async (updatedPolicy: Partial<IAEPPolicy>) => {
    try {
      // Create a properly typed tags object
      let formattedTags: Record<string, string> | undefined = undefined;

      if (updatedPolicy.metadata?.tags) {
        formattedTags = {};
        // Convert each entry to a proper string-string pair
        Object.entries(updatedPolicy.metadata.tags).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formattedTags![key] = String(value);
          }
        });
      }

      await updatePolicy({
        policyId: policy.policy_id,
        data: {
          name:
            (updatedPolicy.metadata?.name as string | undefined) ||
            (policy.metadata.name as string | undefined),
          description:
            (updatedPolicy.metadata?.description as string | undefined) ||
            (policy.metadata.description as string | undefined),
          status: updatedPolicy.metadata?.status || undefined,
          sensitivity: updatedPolicy.properties?.sensitivity || undefined,
          functional_group:
            updatedPolicy.properties?.functional_group || undefined,
          allowed_sensitivities:
            updatedPolicy.connection_rules?.inference?.allowed?.sensitivities ||
            policy.connection_rules.inference.allowed.sensitivities,
          allowed_network_groups:
            updatedPolicy.connection_rules?.inference?.allowed
              ?.network_groups ||
            policy.connection_rules.inference.allowed.network_groups,
          allowed_functional_groups:
            updatedPolicy.connection_rules?.inference?.allowed
              ?.functional_groups ||
            policy.connection_rules.inference.allowed.functional_groups,
          tags:
            formattedTags ||
            (policy.metadata.tags as Record<string, string> | undefined),
        },
      });
      toast.success("Policy updated successfully");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating policy:", error);
      toast.error("Failed to update policy");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Policies
        </Button>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowEditModal(true)}
          >
            <EditIcon className="h-4 w-4" />
            Edit Policy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Main Policy Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {policy.metadata.name || "Unnamed Policy"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {policy.metadata.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge
                variant={
                  policy.metadata.status === "ACTIVE" ? "success" : "secondary"
                }
              >
                {policy.metadata.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger value="json">JSON View</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Policy ID
                    </h4>
                    <p className="font-mono text-xs">{policy.policy_id}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Policy Version
                    </h4>
                    <p>v{policy.policy_version}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Sensitivity
                    </h4>
                    <Badge
                      variant={
                        policy.properties.sensitivity === "high"
                          ? "destructive"
                          : policy.properties.sensitivity === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {policy.properties.sensitivity}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Functional Group
                    </h4>
                    <p>{policy.properties.functional_group}</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Organization
                    </h4>
                    <p
                      className="truncate font-mono text-xs"
                      title={policy.organization_id}
                    >
                      {policy.organization_id}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Schema Version
                    </h4>
                    <p>{policy.schema_version}</p>
                  </div>

                  {policy.parent_policy_id && (
                    <div className="col-span-2 space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Parent Policy
                      </h4>
                      <p className="font-mono text-xs">
                        {policy.parent_policy_id}
                      </p>
                    </div>
                  )}

                  {policy.metadata.tags &&
                    Object.keys(policy.metadata.tags).length > 0 && (
                      <div className="col-span-2 space-y-1">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Tags
                        </h4>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {Object.entries(policy.metadata.tags).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}: {value}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Audit Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs text-muted-foreground">
                        Created By
                      </h4>
                      <p className="text-sm">
                        {policy.metadata.audit.created_by}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs text-muted-foreground">
                        Created At
                      </h4>
                      <p className="text-sm">
                        {format(
                          new Date(policy.metadata.audit.created_at),
                          "PPP p",
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs text-muted-foreground">
                        Updated By
                      </h4>
                      <p className="text-sm">
                        {policy.metadata.audit.updated_by}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs text-muted-foreground">
                        Updated At
                      </h4>
                      <p className="text-sm">
                        {format(
                          new Date(policy.metadata.audit.updated_at),
                          "PPP p",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="connections" className="space-y-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Allowed Connections
                      </CardTitle>
                      <CardDescription>
                        Rules defining which endpoints this policy can connect
                        to
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Allowed Data Sensitivity Levels
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {policy.connection_rules.inference.allowed.sensitivities.map(
                              (sensitivity) => (
                                <Badge
                                  key={sensitivity}
                                  variant={
                                    sensitivity === "high"
                                      ? "destructive"
                                      : sensitivity === "medium"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {sensitivity}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Data Sharing Scope
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {policy.connection_rules.inference.allowed.network_groups.map(
                              (group) => (
                                <Badge key={group}>{group}</Badge>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">
                            Allowed Functional Groups
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {policy.connection_rules.inference.allowed.functional_groups.map(
                              (group) => (
                                <Badge key={group} variant="secondary">
                                  {group}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="json">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Policy JSON</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={handleCopyJson}
                      >
                        {jsonCopied ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardCopyIcon className="h-4 w-4" />
                            Copy JSON
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Raw JSON representation of the policy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                        {JSON.stringify(policy, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sidebar Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Policy Relationships</CardTitle>
            <CardDescription>
              How this policy relates to other policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {policy.parent_policy_id ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Parent Policy</h4>
                <div className="flex items-center rounded-md border p-2">
                  <div className="flex-1 truncate font-mono text-xs">
                    {policy.parent_policy_id}
                  </div>
                  <ArrowRightIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">This is a root policy with no parent</p>
              </div>
            )}

            <div className="pt-4">
              <h4 className="mb-2 text-sm font-medium">
                Connection Rules Summary
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Data Sensitivities:
                  </span>
                  <span>
                    {
                      policy.connection_rules.inference.allowed.sensitivities
                        .length
                    }
                  </span>
                </div>
                {/* <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">O Groups:</span>
                  <span>{policy.connection_rules.inference.allowed.network_groups.length}</span>
                </div> */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Functional Groups:
                  </span>
                  <span>
                    {
                      policy.connection_rules.inference.allowed
                        .functional_groups.length
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Policy Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
          </DialogHeader>
          <PolicyEditor
            policy={policy}
            onSave={handleSaveChanges}
            onCancel={() => setShowEditModal(false)}
            isSaving={isUpdatingPolicy}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
