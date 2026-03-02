import React, { useState } from "react";
import mixpanel from "mixpanel-browser";
import { UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";
import { Edit, ExternalLink, Plus, Trash2, X, Zap } from "lucide-react";

import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { isDevEnv, isMixpanelActive, sampleJsonExample } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { AxiosResponse } from "axios";
import { OpenAISchemaValidator } from "./openapi-schema-validator";
import { ResponseFormatSchema } from "../schema";

type StructuredOutputFieldProps = {
  form: UseFormReturn<any, any>;
};

const StructuredOutputToolTip = () => (
  <>
    <span>
      "Define the desired JSON structure for the agent to follow in its
      response. Supports only JSON format."
    </span>
    <Link
      to="https://www.avanade.com/en-gb/services"
      target="_blank"
      className="ml-2 mt-3 inline-flex items-center text-link underline-offset-4 hover:underline"
      onClick={() => {
        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track("Docs-clicked", {
            feature: "Structured Output",
          });
      }}
    >
      Docs
      <ExternalLink className="ml-1 size-3" />
    </Link>
    <Link
      to="https://platform.openai.com/docs/guides/structured-outputs?api-mode=chat#supported-schemas"
      target="_blank"
      className="ml-1 mt-3 inline-flex items-center text-link underline-offset-4 hover:underline"
      onClick={() => {
        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track("Docs-clicked", {
            feature: "Structured Output",
          });
      }}
    >
      Reference
      <ExternalLink className="ml-1 size-3" />
    </Link>
  </>
);

export const StructuredOutputField: React.FC<StructuredOutputFieldProps> = ({
  form,
}) => {
  const input = form.watch("structured_output");

  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [structuredOpErrors, setStructuredOpErrors] = useState<{
    isValid: boolean;
    canSave: boolean;
    errors: string[];
  }>({
    isValid: true,
    canSave: false,
    errors: [],
  });

  const apiKey = useStore((state) => state.api_key);

  const onValidate = async (jsonString?: string) => {
    let json;
    try {
      json = JSON.parse(jsonString ?? input);
    } catch (error) {
      setStructuredOpErrors((prev) => ({
        ...prev,
        isValid: false,
      }));
    }

    const responseFormatResult = ResponseFormatSchema.safeParse(json);

    if (!responseFormatResult.success) {
      setStructuredOpErrors((prev) => ({
        ...prev,
        errors: responseFormatResult.error.errors.flatMap(
          (v) => `${v.code} : ${v.path} ${v.message}`,
        ),
        isValid: false,
      }));
    }

    const validator = new OpenAISchemaValidator();

    if (responseFormatResult?.success) {
      const schema = json?.schema ?? {};
      const result = validator.validate(schema);
      setStructuredOpErrors({
        ...result,
        canSave: result.isValid,
      });
    } else {
      console.error("Error validating structured output");
    }
  };

  const {
    mutateAsync: improveJson,
    isPending: isImprovingJson,
    isSuccess: isJsonImproved,
  } = useMutation({
    mutationFn: () =>
      axios.post(
        `/inference/chat/`,
        {
          user_id: "studio",
          agent_id: isDevEnv
            ? "689a14721b156ea05f9cf163"
            : "6863acc6c170c667f9869e1f",
          message: input,
          session_id: isDevEnv
            ? "689a14721b156ea05f9cf163-39dcbvdpbxy"
            : "6863acc6c170c667f9869e1f-qxd8h10qud",
        },
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      ),
    onSuccess: (res: AxiosResponse) => {
      form.setValue("structured_output", res.data?.response);
      onValidate(res.data?.response);
    },
  });

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setFormVisible(true);
  };

  const handleEdit = () => {
    setFormVisible(true);
  };

  const handleDelete = () => {
    form.setValue("structured_output", null);
  };

  return (
    <div className="col-span-4">
      <FormField
        control={form.control}
        name="structured_output"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                <LabelWithTooltip
                  align="start"
                  tooltip={<StructuredOutputToolTip />}
                  className="inline-flex items-center"
                >
                  <p>Structured Output (JSON)</p>
                </LabelWithTooltip>
              </FormLabel>
              {!input && (
                <Button size="sm" variant="outline" onClick={handleAdd}>
                  <Plus className="mr-1 size-4" />
                  Add
                </Button>
              )}
              <Dialog open={formVisible} onOpenChange={setFormVisible}>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>
                      <LabelWithTooltip
                        align="start"
                        tooltip={<StructuredOutputToolTip />}
                        className="inline-flex items-center"
                      >
                        <p>Structured Output (JSON)</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="m-0 h-3.5 text-link"
                          onClick={(e) => {
                            e.preventDefault();
                            form.setValue(
                              "structured_output",
                              JSON.stringify(sampleJsonExample, null, 2),
                              { shouldDirty: true },
                            );
                          }}
                        >
                          See sample
                        </Button>
                      </LabelWithTooltip>
                    </DialogTitle>
                    <DialogDescription>
                      Requires JSON schema format. Clicking on "Fix using AI"
                      helps in converting to desired format.
                    </DialogDescription>
                  </DialogHeader>

                  <FormControl>
                    <Textarea
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setStructuredOpErrors({
                          ...structuredOpErrors,
                          canSave: false,
                        });
                      }}
                      placeholder="Provide an example of structured output. The agent will respond in the given structured format."
                      rows={20}
                      className={cn(
                        "text-pretty",
                        isJsonImproved && "success-glow",
                        isImprovingJson && "pointer-events-none",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                  <table className="grid max-h-32 grid-cols-1 gap-2 overflow-y-auto">
                    {structuredOpErrors?.errors?.map((error) => (
                      <tr key={error}>
                        <td>
                          <X className="mr-2 size-3 text-destructive" />
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {error}
                        </td>
                      </tr>
                    ))}
                  </table>
                  <DialogFooter>
                    {!structuredOpErrors?.isValid && (
                      <Button
                        variant="outline"
                        loading={isImprovingJson}
                        disabled={!Boolean(input?.length)}
                        onClick={() => improveJson()}
                      >
                        <Zap className="mr-1 size-3" />
                        Fix using AI
                      </Button>
                    )}
                    {structuredOpErrors?.canSave ? (
                      <DialogClose className={buttonVariants()}>
                        Save
                      </DialogClose>
                    ) : (
                      <Button
                        disabled={!Boolean(input?.length)}
                        onClick={() => onValidate()}
                      >
                        Validate
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      {input && (
        <div className="mt-1 flex items-center justify-between bg-secondary p-2">
          <p className="line-clamp-2 w-4/5  text-sm text-muted-foreground">
            {input}
          </p>
          <div className="flex items-center gap-4">
            <Edit className="size-4 cursor-pointer" onClick={handleEdit} />
            <Trash2
              className="size-4 cursor-pointer text-destructive"
              onClick={handleDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
};
