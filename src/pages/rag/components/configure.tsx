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
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";

interface Config {
  [key: string]: string;
}

const generateSchema = (config: Config): ZodSchema => {
  const shape: Record<string, z.ZodString> = {};
  for (const key in config) {
    shape[key] = z.string().nonempty({ message: `${key} is required` });
  }
  return z.object(shape);
};

const Configure: React.FC<any> = ({ config, type, setModuleConfig }) => {
  const formSchema = generateSchema(config);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: config,
    mode: "onChange",
  });

  function onSubmit(data: Record<string, string>) {
    setModuleConfig(type, data);
    toast({
      title: "Saved Module Config",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
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
                    <FormLabel>{fieldName}</FormLabel>
                    <FormControl>
                      <Input placeholder={`Enter ${fieldName}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex justify-end pb-2 pt-6">
              <Button type="submit">Save</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Configure;
