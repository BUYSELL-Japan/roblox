const USERS_API      = 'https://users.roblox.com';
const THUMBNAILS_API = 'https://thumbnails.roblox.com';
const AVATAR_API     = 'https://avatar.roblox.com';
const FRIENDS_API    = 'https://friends.roblox.com';
const GROUPS_API     = 'https://groups.roblox.com';
const FOLLOWINGS_API = 'https://followings.roblox.com';
const GAMES_API      = 'https://games.roblox.com';

async function safeJson(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchThumbnailsBatch(ids, type) {
  const result = {};
  if (ids.length === 0) return result;
  const chunk = ids.slice(0, 100).join(',');
  const url = type === 'assets'
    ? `${THUMBNAILS_API}/v1/assets?assetIds=${chunk}&size=150x150&format=Png&isCircular=false`
    : `${THUMBNAILS_API}/v1/users/avatar-headshot?userIds=${chunk}&size=150x150&format=Png&isCircular=true`;
  const data = await safeJson(url);
  (data?.data ?? []).forEach(t => {
    if (t.imageUrl) result[String(t.targetId)] = t.imageUrl;
  });
  return result;
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId') ?? '';

    if (!userId || !/^\d+$/.test(userId)) {
      return Response.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // 1. User info (critical)
    const user = await safeJson(`${USERS_API}/v1/users/${userId}`);
    if (!user) {
      return Response.json({ error: 'Failed to reach Roblox API' }, { status: 503 });
    }
    if (user.errors || (!user.name && user.isBanned === undefined)) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Parallel supporting data
    const [avatarImgData, avatarInfo, wearingData, friendsCount, groupsData,
           followersData, followingData, gamesData, outlitsData, historyData] =
      await Promise.all([
        safeJson(`${THUMBNAILS_API}/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`),
        safeJson(`${AVATAR_API}/v1/users/${userId}/avatar`),
        safeJson(`${AVATAR_API}/v1/users/${userId}/currently-wearing`),
        safeJson(`${FRIENDS_API}/v1/users/${userId}/friends/count`),
        safeJson(`${GROUPS_API}/v1/users/${userId}/groups/roles`),
        safeJson(`${FOLLOWINGS_API}/v1/users/${userId}/followers/count`),
        safeJson(`${FOLLOWINGS_API}/v1/users/${userId}/followings/count`),
        safeJson(`${GAMES_API}/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`),
        safeJson(`${AVATAR_API}/v1/users/${userId}/outfits?itemsPerPage=50`),
        safeJson(`${USERS_API}/v1/users/${userId}/username-history?limit=10&sortOrder=Asc`),
      ]);

    // 3. Avatar image
    const rawAvatarUrl = avatarImgData?.data?.[0]?.imageUrl ?? null;
    const avatarImageUrl = rawAvatarUrl
      ? `/api/proxy-asset?url=${encodeURIComponent(rawAvatarUrl)}`
      : null;

    // 4. Outfit items
    const assetIds = Array.isArray(wearingData?.assetIds)
      ? wearingData.assetIds.map(String).filter(Boolean)
      : [];
    let outfitItems = [];
    if (assetIds.length > 0) {
      const thumbMap = await fetchThumbnailsBatch(assetIds, 'assets');
      outfitItems = assetIds.map(id => ({
        assetId: id,
        thumbnailUrl: thumbMap[id] ? `/api/proxy-asset?url=${encodeURIComponent(thumbMap[id])}` : null,
      }));
    }

    // 5. Saved outfits
    const rawOutfits = Array.isArray(outlitsData?.data) ? outlitsData.data : [];
    const savedOutfits = rawOutfits.map(o => ({
      id: String(o.id),
      name: o.name || 'Unnamed Outfit',
      isEditable: o.isEditable ?? false,
      thumbnailUrl: null,
    }));
    if (savedOutfits.length > 0) {
      const outfitIds = savedOutfits.map(o => o.id).join(',');
      const ot = await safeJson(
        `${THUMBNAILS_API}/v1/users/outfits?userOutfitIds=${outfitIds}&size=150x150&format=Png&isCircular=false`
      );
      const otMap = {};
      (ot?.data ?? []).forEach(t => { if (t.imageUrl) otMap[String(t.targetId)] = t.imageUrl; });
      savedOutfits.forEach(o => {
        if (otMap[o.id]) o.thumbnailUrl = `/api/proxy-asset?url=${encodeURIComponent(otMap[o.id])}`;
      });
    }

    // 6. Friends (top 50)
    const friendsRaw = await safeJson(`${FRIENDS_API}/v1/users/${userId}/friends`);
    const friendsList = Array.isArray(friendsRaw?.data) ? friendsRaw.data : [];
    let friendsWithAvatars = [];
    if (friendsList.length > 0) {
      friendsList.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
      const displayIds = friendsList.slice(0, 50).map(f => String(f.id || f.userId));
      const chunk2 = displayIds.join(',');
      const [hd, ud] = await Promise.all([
        safeJson(`${THUMBNAILS_API}/v1/users/avatar-headshot?userIds=${chunk2}&size=150x150&format=Png&isCircular=true`),
        safeJson(`${USERS_API}/v1/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: displayIds, excludeBannedUsers: false }),
        }),
      ]);
      const hdMap = {};
      (hd?.data ?? []).forEach(t => { if (t.imageUrl) hdMap[String(t.targetId)] = t.imageUrl; });
      const udMap = {};
      (ud?.data ?? []).forEach(u => { udMap[String(u.id)] = u; });
      friendsWithAvatars = displayIds.map(id => {
        const info = udMap[id];
        const orig = friendsList.find(f => String(f.id || f.userId) === id);
        const img = hdMap[id];
        return {
          userId: id,
          username: info?.name || id,
          displayName: info?.displayName || info?.name || id,
          isOnline: orig?.isOnline ?? false,
          avatarUrl: img ? `/api/proxy-asset?url=${encodeURIComponent(img)}` : null,
        };
      });
    }

    // 7. Games
    const gamesList = Array.isArray(gamesData?.data)
      ? gamesData.data.map(g => ({
          id: g.id,
          name: g.name,
          placeVisits: g.placeVisits ?? 0,
          rootPlaceId: g.rootPlaceId,
          thumbnailUrl: null,
        }))
      : [];
    if (gamesList.length > 0) {
      const uids = gamesList.map(g => g.id).join(',');
      const gt = await safeJson(
        `${THUMBNAILS_API}/v1/games/icons?universeIds=${uids}&size=150x150&format=Png&isCircular=false`
      );
      const gtMap = {};
      (gt?.data ?? []).forEach(t => { if (t.imageUrl) gtMap[t.targetId] = t.imageUrl; });
      gamesList.forEach(g => {
        if (gtMap[g.id]) g.thumbnailUrl = `/api/proxy-asset?url=${encodeURIComponent(gtMap[g.id])}`;
      });
    }

    return Response.json({
      userId: user.id,
      username: user.name,
      displayName: user.displayName ?? user.name,
      description: user.description || '',
      joinDate: user.created,
      isBanned: user.isBanned ?? false,
      avatarImageUrl,
      avatarType: avatarInfo?.playerAvatarType ?? 'R15',
      bodyColors: avatarInfo?.bodyColors ?? null,
      scales: avatarInfo?.scales ?? null,
      outfitItems,
      savedOutfits,
      friendCount: friendsCount?.count ?? friendsList.length,
      friends: friendsWithAvatars,
      groups: (groupsData?.data ?? []).map(g => ({
        id: g.group.id,
        name: g.group.name,
        role: g.role.name,
        memberCount: g.group.memberCount,
      })),
      followerCount: followersData?.count ?? 0,
      followingCount: followingData?.count ?? 0,
      games: gamesList,
      usernameHistory: (historyData?.data ?? []).map(h => h.name),
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return Response.json(
      { error: err?.message ?? 'Internal Server Error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
