const CATALOG_API    = 'https://catalog.roblox.com';
const THUMBNAILS_API = 'https://thumbnails.roblox.com';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const keyword  = url.searchParams.get('keyword')  || '';
    const category = url.searchParams.get('category') || 'All';
    const cursor   = url.searchParams.get('cursor')   || '';

    const params = new URLSearchParams({ category, limit: '30', sortOrder: 'Desc' });
    if (keyword) params.set('keyword', keyword);
    if (cursor)  params.set('cursor', cursor);

    const searchRes = await fetch(`${CATALOG_API}/v1/search/items?${params}`);
    if (!searchRes.ok) throw new Error('Catalog search failed');
    const searchData = await searchRes.json();

    const items = searchData.data ?? [];
    const assetIds = items.map(i => i.id).join(',');

    const thumbnails = {};
    if (assetIds) {
      const thumbRes = await fetch(
        `${THUMBNAILS_API}/v1/assets?assetIds=${assetIds}&size=150x150&format=Png&isCircular=false`
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        (thumbData.data ?? []).forEach(t => {
          if (t.state === 'Completed') {
            thumbnails[t.targetId] = `/api/proxy-asset?url=${encodeURIComponent(t.imageUrl)}`;
          }
        });
      }
    }

    return Response.json({
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        creatorName: item.creatorName,
        itemType: item.itemType,
        lowestPrice: item.lowestPrice,
        price: item.price,
        thumbnailUrl: thumbnails[item.id] ?? null,
      })),
      nextPageCursor: searchData.nextPageCursor ?? null,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch catalog' }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
