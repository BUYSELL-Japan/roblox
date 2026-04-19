import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || 'All';
  const cursor = searchParams.get('cursor') || '';

  try {
    const params = new URLSearchParams({
      category,
      limit: '30',
      sortOrder: 'Desc',
      ...(keyword && { keyword }),
      ...(cursor && { cursor }),
    });

    const searchRes = await fetch(`https://catalog.roproxy.com/v1/search/items?${params}`);
    if (!searchRes.ok) throw new Error('Catalog search failed');
    const searchData = await searchRes.json();

    const items = searchData.data ?? [];
    const assetIds = items.map((i: any) => i.id).join(',');

    let thumbnails: Record<number, string> = {};
    if (assetIds) {
      const thumbRes = await fetch(
        `https://thumbnails.roproxy.com/v1/assets?assetIds=${assetIds}&size=150x150&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        (thumbData.data ?? []).forEach((t: any) => {
          if (t.state === 'Completed') {
            thumbnails[t.targetId] = `/api/proxy-asset?url=${encodeURIComponent(t.imageUrl)}`;
          }
        });
      }
    }

    return NextResponse.json({
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        creatorName: item.creatorName,
        itemType: item.itemType,
        lowestPrice: item.lowestPrice,
        price: item.price,
        thumbnailUrl: thumbnails[item.id] ?? null,
      })),
      nextPageCursor: searchData.nextPageCursor ?? null,
    });
  } catch (error) {
    console.error('Catalog API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
  }
}

