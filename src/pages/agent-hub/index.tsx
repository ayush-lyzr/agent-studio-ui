import { useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, ArrowLeft } from "lucide-react";
import mixpanel from "mixpanel-browser";

import { Button } from "@/components/ui/button";
import { lyzrApps } from "@/data/lyzr-apps";
import { Skeleton } from "@/components/ui/skeleton";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { PlanType } from "@/lib/constants";
import { Path } from "@/lib/types";
import { motion } from "framer-motion";
import Markdown from "react-markdown";

const AgentHub = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agentData = lyzrApps.find((app) => app.id === agentId);
  const { userId, getToken } = useAuth();
  const token = getToken();
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const usage_data = useManageAdminStore((state) => state.usage_data);
  const isNotProAndAbove = [PlanType.Starter, PlanType.Community].includes(
    usage_data?.plan_name as PlanType,
  );

  if (!agentData) {
    return <div>Agent not found</div>;
  }

  const handleLaunchClick = useCallback(() => {
    if (mixpanel.hasOwnProperty("cookie")) {
      mixpanel.track("Launch App Clicked", agentData);
    }
    if (token && userId) {
      window.open(`${agentData.launch_link}?token=${token}`, "_blank");
    }
  }, [userId, token]);

  const handleBookDemoClick = () => {
    if (mixpanel.hasOwnProperty("cookie")) {
      mixpanel.track("Book Demo Clicked", agentData);
    }
    window.open("https://www.avanade.com/en-gb/contact", "_blank");
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10"
    >
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-3xl">
          {agentData.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:gap-8 lg:grid-cols-2">
        <div className="space-y-6 md:space-y-8">
          <p className="text-justify leading-7 text-muted-foreground">
            {agentData.description}
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-lg font-semibold">The Problem</h2>
              <ul className="list-none space-y-2 text-sm text-muted-foreground sm:text-base">
                {agentData.problems.map((problem, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <Markdown>{problem}</Markdown>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h2 className="text-lg font-semibold">Benefits</h2>
              <ul className="list-none space-y-2 text-sm text-muted-foreground sm:text-base">
                {agentData.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <Markdown>{benefit}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col space-y-8 md:space-y-12">
          {agentData.videoUrl ? (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">How It Works?</h1>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {isVideoLoading && (
                  <Skeleton className="absolute inset-0 h-full w-full" />
                )}
                <iframe
                  title="Video"
                  src={agentData.videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsVideoLoading(false)}
                />
              </div>
            </div>
          ) : (
            <div className="h-full w-full" />
          )}
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              onClick={handleLaunchClick}
              disabled={agentData?.forProAnAbove && isNotProAndAbove}
              className="p-6 text-base sm:p-8 sm:text-lg"
            >
              Launch Agent <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            {agentData?.forProAnAbove && isNotProAndAbove && (
              <span className="mt-2 text-sm">
                {"Available only to Pro plan & above. "}
                <Link
                  to={Path.UPGRADE_PLAN}
                  className="underline underline-offset-4"
                >
                  Upgrade now
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex flex-col gap-4 rounded-lg bg-secondary p-4 md:mt-12 md:flex-row md:items-center md:justify-between md:p-8 lg:mx-20">
        <div className="space-y-2">
          <h2 className="text-lg font-bold sm:text-xl">
            Do you need a customized version of this agent?
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base md:max-w-[40rem]">
            We can help with a tailored version of this agent that better suits
            your internal processes and requirements. Book a call with our agent
            builder team now.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBookDemoClick}
          className="w-full md:w-auto"
        >
          Speak to a Specialist
        </Button>
      </div>
    </motion.main>
  );
};

export default AgentHub;
