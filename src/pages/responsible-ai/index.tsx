import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/custom/button";
import { Skeleton } from "@/components/ui/skeleton";
import PolicyForm from "./components/policy-form";
import UtilityBar from "./components/utility-bar";
import { IRAIPolicy } from "@/lib/types";
import ResponsibleAiCard from "./components/responsible-ai-card";
import { useQuery } from "@tanstack/react-query";
import useStore from "@/lib/store";
import { RAI_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import { AxiosResponse } from "axios";
import { DeletePolicy } from "./components/delete-policy";
import { Link } from "react-router-dom";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";

const ResponsibleAI = () => {
  const [policyFormVisible, setPolicyFormVisible] = useState<boolean>(false);
  const [deleteVisible, setDeleteVisible] = useState<boolean>(false);
  const [data, setData] = useState<Partial<IRAIPolicy>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const apiKey = useStore((state) => state.api_key);

  const {
    data: policies,
    isFetching: isFetchingPolicies,
    refetch: fetchPolicies,
  } = useQuery({
    queryKey: ["fetchAllPolicies", apiKey],
    queryFn: () =>
      axios.get(`/v1/rai/policies`, {
        baseURL: RAI_URL,
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse<{ policies: IRAIPolicy[] }, any>) =>
      res.data?.policies ?? [],
    enabled: !!apiKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const onEdit = (policy: Partial<IRAIPolicy>) => (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setData(policy);
    setPolicyFormVisible(true);
  };

  const onDelete = (policy: Partial<IRAIPolicy>) => (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setData(policy);
    setDeleteVisible(true);
  };

  const onRefresh = async () => {
    await fetchPolicies();
    setData({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full space-y-8 p-8"
    >
      <PageTitle
        title="Responsible AI"
        description={
          <span className="inline-flex items-center gap-1 space-x-1 text-sm text-muted-foreground">
            <p>
              Analyze and ensure safety, fairness, and reliability of AI
              interactions.
            </p>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Docs-clicked", {
                    feature: "Responsible AI",
                  });
              }}
            >
              Docs
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("API-clicked", {
                    feature: "Responsible AI",
                  });
              }}
            >
              API
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
            <Link
              to="https://youtu.be/Ccrn1pIwU7I?si=Bc7q8aRarwyDTjz"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Video-clicked", {
                    content_name: "Responsible AI",
                  });
              }}
            >
              Video
              <ArrowTopRightIcon className="ml-1 size-3" />
            </Link>
          </span>
        }
      />

      <UtilityBar
        onRefresh={fetchPolicies}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openForm={() => {
          setData({});
          setPolicyFormVisible(true);
        }}
      />
      <div className="grid w-full grid-cols-4 gap-4 overflow-y-auto pt-1">
        {isFetchingPolicies ? (
          new Array(8)
            .fill(0)
            .map((_, index) => (
              <Skeleton
                key={`policy-skeleton-${index}`}
                className="h-36 w-full rounded-xl"
              />
            ))
        ) : policies?.length === 0 ? (
          <div className="col-span-4 flex w-full flex-col items-center justify-center space-y-5 text-center">
            <img
              src="/images/no-tools.svg"
              alt="Empty state"
              className="mt-20"
            />
            <p>Create your first policy</p>

            <Button onClick={() => setPolicyFormVisible(true)}>
              <Plus className="mr-1 size-4" /> Create new
            </Button>
          </div>
        ) : (
          policies
            ?.filter((policy) => policy.name.match(searchQuery))
            ?.map((policy) => (
              <ResponsibleAiCard
                policy={policy}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
        )}
        <PolicyForm
          open={policyFormVisible}
          onOpen={setPolicyFormVisible}
          data={data}
          onRefresh={onRefresh}
        />
        <DeletePolicy
          data={data}
          open={deleteVisible}
          onOpen={setDeleteVisible}
          onRefresh={onRefresh}
        />
      </div>
    </motion.div>
  );
};

export default ResponsibleAI;
