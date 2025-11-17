// Example usage of the server-side Supabase client
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple health check: fetch one album to verify database connection
    const { data, error } = await supabase.from("albums").select("*").limit(1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        {
          status: "error",
          message: "Database connection failed",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "Database connection successful",
      albumsCount: data?.length ?? 0,
      sample: data?.[0] ?? null,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
