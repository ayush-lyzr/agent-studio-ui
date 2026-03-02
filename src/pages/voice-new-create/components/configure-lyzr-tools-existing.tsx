import { useEffect, useMemo, useRef, type ComponentProps } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";

import ToolsSection from "@/pages/create-agent/components/tools-section";
import type { LyzrToolConfig } from "@/lib/livekit/types";
import type { VoiceNewCreateFormValues } from "./types";

type ToolRow = {
  name: string;
  usage_description: string;
  tool_source?: string;
  server_id?: string;
  persist_auth?: boolean;
  provider_uuid?: string;
  credential_id?: string;
};

function flattenLyzrTools(
  configs: LyzrToolConfig[] | undefined | null,
): ToolRow[] {
  const input = Array.isArray(configs) ? configs : [];
  const out: ToolRow[] = [];
  for (const cfg of input) {
    const toolName = (cfg.tool_name ?? "").trim();
    const toolSource = (cfg.tool_source ?? "").trim();
    if (!toolName || !toolSource) continue;
    const actions = Array.isArray(cfg.action_names) ? cfg.action_names : [];
    for (const action of actions) {
      const actionName = String(action ?? "").trim();
      if (!actionName) continue;
      out.push({
        name: toolName,
        usage_description: actionName,
        tool_source: toolSource,
        server_id: cfg.server_id ?? undefined,
        persist_auth: Boolean(cfg.persist_auth),
        provider_uuid: cfg.provider_uuid ?? undefined,
        credential_id: cfg.credential_id ?? undefined,
      });
    }
  }
  return out;
}

function groupToolRows(rows: ToolRow[] | undefined | null): LyzrToolConfig[] {
  const input = Array.isArray(rows) ? rows : [];
  const map = new Map<string, LyzrToolConfig>();

  for (const row of input) {
    const tool_name = (row.name ?? "").trim();
    const tool_source = (row.tool_source ?? "").trim();
    const action = (row.usage_description ?? "").trim();
    if (!tool_name || !tool_source || !action) continue;

    const server_id = row.server_id?.trim() || undefined;
    const provider_uuid = row.provider_uuid?.trim() || undefined;
    const credential_id = row.credential_id?.trim() || undefined;
    const persist_auth = Boolean(row.persist_auth);

    const key = [
      tool_name,
      tool_source,
      server_id ?? "",
      provider_uuid ?? "",
      credential_id ?? "",
    ].join("|");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        tool_name,
        tool_source,
        action_names: [action],
        persist_auth,
        ...(server_id ? { server_id } : {}),
        ...(provider_uuid ? { provider_uuid } : {}),
        ...(credential_id ? { credential_id } : {}),
      });
      continue;
    }

    if (!existing.action_names.includes(action)) {
      existing.action_names.push(action);
    }
    // If any row wants creator creds, keep it true.
    if (persist_auth) {
      existing.persist_auth = true;
    }
  }

  return [...map.values()];
}

/**
 * Wrapper that reuses the existing agent-create `ToolsSection` UI, but syncs its
 * internal `tools` array into the voice-new `lyzr_tools` field.
 *
 * This avoids clobbering voice-new's `tools: string[]` (built-in LiveKit tool IDs).
 */
export default function ConfigureLyzrToolsExisting({
  form,
}: {
  form: UseFormReturn<VoiceNewCreateFormValues>;
}) {
  const innerForm = useForm<{ tools: ToolRow[] }>({
    defaultValues: { tools: [] },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const parentLyzrTools = useWatch({
    control: form.control,
    name: "lyzr_tools",
  }) as LyzrToolConfig[] | undefined;

  const innerTools = useWatch({
    control: innerForm.control,
    name: "tools",
  }) as ToolRow[] | undefined;

  const lastParentSync = useRef<string>("");
  const lastInnerSync = useRef<string>("");

  // Parent -> inner (hydrate/edit existing saved agent)
  useEffect(() => {
    const flat = flattenLyzrTools(parentLyzrTools);
    const sig = JSON.stringify(flat);
    if (sig === lastParentSync.current) return;
    lastParentSync.current = sig;
    innerForm.setValue("tools", flat, { shouldDirty: false });
  }, [innerForm, parentLyzrTools]);

  // Inner -> parent (user edits tool configs)
  useEffect(() => {
    const grouped = groupToolRows(innerTools);
    const sig = JSON.stringify(grouped);
    if (sig === lastInnerSync.current) return;
    lastInnerSync.current = sig;

    form.setValue("lyzr_tools", grouped, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
    form.trigger?.("lyzr_tools");
  }, [form, innerTools]);

  // ToolsSection expects a partial agent; not used for our case here.
  const agent = useMemo<ComponentProps<typeof ToolsSection>["agent"]>(
    () => ({}),
    [],
  );

  return (
    <ToolsSection
      form={
        innerForm as unknown as ComponentProps<typeof ToolsSection>["form"]
      }
      agent={agent}
    />
  );
}
