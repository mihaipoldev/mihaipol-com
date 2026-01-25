import { NextRequest, NextResponse } from "next/server";
import { createWorkflowRun } from "@/features/workflows/mutations";
import { getWorkflowById, getWorkflowSecrets } from "@/features/workflows/data";
import { executeAutomation } from "@/features/automations/registry";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Define schema inline to avoid potential Zod import caching issues
function validateRequestBody(json: any): { success: true; data: { entity_type: string; entity_id: string; input_data: Record<string, any> } } | { success: false; error: string } {
  // Manual validation instead of Zod to avoid "_zod" errors
  if (!json || typeof json !== "object") {
    return { success: false, error: "Request body must be an object" };
  }
  
  if (typeof json.entity_type !== "string" || !json.entity_type) {
    return { success: false, error: "entity_type must be a non-empty string" };
  }
  
  if (typeof json.entity_id !== "string" || !json.entity_id) {
    return { success: false, error: "entity_id must be a non-empty string" };
  }
  
  // Validate UUID format for entity_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(json.entity_id)) {
    return { success: false, error: "entity_id must be a valid UUID" };
  }
  
  if (!json.input_data || typeof json.input_data !== "object" || Array.isArray(json.input_data)) {
    return { success: false, error: "input_data must be an object" };
  }
  
  return {
    success: true,
    data: {
      entity_type: json.entity_type,
      entity_id: json.entity_id,
      input_data: json.input_data,
    },
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
): Promise<Response> {
  // Wrap everything in a try-catch to prevent Next.js from trying to serialize Zod errors
  try {
    return await handleWorkflowRun(request, params);
  } catch (outerError: any) {
    // Ultimate fallback - catch any error that wasn't caught by inner handlers
    console.error("[Workflow Run API] ====== OUTER CATCH ======");
    console.error("[Workflow Run API] Unhandled error:", outerError);
    
    // Create a completely clean error response
    const cleanMessage = typeof outerError?.message === "string" 
      ? outerError.message 
      : "An unexpected error occurred";
    
    return NextResponse.json(
      { 
        error: "Failed to create workflow run", 
        details: { message: cleanMessage } 
      },
      { status: 500 }
    );
  }
}

