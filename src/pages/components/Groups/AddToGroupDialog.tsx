import { useState, useEffect, useMemo } from "react";
import { FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Group,
  getGroups,
  createGroup,
  moveAssetBetweenGroups,
  removeAssetFromGroup,
} from "@/services/groupsApiService";
import { useGroups } from "@/pages/groups/groups.service";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import useStore from "@/lib/store";

interface Asset {
  id: string;
  name: string;
  description?: string;
}

interface AddToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "agent" | "knowledge_base" | "voice-agent";
  asset?: Asset | null;
  assets?: Asset[];
  onSuccess?: () => void;
  additionalMetadata?: Record<string, any>;
  /**
   * Optional override for the "current folder" context (e.g., when the UI is
   * already inside a folder but the groups API doesn't include full asset lists).
   * Only applied for single-asset moves.
   */
  currentGroupId?: string | null;
}

export function AddToGroupDialog({
  open,
  onOpenChange,
  type,
  asset = null,
  assets = [],
  onSuccess,
  additionalMetadata = {},
  currentGroupId = null,
}: AddToGroupDialogProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isCreateNew, setIsCreateNew] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  const token = useStore((state) => state.app_token);
  const { current_organization } = useManageAdminStore();
  const { moveMultiToGroup, isMovingMultiToGroup } = useGroups(token);

  const assetsToHandle = useMemo<Asset[]>(() => {
    if (assets && assets.length > 0) {
      return assets;
    }
    return asset ? [asset] : [];
  }, [asset, assets]);

  const assetDependencyKey = useMemo(
    () =>
      assetsToHandle
        .map((item) => item.id)
        .sort()
        .join("|"),
    [assetsToHandle],
  );

  const isMultiAsset = assetsToHandle.length > 1;

  useEffect(() => {
    if (open && assetsToHandle.length > 0) {
      loadGroups();
    }
  }, [open, assetDependencyKey]);

  const loadGroups = async () => {
    const orgId = current_organization?._id;
    if (!orgId) return;

    try {
      setIsLoading(true);
      const groupsData = await getGroups(orgId, type, token);
      setGroups(groupsData);

      const map: Record<string, Group | null> = {};
      assetsToHandle.forEach((assetItem) => {
        const foundGroup = groupsData.find((g) =>
          g.assets.some((a) => a.asset_id === assetItem.id),
        );
        map[assetItem.id] = foundGroup || null;
      });

      if (!isMultiAsset && assetsToHandle[0]) {
        const assetId = assetsToHandle[0].id;
        let resolvedCurrentGroup = map[assetId] || null;

        // If the caller knows the current folder context, prefer it for single-asset moves
        // so the "same folder" can be hidden/validated reliably.
        if (currentGroupId) {
          const overrideGroup =
            groupsData.find((g) => g.group_id === currentGroupId) || null;
          if (overrideGroup) {
            resolvedCurrentGroup = overrideGroup;
          }
        }

        setCurrentGroup(resolvedCurrentGroup);
      } else {
        setCurrentGroup(null);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (assetsToHandle.length === 0) {
      toast.error("No items selected to add");
      return;
    }

    const orgId = current_organization?._id;
    if (!orgId) {
      toast.error("Organization not found");
      return;
    }

    try {
      setIsSubmitting(true);

      const computeCurrentGroupsForAsset = (assetId: string) =>
        groups.filter((g) => g.assets.some((a) => a.asset_id === assetId));

      /**
       * Moves the asset FROM the current folder context (when provided),
       * otherwise just adds it to the destination folder.
       *
       * Important: we intentionally do NOT try to "clean up" multiple-folder
       * membership; we only care about moving out of the current folder.
       */
      const moveOrAddAssetsToGroup = async ({
        destinationGroupName,
        destinationGroupType,
      }: {
        destinationGroupName: string;
        destinationGroupType: string;
      }) => {
        const sourceGroup = currentGroupId
          ? groups.find((g) => g.group_id === currentGroupId) || null
          : null;

        if (
          sourceGroup &&
          sourceGroup.group_name === destinationGroupName &&
          sourceGroup.group_type === destinationGroupType
        ) {
          toast.error(`"${destinationGroupName}" is already the current folder`);
          return;
        }

        const toAddPayload: Array<{
          asset_id: string;
          asset_type: string;
          asset_name: string;
          metadata?: Record<string, any>;
        }> = [];

        const moveOps: Array<Promise<unknown>> = [];

        let processedCount = 0;
        assetsToHandle.forEach((assetItem) => {
          const currentGroupsForAsset = computeCurrentGroupsForAsset(assetItem.id);
          const isInDestination = currentGroupsForAsset.some(
            (g) =>
              g.group_name === destinationGroupName &&
              g.group_type === destinationGroupType,
          );

          if (sourceGroup) {
            // When we know the "current folder", treat this as a true move from that folder.
            processedCount += 1;

            // If the asset already exists in destination, we just remove it from the source folder.
            if (isInDestination) {
              moveOps.push(
                removeAssetFromGroup(
                  sourceGroup.group_name,
                  sourceGroup.group_type,
                  assetItem.id,
                  orgId,
                  token,
                ),
              );
              return;
            }

            moveOps.push(
              moveAssetBetweenGroups(
                sourceGroup.group_name,
                sourceGroup.group_type,
                assetItem.id,
                orgId,
                {
                  to_group_name: destinationGroupName,
                  to_group_type: destinationGroupType,
                },
                token,
              ),
            );
            return;
          }

          // No source context (e.g. opened from All). If it's already in destination, nothing to do.
          if (isInDestination) return;
          processedCount += 1;
          toAddPayload.push({
            asset_id: assetItem.id,
            asset_type: type,
            asset_name: assetItem.name,
            metadata: {
              description: assetItem.description,
              ...additionalMetadata,
            },
          });
        });

        if (processedCount === 0) {
          toast.error(
            `Selected item${assetsToHandle.length > 1 ? "s" : ""} already in "${destinationGroupName}"`,
          );
          return;
        }

        if (moveOps.length > 0) {
          await Promise.all(moveOps);
        }

        if (toAddPayload.length > 0) {
          await moveMultiToGroup({
            groupName: destinationGroupName,
            groupType: destinationGroupType,
            organizationId: orgId,
            payload: toAddPayload,
          });
        }
        toast.success(
          `Moved ${processedCount} item${processedCount > 1 ? "s" : ""} to "${destinationGroupName}"`,
        );
      };

      if (isCreateNew) {
        const trimmedName = newGroupName.trim();
        if (!trimmedName) {
          toast.error("Please enter a folder name");
          return;
        }
        await createGroup(
          {
            group_name: trimmedName,
            group_type: type,
            organization_id: orgId,
          },
          token,
        );

        try {
          await moveOrAddAssetsToGroup({
            destinationGroupName: trimmedName,
            destinationGroupType: type,
          });
        } catch (error) {
          console.error("Failed to add assets to new group:", error);
          toast.error(
            `Failed to move selected ${type.replace("_", " ")}s to "${trimmedName}"`,
          );
          return;
        }
      } else {
        const targetGroup = groups.find((g) => g.group_id === selectedGroupId);
        if (!targetGroup) {
          toast.error("Please select a group");
          return;
        }
        await moveOrAddAssetsToGroup({
          destinationGroupName: targetGroup.group_name,
          destinationGroupType: targetGroup.group_type,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(`Failed to add ${type} to group:`, error);
      toast.error(`Failed to add ${type.replace("_", " ")} to group`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to Folder</DialogTitle>
          <DialogDescription>
            {currentGroup
              ? `"${asset?.name}" is currently in "${currentGroup.group_name}". Select a different folder to move it.`
              : `Select a folder to move "${asset?.name}" to, or create a new one.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : (
            <>
              <RadioGroup value={isCreateNew ? "new" : selectedGroupId || ""}>
                {groups
                  .filter((g) =>
                    !currentGroup || isMultiAsset
                      ? true
                      : g.group_id !== currentGroup.group_id,
                  )
                  .map((group) => (
                    <div
                      key={group.group_id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={group.group_id}
                        id={group.group_id}
                        onClick={() => {
                          setSelectedGroupId(group.group_id);
                          setIsCreateNew(false);
                        }}
                      />
                      <Label
                        htmlFor={group.group_id}
                        className="flex min-w-0 cursor-pointer items-center gap-2"
                      >
                        <FolderPlus className="h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1 line-clamp-1">
                          {group.group_name}
                        </div>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          ({group.assets.length} {type.replace("_", " ")}s)
                        </span>
                      </Label>
                    </div>
                  ))}

                <div className="mt-4 flex items-center space-x-2">
                  <RadioGroupItem
                    value="new"
                    id="new"
                    onClick={() => {
                      setIsCreateNew(true);
                      setSelectedGroupId("");
                    }}
                  />
                  <Label
                    htmlFor="new"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    Create new folder
                  </Label>
                </div>
              </RadioGroup>

              {isCreateNew && (
                <Input
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-2"
                />
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isMovingMultiToGroup ||
              (!selectedGroupId && !isCreateNew) ||
              (isCreateNew && newGroupName.trim().length === 0)
            }
          >
            {isSubmitting || isMovingMultiToGroup
              ? "Moving..."
              : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
