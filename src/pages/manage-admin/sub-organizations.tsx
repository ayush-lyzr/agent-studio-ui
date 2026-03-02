import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useSubOrganizationService,
  CreateSubOrganizationRequest,
  UpdateSubOrganizationRequest,
} from "@/services/subOrganizationService";
import { SubOrganization } from "@/lib/types";
import { useManageAdminStore } from "./manage-admin.store";
import { MoreVertical, Plus, Building2, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useOrganization } from "../organization/org.service";

export default function SubOrganizations() {
  const { getToken } = useAuth();
  const { current_organization, setCurrentOrganization } = useManageAdminStore(
    (state) => state,
  );
  const { getCurrentOrg } = useOrganization({
    token: getToken() ?? "",
    current_organization,
  });

  const {
    createSubOrganization,
    isCreatingSubOrg,
    updateSubOrganization,
    isUpdatingSubOrg,
    deleteSubOrganization,
    isDeletingSubOrg,
  } = useSubOrganizationService({ token: getToken() ?? "" });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubOrg, setSelectedSubOrg] = useState<SubOrganization | null>(
    null,
  );

  const [formData, setFormData] = useState<CreateSubOrganizationRequest>({
    name: "",
    domain: "",
    about_organization: "",
    industry: "",
    limit: 0,
  });

  // Helper function to refresh organization data and update store
  const refreshOrganizationData = async () => {
    try {
      const res = await getCurrentOrg();
      if (res?.data?.current_organization) {
        setCurrentOrganization({
          org_id: res.data.current_organization._id,
          ...res.data.current_organization,
          ...res.data.policy,
        });
      }
    } catch (error) {
      console.error("Error refreshing organization data:", error);
    }
  };

  const handleCreate = async () => {
    console.log(
      "Creating sub-org with parent ID:",
      current_organization?.org_id,
    );
    console.log("Form data:", formData);

    if (!current_organization?.org_id || !formData.name) {
      toast.error("Name is required");
      return;
    }

    try {
      const result = await createSubOrganization({
        // parentOrgId: current_organization.org_id,
        ...formData,
      });
      console.log("Create sub-org result:", result);
      toast.success("Sub-organization created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        domain: "",
        about_organization: "",
        industry: "",
        limit: 0,
      });
      await refreshOrganizationData();
    } catch (error: any) {
      console.error("Create sub-org error:", error);
      toast.error(
        error?.response?.data?.detail || "Failed to create sub-organization",
      );
    }
  };

  const handleUpdate = async () => {
    if (!current_organization?.org_id || !selectedSubOrg) return;

    const updates: UpdateSubOrganizationRequest = {};
    if (formData.name && formData.name !== selectedSubOrg.name) {
      updates.name = formData.name;
    }
    if (formData.domain) updates.domain = formData.domain;
    if (formData.about_organization)
      updates.about_organization = formData.about_organization;
    if (formData.industry) updates.industry = formData.industry;

    if (Object.keys(updates).length === 0) {
      toast.error("No changes to update");
      return;
    }

    try {
      await updateSubOrganization({
        subOrgId: selectedSubOrg.organization_id,
        data: updates,
      });
      toast.success("Sub-organization updated successfully");
      setIsEditDialogOpen(false);
      setSelectedSubOrg(null);
      setFormData({
        name: "",
        domain: "",
        about_organization: "",
        industry: "",
        limit: 0,
      });
      await refreshOrganizationData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to update sub-organization",
      );
    }
  };

  const handleDelete = async () => {
    if (!current_organization?.org_id || !selectedSubOrg) return;

    try {
      await deleteSubOrganization({
        // parentOrgId: current_organization.org_id,
        subOrgId: selectedSubOrg.organization_id,
      });
      toast.success("Sub-organization deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedSubOrg(null);
      await refreshOrganizationData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Failed to delete sub-organization",
      );
    }
  };

  const openEditDialog = (subOrg: SubOrganization) => {
    setSelectedSubOrg(subOrg);
    setFormData({
      name: subOrg.name,
      domain: "",
      about_organization: "",
      industry: "",
      limit: 0,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (subOrg: SubOrganization) => {
    setSelectedSubOrg(subOrg);
    setIsDeleteDialogOpen(true);
  };

  const isVpasEnabled = current_organization?.vpas_enabled ?? false;

  if (!isVpasEnabled) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sub-Organizations
          </CardTitle>
          <CardDescription>
            Your organization does not have sub-organizations enabled. Please
            contact your administrator to enable this feature.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const subOrganizations = current_organization?.sub_organizations || [];

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Sub-Organizations
              </CardTitle>
              <CardDescription>
                Manage child organizations under your parent organization
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Sub-Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subOrganizations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No sub-organizations created yet. Click the button above to create
              one.
            </div>
          ) : (
            <div className="space-y-4">
              {subOrganizations.map((subOrg) => (
                <div
                  key={subOrg.organization_id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{subOrg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {subOrg.organization_id}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(subOrg)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(subOrg)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sub-Organization</DialogTitle>
            <DialogDescription>
              Create a new sub-organization under your parent organization.
              Sub-organizations share billing and ownership with the parent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter sub-organization name"
              />
            </div>
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                placeholder="e.g., sub.example.com"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="e.g., Technology"
              />
            </div>
            <div>
              <Label htmlFor="about">About Organization</Label>
              <Textarea
                id="about"
                value={formData.about_organization}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    about_organization: e.target.value,
                  })
                }
                placeholder="Brief description of the sub-organization"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreatingSubOrg || !formData.name}
            >
              {isCreatingSubOrg ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-Organization</DialogTitle>
            <DialogDescription>
              Update the details of the sub-organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter sub-organization name"
              />
            </div>
            <div>
              <Label htmlFor="edit-domain">Domain</Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                placeholder="e.g., sub.example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-industry">Industry</Label>
              <Input
                id="edit-industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="e.g., Technology"
              />
            </div>
            <div>
              <Label htmlFor="edit-about">About Organization</Label>
              <Textarea
                id="edit-about"
                value={formData.about_organization}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    about_organization: e.target.value,
                  })
                }
                placeholder="Brief description of the sub-organization"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdatingSubOrg}>
              {isUpdatingSubOrg ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sub-Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSubOrg?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeletingSubOrg}
            >
              {isDeletingSubOrg ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
