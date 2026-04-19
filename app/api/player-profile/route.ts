import { NextResponse } from 'next/server';

export const runtime = 'edge';

const API = {
  users:       'https://users.roblox.com',
  thumbnails:  'https://thumbnails.roblox.com',
  avatar:      'https://avatar.roblox.com',
  friends:     'https://friends.roblox.com',
  groups:      'https://groups.roblox.com',
  followings:  'https://followings.roblox.com',
  games:       'https://games.roblox.com',
};

async function safeJson<T = any>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`[API] ${res.status} ${url}`);
      return null;
    }
    return await res.json() as T;
  } catch (e: any) {
    console.error(`[API] fetch error ${url}:`, e?.message ?? e);
    return null;
  }
}

async function fetchThumbnailsBatch(
  ids: (number | string)[],
  type: 'assets' | 'headshots',
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (ids.length === 0) return result;
  const chunk = ids.slice(0, 100).join(',');
  const url =
    type === 'assets'
      ? `${API.thumbnails}/v1/assets?assetIds=${chunk}&size=150x150&format=Png&isCircular=false`
      : `${API.thumbnails}/v1/users/avatar-headshot?userIds=${chunk}&size=150x150&format=Png&isCircular=true`;
  const data = await safeJson(url);
  (data?.data ?? []).forEach((t: any) => {
    if (t.imageUrl) result[String(t.targetId)] = t.imageUrl;
  });
  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // Step 1: Critical user info
    const userData = await safeJson(`${API.users}/v1/users/${userId}`);
    if (!userData) {
      return NextResponse.json({ error: 'Failed to reach Roblox API' }, { status: 503 });
    }
    if (userData.errors || (!userData.name && userData.isBanned === undefined)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 2: Supporting data
    const [avatarImgData, avatarInfo, wearingData, friendsCountData, groupsData,
           followersData, followingData, gamesData, outlitsData, usernameHistoryData] =
      await Promise.all([
        safeJson(`${API.thumbnails}/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`),
        safeJson(`${API.avatar}/v1/users/${userId}/avatar`),
        safeJson(`${API.avatar}/v1/users/${userId}/currently-wearing`),
        safeJson(`${API.friends}/v1/users/${userId}/friends/count`),
        safeJson(`${API.groups}/v1/users/${userId}/groups/roles`),
        safeJson(`${API.followings}/v1/users/${userId}/followers/count`),
        safeJson(`${API.followings}/v1/users/${userId}/followings/count`),
        safeJson(`${API.games}/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`),
        safeJson(`${API.avatar}/v1/users/${userId}/outfits?itemsPerPage=50`),
        safeJson(`${API.users}/v1/users/${userId}/username-history?limit=10&sortOrder=Asc`),
      ]);

    // Step 3: Avatar image
    const rawAvatarUrl: string | null = avatarImgData?.data?.[0]?.imageUrl ?? null;
    const avatarImageUrl = rawAvatarUrl
      ? `/api/proxy-asset?url=${encodeURIComponent(rawAvatarUrl)}`
      : null;

    // Step 4: Outfit items
    const assetIds: string[] = (wearingData?.assetIds ?? []).map(String).filter(Boolean);
    let outfitItems: { assetId: string; thumbnailUrl: string | null }[] = [];
    if (assetIds.length > 0) {
      const thumbMap = await fetchThumbnailsBatch(assetIds, 'assets');
      outfitItems = assetIds.map((id) => ({
        assetId: id,
        thumbnailUrl: thumbMap[id] ? `/api/proxy-asset?url=${encodeURIComponent(thumbMap[id])}` : null,
      }));
    }

    // Step 5: Saved outfits
    const rawOutfits: any[] = outlitsData?.data ?? [];
    const savedOutfits: any[] = rawOutfits.map((o: any) => ({
      id: String(o.id),
      name: o.name || 'Unnamed Outfit',
      isEditable: o.isEditable ?? false,
      thumbnailUrl: null as string | null,
    }));
    if (savedOutfits.length > 0) {
      const outfitIds = savedOutfits.map((o) => o.id).join(',');
      const ot = await safeJson(
        `${API.thumbnails}/v1/users/outfits?userOutfitIds=${outfitIds}&size=150x150&format=Png&isCircular=false`,
      );
      if (ot?.data) {
        const thumbMap = new Map<string, string>(
          (ot.data as any[]).map((t: any) => [String(t.targetId), t.imageUrl as string]),
        );
        savedOutfits.forEach((o) => {
          const img = thumbMap.get(o.id);
          if (img) o.thumbnailUrl = `/api/proxy-asset?url=${encodeURIComponent(img)}`;
        });
      }
    }

    // Step 6: Friends (limit 50 to stay within CPU budget)
    const friendsRaw = await safeJson(`${API.friends}/v1/users/${userId}/friends`);
    const friends: any[] = friendsRaw?.data ?? [];
    let friendsWithAvatars: any[] = [];
    if (friends.length > 0) {
      friends.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
      const displayIds = friends.slice(0, 50).map((f) => String(f.id || f.userId));
      const [thumbMap, usersData] = await Promise.all([
        fetchThumbnailsBatch(displayIds, 'headshots'),
        safeJson(`${API.users}/v1/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: displayIds, excludeBannedUsers: false }),
        }),
      ]);
      const userInfoMap = new Map<string, any>();
      ((usersData?.data ?? []) as any[]).forEach((u: any) => userInfoMap.set(String(u.id), u));
      friendsWithAvatars = displayIds.map((id) => {
        const info = userInfoMap.get(id);
        const orig = friends.find((f) => String(f.id || f.userId) === id);
        const imgUrl = thumbMap[id];
        return {
          userId: id,
          username: info?.name || id,
          displayName: info?.displayName || info?.name || id,
          isOnline: orig?.isOnline ?? false,
          avatarUrl: imgUrl ? `/api/proxy-asset?url=${encodeURIComponent(imgUrl)}` : null,
        };
      });
    }

    // Step 7: Games
    const games: any[] = (gamesData?.data ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      placeVisits: g.placeVisits ?? 0,
      rootPlaceId: g.rootPlaceId,
      thumbnailUrl: null as string | null,
    }));
    if (games.length > 0) {
      const universeIds = games.map((g) => g.id).join(',');
      const gt = await safeJson(
        `${API.thumbnails}/v1/games/icons?universeIds=${universeIds}&size=150x150&format=Png&isCircular=false`,
      );
      if (gt?.data) {
        const thumbMap = new Map<number, string>(
          (gt.data as any[]).map((t: any) => [t.targetId as number, t.imageUrl as string]),
        );
        games.forEach((g) => {
          const img = thumbMap.get(g.id);
          if (img) g.thumbnailUrl = `/api/proxy-asset?url=${encodeURIComponent(img)}`;
        });
      }
    }

    return NextResponse.json({
      userId: userData.id,
      username: userData.name,
      displayName: userData.displayName ?? userData.name,
      description: userData.description || '',
      joinDate: userData.created,
      isBanned: userData.isBanned ?? false,
      avatarImageUrl,
      avatarType: avatarInfo?.playerAvatarType ?? 'R15',
      bodyColors: avatarInfo?.bodyColors ?? null,
      scales: avatarInfo?.scales ?? null,
      outfitItems,
      savedOutfits,
      friendCount: friendsCountData?.count ?? friends.length,
      friends: friendsWithAvatars,
      groups: ((groupsData?.data ?? []) as any[]).map((g: any) => ({
        id: g.group.id,
        name: g.group.name,
        role: g.role.name,
        memberCount: g.group.memberCount,
      })),
      followerCount: followersData?.count ?? 0,
      followingCount: followingData?.count ?? 0,
      games,
      usernameHistory: ((usernameHistoryData?.data ?? []) as any[]).map((h: any) => h.name),
    });
  } catch (err: any) {
    console.error('[player-profile] Unhandled error:', err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal Server Error' },
      { status: 500 },
    );
  }
}
