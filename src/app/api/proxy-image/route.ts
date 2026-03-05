import { NextRequest, NextResponse } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Block private/internal IP ranges */
function isBlockedHost(hostname: string): boolean {
  // Block obvious internal hostnames
  if (hostname === "localhost" || hostname === "[::1]") return true;

  // IPv4 checks
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true;           // 127.x.x.x
    if (a === 10) return true;            // 10.x.x.x
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16-31.x.x
    if (a === 192 && b === 168) return true; // 192.168.x.x
    if (a === 169 && b === 254) return true; // 169.254.x.x
    if (a === 0) return true;             // 0.x.x.x
  }

  // IPv6 checks
  const lower = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc00:") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80:")) return true;

  return false;
}

/**
 * Proxy images to avoid CORS issues when extracting colors via canvas.
 * Usage: /api/proxy-image?url=https://example.com/image.png
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate HTTPS only
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only HTTPS URLs allowed" }, { status: 400 });
  }

  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Blocked URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }

    // Validate Content-Type is an image
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Response is not an image" }, { status: 400 });
    }

    // Check Content-Length header if available
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
