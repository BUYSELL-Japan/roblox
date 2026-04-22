import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ?? '4460761705';

    // Step 1: attempt to reach Roblox directly from Cloudflare Workers
    let userFetchStatus = 0;
    let userJson: any = null;
    let userError = '';

    try {
      const r = await fetch(`https://users.roblox.com/v1/users/${userId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      userFetchStatus = r.status;
      const text = await r.text();
      userJson = JSON.parse(text);
    } catch (e: any) {
      userError = String(e);
    }

    return NextResponse.json({
      debug: true,
      userId,
      userFetchStatus,
      userJson,
      userError,
    });
  } catch (err: any) {
    return NextResponse.json({ fatal: String(err) }, { status: 500 });
  }
}
