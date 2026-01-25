"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ModalShell } from "@/components/ui/modal-shell";
import { DialogFooter } from "@/components/ui/dialog";
import { FormField } from "@/components/admin/forms/FormField";
import { ShadowInput } from "@/components/admin/forms/ShadowInput";
import { ShadowButton } from "@/components/admin/forms/ShadowButton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/forms/AdminSelect";
import { Loader2, Code, Key, Maximize2, Settings } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSitemap } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Workflow } from "../types";
import { PresetsList } from "./PresetsList";

const workflowSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  estimated_cost: z.number().nullable().optional(),
  estimated_time_minutes: z.number().int().nullable().optional(),
  input_schema: z.string().optional(), // JSON as string
  enabled: z.boolean(),
  default_ai_model: z.string().min(1),
});

type WorkflowFormData = z.infer<typeof workflowSchema>;

type EditWorkflowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: Workflow | null; // null for creating new workflow
  onSuccess?: () => void;
};

const AI_MODELS = [
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-haiku-4.5",
  "google/gemini-3-flash-preview",
  "google/gemini-3-pro-preview",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "openai/gpt-5-mini",
  "openai/gpt-5.2",
];

export function EditWorkflowModal({
  open,
  onOpenChange,
  workflow: initialWorkflow,
  onSuccess,
}: EditWorkflowModalProps) {
  const isNew = !initialWorkflow;
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [hasSecrets, setHasSecrets] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [config, setConfig] = useState("");
  const [inputSchemaError, setInputSchemaError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isInputSchemaFullscreen, setIsInputSchemaFullscreen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      enabled: true,
      default_ai_model: "anthropic/claude-haiku-4.5",
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Initialize form and fetch related data when modal opens
  useEffect(() => {
    if (open) {
      if (initialWorkflow) {
        // Set form values from initial workflow
        reset({
          slug: initialWorkflow.slug || "",
          name: initialWorkflow.name || "",
          description: initialWorkflow.description || "",
          icon: initialWorkflow.icon || "",
          estimated_cost: initialWorkflow.estimated_cost ?? null,
          estimated_time_minutes: initialWorkflow.estimated_time_minutes ?? null,
          input_schema: initialWorkflow.input_schema
            ? JSON.stringify(initialWorkflow.input_schema, null, 2)
            : "",
          enabled: initialWorkflow.enabled !== undefined ? initialWorkflow.enabled : true,
          default_ai_model: initialWorkflow.default_ai_model || "anthropic/claude-haiku-4.5",
        });
        fetchSecrets();
      } else {
        // Reset to defaults for new workflow
        reset({
          slug: "",
          name: "",
          description: "",
          icon: "",
          estimated_cost: null,
          estimated_time_minutes: null,
          input_schema: "",
          enabled: true,
          default_ai_model: "anthropic/claude-haiku-4.5",
        });
      }
    }
  }, [open, initialWorkflow, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
      setWebhookUrl("");
      setApiKey("");
      setConfig("");
      setHasSecrets(false);
      setIsInputSchemaFullscreen(false);
      setActiveTab("details");
    }
  }, [open, reset]);

  // Auto-generate slug from name
  useEffect(() => {
    if (open && nameValue && (isNew || !slugValue || slugValue === "")) {
      const autoSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (autoSlug !== slugValue) {
        setValue("slug", autoSlug, { shouldValidate: false });
      }
    }
  }, [nameValue, setValue, isNew, slugValue, open]);

  const fetchSecrets = async () => {
    if (!initialWorkflow) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/workflows/${initialWorkflow.id}/secrets`, {
        method: "GET",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch secrets");
        return;
      }

      const data = await response.json();
      
      if (data.exists && data.webhook_url) {
        setHasSecrets(true);
        setWebhookUrl(data.webhook_url || "");
        setApiKey(""); // Don't populate masked value
        setConfig(data.config ? JSON.stringify(data.config, null, 2) : "");
      }
    } catch (error) {
      console.error("Error loading secrets:", error);
    }
  };

  const formatJSON = (jsonString: string): string => {
    if (!jsonString.trim()) return "";
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      toast.error("Invalid JSON format");
      return jsonString;
    }
  };

  const handleFormatInputSchema = () => {
    const currentValue = watch("input_schema") || "";
    const formatted = formatJSON(currentValue);
    if (formatted !== currentValue) {
      setValue("input_schema", formatted, { shouldValidate: false });
      setInputSchemaError(null);
    }
  };

  const handleFormatConfig = () => {
    const formatted = formatJSON(config);
    if (formatted !== config) {
      setConfig(formatted);
      setConfigError(null);
    }
  };

  const parseErrorResponse = async (response: Response): Promise<string> => {
    try {
      const text = await response.text();
      console.log("=== CLIENT: Raw error response text ===", text);
      
      if (!text) {
        return `Server returned ${response.status} ${response.statusText}`;
      }
      try {
        const json = JSON.parse(text);
        console.log("=== CLIENT: Parsed error JSON ===", json);
        
        // If there are validation details, format them nicely
        if (json.details) {
          const detailsStr = JSON.stringify(json.details, null, 2);
          return `${json.error}\n\nValidation details:\n${detailsStr}`;
        }
        
        return json.error || json.message || text;
      } catch {
        return text || `Server returned ${response.status} ${response.statusText}`;
      }
    } catch {
      return `Server returned ${response.status} ${response.statusText}`;
    }
  };

  const onSubmit = async (data: WorkflowFormData) => {
    try {
      // Validate JSON fields
      let parsedInputSchema = null;
      if (data.input_schema?.trim()) {
        try {
          const parsed = JSON.parse(data.input_schema);
          // If the parsed JSON is an object with a single "input_schema" key, unwrap it
          // This handles cases where users paste {"input_schema": [...]} instead of just [...]
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "input_schema" in parsed && Object.keys(parsed).length === 1) {
            parsedInputSchema = parsed.input_schema;
          } else {
            parsedInputSchema = parsed;
          }
        } catch (e) {
          setInputSchemaError("Invalid JSON format");
          return;
        }
      }

      let parsedConfig = null;
      if (config.trim()) {
        try {
          parsedConfig = JSON.parse(config);
        } catch (e) {
          setConfigError("Invalid JSON format");
          return;
        }
      }

      // Validate webhook URL if provided
      if (webhookUrl.trim()) {
        try {
          new URL(webhookUrl.trim());
        } catch {
          toast.error("Webhook URL must be a valid URL");
          return;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const payload: Record<string, any> = {
        slug: data.slug.trim(),
        name: data.name.trim(),
        enabled: data.enabled,
        default_ai_model: data.default_ai_model.trim(),
      };

      // Only include optional fields if they have values
      if (data.description?.trim()) {
        payload.description = data.description.trim();
      } else {
        payload.description = null;
      }

      if (data.icon?.trim()) {
        payload.icon = data.icon.trim();
      } else {
        payload.icon = null;
      }

      if (data.estimated_cost !== null && data.estimated_cost !== undefined) {
        payload.estimated_cost = data.estimated_cost;
      } else {
        payload.estimated_cost = null;
      }

      if (data.estimated_time_minutes !== null && data.estimated_time_minutes !== undefined) {
        payload.estimated_time_minutes = data.estimated_time_minutes;
      } else {
        payload.estimated_time_minutes = null;
      }

      // Only include input_schema if it's not null/undefined
      if (parsedInputSchema !== null && parsedInputSchema !== undefined) {
        payload.input_schema = parsedInputSchema;
      } else {
        payload.input_schema = null;
      }

      let result;
      if (isNew) {
        const response = await fetch("/api/admin/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorMessage = await parseErrorResponse(response);
          throw new Error(errorMessage || "Failed to create workflow");
        }

        result = await response.json();
        toast.success("Workflow created successfully");

        // Save secrets if provided
        if (webhookUrl.trim()) {
          await fetch(`/api/admin/workflows/${result.id}/secrets`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              webhook_url: webhookUrl.trim(),
              api_key: apiKey.trim() || null,
              config: parsedConfig,
            }),
          });
        }
      } else {
        const updatePayload = {
          id: initialWorkflow.id,
          ...payload,
        };
        
        console.log("=== CLIENT: Sending PUT request ===");
        console.log("Workflow ID:", initialWorkflow.id);
        console.log("Full payload:", JSON.stringify(updatePayload, null, 2));
        
        const response = await fetch("/api/admin/workflows", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(updatePayload),
        });

        console.log("=== CLIENT: Response status ===", response.status);

        if (!response.ok) {
          const errorMessage = await parseErrorResponse(response);
          console.error("=== CLIENT: Error response ===", errorMessage);
          throw new Error(errorMessage || "Failed to update workflow");
        }

        result = await response.json();
        console.log("=== CLIENT: Success ===", result);
        toast.success("Workflow updated successfully");

        // Save secrets if provided
        if (webhookUrl.trim()) {
          await fetch(`/api/admin/workflows/${initialWorkflow.id}/secrets`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              webhook_url: webhookUrl.trim(),
              api_key: apiKey.trim() || null,
              config: parsedConfig,
            }),
          });
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isNew ? "creating" : "updating"} workflow:`, error);
      toast.error(error.message || `Failed to ${isNew ? "create" : "update"} workflow`);
    }
  };

  if (isLoading) {
    return (
      <ModalShell
        open={open}
        onOpenChange={onOpenChange}
        title={initialWorkflow?.name || "Edit Workflow"}
        titleIcon={<FontAwesomeIcon icon={faSitemap} className="w-5 h-5 md:w-6 md:h-6" />}
        description="Select a workflow and configure your analysis"
        maxWidth="4xl"
        maxHeight="90vh"
        showScroll={true}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={watch("name") || initialWorkflow?.name || (isNew ? "Create New Workflow" : "Edit Workflow")}
      titleIcon={<FontAwesomeIcon icon={faSitemap} className="w-5 h-5 md:w-6 md:h-6" />}
      description="Select a workflow and configure your analysis"
      footer={
        activeTab === "details" ? (
          <DialogFooter>
            <ShadowButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </ShadowButton>
            <ShadowButton type="submit" form="workflow-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isNew ? "Create Workflow" : "Save Changes"
              )}
            </ShadowButton>
          </DialogFooter>
        ) : undefined
      }
      maxWidth="4xl"
      maxHeight="90vh"
      showScroll={true}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">
            <Settings className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="secrets">
            <Key className="h-4 w-4 mr-2" />
            Secrets
          </TabsTrigger>
          <TabsTrigger value="presets" disabled={isNew}>
            Presets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <form id="workflow-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <FormField label="Name" required error={errors.name?.message}>
            <ShadowInput
              {...register("name")}
              placeholder="e.g., Niche Intelligence, Content Generation"
            />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <ShadowInput
              {...register("slug")}
              placeholder="e.g., niche-intelligence, content-generation"
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register("description")}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="resize-none"
            />
          </FormField>

          <FormField label="Icon" error={errors.icon?.message}>
            <ShadowInput
              {...register("icon")}
              placeholder="e.g., 📊, 👥"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estimated Cost" error={errors.estimated_cost?.message}>
              <ShadowInput
                type="number"
                step="0.01"
                {...register("estimated_cost", { valueAsNumber: true })}
                placeholder="e.g., 10.50"
              />
            </FormField>

            <FormField label="Estimated Time (minutes)" error={errors.estimated_time_minutes?.message}>
              <ShadowInput
                type="number"
                {...register("estimated_time_minutes", { valueAsNumber: true })}
                placeholder="e.g., 30"
              />
            </FormField>
          </div>

          <FormField label="Default AI Model" required error={errors.default_ai_model?.message}>
            <Select
              value={watch("default_ai_model")}
              onValueChange={(value) => setValue("default_ai_model", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Input Schema (JSON)"
            error={inputSchemaError || errors.input_schema?.message}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Define the input fields for this workflow
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInputSchemaFullscreen(true)}
                    className="h-7 text-xs"
                    title="Open in full screen"
                  >
                    <Maximize2 className="h-3 w-3 mr-1.5" />
                    Full Screen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFormatInputSchema}
                    className="h-7 text-xs"
                  >
                    <Code className="h-3 w-3 mr-1.5" />
                    Format JSON
                  </Button>
                </div>
              </div>
              <Textarea
                {...register("input_schema")}
                placeholder='{"field1": "text", "field2": "textarea"}'
                rows={8}
                className="resize-none font-mono text-sm"
                onChange={(e) => {
                  setValue("input_schema", e.target.value, { shouldValidate: false });
                  setInputSchemaError(null);
                }}
              />
            </div>
          </FormField>

          {/* Full Screen Input Schema Modal */}
          <ModalShell
            open={isInputSchemaFullscreen}
            onOpenChange={setIsInputSchemaFullscreen}
            title="Input Schema Editor"
            maxWidth="6xl"
            maxHeight="90vh"
            showScroll={true}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Edit the input schema JSON. Changes are saved when you close this editor.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentValue = watch("input_schema") || "";
                    const formatted = formatJSON(currentValue);
                    if (formatted !== currentValue) {
                      setValue("input_schema", formatted, { shouldValidate: false });
                      setInputSchemaError(null);
                    }
                  }}
                  className="h-7 text-xs"
                >
                  <Code className="h-3 w-3 mr-1.5" />
                  Format JSON
                </Button>
              </div>
              <Textarea
                value={watch("input_schema") || ""}
                placeholder='{"field1": "text", "field2": "textarea"}'
                rows={35}
                className="resize-none font-mono text-sm w-full min-h-[80vh]"
                onChange={(e) => {
                  setValue("input_schema", e.target.value, { shouldValidate: false });
                  setInputSchemaError(null);
                }}
              />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInputSchemaFullscreen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </ModalShell>

          <FormField label="Status" error={errors.enabled?.message}>
            <Select
              value={watch("enabled") ? "enabled" : "disabled"}
              onValueChange={(value) => setValue("enabled", value === "enabled")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

          </form>
        </TabsContent>

        <TabsContent value="secrets" className="mt-4">
          <div className="space-y-4">
            {hasSecrets && initialWorkflow && webhookUrl && (
              <Card className="p-4 bg-muted/30">
                <FormField label="Webhook URL">
                  <ShadowInput
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The n8n webhook endpoint URL for this workflow
                  </p>
                </FormField>
              </Card>
            )}

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Secrets Configuration</span>
                  {hasSecrets && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/10 text-green-600 dark:text-green-400">
                      Configured
                    </span>
                  )}
                </div>

                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>Security Notice:</strong> These secrets are stored securely and never exposed.
                  Enter new values to update them.
                </div>

                <FormField label="Webhook URL" required>
                  <ShadowInput
                    type="url"
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    autoComplete="url"
                    name="webhook_url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The n8n webhook endpoint URL for this workflow
                  </p>
                </FormField>

                <FormField label="API Key (optional)">
                  <ShadowInput
                    type="text"
                    placeholder="Enter API key if needed"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="one-time-code"
                    name="api_key"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional API key for authentication
                  </p>
                </FormField>

                <FormField label="Config (JSON, optional)" error={configError || undefined}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleFormatConfig}
                        className="h-7 text-xs"
                      >
                        <Code className="h-3 w-3 mr-1.5" />
                        Format JSON
                      </Button>
                    </div>
                    <Textarea
                      placeholder='{"key": "value"}'
                      rows={6}
                      className="resize-none font-mono text-sm"
                      value={config}
                      onChange={(e) => {
                        setConfig(e.target.value);
                        setConfigError(null);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Additional configuration as JSON object
                    </p>
                  </div>
                </FormField>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="presets" className="mt-4">
          {initialWorkflow ? (
            <PresetsList workflowId={initialWorkflow.id} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                Save the workflow first to manage presets.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ModalShell>
  );
}
