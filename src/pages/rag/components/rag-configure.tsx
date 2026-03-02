import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import Jdisplay from "./json-display";
import ConfigureRAG from "./rag-configure-form";
import useStore from "@/lib/store";
import { Button } from "@/components/custom/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RagConfig {
  _id: string;
  ragName: string;
  vectorStore: string;
  vectorStoreUrl: string;
  vectorStoreApiKey: string;
  vectorStoreHost: string;
  vectorStorePort: string;
  llmModel: string;
  llmApiKey: string;
  topK: number;
}

export default function RagConfigure() {
  const [open, setOpen] = useState(false);
  const [rag, setRag] = useState<RagConfig>({
    _id: "new",
    ragName: "",
    vectorStore: "",
    vectorStoreUrl: "",
    vectorStoreApiKey: "",
    vectorStoreHost: "",
    vectorStorePort: "",
    llmModel: "",
    llmApiKey: "",
    topK: 10,
  });

  const rags = useStore((state: any) => state.rags);

  const setRagConfig = useCallback((data: Partial<RagConfig>) => {
    setRag((prevRag) => ({ ...prevRag, ...data }));
  }, []);

  const setRagId = (id: string) => {
    setRag((prevRag) => ({ ...prevRag, _id: id }));
  };

  const generateJsonData = () => {
    let vectorStoreParams;
    if (rag?.vectorStore?.toLowerCase() === "qdrant") {
      vectorStoreParams = {
        host: rag.vectorStoreHost,
        port: rag.vectorStorePort,
        index_name:
          rag?.ragName?.charAt(0).toUpperCase() + rag?.ragName?.slice(1),
      };
    } else {
      vectorStoreParams = {
        url: rag.vectorStoreUrl,
        api_key: rag.vectorStoreApiKey,
        index_name:
          rag?.ragName?.charAt(0).toUpperCase() + rag?.ragName?.slice(1),
      };
    }

    return {
      vector_store_config: {
        type: rag.vectorStore,
        params: vectorStoreParams,
      },
      embedding_config: {
        provider: "openai",
        params: {
          model: "text-embedding-ada-002",
          api_key: rag.llmApiKey,
        },
      },
      retriever_config: { type: "simple", params: {} },
      service_config: {
        chunk_size: 1000,
        chunk_overlap: 100,
        context_window: 128000,
      },
      base_config: {
        params: {
          similarity_top_k: parseInt(rag.topK?.toString()),
          memory_window: 128000,
        },
      },
    };
  };

  const handleRagSelection = (selectedRag: any) => {
    const newRag: RagConfig = {
      _id: selectedRag.id.toString(),
      ragName: selectedRag.name,
      vectorStore: selectedRag.config.vector_store_config.type,
      vectorStoreUrl: selectedRag.config.vector_store_config.params.url || "",
      vectorStoreApiKey:
        selectedRag.config.vector_store_config.params.api_key || "",
      vectorStoreHost: selectedRag.config.vector_store_config.params.host || "",
      vectorStorePort: selectedRag.config.vector_store_config.params.port || "",
      llmModel: selectedRag.config.embedding_config.params.model,
      llmApiKey: selectedRag.config.embedding_config.params.api_key,
      topK: selectedRag.config.base_config.params.similarity_top_k,
    };
    setRag(newRag);
    setOpen(false);
  };

  return (
    <TabsContent value="rag-configure" className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between sm:w-1/2"
          >
            {rag.ragName || "Select RAG or Create new..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full rounded-lg bg-opacity-20 p-0 shadow-lg backdrop-blur-lg backdrop-filter sm:w-[40rem]">
          <Command className="max-h-[300px] overflow-hidden">
            <CommandInput placeholder="Search RAG..." className="h-9" />
            <CommandEmpty>No RAG found.</CommandEmpty>
            <div className="max-h-[300px] overflow-y-auto">
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setRag({
                      _id: "new",
                      ragName: "",
                      vectorStore: "",
                      vectorStoreUrl: "",
                      vectorStoreApiKey: "",
                      vectorStoreHost: "",
                      vectorStorePort: "",
                      llmModel: "",
                      llmApiKey: "",
                      topK: 10,
                    });
                    setOpen(false);
                  }}
                  className="font-bold"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      rag._id === "new" ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Create new RAG +
                </CommandItem>
                <Separator className="my-2" />

                {rags.length > 0 ? (
                  rags.map((ragItem: any) => (
                    <CommandItem
                      key={ragItem.id}
                      onSelect={() => handleRagSelection(ragItem)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          rag._id === ragItem.id.toString()
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {ragItem.name}
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem>No RAGs available</CommandItem>
                )}
              </CommandGroup>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-8">
        <Card className="col-span-1 lg:col-span-2 xl:col-span-4">
          <CardHeader></CardHeader>
          <CardContent className="pl-2">
            <ConfigureRAG config={rag} setRagConfig={setRagConfig} />
          </CardContent>
        </Card>

        <div className="col-span-1 lg:col-span-2 xl:col-span-4">
          <Jdisplay
            title={"RAG Configuration"}
            setNewId={setRagId}
            key={JSON.stringify(rag)}
            id={rag._id}
            endpoint="/v2/environment"
            jsonData={generateJsonData()}
          />
        </div>
      </div>
    </TabsContent>
  );
}
