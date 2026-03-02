import React, { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CircleChevronRight, Target, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useStore from "@/lib/store";
import { useParams } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAgentVersionsService } from "../version-history.service";

interface VersionItem {
  id: string;
  createdBy: string;
  timestamp: string;
  active?: boolean;
  config: any;
}

interface VersionHistoryProps {
  onSelect: (version: VersionItem) => void;
  onClose?: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  onSelect,
  onClose,
}) => {
  const { agentId } = useParams();
  const apiKey = useStore((state) => state.api_key);
  const { currentUser } = useCurrentUser();
  const userName = currentUser?.customFields?.["first-name"];

  const {
    versions: apiVersions,
    isFetchingVersions,
    getAgentVersions,
  } = useAgentVersionsService({ apiKey, agentId });

  const versions: VersionItem[] = apiVersions.map((v) => ({
    id: v.version_id,
    createdBy: v.createdBy ?? userName,
    timestamp: v.created_at,
    active: v.active,
    config: v.config,
  }));

  useEffect(() => {
    getAgentVersions();
  }, [getAgentVersions]);

  const activeVersion = versions.find((v) => v.active);
  const otherVersions = versions
    .filter((v) => !v.active)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  const sortedVersions = activeVersion
    ? [activeVersion, ...otherVersions]
    : otherVersions;

  return (
    <>
      <h2 className="mb-4 flex items-center justify-between text-lg font-semibold">
        Version History
        <Button variant="link" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </h2>
      <Separator className="h-0.5" />
      {isFetchingVersions ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="animate-spin items-center justify-center" />
        </div>
      ) : sortedVersions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No versions available
        </div>
      ) : (
        <div className="relative mt-4 space-y-1">
          {sortedVersions.map((version, index) => (
            <div key={version.id} className="relative flex items-start">
              {index !== sortedVersions.length - 1 && (
                <span className="absolute left-[13px] top-8 mt-3 h-full w-px bg-gray-300 dark:bg-gray-600" />
              )}
              <div className="relative z-10 mr-2 mt-5 flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent">
                {version.active ? (
                  <Target className="h-4 w-4" />
                ) : (
                  <CircleChevronRight className="h-4 w-4" />
                )}
              </div>
              <div
                className="w-full cursor-pointer items-center justify-between rounded-md border border-transparent p-2 hover:border-zinc-300 hover:bg-sidebar-accent group-hover:flex dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                onClick={() => onSelect(version)}
              >
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {formatDate(version.timestamp)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{version.createdBy?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">
                      By {version.createdBy}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default VersionHistory;
