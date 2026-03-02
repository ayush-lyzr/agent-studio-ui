import { Plus, Loader2, Pencil } from "lucide-react";
import React, { SetStateAction, Dispatch, useState } from "react";

import { Button, buttonVariants } from "@/components/custom/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataConnector, ICredential } from "@/lib/types";
import { DeleteKey } from "../models/delete-key";
import AddDataConnectorForm from "./add-credential-form";
import { Separator } from "@/components/ui/separator";

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

type ICredentialsModal = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  isTableView: boolean;
  setIsTableView: Dispatch<SetStateAction<boolean>>;
  savedConfig: Record<string, string> | undefined;
  config: FieldConfig[];
  provider: DataConnector;
  credentials: ICredential[];
  isFetchingCredentials: boolean;
  refreshCredentials: () => void;
};

const CredentialsModal: React.FC<ICredentialsModal> = ({
  open,
  onOpen,
  isTableView,
  setIsTableView,
  config,
  savedConfig,
  provider,
  credentials,
  isFetchingCredentials,
  refreshCredentials,
}) => {
  const [selectedCredential, setSelectedCredential] = useState<any>({});

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setIsTableView(false);
        onOpen(val);
      }}
    >
      <DialogTrigger
        asChild
        onClick={() => {
          onOpen(true);
          setIsTableView(false);
          setSelectedCredential({});
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        <Button variant="outline">
          <Plus className="mr-1 size-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl !rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isTableView
              ? provider?.form?.title
              : `Connect ${provider?.form?.title} ${provider?.type}`}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        {isTableView ? (
          <div className="space-y-4">
            {isFetchingCredentials ? (
              <div className="grid h-[300px] place-items-center bg-secondary">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <div className="h-[300px] space-y-2 overflow-y-auto pr-2">
                <div className="flex items-center justify-between">
                  <span>
                    {provider?.provider_id === "file_upload"
                      ? "Files"
                      : "Credentials"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsTableView(false);
                      setSelectedCredential({});
                    }}
                  >
                    Add
                  </Button>
                </div>
                {["qdrant", "weaviate"].includes(provider?.provider_id) && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-2">
                    <span className="font-medium">Lyzr</span>
                    <span className="text-sm text-muted-foreground">
                      Managed {provider?.form?.title} {provider?.type}
                    </span>
                  </div>
                )}
                {credentials.length > 0 ? (
                  credentials.map((credential) => (
                    <div
                      key={String(credential.meta_data?.name)}
                      className="flex items-center justify-between rounded-lg bg-secondary px-4 py-2"
                    >
                      <span className="font-medium">
                        {String(credential.meta_data?.name)}
                      </span>
                      <div className="flex items-center gap-4">
                        <Pencil
                          className="size-4 cursor-pointer"
                          onClick={() => {
                            setSelectedCredential(credential);
                            setIsTableView(false);
                          }}
                        />
                        <DeleteKey
                          data={credential}
                          onDelete={refreshCredentials}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-4/5 flex-col items-center justify-center gap-4 rounded-lg border bg-secondary">
                    <img src="/images/empty.svg" width={80} alt="Empty state" />
                    <p>
                      {`No ${
                        provider?.provider_id === "file_upload"
                          ? "Files"
                          : "Custom Credentials"
                      } found`}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: "outline" })}>
                Close
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <AddDataConnectorForm
            config={config}
            provider={provider}
            savedConfig={savedConfig}
            setIsTableView={setIsTableView}
            refreshCredentials={refreshCredentials}
            defaultValues={selectedCredential}
            closeDialog={() => onOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CredentialsModal;
