import { Link } from "react-router-dom";
import { z, ZodSchema } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/custom/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import useStore from "@/lib/store";

interface FieldConfig {
  name: string;
  type: "input" | "select";
  options?: string[];
}

interface Config {
  [key: string]: FieldConfig;
}

const generateSchema = (config: Config): ZodSchema => {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const key in config) {
    if (config[key].type === "input") {
      shape[key] = z.string().min(1, `${config[key].name} is required`);
    } else {
      shape[key] = z.union([z.string().min(1), z.array(z.string()).min(1)]);
    }
  }
  return z.object(shape);
};

const Configure: React.FC<any> = ({ config, type, setModuleConfig }) => {
  const formSchema = generateSchema(config);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      Object.entries(config).map(([key, value]) => [
        key,
        (value as FieldConfig).type === "input" ? "" : [],
      ]),
    ),
    mode: "onChange",
  });

  const rags = useStore((state: any) => state.rags);

  function onSubmit(data: Record<string, string | string[]>) {
    const formattedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (key === "lyzr_rag") {
          const ragName = typeof value === "string" ? value : value[0];
          const ragId = rags.find((rag: any) => rag.name === ragName)?.id;
          return ["lyzr_rag", { value: ragName, rag_id: ragId }];
        }
        return [key, Array.isArray(value) ? value : [value]];
      }),
    );

    setModuleConfig(type, formattedData);
    toast({
      title: "Saved Module Config",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">
            {JSON.stringify(formattedData, null, 2)}
          </code>
        </pre>
      ),
    });
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="p-6">
            <div className="card-top-rectangle"></div>
            {Object.keys(config).map((fieldName) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config[fieldName].name}</FormLabel>
                    <FormControl>
                      {config[fieldName].type === "input" ? (
                        <Input
                          placeholder={`Enter ${config[fieldName].name}`}
                          {...field}
                        />
                      ) : (
                        <Select onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${config[fieldName].name}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {config[fieldName].options?.map((option: any) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-between pb-2 pt-6">
              {Object.keys(config).includes("lyzr_rag") && (
                <Link to="/rag">
                  <Button variant="secondary">Create new +</Button>
                </Link>
              )}
              <Button type="submit">Save</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Configure;
