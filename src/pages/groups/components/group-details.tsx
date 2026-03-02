import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  ChevronLeft,
  Trash2Icon,
  PlusIcon,
  XIcon,
  UserCheckIcon,
  UserXIcon,
  EditIcon,
  UserPlusIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IGroup, GroupMember } from "../types";
import { useGroups } from "../groups.service";
import { useAEPPolicies } from "@/pages/agent-policies/aep.service";
import { IAEPPolicy } from "@/pages/agent-policies/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  group_aep_id: z.string().optional(),
});

interface GroupDetailsProps {
  group: IGroup;
  onBack: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

export default function GroupDetails({
  group,
  onBack,
  onDelete,
  onRefresh,
}: GroupDetailsProps) {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const {
    updateGroup,
    isUpdatingGroup,
    addGroupMember,
    removeGroupMember,
    updateMemberRole,
    addGroupTags,
    removeGroupTags,
  } = useGroups(token);
  const { policies, getAllPolicies } = useAEPPolicies(token);
  const [groupPolicies, setGroupPolicies] = useState<IAEPPolicy[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [memberToUpdate, setMemberToUpdate] = useState<{
    userId: string;
    role: string;
  } | null>(null);

  // Fetch policies when editing is toggled on
  useEffect(() => {
    if (isEditing) {
      getAllPolicies();
    }
  }, [isEditing, getAllPolicies]);

  // Filter policies where function_group is "group"
  useEffect(() => {
    if (policies) {
      const filtered = policies.filter(
        (policy: IAEPPolicy) =>
          policy.properties && policy.properties.functional_group === "group",
      );
      setGroupPolicies(filtered);
    }
  }, [policies]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group.name || "",
      description: group.description || "",
      group_aep_id: group.group_aep_id || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateGroup({
        groupId: group.group_id,
        data: {
          name: values.name,
          description: values.description || null,
          group_aep_id:
            values.group_aep_id === "none" ? null : values.group_aep_id || null,
          updated_at: new Date().toISOString(),
        },
      });

      toast.success("Group updated successfully");
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
    }
  }

  const handleAddTag = async () => {
    if (tagInput.trim() && !group.tags.includes(tagInput.trim())) {
      try {
        await addGroupTags({
          groupId: group.group_id,
          tags: [tagInput.trim()],
        });
        toast.success("Tag added successfully");
        setTagInput("");
        onRefresh();
      } catch (error) {
        console.error("Error adding tag:", error);
        toast.error("Failed to add tag");
      }
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeGroupTags({
        groupId: group.group_id,
        tags: [tag],
      });
      toast.success("Tag removed successfully");
      onRefresh();
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId.trim()) {
      toast.error("User ID is required");
      return;
    }

    try {
      await addGroupMember({
        groupId: group.group_id,
        data: {
          user_id_to_add: newMemberId,
          role: newMemberRole,
        },
      });
      toast.success("Member added successfully");
      setIsAddingMember(false);
      setNewMemberId("");
      setNewMemberRole("member");
      onRefresh();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeGroupMember({
        groupId: group.group_id,
        userId,
      });
      toast.success("Member removed successfully");
      onRefresh();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async () => {
    if (!memberToUpdate) return;

    try {
      await updateMemberRole({
        groupId: group.group_id,
        userId: memberToUpdate.userId,
        data: {
          new_role: memberToUpdate.role,
        },
      });
      toast.success("Member role updated successfully");
      setMemberToUpdate(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Failed to update member role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-2 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {group.name || "Unnamed Group"}
          </h2>
        </div>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Group</CardTitle>
                  <CardDescription>Update group information</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter group name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter group description"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group_aep_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="group_aep_id">
                          Agent Group Policy ID
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || "none"}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an agent group policy" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {groupPolicies.map((policy: IAEPPolicy) => (
                                <SelectItem
                                  key={policy.policy_id}
                                  value={policy.policy_id}
                                >
                                  {policy.metadata.name || policy.policy_id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdatingGroup}>
                      {isUpdatingGroup ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Name</h3>
                <p className="text-muted-foreground">
                  {group.name || "Unnamed Group"}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-muted-foreground">
                  {group.description || "No description provided"}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Agent Policy ID</h3>
                <p className="text-muted-foreground">
                  {group.group_aep_id || "Not linked to any policy"}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Created On</h3>
                <p className="text-muted-foreground">
                  {format(new Date(group.created_at), "MMM d, yyyy")}
                </p>
              </div>
              {group.updated_at && (
                <div>
                  <h3 className="font-medium">Last Updated</h3>
                  <p className="text-muted-foreground">
                    {format(new Date(group.updated_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-medium">Group ID</h3>
                <p className="text-muted-foreground">{group._id}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tags</CardTitle>
            </div>
            <CardDescription>Organize your group with tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {group.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {group.tags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No tags added yet
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Members ({group.members.length})</CardTitle>
            <Button size="sm" onClick={() => setIsAddingMember(true)}>
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
          <CardDescription>People who are part of this group</CardDescription>
        </CardHeader>
        <CardContent>
          {group.members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <UserCheckIcon className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No members in this group yet
              </p>
              <Button className="mt-4" onClick={() => setIsAddingMember(true)}>
                Add First Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.members.map((member: GroupMember) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      {member.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "admin" ? "default" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.joined_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setMemberToUpdate({
                              userId: member.user_id,
                              role: member.role,
                            })
                          }
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        {member.user_id !== group.admin_user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                          >
                            <UserXIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Add a user to this group by entering their user ID
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Enter user ID"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMember(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Role Dialog */}
      <Dialog
        open={!!memberToUpdate}
        onOpenChange={(open) => !open && setMemberToUpdate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
            <DialogDescription>
              Change the role for this member
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="updateRole">Role</Label>
              <Select
                value={memberToUpdate?.role || ""}
                onValueChange={(value) =>
                  setMemberToUpdate((prev) =>
                    prev ? { ...prev, role: value } : null,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToUpdate(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted to avoid error about missing Label component
function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {children}
    </label>
  );
}