async function handleWorkflowRun(
  request: NextRequest,
  params: Promise<{ workflow_id: string }>
): Promise<Response> {
  try {
    console.log("[Workflow Run API] ====== START ======");
    
    let guard;
    try {
      guard = await requireAdmin(request);
      // Check if guard is a Response object (error case)
      if (guard instanceof Response) {
        console.log("[Workflow Run API] Auth guard failed - returning guard response");
        return guard;
      }
      // Check if guard is the success object
      if (guard && typeof guard === "object" && "ok" in guard && guard.ok === true) {
        console.log("[Workflow Run API] Auth check passed");
      } else {
        console.error("[Workflow Run API] Unexpected guard response:", guard);
        return serverError("Authentication failed", "Unexpected authentication response");
      }
    } catch (authError: any) {
      console.error("[Workflow Run API] Auth error:", authError?.message);
      return serverError("Authentication failed", authError?.message || "Unknown auth error");
    }

    let workflow_id: string;
    try {
      const paramsData = await params;
      workflow_id = paramsData.workflow_id;
      console.log("[Workflow Run API] Workflow ID from params:", workflow_id);
    } catch (paramsError: any) {
      console.error("[Workflow Run API] Error getting params:", paramsError);
      return serverError("Invalid request parameters", paramsError?.message || "Failed to parse route parameters");
    }

    let json: any;
    try {
      json = await request.json();
      console.log("[Workflow Run API] Request body parsed successfully");
      console.log("[Workflow Run API] Request body keys:", Object.keys(json));
    } catch (parseError: any) {
      console.error("[Workflow Run API] Failed to parse request body:", parseError?.message);
      return badRequest("Invalid JSON in request body", { message: parseError?.message || "Invalid JSON" });
    }

    // Validate request body using manual validation instead of Zod
    const validated = validateRequestBody(json);
    if (!validated.success) {
      console.error("[Workflow Run API] Validation failed:", validated.error);
      return badRequest("Invalid payload", { message: validated.error });
    }
    console.log("[Workflow Run API] Validation passed");

    const { entity_type, entity_id, input_data } = validated.data;
    console.log("[Workflow Run API] Parsed data:", {
      entity_type,
      entity_id,
      input_data_keys: Object.keys(input_data),
    });
    
    // Safely log input_data
    try {
      const inputDataStr = JSON.stringify(input_data, null, 2);
      console.log("[Workflow Run API] Input data:", inputDataStr);
    } catch (stringifyError: any) {
      console.warn("[Workflow Run API] Could not stringify input_data:", stringifyError?.message);
      console.log("[Workflow Run API] Input data keys only:", Object.keys(input_data));
    }

    // 1. Get workflow by ID
    console.log("[Workflow Run API] Fetching workflow by ID:", workflow_id);
    let workflow;
    try {
      workflow = await getWorkflowById(workflow_id);
      if (!workflow) {
        console.error("[Workflow Run API] Workflow not found:", workflow_id);
        return badRequest("Workflow not found");
      }
      console.log("[Workflow Run API] Workflow found:", {
        id: workflow.id,
        slug: workflow.slug,
        name: workflow.name,
        enabled: workflow.enabled,
      });
    } catch (workflowError: any) {
      console.error("[Workflow Run API] Error fetching workflow:", workflowError?.message);
      return serverError("Failed to fetch workflow", workflowError?.message || "Database error");
    }

    // 2. Check if workflow is enabled
    if (!workflow.enabled) {
      console.error("[Workflow Run API] Workflow is disabled:", workflow_id);
      return badRequest("Workflow is disabled");
    }

    // 3. Create workflow_run record with status "pending"
    console.log("[Workflow Run API] Creating workflow run...");
    let run: any;
    try {
      // Wrap createWorkflowRun in an isolated try-catch to catch any errors
      // and ensure we don't accidentally pass Zod-internal error objects
      try {
        run = await createWorkflowRun({
          workflow_id,
          entity_type,
          entity_id,
          input_data,
          estimated_cost: workflow.estimated_cost,
        });
        console.log("[Workflow Run API] Workflow run created successfully:", {
          id: run?.id,
          status: run?.status,
          workflow_id: run?.workflow_id,
        });
      } catch (innerError: any) {
        // Completely isolate the error - create a brand new Error object
        // with only safe, serializable properties
        console.error("[Workflow Run API] Inner error in createWorkflowRun:", {
          message: typeof innerError?.message === "string" ? innerError.message : "Unknown error",
          name: typeof innerError?.name === "string" ? innerError.name : "Error",
        });
        
        // Create a completely clean error without any references
        const cleanError = new Error(
          typeof innerError?.message === "string" 
            ? innerError.message 
            : "Failed to create workflow run"
        );
        
        // Only copy safe properties
        if (typeof innerError?.code === "string") {
          (cleanError as any).code = innerError.code;
        }
        if (typeof innerError?.details === "string") {
          (cleanError as any).details = innerError.details;
        }
        if (typeof innerError?.hint === "string") {
          (cleanError as any).hint = innerError.hint;
        }
        
        throw cleanError;
      }

      // 4. Check for webhook_url
      console.log("[Workflow Run API] Checking for workflow secrets...");
      const secrets = await getWorkflowSecrets(workflow_id);
      console.log("[Workflow Run API] Workflow secrets:", {
        hasSecrets: !!secrets,
        hasWebhook: !!secrets?.webhook_url,
      });

      if (secrets?.webhook_url) {
        // External n8n workflow - send to webhook (fire and forget)
        console.log(`[Workflow Run API] Sending run ${run.id} to n8n webhook:`, secrets.webhook_url);
        fetch(secrets.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(secrets.api_key ? { Authorization: `Bearer ${secrets.api_key}` } : {}),
          },
          body: JSON.stringify({
            run_id: run.id,
            workflow_id,
            input_data,
            entity_type,
            entity_id,
          }),
        }).catch((error) => {
          console.error(`[Workflow Run API] Error triggering webhook for run ${run.id}:`, error);
          // Don't fail the request if webhook fails
        });
      } else {
        // Internal automation executor - route to executor registry
        console.log(`[Workflow Run API] Executing internal automation: ${workflow.slug}`);
        executeAutomation(workflow.slug, run.id, input_data, {
          entityType: entity_type,
          entityId: entity_id,
          workflowId: workflow_id,
        }).catch((error) => {
          console.error(`[Workflow Run API] Error executing automation for run ${run.id}:`, error);
          console.error(`[Workflow Run API] Error stack:`, error.stack);
          // Error handling is done inside the executor (status update to "failed")
        });
      }

      // 5. Return run ID immediately (async execution)
      console.log("[Workflow Run API] ====== SUCCESS ======");
      
      // Create a completely clean, manually constructed response object
      // Extract only primitive values to avoid any hidden references
      const cleanRunId = typeof run?.id === "string" ? run.id : String(run?.id || "");
      const cleanWorkflowId = typeof run?.workflow_id === "string" ? run.workflow_id : String(run?.workflow_id || "");
      const cleanStatus = typeof run?.status === "string" ? run.status : "pending";
      const cleanStartedAt = typeof run?.started_at === "string" ? run.started_at : new Date().toISOString();
      
      // Manually construct the response object with only primitives
      const responseData: {
        success: boolean;
        run: {
          id: string;
          workflow_id: string;
          status: string;
          started_at: string;
        };
      } = {
        success: true,
        run: {
          id: cleanRunId,
          workflow_id: cleanWorkflowId,
          status: cleanStatus,
          started_at: cleanStartedAt,
        },
      };
      
      // Test serialization before returning
      try {
        const testSerialization = JSON.stringify(responseData);
        console.log("[Workflow Run API] Response data is serializable, length:", testSerialization.length);
        
        // Use NextResponse.json directly instead of ok() to avoid any potential issues
        return NextResponse.json(responseData, { status: 200 });
      } catch (serializeError: any) {
        console.error("[Workflow Run API] Response data serialization failed:", serializeError?.message);
        // Return minimal response if serialization fails
        return NextResponse.json(
          {
            success: true,
            run: {
              id: cleanRunId,
              workflow_id: cleanWorkflowId,
              status: "pending",
              started_at: new Date().toISOString(),
            },
          },
          { status: 200 }
        );
      }
    } catch (createError: any) {
      // Safely extract error information without accessing Zod internals
      const errorMessage = typeof createError?.message === "string" 
        ? createError.message 
        : "Failed to create workflow run";
      const errorCode = typeof createError?.code === "string" ? createError.code : undefined;
      const errorDetails = typeof createError?.details === "string" ? createError.details : undefined;
      const errorHint = typeof createError?.hint === "string" ? createError.hint : undefined;
      
      console.error("[Workflow Run API] Error creating workflow run:", {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        hint: errorHint,
      });
      
      // Create a completely clean error object without any Zod references
      const cleanError = new Error(errorMessage);
      if (errorCode) (cleanError as any).code = errorCode;
      if (errorDetails) (cleanError as any).details = errorDetails;
      if (errorHint) (cleanError as any).hint = errorHint;
      
      throw cleanError;
    }
  } catch (error: any) {
    console.error("[Workflow Run API] ====== ERROR ======");
    console.error("[Workflow Run API] Error creating workflow run");
    console.error("[Workflow Run API] Error type:", error?.constructor?.name);
    
    // Safely extract error message
    let errorMessage = "Unknown error";
    try {
      if (typeof error?.message === "string") {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
    } catch (e) {
      // Ignore
    }
    
    console.error("[Workflow Run API] Error message:", errorMessage);
    
    // Safely extract error code
    let errorCode: string | null = null;
    try {
      if (typeof error?.code === "string") {
        errorCode = error.code;
      }
    } catch (e) {
      // Ignore
    }
    
    // Create a completely plain object for error details
    const errorDetails: { message: string; code?: string | null } = {
      message: errorMessage,
    };
    
    if (errorCode) {
      errorDetails.code = errorCode;
    }
    
    // Log to console but don't try to serialize complex objects
    if (error?.stack) {
      console.error("[Workflow Run API] Error stack:", String(error.stack));
    }
    
    return serverError("Failed to create workflow run", errorDetails);
  }
}
