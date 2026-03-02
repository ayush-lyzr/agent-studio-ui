import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Files,
  Globe,
  LetterText,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileManagementTable } from "./FileManagementTable";
import RagRetrieval from "./RagRetrieval";
import { DeleteKnowledgeBase } from "../knowledge-base/components/delete-knowledge-base";
import { Separator } from "@/components/ui/separator";
import useStore from "@/lib/store";
import { IPolicy, ITeamMember, Path } from "@/lib/types";
import { isMixpanelActive, RAG_URL } from "@/lib/constants";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { useOrganization } from "../organization/org.service";
import { useAgentBuilder } from "../agent-builder/agent-builder.service";
import KnowledgeBaseFormDialog from "../knowledge-base/components/knowledge-base-form-dialog";
import { KnowledgeBaseApiDialog } from "./components/knowledge-base-api-dialog";
import { KnowledgeGraphVisualizer } from "./components/knowledge-graphvisualizer";
import UploadWizard, { UploadMethod } from "./components/UploadWizard";
import mixpanel from "mixpanel-browser";

export default function KnowledgeBaseFiles() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, _] = useSearchParams();
  const group_name = searchParams.get("group_name");
  const rag_id = params.id;
  const [uploadVisible, setUploadVisible] = useState<boolean>(false);
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [deleteVisible, setDeleteVisible] = useState<boolean>(false);
  const [visualizationVisible, setVisualizationVisible] =
    useState<boolean>(false);
  const [isGraphRag, setIsGraphRag] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>();

  const apiKey = useStore((state) => state.api_key);
  const token = useStore((state) => state.app_token);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );
  const currentUser = useManageAdminStore((state) => state.current_user);

  const { getCurrentOrgMembers, isFetchingCurrentOrgMembers } = useOrganization(
    {
      token,
      current_organization,
    },
  );
  const { getAgentPolicy, isFetchingAgentPolicies } = useAgentBuilder({
    apiKey,
    permission_type: "knowledge_base",
  });

  const handleBackClick = () =>
    group_name
      ? navigate(`${Path.KNOWLEDGE_BASE}?group_name=${group_name}`)
      : navigate(-1);

  const {
    data: ragDocuments,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["rag", rag_id, apiKey],
    queryFn: async () => {
      const response = await axios.get(
        `${RAG_URL}/v3/rag/documents/${rag_id}/`,
        {
          headers: { accept: "application/json", "x-api-key": apiKey },
        },
      );
      return response.data || [];
    },
    enabled: !!rag_id && !!apiKey,
    refetchOnWindowFocus: false,
  });

  const { data: completeRagData } = useQuery({
    queryKey: ["complete-rag", rag_id, apiKey],
    queryFn: async () =>
      axios.get(`/v3/rag/${rag_id}/`, {
        baseURL: RAG_URL,
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse) => res.data,
    enabled: !!rag_id && !!apiKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const deleteFilesMutation = useMutation({
    mutationKey: [apiKey, rag_id],
    mutationFn: async (files: string[]) => {
      await axios.delete(`${RAG_URL}/v3/rag/${rag_id}/docs/`, {
        headers: { accept: "application/json", "x-api-key": apiKey },
        data: files,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag", rag_id] });
    },
  });

  const rag = {
    _id: rag_id,
    collection_name: completeRagData?.collection_name,
    docs: ragDocuments || [],
  };

  useEffect(() => {
    const fetchTeam = async () => {
      const res = await getCurrentOrgMembers();
      const team = res.data;
      const policyRes = await getAgentPolicy();
      const agentPolicies = policyRes.data?.filter(
        (policy: IPolicy) => policy?.resource_id === rag_id,
      );
      const sharedEmails = team
        ?.filter((member: ITeamMember) =>
          agentPolicies
            ?.map((p: IPolicy) => p?.user_id)
            .includes(member?.user_id),
        )
        ?.map((member: ITeamMember) => member?.email);
      const userHasPermission =
        sharedEmails?.length > 0
          ? sharedEmails?.includes(currentUser?.auth?.email)
          : false;
      const userIsOwner = completeRagData?.user_id === apiKey;
      if (!(userHasPermission || userIsOwner)) {
        // navigate(Path.NOT_FOUND);
      }
    };
    if (current_organization?.org_id && completeRagData?.user_id) {
      fetchTeam();
    }

    if (completeRagData?.vector_store_provider) {
      setIsGraphRag(
        completeRagData?.vector_store_provider
          ?.toLowerCase()
          ?.includes("neo4j") ||
        completeRagData?.vector_store_provider
          ?.toLowerCase()
          ?.includes("neptune"),
      );
    }
  }, [
    currentUser?.auth?.email,
    current_organization?.org_id,
    apiKey,
    completeRagData,
    ragDocuments?.length,
  ]);

  const handleAddFile = (step: number) => {
    setUploadVisible(true);
    switch (step) {
      case 1:
        setUploadMethod("files");
        break;
      case 2:
        setUploadMethod("website");
        break;
      case 3:
        setUploadMethod("text");
        break;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="h-full w-full space-y-8 p-8"
    >
      <div className="flex items-center justify-between border-b-2 pb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="hover:bg-transparent"
          >
            <ArrowLeft className="size-6" />
          </Button>
          <p className="text-4xl font-medium tracking-tight">
            {completeRagData?.collection_name.slice(0, -4)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isGraphRag && ragDocuments?.length > 0 && !isLoading && (
            <KnowledgeGraphVisualizer
              rag_id={rag_id ?? ""}
              apiKey={apiKey}
              open={visualizationVisible}
              onOpenChange={setVisualizationVisible}
            />
          )}
          <KnowledgeBaseApiDialog
            ragId={rag_id!}
            apiKey={apiKey}
            completeRagData={completeRagData}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreVertical className="size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditVisible(true)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteVisible(true)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
              mixpanel.track("Add File clicked");
            handleAddFile(1);
          }}
        >
          <Files className="mr-1 h-4 w-4" />
          Add File
        </Button>
        {!isGraphRag && (
          <Button
            variant="outline"
            onClick={() => {
              if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                mixpanel.track("Add Website clicked");
              handleAddFile(2);
            }}
          >
            <Globe className="mr-1 h-4 w-4" />
            Add Website
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
              mixpanel.track("Add Text clicked");
            handleAddFile(3);
          }}
        >
          <LetterText className="mr-1 h-4 w-4" />
          Add Text
        </Button>
      </div>

      <div className="relative grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <FileManagementTable
            data={ragDocuments || []}
            isLoading={
              isLoading ||
              isFetching ||
              isFetchingCurrentOrgMembers ||
              isFetchingAgentPolicies
            }
            onRefresh={() =>
              queryClient.invalidateQueries({ queryKey: ["rag", rag_id] })
            }
            onUpload={async () => {
              setUploadVisible(true);
              return Promise.resolve();
            }}
            onDelete={deleteFilesMutation.mutateAsync}
          />
        </div>

        <Separator
          orientation="vertical"
          className="absolute right-[40%] h-full"
        />

        <div className="col-span-2">
          <RagRetrieval
            ragId={rag_id}
            ragData={ragDocuments}
            isGraphRag={
              completeRagData?.vector_store_provider
                ?.toLowerCase()
                ?.includes("neo4j") ||
              completeRagData?.vector_store_provider
                ?.toLowerCase()
                ?.includes("neptune")
            }
          />
        </div>
      </div>

      <KnowledgeBaseFormDialog
        open={editVisible}
        onOpen={setEditVisible}
        data={completeRagData}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["rag", rag_id] });
          queryClient.invalidateQueries({ queryKey: ["complete-rag", rag_id] });
        }}
      />
      <UploadWizard
        open={uploadVisible}
        onOpenChange={setUploadVisible}
        data={rag}
        isGraphRag={isGraphRag}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["rag", rag_id] })
        }
        stepCount={2}
        method={uploadMethod}
      />
      <DeleteKnowledgeBase
        open={deleteVisible}
        onOpenChange={setDeleteVisible}
        data={rag}
        apiKey={apiKey}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["rag", rag_id] });
          navigate(Path.KNOWLEDGE_BASE);
        }}
      />
    </motion.div>
  );
}
