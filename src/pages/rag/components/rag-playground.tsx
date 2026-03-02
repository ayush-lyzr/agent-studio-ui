import { useState } from "react";
import { Separator } from "@/components/ui/separator";

import TestRag from "./rag-playground-input";
import RetrievedRag from "./rag-playground-output";

export default function RagPlayground() {
  const [env, setEnv] = useState({ name: "", _id: "new", llm_api_key: "" });
  const [, setSelectedRagId] = useState("");
  const [retrievedResponse, setRetrievedResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const setAIConfig = (data: any) => {
    setEnv({ ...env, llm_api_key: data.apiKey });
  };

  const handleRagIdChange = (ragId: string) => {
    setSelectedRagId(ragId);
  };

  const handleRetrievedResponse = (response: any) => {
    setRetrievedResponse(response);
    setIsLoading(false);
  };

  const handleSubmit = () => {
    setIsLoading(true);
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex-1">
        <div className="">
          <TestRag
            key={env._id}
            config={{
              ragId: "",
              query: "",
            }}
            setAIConfig={setAIConfig}
            onRagIdChange={handleRagIdChange}
            onRetrievedResponse={handleRetrievedResponse}
            onSubmit1={handleSubmit}
          />
        </div>
      </div>

      <div className="mx-4 hidden lg:block">
        <Separator orientation="vertical" className="h-full" />
      </div>

      <div className="flex-1">
        <div className="">
          <RetrievedRag response={retrievedResponse} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
