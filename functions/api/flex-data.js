const USERS_API      = 'https://users.roblox.com';
const THUMBNAILS_API = 'https://thumbnails.roblox.com';
const FRIENDS_API    = 'https://friends.roblox.com';
const BADGES_API     = 'https://badges.roblox.com';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!userId || !/^\d+$/.test(userId)) {
      return Response.json({ error: 'Missing or invalid userId' }, { status: 400 });
    }

    // Fetch user profile, badges, friends count, avatar in parallel
    const [userRes, badgesRes, friendsRes, avatarRes] = await Promise.all([
      fetch(`${USERS_API}/v1/users/${userId}`),
      fetch(`${BADGES_API}/v1/users/${userId}/badges/awarded?limit=10&sortOrder=Desc`),
      fetch(`${FRIENDS_API}/v1/users/${userId}/friends/count`),
      fetch(`${THUMBNAILS_API}/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`),
    ]);

    if (!userRes.ok) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userData   = await userRes.json();
    const badgesData = badgesRes.ok  ? await badgesRes.json()  : { data: [] };
    const friendsData = friendsRes.ok ? await friendsRes.json() : { count: 0 };

    let avatarImageUrl = null;
    if (avatarRes.ok) {
      const avatarData = await avatarRes.json();
      const imageUrl = avatarData?.data?.[0]?.imageUrl;
      if (imageUrl) {
        avatarImageUrl = `/api/proxy-asset?url=${encodeURIComponent(imageUrl)}`;
      }
    }

    return Response.json({
      userId: userData.id,
      username: userData.name,
      displayName: userData.displayName,
      joinDate: userData.created,
      badges: badgesData.data || [],
      friendCount: friendsData.count || 0,
      avatarImageUrl,
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
