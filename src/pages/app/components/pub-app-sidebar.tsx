import { Dispatch, SetStateAction, useState } from "react";
import { Edit, MoreHorizontal, Plus, Share2, Trash2 } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "../chat.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import RenameSessionDialog from "./rename-session";
import { cn } from "@/lib/utils";
import { DeleteSession } from "./delete-session";
import { Skeleton } from "@/components/ui/skeleton";
import { Message } from "@/types/chat";
import { useSearchParams } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { ShareAppModal } from "./share-app-modal";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

export function PublishedAppSidebar({
  streaming = false,
  loading,
  setMessages,
  appId,
}: {
  streaming: boolean;
  loading: boolean;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  appId: string;
}) {
  const [_, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<
    "rename" | "delete" | "share" | null
  >(null);
  const [renameDialogVisible, setRenameDialogVisible] =
    useState<boolean>(false);
  const [deleteDialogVisible, setDeleteDialogVisible] =
    useState<boolean>(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const agent = useChatStore((state) => state.agent);
  const sessions = useChatStore((state) => state.sessions);
  const { currentSessionId, setCurrentSessionId } = useChatStore(
    (state) => state,
  );
  const current_user = useManageAdminStore((state) => state.current_user);

  return (
    <Sidebar
      collapsible="none"
      className="hidden border-r border-border bg-sidebar md:flex"
    >
      <SidebarHeader>
        <div className="p-2">
          {agent?.description && (
            <>
              <div className="mb-1 text-xs font-semibold">About the Agent</div>
              <div className="max-h-[10rem] overflow-y-auto text-sm text-muted-foreground">
                {agent?.description?.slice(
                  0,
                  expanded ? agent?.description?.length : 100,
                )}
                {agent?.description?.length > 100 && (
                  <>
                    ...{" "}
                    <a
                      href="#"
                      className="text-blue-600 hover:underline"
                      onClick={() => setExpanded(!expanded)}
                    >
                      read {expanded ? "less" : "more"}
                    </a>
                  </>
                )}
              </div>
              <Separator />
            </>
          )}
        </div>
        <SidebarMenuButton
          variant="outline"
          onClick={() => {
            if (streaming) return;
            setCurrentSessionId("");
            setMessages([]);
            setParams({ chat: "new" });
          }}
        >
          <Plus />
          <span className="font-semibold">New Chat</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <ScrollArea className="no-scrollbar h-[calc(100%-12rem)] overflow-y-auto">
                {loading ? (
                  <div className="grid grid-cols-1 gap-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : (
                  (sessions ?? [])?.map((item) => (
                    <SidebarMenuItem key={item.session_id} className="mb-2">
                      <SidebarMenuButton
                        asChild
                        isActive={item.session_id === currentSessionId}
                        className={cn(
                          "line-clamp-1",
                          streaming ? "cursor-not-allowed" : "cursor-default",
                        )}
                        onClick={() => {
                          if (streaming) return;
                          setCurrentSessionId("");
                          setCurrentSessionId(item?.session_id);
                          setParams({ chat: "saved" });
                        }}
                      >
                        <p className="w-full truncate text-nowrap text-left">
                          {item?.metadata?.title}
                        </p>

                        {/* <Link
                            to={
                              !streaming
                                ? `${Path.AGENT}/${params?.app_id}?sessionId=${item.session_id}`
                                : "#"
                            }
                            className={cn(
                              item.session_id === searchParams.get("sessionId")
                                ? "font-semibold"
                                : "font-normal",
                              streaming ? "cursor-not-allowed" : "",
                            )}
                          >
                            {(item?.metadata?.title).slice(0, 20) +
                              (item.metadata?.title?.length > 20 ? "..." : "")}
                          </Link> */}
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={streaming}>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal />
                            <span className="sr-only">More</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="rounded-lg"
                          side="right"
                          align="start"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setRenameDialogVisible(true);
                              setSelectedSessionId(item.session_id);
                            }}
                          >
                            <Edit className="mr-1 size-4 text-muted-foreground" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteDialogVisible(true);
                              setSelectedSessionId(item.session_id);
                            }}
                          >
                            <Trash2 className="mr-1 size-4 text-destructive" />
                            <span className="text-destructive">Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))
                )}
              </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {agent?.public && agent.user_id === current_user?.id && (
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className={cn(
                buttonVariants(),
                "hover:text-sidebar-accent- items-start justify-start px-2",
              )}
              onClick={() => setModalVisible("share")}
            >
              <Share2 className="size-4" />
              Share App
            </SidebarMenuButton>

            <SidebarMenuBadge className="text- mr-1 h-fit bg-premium-background text-[0.65rem]">
              Earn credits
            </SidebarMenuBadge>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
      <RenameSessionDialog
        open={renameDialogVisible}
        onOpen={setRenameDialogVisible}
        sessionId={selectedSessionId}
      />
      <DeleteSession
        session_id={selectedSessionId}
        open={deleteDialogVisible}
        onOpen={setDeleteDialogVisible}
      />
      <ShareAppModal
        open={modalVisible === "share"}
        onOpenChange={(open) => setModalVisible(open ? "share" : null)}
        appId={appId}
      />
    </Sidebar>
  );
}
