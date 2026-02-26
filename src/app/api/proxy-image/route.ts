import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy images to avoid CORS issues when extracting colors via canvas.
 * Usage: /api/proxy-image?url=https://example.com/image.png
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24h
    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

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
