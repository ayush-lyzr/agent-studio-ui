import { ExternalLink } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CredentialsModal from "./credentials-modal";
import useStore from "@/lib/store";
import { useDataConnector } from "./data-connector.service";
import { DataConnector, ICredential } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { DataConnectorId, getDataConnectorLogo } from "@/assets/images";

type FieldConfig = {
  field_id: string;
  field_name: string;
  field_value: string;
  field_type: string;
  field_accepted_formats?: string[];
  field_multiple?: boolean;
  field_description?: string;
  required: boolean;
};

type IDataConnectorCard = {
  connector: DataConnector;
  enabled: boolean;
  config: FieldConfig[];
  savedConfig: Record<string, string> | undefined;
};

export const DataConnectorCard: React.FC<IDataConnectorCard> = ({
  connector,
  config,
  savedConfig,
}) => {
  const [credentialsDialogVisible, setCredentialsDialogVisible] =
    useState<boolean>(false);
  const [isTableView, setIsTableView] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<ICredential[]>([]);

  const name = connector?.meta_data?.provider_name;
  const description = connector.form?.description;
  const documentationLink = connector.meta_data.documentation_link;
  const icon = getDataConnectorLogo(connector?.provider_id as DataConnectorId);
  const provider_id = connector.provider_id;

  const disableProvider = false;

  const apiKey = useStore((state) => state.api_key);
  const { getCredentials, isFetchingCredentials } = useDataConnector({
    apiKey,
    providerId: connector?.provider_id,
    providerType: connector?.type,
  });

  const openCredentials = (isQdrant: boolean) => () => {
    if (isQdrant) {
      return;
    }
    setCredentialsDialogVisible(true);
    setIsTableView(true);
  };

  const refreshCredentials = useCallback(async () => {
    try {
      const result = await getCredentials();
      setCredentials(result.data ?? []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setCredentials([]);
    }
  }, [getCredentials, provider_id]);

  useEffect(() => {
    refreshCredentials();
  }, []);

  return (
    <Card className="flex flex-col">
      <CardContent className="h-36 space-y-2 p-4">
        <CardHeader className="h-10 cursor-pointer p-0">
          <CardTitle className="flex items-center justify-between gap-4 p-0">
            <LazyImage
              src={icon}
              alt={connector.form?.title || "Provider Logo"}
              width={30}
              height={30}
              className="h-[30px] w-[30px] object-contain"
            />
            <CredentialsModal
              open={credentialsDialogVisible}
              onOpen={setCredentialsDialogVisible}
              isTableView={isTableView}
              setIsTableView={setIsTableView}
              credentials={credentials}
              isFetchingCredentials={isFetchingCredentials}
              refreshCredentials={refreshCredentials}
              config={config}
              savedConfig={savedConfig}
              provider={connector}
            />
          </CardTitle>
        </CardHeader>
        <span className="inline-flex items-center gap-2 font-semibold">
          <p>{name}</p>
          {disableProvider && (
            <p className="h-4 w-fit rounded-full bg-green-100 px-2 text-xxs text-green-600">
              Coming Soon
            </p>
          )}
        </span>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4">
        <Badge
          variant="secondary"
          className="cursor-pointer rounded-full text-muted-foreground"
          onClick={openCredentials(disableProvider)}
        >
          {credentials?.length}{" "}
          {connector?.provider_id === "file_upload"
            ? `files`
            : `DB's connected`}
        </Badge>
        {documentationLink?.length > 0 &&
          connector?.provider_id !== "file_upload" && (
            <Link
              to={documentationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
            >
              View Documentation
              <ExternalLink className="size-4" />
            </Link>
          )}
      </CardFooter>
    </Card>
  );
};
