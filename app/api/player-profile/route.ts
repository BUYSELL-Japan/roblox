import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Batch thumbnail fetching (max 100 IDs per request)
async function fetchThumbnailsBatch(ids: (number | string)[], type: 'assets' | 'headshots'): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize).join(',');
    const url = type === 'assets'
      ? `https://thumbnails.roproxy.com/v1/assets?assetIds=${chunk}&size=150x150&format=Png&isCircular=false`
      : `https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${chunk}&size=150x150&format=Png&isCircular=true`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        (data.data ?? []).forEach((t: any) => {
          if (t.state === 'Completed' || t.imageUrl) {
            result[String(t.targetId)] = `/api/proxy-asset?url=${encodeURIComponent(t.imageUrl)}`;
          }
        });
      }
    } catch (e) {
      console.error(`Thumbnails batch error (${type}):`, e);
    }
  }
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '4460761705';

  try {
    // 1. Fetch BASIC profile and count immediately to keep it fast
    const [userRes, avatarRes, avatarInfoRes, wearingRes, friendsCountRes, groupsRes, followersRes, followingRes, gamesRes, outlitsRes, usernameHistoryRes] = await Promise.all([
      fetch(`https://users.roproxy.com/v1/users/${userId}`),
      fetch(`https://thumbnails.roproxy.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`),
      fetch(`https://avatar.roproxy.com/v1/users/${userId}/avatar`),
      fetch(`https://avatar.roproxy.com/v1/users/${userId}/currently-wearing`),
      fetch(`https://friends.roproxy.com/v1/users/${userId}/friends/count`), 
      fetch(`https://groups.roproxy.com/v1/users/${userId}/groups/roles`),
      fetch(`https://followings.roproxy.com/v1/users/${userId}/followers/count`),
      fetch(`https://followings.roproxy.com/v1/users/${userId}/followings/count`),
      fetch(`https://games.roproxy.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`),
      fetch(`https://avatar.roproxy.com/v1/users/${userId}/outfits?itemsPerPage=50`),
      fetch(`https://users.roproxy.com/v1/users/${userId}/username-history?limit=10&sortOrder=Asc`),
    ]);

    const userData = await userRes.json();
    if (userData.errors || (userData.isBanned === undefined && !userData.name)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const avatarData = avatarRes.ok ? await avatarRes.json() : null;
    const avatarInfo = avatarInfoRes.ok ? await avatarInfoRes.json() : null;
    const wearingData = wearingRes.ok ? await wearingRes.json() : null;
    const friendsCountData = friendsCountRes.ok ? await friendsCountRes.json() : { count: 0 };
    const groupsData = groupsRes.ok ? await groupsRes.json() : null;
    const followersData = followersRes.ok ? await followersRes.json() : null;
    const followingData = followingRes.ok ? await followingRes.json() : null;
    const gamesData = gamesRes.ok ? await gamesRes.json() : null;
    const outlitsData = outlitsRes.ok ? await outlitsRes.json() : null;
    const usernameHistory = usernameHistoryRes.ok ? await usernameHistoryRes.json() : null;

    // --- Asset Detection ---
    const assetIds = (wearingData?.assetIds ?? []).map(String).filter(Boolean);
    
    // 縲宣㍾隕√代ｂ縺預ssetIds縺檎ｩｺ縺ｮ蝣ｴ蜷医ヽoblox API縺ｮ蛻ｶ髯舌・蜿ｯ閭ｽ諤ｧ縺後≠繧九◆繧√√Ο繧ｰ繧貞・縺励※隴ｦ蜻翫☆繧・    if (assetIds.length === 0) {
      console.warn(`[API Warning] No assets returned for user ${userId}. Roblox might be rate-limiting.`);
      // 遨ｺ縺ｮ縺ｾ縺ｾ縺縺ｨ繝輔Ο繝ｳ繝医お繝ｳ繝峨・陦ｨ遉ｺ縺梧ｶ医∴繧九・縺ｧ縲∽ｻ･蜑阪・繝・・繧ｿ繧剃ｿ晄戟縺輔○繧九◆繧√↓繧ｨ繝ｩ繝ｼ繧定ｿ斐☆縺九・      // 縺ゅｋ縺・・迚ｹ蛻･縺ｪ繝輔Λ繧ｰ繧堤ｫ九※繧九％縺ｨ繧よ､懆ｨ・    }

    // Avatar image
    const rawAvatarUrl = avatarData?.data?.[0]?.imageUrl ?? null;
    const avatarImageUrl = rawAvatarUrl
      ? `/api/proxy-asset?url=${encodeURIComponent(rawAvatarUrl)}`
      : null;

    // Outfit items with thumbnails
    let outfitItems: any[] = [];
    if (assetIds.length > 0) {
      const thumbMap = await fetchThumbnailsBatch(assetIds, 'assets');
      outfitItems = assetIds.map((id: string) => ({ 
        assetId: id, 
        thumbnailUrl: thumbMap[id] || null 
      }));
    }

    // Saved outfits
    const rawOutfits = outlitsData?.data ?? [];
    const savedOutfits = rawOutfits.map((o: any) => ({
      id: String(o.id),
      name: o.name || 'Unnamed Outfit',
      isEditable: o.isEditable ?? false,
    }));

    if (savedOutfits.length > 0) {
      const outfitIds = savedOutfits.map((o: any) => o.id).join(',');
      const outfitThumbRes = await fetch(
        `https://thumbnails.roproxy.com/v1/users/outfits?userOutfitIds=${outfitIds}&size=150x150&format=Png&isCircular=false`
      );
      if (outfitThumbRes.ok) {
        const ot = await outfitThumbRes.json();
        const thumbMap = new Map<string, string>((ot.data ?? []).map((t: any) => [String(t.targetId), t.imageUrl]));
        savedOutfits.forEach((o: any) => {
          const imgUrl = thumbMap.get(o.id);
          if (imgUrl) o.thumbnailUrl = `/api/proxy-asset?url=${encodeURIComponent(imgUrl as string)}`;
        });
      }
    }

    // Friends
    const basicFriendsRes = await fetch(`https://friends.roproxy.com/v1/users/${userId}/friends`);
    const basicFriendsData = basicFriendsRes.ok ? await basicFriendsRes.json() : { data: [] };
    const friends = basicFriendsData.data || [];
    let friendsWithAvatars: any[] = [];
    
    if (friends.length > 0) {
      friends.sort((a: any, b: any) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
      const displayIds = friends.slice(0, 100).map((f: any) => String(f.id || f.userId));
      
      const [thumbMap, userInfoRes] = await Promise.all([
        fetchThumbnailsBatch(displayIds, 'headshots'),
        fetch('https://users.roproxy.com/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: displayIds, excludeBannedUsers: false }),
        })
      ]);

      const userInfoMap = new Map<string, any>();
      if (userInfoRes.ok) {
        const uData = await userInfoRes.json();
        (uData.data ?? []).forEach((u: any) => userInfoMap.set(String(u.id), u));
      }

      friendsWithAvatars = displayIds.map((id: string) => {
        const info = userInfoMap.get(id);
        const orig = friends.find((f: any) => String(f.id || f.userId) === id);
        return {
          userId: id,
          username: info?.name || id,
          displayName: info?.displayName || info?.name || id,
          isOnline: orig?.isOnline ?? false,
          avatarUrl: thumbMap[id] || null,
        };
      });
    }

    // Games
    const games = (gamesData?.data ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      placeVisits: g.placeVisits ?? 0,
      rootPlaceId: g.rootPlaceId,
    }));

    if (games.length > 0) {
      const universeIds = games.map((g: any) => g.id).join(',');
      const gameThumbRes = await fetch(`https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeIds}&size=150x150&format=Png&isCircular=false`);
      if (gameThumbRes.ok) {
        const gt = await gameThumbRes.json();
        const thumbMap = new Map<number, string>((gt.data ?? []).map((t: any) => [t.targetId, t.imageUrl]));
        games.forEach((g: any) => {
          const imgUrl = thumbMap.get(g.id);
          if (imgUrl) g.thumbnailUrl = `/api/proxy-asset?url=${encodeURIComponent(imgUrl as string)}`;
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
      friendCount: friendsCountData.count || friends.length,
      friends: friendsWithAvatars,
      groups: (groupsData?.data ?? []).map((g: any) => ({
        id: g.group.id,
        name: g.group.name,
        role: g.role.name,
        memberCount: g.group.memberCount,
      })),
      followerCount: followersData?.count ?? 0,
      followingCount: followingData?.count ?? 0,
      games,
      usernameHistory: (usernameHistory?.data ?? []).map((h: any) => h.name),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

