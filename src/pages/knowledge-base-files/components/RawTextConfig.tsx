import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import type { FormData } from "./UploadWizard";
import {
  KB_UPLOAD_DISCLAIMER_ONE,
  KB_UPLOAD_DISCLAIMER_TWO,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";

interface RawTextConfigProps {
  form: UseFormReturn<FormData>;
  onContinue: () => void;
}

export default function RawTextConfig({
  form,
  onContinue,
}: RawTextConfigProps) {
  const rawText = form.watch("rawText");
  const canContinue = rawText && rawText.trim().length > 0;
  const characterCount = rawText?.length || 0;

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="rawText"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip tooltip="Enter any text content you want to process">
              Text Content
            </LabelWithTooltip>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Enter or paste your text content here..."
                className="min-h-[200px] resize-none text-sm"
                rows={8}
              />
            </FormControl>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {characterCount > 0
                  ? `${characterCount.toLocaleString()} characters`
                  : "No content entered"}
              </span>
              {characterCount > 10000 && (
                <span className="text-amber-600">
                  Large content may take longer to process
                </span>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="chunkSize"
          defaultValue={1000}
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                tooltip="The maximum number of tokens in each split segment of text. 
              Larger chunks keep more context together but may be harder to process."
              >
                Chunk size
              </LabelWithTooltip>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value || 1000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="chunkOverlap"
          defaultValue={100}
          render={({ field }) => (
            <FormItem>
              <LabelWithTooltip
                tooltip="The number of tokens repeated between consecutive chunks. 
              Overlap helps maintain context continuity across splits."
              >
                Chunk overlap
              </LabelWithTooltip>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value || 100}
                  placeholder="100"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="rounded-md bg-muted/50 p-4">
        <h4 className="mb-2 text-sm font-medium">
          Text Processing Information
        </h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Text will be automatically chunked for optimal retrieval</li>
          <li>• Formatting will be preserved where possible</li>
          <li>• Very long texts will be split into manageable sections</li>
          <li>• The source will be identified as "Raw Text Input"</li>
        </ul>
      </div>

      <div className="text-xxs text-muted-foreground">
        <p>{KB_UPLOAD_DISCLAIMER_ONE}</p>
        <p>{KB_UPLOAD_DISCLAIMER_TWO}</p>
      </div>

      <div className="flex justify-end pt-4">
        {/* <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button> */}
        <Button type="button" onClick={onContinue} disabled={!canContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}
