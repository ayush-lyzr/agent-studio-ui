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
  endpoint,
  id,
  setNewId,
  setEnvSection,
  currentSection,
  isSingleSection,
  validateBeforeNext,
}: {
  title: string;
  jsonData: Object;
  endpoint: string;
  id: string;
  setNewId: CallableFunction;
  setEnvSection: CallableFunction;
  currentSection: number;
  isSingleSection: boolean;
  validateBeforeNext: () => boolean;
}) => {
  const [, setIsJsonCopied] = useState(false);
  const [isNewItem, setIsNewItem] = useState(id === "" || id === "new");
  const [currentJsonData, setCurrentJsonData] = useState(jsonData);
  const [currentId, setCurrentId] = useState(id);

  const api_key = useStore((state: any) => state.api_key);
  const base_url = useStore((state: any) => state.baseUrl);
  const store = useStore();

  useEffect(() => {
    setIsNewItem(id === "" || id === "new");
    setCurrentJsonData(jsonData);
    setCurrentId(id);
  }, [id, jsonData]);

  const copyToClipboard = (
    text: string,
    setIsCopied: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      toast({
        title: "Your configuration has been copied to clipboard!",
      });
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  const formattedJson = JSON.stringify(currentJsonData, null, 4);

  const handlePostRequest = async () => {
    toast({
      title: `${isNewItem ? "Creating" : "Updating"} Agent Environment...`,
    });

    try {
      const pathId = isNewItem ? "" : `/${currentId}`;
      const url = `${base_url}${endpoint}${pathId}`;
      const method = isNewItem ? "post" : "put";
      const response = await axios({
        method,
        url,
        data: currentJsonData,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": api_key,
        },
      });

      const newId = isNewItem
        ? url.includes("agents")
          ? response.data.agent_id
          : response.data.env_id
        : currentId;

      setCurrentId(newId);
      setNewId(newId);
      setIsNewItem(false);

      setCurrentJsonData((prevData) => ({
        ...prevData,
        _id: newId,
      }));

      reloadData(store);
      toast({
        title: "Success!",
        description: `Your Environment/Agent has been successfully ${isNewItem ? "created" : "updated"}.`,
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
      title: "Deleting Agent Environment...",
    });

    try {
      const pathId = `/${id}`;
      const url = `${base_url}${endpoint}${pathId}`;
      const response = await axios({
        method: "delete",
        url,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": api_key,
        },
      });

      console.log("Response:", response.data);
      reloadData(store);
      toast({
        title: "Success!",
        description: `Your environment/agent has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error!",
        description: "There was an issue with your request.",
      });
    }
  };

  const handleNext = () => {
    if (validateBeforeNext()) {
      if (currentSection < 2) {
        setEnvSection(currentSection + 1);
      } else {
        handlePostRequest();
      }
    } else {
    }
  };

  return (
    <div className="col-span-1 lg:col-span-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
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
            <div className="max-h-72 overflow-auto">
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
            <div>
              {!isSingleSection && currentSection > 0 && (
                <Button
                  onClick={() => {
                    if (currentSection > 0) {
                      setEnvSection(currentSection - 1);
                    }
                  }}
                  className="mr-2"
                  type="button"
                  variant={"secondary"}
                >
                  Back
                </Button>
              )}
              <Button onClick={handleNext} className="ml-2" type="button">
                {currentSection < 2 ? "Next" : isNewItem ? "Create" : "Update"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Jdisplay;
