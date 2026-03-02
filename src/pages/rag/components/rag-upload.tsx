import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

import ConfigureRag from "./rag-upload-configure";
import UploadedDocs from "./rag-uploaded-docs";

export default function RagUpload() {
  const [env, setEnv] = useState({ name: "", _id: "new", llm_api_key: "" });
  const [selectedRagId, setSelectedRagId] = useState("");

  const setAIConfig = (data: any) => {
    setEnv({ ...env, llm_api_key: data.apiKey });
  };

  const handleRagIdChange = (ragId: string) => {
    setSelectedRagId(ragId);
  };

  return (
    <TabsContent value="upload" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-8">
        <Card className="col-span-1 lg:col-span-1 xl:col-span-4">
          <CardHeader>{/* <CardTitle>LLM</CardTitle> */}</CardHeader>
          <CardContent className="pl-2">
            <ConfigureRag
              key={env._id}
              config={{
                ragId: "",
                files: [],
                websiteUrl: "",
                crawlPages: "1",
                crawlDepth: "0",
                dynamicWait: "5",
                youtubeUrl: "",
                rawText: "",
              }}
              setAIConfig={setAIConfig}
              onRagIdChange={handleRagIdChange}
            />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-1 xl:col-span-4">
          <CardContent className="pl-2">
            <UploadedDocs ragId={selectedRagId} />
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
