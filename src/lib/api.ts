import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as any, { status: 200, ...(init || {}) });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as any, { status: 201, ...(init || {}) });
}

export function badRequest(message: string, details?: unknown) {
  // Safely serialize details to avoid Zod internals or circular references
  let safeDetails: unknown = null;
  if (details !== undefined && details !== null) {
    try {
      // Only serialize if it's a plain object/string/number
      if (typeof details === "string" || typeof details === "number" || typeof details === "boolean") {
        safeDetails = details;
      } else if (typeof details === "object") {
        // Try to create a plain object copy, avoiding Zod internals
        const plain: Record<string, unknown> = {};
        for (const key in details) {
          if (Object.prototype.hasOwnProperty.call(details, key) && !key.startsWith("_")) {
            const value = (details as Record<string, unknown>)[key];
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
              plain[key] = value;
            } else if (Array.isArray(value)) {
              // Handle arrays (like fieldErrors which might be arrays)
              plain[key] = value.map((item) => {
                if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) {
                  return item;
                }
                if (typeof item === "object" && item !== null) {
                  const itemPlain: Record<string, unknown> = {};
                  for (const itemKey in item) {
                    if (Object.prototype.hasOwnProperty.call(item, itemKey) && !itemKey.startsWith("_")) {
                      const itemValue = (item as Record<string, unknown>)[itemKey];
                      if (typeof itemValue === "string" || typeof itemValue === "number" || typeof itemValue === "boolean" || itemValue === null) {
                        itemPlain[itemKey] = itemValue;
                      }
                    }
                  }
                  return Object.keys(itemPlain).length > 0 ? itemPlain : null;
                }
                return null;
              });
            } else if (typeof value === "object" && value !== null) {
              // Nested objects - recursively clean them
              const nestedPlain: Record<string, unknown> = {};
              for (const nestedKey in value) {
                if (Object.prototype.hasOwnProperty.call(value, nestedKey) && !nestedKey.startsWith("_")) {
                  const nestedValue = (value as Record<string, unknown>)[nestedKey];
                  if (typeof nestedValue === "string" || typeof nestedValue === "number" || typeof nestedValue === "boolean" || nestedValue === null) {
                    nestedPlain[nestedKey] = nestedValue;
                  }
                }
              }
              plain[key] = Object.keys(nestedPlain).length > 0 ? nestedPlain : null;
            }
          }
        }
        safeDetails = Object.keys(plain).length > 0 ? plain : null;
      }
    } catch (e) {
      // If serialization fails, just use null
      safeDetails = null;
    }
  }
  
  return NextResponse.json({ error: message, details: safeDetails }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal server error", details?: unknown) {
  // Safely serialize details to avoid Zod internals or circular references
  let safeDetails: unknown = null;
  if (details !== undefined && details !== null) {
    try {
      // Only serialize if it's a plain object/string/number
      if (typeof details === "string" || typeof details === "number" || typeof details === "boolean") {
        safeDetails = details;
      } else if (typeof details === "object") {
        // Try to create a plain object copy
        const plain: Record<string, unknown> = {};
        for (const key in details) {
          if (Object.prototype.hasOwnProperty.call(details, key) && !key.startsWith("_")) {
            const value = (details as Record<string, unknown>)[key];
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
              plain[key] = value;
            }
          }
        }
        safeDetails = Object.keys(plain).length > 0 ? plain : null;
      }
    } catch (e) {
      // If serialization fails, just use null
      safeDetails = null;
    }
  }
  
  return NextResponse.json({ error: message, details: safeDetails }, { status: 500 });
}
