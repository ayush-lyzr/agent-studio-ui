import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/custom/button";
import { toast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";

const FormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
});

const UploadedDocs = ({ ragId }: { ragId: string }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = useStore((state) => state.api_key);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [],
    },
  });

  const fetchDocs = useCallback(async () => {
    if (!ragId) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_RAG_URL}/rag/${ragId}/docs`,
        { headers: { "x-api-key": apiKey } },
      );
      setDocs(response.data[0].docs);
    } catch (err) {
      setError("Failed to fetch documents");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [ragId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: "Deleting documents...",
    });
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_RAG_URL}/rag/${ragId}/docs`,
        { data: data.items, headers: { "x-api-key": apiKey } },
      );
      if (response.status === 200) {
        toast({
          title: "Documents deleted successfully",
        });
        fetchDocs();
      } else {
        toast({
          title: "Failed to delete documents",
          description: response.data.message,
        });
      }
    } catch (err: any) {
      toast({
        title: "Failed to delete documents",
        description: err.message,
      });
    }
  }

  return (
    <div className="flex h-full flex-col px-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center justify-between">
          <h1 className="my-4 mt-10 font-bold">Uploaded Data</h1>
          {!loading && docs && (
            <div className="my-4 ml-6 mt-10 text-gray-500">
              {docs.length === 1
                ? "1 document found"
                : `${docs.length} documents found`}
            </div>
          )}
        </div>
        <Button
          onClick={fetchDocs}
          variant="outline"
          size="icon"
          className="mt-4 h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full max-h-[44rem] flex-col overflow-auto"
      >
        <div
          className="mb-4 flex-grow overflow-y-auto"
          style={{ minHeight: "200px" }}
        >
          {loading ? (
            <>
              <Skeleton className="mb-5 h-4 w-[250px]" />
              <Skeleton className="mb-5 h-4 w-[250px]" />
              <Skeleton className="mb-5 h-4 w-[250px]" />
              <Skeleton className="mb-5 h-4 w-[250px]" />
            </>
          ) : error ? (
            <div>Error: {error}</div>
          ) : docs.length === 0 ? (
            <div>No documents uploaded yet.</div>
          ) : (
            <ul>
              {docs.map((name) => (
                <li key={name} className="mb-4">
                  <Checkbox
                    id={name}
                    checked={form.watch("items").includes(name)}
                    onCheckedChange={(checked) =>
                      checked
                        ? form.setValue("items", [
                            ...form.getValues("items"),
                            name,
                          ])
                        : form.setValue(
                            "items",
                            form
                              .getValues("items")
                              .filter((item) => item !== name),
                          )
                    }
                  />
                  <label className="mx-4">{name}</label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-[27rem] flex justify-end border-t pt-4">
          <Button
            type="submit"
            variant="destructive"
            disabled={form.watch("items").length === 0}
          >
            Delete
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadedDocs;
