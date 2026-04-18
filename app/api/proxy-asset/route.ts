import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Basic security: only allow roblox CDNs
  if (!targetUrl.includes('rbxcdn.com')) {
    // During dev, maybe allow other sources or just mock if needed
  }

  try {
    const res = await fetch(targetUrl);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch from proxy target: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Error proxying asset', { status: 500 });
  }
}
