import { NextRequest } from "next/server";
import { upsertWorkflowSecrets } from "@/features/workflows/mutations";
import { getWorkflowSecrets } from "@/features/workflows/data";
import { workflowSecretsSchema } from "@/features/workflows/schemas";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { id } = await params;
    const secrets = await getWorkflowSecrets(id);

    if (!secrets) {
      return ok({ exists: false });
    }

    // Return webhook_url and config, but mask api_key for security
    return ok({ 
      exists: true,
      webhook_url: secrets.webhook_url || null,
      api_key: secrets.api_key ? "********" : null, // Masked for security
      config: secrets.config || null,
    });
  } catch (error: any) {
    console.error("Error fetching workflow secrets:", error);
    return serverError("Failed to fetch workflow secrets", error?.message);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { id } = await params;
    const json = await request.json();
    const parsed = workflowSecretsSchema.safeParse(json);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    await upsertWorkflowSecrets(id, parsed.data);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error updating workflow secrets:", error);
    return serverError("Failed to update workflow secrets", error?.message);
  }
}
