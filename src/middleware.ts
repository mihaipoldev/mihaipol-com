import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_MODE = process.env.NODE_ENV === "production";
const PREVIEW_COOKIE = "mp-preview";

function maintenanceResponse(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mihai Pol</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100dvh;
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 480px;
    }
    .name {
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #fff;
      margin-bottom: 1.5rem;
    }
    .line {
      width: 48px;
      height: 1px;
      background: rgba(255,255,255,0.2);
      margin: 0 auto 1.5rem;
    }
    .status {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="name">Mihai Pol</h1>
    <div class="line"></div>
    <p class="status">Coming Soon</p>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Maintenance gate — only blocks homepage (/), bypass with ?preview=1 (sets cookie)
  if (MAINTENANCE_MODE && pathname === "/") {
    const hasPreviewCookie = request.cookies.get(PREVIEW_COOKIE)?.value === "1";
    const hasPreviewParam = request.nextUrl.searchParams.get("preview") === "1";

    if (hasPreviewParam && !hasPreviewCookie) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("preview");
      const res = NextResponse.redirect(url);
      res.cookies.set(PREVIEW_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }

    if (!hasPreviewCookie && !hasPreviewParam) {
      return maintenanceResponse();
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
