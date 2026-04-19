import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Roblox APIs are public for user info, but have different subdomains.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // 1. Fetch User Profile Info
    const userRes = await fetch(`https://users.roproxy.com/v1/users/${userId}`);
    const userData = await userRes.json();

    // 2. Fetch User Badges
    const badgesRes = await fetch(`https://badges.roproxy.com/v1/users/${userId}/badges/awarded?limit=10&sortOrder=Desc`);
    const badgesData = badgesRes.ok ? await badgesRes.json() : { data: [] };

    // 3. Fetch Friends count
    const friendsRes = await fetch(`https://friends.roproxy.com/v1/users/${userId}/friends/count`);
    const friendsData = friendsRes.ok ? await friendsRes.json() : { count: 0 };

    // 4. Fetch 2D High-Res Avatar image
    const avatarRes = await fetch(`https://thumbnails.roproxy.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`);
    let avatarImageUrl = null;
    
    if (avatarRes.ok) {
      const avatarData = await avatarRes.json();
      if (avatarData.data && avatarData.data.length > 0 && avatarData.data[0].state === 'Completed') {
        const rawUrl = avatarData.data[0].imageUrl;
        avatarImageUrl = `/api/proxy-asset?url=${encodeURIComponent(rawUrl)}`;
      }
    }

    return NextResponse.json({
      userId: userData.id,
      username: userData.name,
      displayName: userData.displayName,
      joinDate: userData.created,
      badges: badgesData.data || [],
      friendCount: friendsData.count || 0,
      avatarImageUrl: avatarImageUrl,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

