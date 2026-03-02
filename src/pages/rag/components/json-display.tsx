import { Button } from "@/components/custom/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import axios from "axios";
import useStore, { reloadData } from "@/lib/store";
import { Copy } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Jdisplay = ({
  jsonData,
  title,
  // endpoint,
  id,
  setNewId,
}: {
  title: string;
  jsonData: Object;
  endpoint: string;
  id: string;
  setNewId: CallableFunction;
}) => {
  const [, setIsJsonCopied] = useState(false);
  const [isIdAvailable, setIsIdAvailable] = useState(id);
  const [isNewItem, setIsNewItem] = useState(id === "" || id === "new");
  const [currentJsonData, setCurrentJsonData] = useState(jsonData);

  const api_key = useStore((state: any) => state.api_key);
  // const base_url = useStore((state: any) => state.baseUrl);
  const store = useStore();

  useEffect(() => {
    setIsNewItem(id === "" || id === "new");
    setCurrentJsonData(jsonData);
  }, [id, jsonData]);

  const copyToClipboard = (
    text: string,
    setIsCopied: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast({
        description: `The RAG Configuration has been copied to your clipboard.`,
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  const formattedJson = JSON.stringify(currentJsonData, null, 4);

  const handlePostRequest = async () => {
    toast({
      title:
        isIdAvailable === "new"
          ? "Creating RAG Configuration..."
          : "Updating RAG Configuration...",
    });

    try {
      const url =
        isIdAvailable === "new"
          ? `${import.meta.env.VITE_RAG_URL}/rag/configurations/configure/?user_id=${api_key}`
          : `${import.meta.env.VITE_RAG_URL}/rag/configurations/${isIdAvailable}`;
      const method = isIdAvailable === "new" ? "post" : "put";

      const response = await axios({
        method,
        url,
        data: jsonData,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": api_key,
        },
      });

      setIsIdAvailable(response.data.rag_id);
      setNewId(response.data.rag_id);

      reloadData(store);

      toast({
        title: "Success!",
        description:
          isIdAvailable === "new"
            ? "Your new RAG Store has been configured."
            : "Your RAG Store has been updated.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error!",
        description: "There was an issue with your request.",
      });
    }
  };

  const handleDeleteRequest = async () => {
    toast({
      title: "Deleting RAG Configuration...",
    });

    try {
      const url = `${import.meta.env.VITE_RAG_URL}/rag/configurations/${isIdAvailable}`;
      const response = await axios({
        method: "delete",
        url,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": api_key,
        },
      });

      console.log("Response:", response.data);
      setIsIdAvailable("new");
      setNewId("new");

      reloadData(store);

      toast({
        title: "Success!",
        description: "Your RAG Store has been deleted.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error!",
        description: "There was an issue with your request.",
      });
    }
  };

  return (
    <div className="col-span-1 lg:col-span-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="pt-4">{title}</CardTitle>
            <Button
              onClick={() => copyToClipboard(formattedJson, setIsJsonCopied)}
              type="button"
              variant="secondary"
            >
              <Copy size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <div className="max-h-96 overflow-auto">
              <pre className="whitespace-pre-wrap break-words">
                {formattedJson}
              </pre>
            </div>
          </div>
          <div className="flex justify-between pb-2 pt-6">
            <div>
              {!isNewItem && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="mr-2"
                      type="button"
                      variant={"destructive"}
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete this agent environment.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteRequest}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <Button
              onClick={() => handlePostRequest()}
              className="ml-2"
              type="button"
            >
              {isIdAvailable === "new" ? "Create" : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Jdisplay;
