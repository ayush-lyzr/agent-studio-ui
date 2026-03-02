import axios from "axios";
import mixpanel from "mixpanel-browser";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Select from "react-select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as RadixSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CurrentUserProps } from "@/lib/types";
import { isMixpanelActive, MARKETPLACE_URL } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

interface FormProps {
  data: FormData;
  setData: (data: Partial<FormData>) => void;
  agents: Array<{ id: string; name: string }>;
}

const CreateApp: React.FC<FormProps & Partial<CurrentUserProps>> = ({
  setData,
  agents,
  currentUser,
  userId,
}) => {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const token = getToken();

  const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    creator: z
      .string()
      .default(
        currentUser?.customFields?.["first-name"] ??
          currentUser?.auth?.email ??
          "x",
      ),
    user_id: z.string(),
    agent_id: z.string(),
    public: z.boolean(),
    categories: z.array(z.string()).nullable(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: userId,
      creator: currentUser?.auth?.email || "",
      public: false,
    },
  });

  const handleChange = (field: keyof FormData, value: any) => {
    setData({ [field]: value });
  };

  const onSubmit = async (formData: FormData) => {
    try {
      const response = await axios.post("/app/", formData, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("App created successfully:", response.data);
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("App created", response.data);
      toast({
        title: "Success!",
        description:
          "Agent created successfully. Please check the Agent Marketplace.",
      });
    } catch (error) {
      console.error("Error creating app:", error);
      toast({
        title: "Error!",
        description: "Failed to create the agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TabsContent value="create_app" className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log(errors);
          })}
        >
          <div className="mt-8 px-8 ">
            <div>
              <p className="text-muted-foreground">
                Publish your Agent as an app.
              </p>
            </div>
            <div className="card-top-rectangle mt-8"></div>
            <div className="space-y-6">
              {/* Agent Select Field */}
              <div className="flex flex-wrap md:flex-nowrap">
                <div className="mr-16">
                  <FormField
                    control={form.control}
                    name="agent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select your agent:</FormLabel>
                        <FormControl>
                          <RadixSelect
                            onValueChange={(val) => {
                              field.onChange(val);
                              handleChange("agent_id", val);
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Agents</SelectLabel>
                                {agents.map((agent: any) => (
                                  <SelectItem
                                    key={agent["id"]}
                                    value={agent["id"]}
                                  >
                                    {agent.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </RadixSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Public Switch */}
                <Controller
                  name="public"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <div className="mt-10 flex items-center">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) => {
                              field.onChange(value);
                              handleChange("public", value);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="ml-2">
                          Make your app public
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Name and Creator Fields */}
              <div className="flex flex-wrap gap-4 md:flex-nowrap">
                <div className="w-full md:w-1/2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Name:</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter name"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleChange("name", e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full md:w-1/2">
                  <FormField
                    control={form.control}
                    name="creator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creator:</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter creator's name"
                            {...field}
                            disabled
                            onChange={(e) => {
                              field.onChange(e);
                              handleChange("creator", e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Categories Multi-Select Field */}
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories:</FormLabel>
                    <FormControl>
                      <Select
                        isMulti
                        options={[
                          { value: "productivity", label: "Productivity" },
                          { value: "communication", label: "Communication" },
                          { value: "entertainment", label: "Entertainment" },
                          { value: "utility", label: "Utility" },
                          { value: "finance", label: "Finance" },
                          { value: "travel", label: "Travel" },
                        ]}
                        value={field.value?.map((val) => ({
                          value: val,
                          label: val,
                        }))}
                        onChange={(selectedOptions) => {
                          const values = selectedOptions.map(
                            (option) => option.value,
                          );
                          field.onChange(values);
                          handleChange("categories", values);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description:</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Enter description"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleChange("description", e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </TabsContent>
  );
};

export default CreateApp;
