import { motion } from "framer-motion";
import {
  Bot,
  Cpu,
  FolderOpen,
  Clock,
  Users,
  ExternalLink,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Link, useNavigate } from "react-router-dom";
import { Path } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { blueprintApiService } from "@/services/blueprintApiService";
import mixpanel from "mixpanel-browser";
import { isDevEnv, isMixpanelActive } from "@/lib/constants";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { Button } from "@/components/custom/button";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { BRAND } from "@/lib/branding";

const HomeV3 = () => {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useCurrentUser();
  const userName = currentUser?.customFields?.["first-name"];
  const navigate = useNavigate();
  const { current_organization } = useManageAdminStore((state) => state);

  // Check if cards should be disabled for role_member with new RBAC
  const isCardsDisabled =
    current_organization?.is_new_rbac &&
    current_organization?.role === "role_member";

  const serviceCards = [
    {
      icon: <Bot className="text-teal-600" size={24} />,
      title: "Agent-as-a-Service",
      description: "Create intelligent agents with advanced capabilities",
      buttonLink: Path.AGENT_CREATE,
      iconBg: "bg-teal-50 dark:bg-teal-950",
    },
    {
      icon: <Cpu className="text-slate-600" size={24} />,
      title: "Model-as-a-Service",
      description: "Browse and select from our library of AI models",
      buttonLink: `${Path.MODELS}`,
      iconBg: "bg-slate-100 dark:bg-slate-800",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const devBlueprintIds = [
    "970c89ec-a30a-4e14-b7b5-501f653d55ce",
    "2cb7c9b3-dad0-46a4-ab60-1a042c8b3f69",
    "c347ff58-973e-423f-b292-b73e0616a420",
  ];

  const prodBlueprintIds = [
    "69a5f0e6-c5dc-49cc-a755-19fc8eec1e38",
    "393650a9-6347-49a5-ae7e-09a8e824e299",
    "7157df0a-c85c-4c73-bcc6-4360af023e0d",
  ];

  const blueprintIds = isDevEnv ? devBlueprintIds : prodBlueprintIds;

  const blueprintIconColors = [
    "text-teal-600 bg-teal-50 dark:bg-teal-950",
    "text-orange-600 bg-orange-50 dark:bg-orange-950",
    "text-blue-600 bg-blue-50 dark:bg-blue-950",
    "text-purple-600 bg-purple-50 dark:bg-purple-950",
  ];

  useEffect(() => {
    fetchBlueprints();
  }, []);

  const fetchBlueprints = async () => {
    try {
      setLoading(true);
      const response = await Promise.all(
        blueprintIds.map((id) => blueprintApiService.getBlueprint(id)),
      );
      const blueprintData = response.map((blueprint, index) => ({
        id: blueprintIds[index],
        title: blueprint.name,
        description: blueprint.description,
        iconColor: blueprintIconColors[index % blueprintIconColors.length],
      }));
      setBlueprints(blueprintData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error fetching blueprints", err);
    }
  };

  // Mock recently worked data — in production this would come from an API
  const recentlyWorked = [
    {
      title: "AI Customer Service Agent",
      time: "2 hours ago",
      type: "Workspace",
      user: userName || "User",
    },
    {
      title: "Document Analysis Pipeline",
      time: "1 day ago",
      type: "Workspace",
      user: "Team",
    },
    {
      title: "Knowledge Base Assistant",
      time: "3 days ago",
      type: "Workspace",
      user: userName || "User",
    },
    {
      title: "Multi-Agent Workflow",
      time: "5 days ago",
      type: "Workspace",
      user: "Team",
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <motion.div
        className="flex flex-1 flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="md:px-18 flex flex-1 flex-col space-y-6 overflow-hidden px-6 py-6 sm:px-6 lg:px-20 2xl:px-24">
          {/* Header Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">
                {userName ? `Welcome back, ${userName}` : "Welcome back"}
              </h2>
              <p className="text-base font-normal text-muted-foreground">
                Sovereign, secure and scalable agentic solutioning platform.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <a
                href={BRAND.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <BrandLogo className="h-16 w-auto object-contain" />
              </a>
              <Link
                to={Path.BLUEPRINTS}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #ce0569 12.66%, #ff5800 94.55%)" }}
              >
                <BookOpen size={16} />
                Agent Guide
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Service Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {serviceCards.map((card) => (
              <Card
                key={card.title}
                className={cn(
                  "cursor-pointer border-dashed transition-all hover:shadow-md",
                  isCardsDisabled && "pointer-events-none opacity-50",
                )}
                onClick={() =>
                  !isCardsDisabled && navigate(card.buttonLink)
                }
              >
                <div className="flex flex-col space-y-3 p-6">
                  <div className={cn(card.iconBg, "w-fit rounded-lg p-3")}>
                    {card.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Recently Worked */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recently Worked</h3>
                <Link
                  to={Path.AGENT_BUILDER}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentlyWorked.map((item, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer transition-all hover:shadow-sm"
                    onClick={() => navigate(Path.AGENT_BUILDER)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <FolderOpen className="size-5 shrink-0 text-blue-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
                          {item.type}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users size={12} />
                          <span>{item.user}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Industry Agentic Solutions */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Industry Agentic Solutions
                </h3>
                <Link
                  to={Path.BLUEPRINTS}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <>
                    {[1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : blueprints.length > 0 ? (
                  blueprints.map((blueprint, index) => (
                    <Card
                      key={index}
                      className={cn(
                        "transition-all hover:shadow-sm",
                        isCardsDisabled && "pointer-events-none opacity-50",
                      )}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            blueprint.iconColor,
                          )}
                        >
                          <Bot size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {blueprint.title}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {blueprint.description}
                          </p>
                        </div>
                        <Link
                          to={
                            isCardsDisabled
                              ? "#"
                              : `${Path.ORCHESTRATION}?blueprint=${blueprint.id}`
                          }
                          onClick={(e) => {
                            if (isCardsDisabled) {
                              e.preventDefault();
                              return;
                            }
                            if (
                              mixpanel.hasOwnProperty("cookie") &&
                              isMixpanelActive
                            )
                              mixpanel.track("Home Blueprint clicked", {
                                name: blueprint.title,
                              });
                          }}
                        >
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5 border-0 text-white hover:opacity-90"
                            style={{ background: "linear-gradient(90deg, #ce0569 12.66%, #ff5800 94.55%)" }}
                          >
                            Open
                            <ExternalLink size={14} />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-lg border bg-card p-6 text-center text-card-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <h3 className="font-medium text-muted-foreground">
                        No solutions found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Check back later for new solutions
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HomeV3;
