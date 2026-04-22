export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new Response('Failed to fetch asset', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response('Error proxying asset', { status: 500 });
  }
}
