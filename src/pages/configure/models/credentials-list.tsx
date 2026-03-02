import { memo } from "react";
import { Building2, User } from "lucide-react";

import { ICredential } from "@/lib/types";
import { DeleteKey } from "./delete-key";
import Loader from "@/components/loader";

export const CredentialsList = memo(
  ({
    credentials,
    provider,
    isLoading,
    onDelete,
  }: {
    credentials: (ICredential & { scope?: "personal" | "org" })[];
    isLoading: boolean;
    onDelete: (credentialId: string) => void;
    provider: any;
  }) => {
    if (isLoading) {
      return (
        <div className="flex h-[300px] items-center justify-center">
          <div className="grid place-items-center gap-2">
            <Loader loadingText="Loading ..." />
          </div>
        </div>
      );
    }

    return (
      <div className="h-[300px] space-y-2 overflow-y-auto pr-2">
        {["aws-bedrock"].includes(provider?.provider_id) && (
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-2">
            <span className="font-medium">Lyzr</span>
            <span className="text-sm text-muted-foreground">
              Managed {provider?.form?.title} {provider?.type}
            </span>
          </div>
        )}
        {credentials?.length > 0 ? (
          <div className="space-y-2">
            {credentials.map((credential) => (
              <div
                key={credential.name}
                className="flex items-center justify-between rounded-lg bg-accent px-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{credential.name}</span>
                  {credential.scope === "org" && (
                    <Building2 className="size-4 text-muted-foreground" />
                  )}
                  {credential.scope === "personal" && (
                    <User className="size-4 text-muted-foreground" />
                  )}
                </div>
                <DeleteKey data={credential} onDelete={onDelete} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-lg border bg-secondary">
            <div className="grid place-items-center gap-4">
              <img src="/images/empty.svg" width={100} alt="Empty state" />
              <p>No Credentials found</p>
            </div>
          </div>
        )}
      </div>
    );
  },
);
