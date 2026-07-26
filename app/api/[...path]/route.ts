import { NextRequest, NextResponse } from "next/server";

function getBackendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.BACKEND_HOSTPORT ||
    process.env.BACKEND_INTERNAL_URL ||
    "127.0.0.1:8000";
  return raw.startsWith("http") ? raw : `http://${raw}`;
}

async function proxyRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendBase = getBackendBaseUrl();
  const path = params.path.join("/");
  const targetUrl = `${backendBase}/api/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(targetUrl, init);
    const body = await res.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamContentType = res.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }

    return new NextResponse(body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable", path: `/api/${path}` },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
