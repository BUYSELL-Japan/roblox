export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Security: only proxy from trusted Roblox CDN domains
    const allowed = ['rbxcdn.com', 'roblox.com', 'robloxlabs.com'];
    const targetHost = new URL(targetUrl).hostname;
    if (!allowed.some(d => targetHost.endsWith(d))) {
      return new Response('Forbidden domain', { status: 403 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RobloxProfileExplorer/1.0)',
        'Referer': 'https://www.roblox.com/',
      }
    });

    if (!res.ok) {
      return new Response(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err) {
    return new Response(`Proxy error: ${err?.message}`, { status: 500 });
  }
}
