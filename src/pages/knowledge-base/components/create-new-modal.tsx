import { Link } from "react-router-dom";
import {
  Database,
  Network,
  GitBranch,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import KnowledgeBaseForm from "./knowledge-base-form";
import { Separator } from "@/components/ui/separator";
import { useCredentials } from "@/pages/configure/data-connectors/data-connector.service";
import useStore from "@/lib/store";
import { Path } from "@/lib/types";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { PlanType } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { NeedsUpgrade } from "@/components/custom/needs-upgrade";

interface CreateNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string[];
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  needsUpgrade?: boolean;
}

function OptionCard({
  icon,
  title,
  description,
  onClick,
  className,
  disabled = false,
  needsUpgrade = false,
}: OptionCardProps) {
  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-md",
        className,
        disabled &&
          "cursor-not-allowed border-primary/30 hover:translate-y-0 hover:shadow-none",
      )}
      {...(!disabled ? { onClick } : {})}
    >
      <CardContent className="p-4">
        <div className={cn("flex items-start gap-2")}>
          <div
            className={cn(
              "flex flex-shrink-0 items-center justify-center rounded-md bg-muted p-1 transition-colors group-hover:bg-primary/10",
              disabled && "opacity-50 group-hover:bg-muted",
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3
                className={cn(
                  "text-md font-semibold text-foreground transition-colors group-hover:text-primary",
                  disabled && "opacity-50",
                )}
              >
                {title}
              </h3>
              {disabled && (
                <Link
                  to={Path.DATA_CONNECTORS}
                  target="_self"
                  className="bg-red-3 inline-flex items-center text-sm text-link"
                >
                  Add Neo4J credentials <ExternalLink className="ml-1 size-3" />
                </Link>
              )}
              {needsUpgrade && <Badge variant="premium">Upgrade</Badge>}
            </div>
            <div
              className={cn(
                "gap-1 text-sm leading-relaxed text-muted-foreground",
                disabled && "opacity-50",
              )}
            >
              <p>{description[0]}</p>
              <p className="italic">{description[1]}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CreateNewKBModal({ open, onOpenChange }: CreateNewModalProps) {
  const [type, setType] = useState<
    "knowledge_base" | "knowledge_graph" | "semantic_data_model" | null
  >(null);
  const [upgradeVisbile, setUpgradeVisbile] = useState<boolean>(false);

  const apiKey = useStore((state) => state.api_key);
  const usage_data = useManageAdminStore((state) => state.usage_data);

  const isPlanBlocked = [
    PlanType.Community,
    PlanType.Starter,
    PlanType.Pro,
    PlanType.Pro_Yearly,
  ].includes(usage_data?.plan_name as PlanType);

  const getData = () => {
    const titleMap = {
      knowledge_base: {
        title: "Knowledge Base",
        description: [
          "Best for quick answers from documents, websites and text files.",
          "(Low cost, Medium accuracy)",
        ],
      },
      knowledge_graph: {
        title: "Knowledge Graph",
        description: [
          "Best for complex questions. It builds relationships across your documents. (High cost, High accuracy)",
          "",
        ],
      },
      semantic_data_model: {
        title: "Semantic Data Model",
        description: [
          "Best for structured data like databases or CSVs. It converts user questions into precise queries to fetch the right data.",
          "",
        ],
      },
    };

    if (!type) return type;

    return titleMap[type];
  };

  // For neo4j credentials
  const { credentials: neo4jCredentials } = useCredentials({
    apiKey,
    providerType: "vector_store",
    providerId: "neo4j",
    enabled: open,
  });

  const handleClose = () => {
    onOpenChange(false);
    setType(null);
  };

  const handleCancel = () => setType(null);

  const renderContent = () => {
    switch (type) {
      case "knowledge_base":
        return (
          <KnowledgeBaseForm
            onCancel={handleClose}
            asSemantic={false}
            asGraph={false}
          />
        );
      case "knowledge_graph":
        return (
          <KnowledgeBaseForm
            onCancel={handleClose}
            asSemantic={false}
            asGraph={true}
          />
        );
      case "semantic_data_model":
        return (
          <KnowledgeBaseForm
            onCancel={handleClose}
            asSemantic={true}
            asGraph={false}
          />
        );
      default:
        return (
          <div className="space-y-4">
            <OptionCard
              icon={<Database className="size-5 text-muted-foreground" />}
              title="Knowledge Base"
              description={[
                "Best for quick answers from documents, websites and text files.",
                "(Low cost, Medium accuracy)",
              ]}
              onClick={() => setType("knowledge_base")}
            />

            <OptionCard
              disabled={neo4jCredentials?.length === 0}
              needsUpgrade={isPlanBlocked}
              icon={<Network className="size-5 text-muted-foreground" />}
              title="Knowledge Graph"
              description={[
                "Best for complex questions. It builds relationships across your documents. (High cost, High accuracy)",
                neo4jCredentials?.length === 0 ? "" : "",
              ]}
              onClick={() =>
                !isPlanBlocked
                  ? setType("knowledge_graph")
                  : setUpgradeVisbile(true)
              }
            />

            <OptionCard
              icon={<GitBranch className="size-5 text-muted-foreground" />}
              title="Semantic Data Model"
              description={[
                "Best for structured data like databases or CSVs. It converts user questions into precise queries to fetch the right data.",
                "",
              ]}
              onClick={() => setType("semantic_data_model")}
            />
          </div>
        );
    }
  };

  useEffect(() => {
    if (neo4jCredentials?.length > 0) {
    }

    return () => {
      setType(null);
    };
  }, [neo4jCredentials?.length]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          onOpenChange(value);
          setType(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="">
            <DialogTitle className="inline-flex items-center gap-2 font-semibold">
              {type && (
                <ArrowLeft
                  className="size-4 cursor-pointer"
                  onClick={handleCancel}
                />
              )}
              Create New {getData()?.title}
            </DialogTitle>
            {type && (
              <DialogDescription>
                <div className="gap-1 text-sm leading-relaxed text-muted-foreground">
                  <p>{getData()?.description[0]}</p>
                  <p className="italic">{getData()?.description[1]}</p>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />
          <div className="no-scrollbar max-h-[35rem] gap-0 space-y-4 overflow-y-scroll">
            {renderContent()}
          </div>
          {!type && (
            <>
              <Separator />
              <DialogFooter className="flex justify-end space-x-3">
                <DialogClose
                  onClick={handleClose}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Close
                </DialogClose>
                <Button disabled={!type}>Create</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <NeedsUpgrade
        open={upgradeVisbile}
        onOpen={setUpgradeVisbile}
        title="Knowledge Graph"
        description="Connect and explore data seamlessly with Neo4j-powered knowledge graphs."
      />
    </>
  );
}
