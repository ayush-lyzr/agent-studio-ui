import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  PlusIcon,
  FileIcon,
  SearchIcon,
  Trash2Icon,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IAEPPolicy } from "./types";
import { useAEPPolicies } from "./aep.service";
import PolicyDetails from "./components/policy-details";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageTitle } from "@/components/ui/page-title";
import { useNavigate } from "react-router-dom";
import { Path } from "@/lib/types";
import PolicyPlayground from "./components/policy-playground";

export default function AgentPoliciesPage() {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPolicy, setSelectedPolicy] = useState<IAEPPolicy | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { policies, getAllPolicies, deletePolicy, isFetchingPolicies } =
    useAEPPolicies(token);

  const fetchPolicies = async () => {
    try {
      await getAllPolicies();
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Failed to load policies");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchPolicies();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewPolicy = async (policyId: string) => {
    try {
      const policy =
        policies?.find((p: IAEPPolicy) => p.policy_id === policyId) || null;
      setSelectedPolicy(policy);
      setActiveTab("details");
    } catch (error) {
      console.error("Error fetching policy details:", error);
      toast.error("Failed to load policy details");
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(policyId);
      toast.success("Policy deleted successfully");
      setShowDeleteConfirm(false);
      fetchPolicies();
      if (selectedPolicy && selectedPolicy.policy_id === policyId) {
        setSelectedPolicy(null);
        setActiveTab("list");
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Failed to delete policy");
    }
  };

  const filterPolicies = (policies: IAEPPolicy[]) => {
    if (!searchQuery.trim()) return policies;

    return policies.filter(
      (policy) =>
        policy.metadata.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        policy.metadata.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        policy.properties.sensitivity
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        policy.properties.functional_group
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  };

  useEffect(() => {
    if (token) {
      fetchPolicies();
    }
  }, [token]);

  const handleCreatePolicy = () => {
    navigate(Path.AGENT_POLICIES + "/create");
  };

  const filteredPolicies = policies ? filterPolicies(policies) : [];
  const policyToDelete = selectedPolicy?.policy_id || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-8 p-8"
    >
      <PageTitle
        title="Agent Entitlement Policy"
        description="Manage policies that govern agent entitlements for data sharing"
      />

      <div className="flex flex-col space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list">All Policies</TabsTrigger>
              {selectedPolicy && (
                <TabsTrigger value="details">Policy Details</TabsTrigger>
              )}
              <TabsTrigger value="playground">Policy Playground</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search policies..."
                  className="w-64 pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCwIcon
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button onClick={handleCreatePolicy}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Policy
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <TabsContent value="list" className="space-y-4">
            {isFetchingPolicies ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <RefreshCwIcon className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading policies...
                  </p>
                </div>
              </div>
            ) : filteredPolicies.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <FileIcon className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-lg font-medium">No policies found</h3>
                  <p className="text-sm text-muted-foreground">
                    {policies?.length === 0
                      ? "Create your first agent endpoint policy to start managing connections"
                      : "No policies match your search criteria"}
                  </p>
                </div>
                {policies?.length === 0 && (
                  <Button onClick={handleCreatePolicy}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Policy
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sensitivity</TableHead>
                      <TableHead>Functional Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolicies.map((policy) => (
                      <TableRow key={policy.policy_id}>
                        <TableCell
                          className="cursor-pointer font-medium"
                          onClick={() => handleViewPolicy(policy.policy_id)}
                        >
                          {policy.metadata.name}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          {policy.properties.functional_group}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              policy.metadata.status === "ACTIVE"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {policy.metadata.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            policy.metadata.audit.created_at,
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPolicy(policy.policy_id)}
                            >
                              <FileIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedPolicy && (
              <PolicyDetails
                policy={selectedPolicy}
                onBack={() => setActiveTab("list")}
              />
            )}
          </TabsContent>

          <TabsContent value="playground" className="space-y-4">
            <PolicyPlayground />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this policy? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeletePolicy(policyToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
