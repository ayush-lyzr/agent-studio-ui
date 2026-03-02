import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  PlusIcon,
  UsersIcon,
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
import { IGroup } from "./types";
import { useGroups } from "./groups.service";
import GroupDetails from "./components/group-details";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageTitle } from "@/components/ui/page-title";
import { useNavigate } from "react-router-dom";
import { Path } from "@/lib/types";
import { format } from "date-fns";

export default function GroupsPage() {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    groups,
    adminGroups,
    getAllGroups,
    getAdminGroups,
    deleteGroup,
    isFetchingGroups,
    isFetchingAdminGroups,
  } = useGroups(token);

  const fetchGroups = async () => {
    try {
      await getAllGroups();
      await getAdminGroups();
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchGroups();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewGroup = async (groupId: string) => {
    const displayGroups = activeTab === "admin" ? adminGroups : groups;
    try {
      const group = displayGroups?.find((g: IGroup) => g._id === groupId);
      if (group) {
        setSelectedGroup(group);
        setActiveTab("details");
      } else {
        toast.error("Group not found");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      toast.error("Failed to load group details");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      toast.success("Folder deleted successfully");
      setShowDeleteConfirm(false);
      fetchGroups();
      if (selectedGroup && selectedGroup.group_id === groupId) {
        setSelectedGroup(null);
        setActiveTab("all");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    }
  };

  const filterGroups = (groupsList: IGroup[]) => {
    if (!searchQuery.trim()) return groupsList || [];

    return (groupsList || []).filter(
      (group) =>
        group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  };

  useEffect(() => {
    if (token) {
      fetchGroups();
    }
  }, [token]);

  const handleCreateGroup = () => {
    navigate(Path.GROUPS + "/create");
  };

  const displayGroups = activeTab === "admin" ? adminGroups : groups;
  const filteredGroups = displayGroups ? filterGroups(displayGroups) : [];
  const isLoading =
    activeTab === "admin" ? isFetchingAdminGroups : isFetchingGroups;
  const groupToDelete = selectedGroup?.group_id || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-8 p-8"
    >
      <PageTitle
        title="Groups"
        description="Manage your groups and their members for better collaboration"
      />

      <div className="flex flex-col space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Groups</TabsTrigger>
              <TabsTrigger value="admin">My Groups</TabsTrigger>
              {selectedGroup && (
                <TabsTrigger value="details">Group Details</TabsTrigger>
              )}
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search groups..."
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
              <Button onClick={handleCreateGroup}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <RefreshCwIcon className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading groups...
                  </p>
                </div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <UsersIcon className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-lg font-medium">No groups found</h3>
                  <p className="text-sm text-muted-foreground">
                    {groups?.length === 0
                      ? "Join or create your first group to start collaborating"
                      : "No groups match your search criteria"}
                  </p>
                </div>
                {groups?.length === 0 && (
                  <Button onClick={handleCreateGroup}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group: IGroup) => (
                      <TableRow key={group.group_id}>
                        <TableCell className="font-medium">
                          {group.name || "Unnamed Group"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {group.description || "No description"}
                        </TableCell>
                        <TableCell>{group.members.length}</TableCell>
                        <TableCell>
                          {format(new Date(group.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {group.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {group.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewGroup(group._id)}
                            >
                              View
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

          <TabsContent value="admin" className="space-y-4">
            {isFetchingAdminGroups ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <RefreshCwIcon className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading your groups...
                  </p>
                </div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <UsersIcon className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-lg font-medium">No groups found</h3>
                  <p className="text-sm text-muted-foreground">
                    {adminGroups?.length === 0
                      ? "Create your first group to start collaborating"
                      : "No groups match your search criteria"}
                  </p>
                </div>
                {adminGroups?.length === 0 && (
                  <Button onClick={handleCreateGroup}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group: IGroup) => (
                      <TableRow key={group.group_id}>
                        <TableCell className="font-medium">
                          {group.name || "Unnamed Group"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {group.description || "No description"}
                        </TableCell>
                        <TableCell>{group.members.length}</TableCell>
                        <TableCell>
                          {format(new Date(group.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {group.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {group.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewGroup(group._id)}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedGroup(group);
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

          <TabsContent value="details">
            {selectedGroup && (
              <GroupDetails
                group={selectedGroup}
                onBack={() => {
                  setSelectedGroup(null);
                  setActiveTab(activeTab === "details" ? "all" : activeTab);
                }}
                onDelete={() => {
                  setShowDeleteConfirm(true);
                }}
                onRefresh={fetchGroups}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteGroup(groupToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
