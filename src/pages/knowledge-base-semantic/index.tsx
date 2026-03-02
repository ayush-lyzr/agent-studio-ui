import { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Ellipsis, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteKnowledgeBase } from "../knowledge-base/components/delete-knowledge-base";
import { Separator } from "@/components/ui/separator";
import useStore from "@/lib/store";
import { DBTableManagement } from "./table-management";
import SchematicModelConfiguration from "./schematic-model-configuration";
import axios from "@/lib/axios";
import { BASE_URL, RAG_URL } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { IPolicy, ITeamMember, Path } from "@/lib/types";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { useOrganization } from "../organization/org.service";
import { useAgentBuilder } from "../agent-builder/agent-builder.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import KnowledgeBaseFormDialog from "../knowledge-base/components/knowledge-base-form-dialog";

export default function KnowledgeBaseFiles() {
  const params = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const rag_id = params?.id;

  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [schema, setSchema] = useState<any>(null);

  const apiKey = useStore((state) => state.api_key);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );

  const { getCurrentOrgMembers, isFetchingCurrentOrgMembers } = useOrganization(
    {
      token: getToken() ?? "",
      current_organization,
    },
  );
  const { getAgentPolicy, isFetchingAgentPolicies } = useAgentBuilder({
    apiKey,
    permission_type: "knowledge_base",
  });

  const onSuccess = () => {
    getRagSchemas();
    setSchema(null);
  };

  const { data: rag = {}, isFetching: isFetchingRag } = useQuery({
    queryKey: ["getRag", rag_id],
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

  const {
    data: schemas = [],
    isFetching: isFetchingSchemas,
    refetch: getRagSchemas,
  } = useQuery({
    queryKey: ["getRagSchemas", rag_id, rag?.meta_data?.database_id, apiKey],
    queryFn: async () =>
      axios.get(
        `/v3/semantic_model/list_tables/${rag_id}/${rag?.meta_data?.database_id}`,
        {
          baseURL: BASE_URL,
          headers: { accept: "application/json", "x-api-key": apiKey },
        },
      ),
    select: (res: AxiosResponse) => res.data?.schemas_and_tables,
    enabled: !!rag_id && !!rag?.meta_data?.database_id && !!apiKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

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
      const userIsOwner = rag?.user_id === apiKey;
      if (!(userHasPermission || userIsOwner)) {
        navigate(Path.NOT_FOUND);
      }
    };
    if (current_organization?.org_id && rag?.user_id) {
      fetchTeam();
    }
  }, [
    currentUser?.auth?.email,
    current_organization?.org_id,
    rag?.user_id,
    apiKey,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="h-full w-full space-y-4 p-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-transparent"
          >
            <ArrowLeft className="size-6" />
          </Button>
          {isFetchingRag ? (
            <Skeleton className="h-10 w-44" />
          ) : (
            <p className="text-xl font-medium tracking-tight">
              {rag?.collection_name?.slice(0, -4)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {rag?.meta_data?.description_agent_name}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Ellipsis className="size-4" />
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

      <div className="flex h-[94%] w-full">
        <DBTableManagement
          data={schemas}
          setSchema={setSchema}
          loading={
            isFetchingSchemas ||
            isFetchingCurrentOrgMembers ||
            isFetchingAgentPolicies
          }
          metadata={rag?.meta_data ?? {}}
          rag_config_id={rag_id ?? ""}
          onSuccess={onSuccess}
        />

        <Separator orientation="vertical" />

        <SchematicModelConfiguration
          schema={schema}
          rag_config_id={rag_id}
          metadata={rag?.meta_data ?? {}}
          onSuccess={onSuccess}
        />
      </div>

      <KnowledgeBaseFormDialog
        open={editVisible}
        onOpen={setEditVisible}
        data={rag}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["rag", rag_id] });
        }}
      />

      <DeleteKnowledgeBase
        open={deleteVisible}
        onOpenChange={setDeleteVisible}
        data={{ ...rag, _id: rag?.id }}
        apiKey={apiKey}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["rag", rag_id] });
          navigate(Path.KNOWLEDGE_BASE);
        }}
      />
    </motion.div>
  );
}
