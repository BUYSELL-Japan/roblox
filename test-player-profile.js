async function test() {
  const userId = 312650006;
  try {
    const res = await fetch(`http://localhost:3000/api/player-profile?userId=${userId}`);
    if (!res.ok) {
      console.error('Response NOT OK:', res.status, await res.text());
      return;
    }
    const data = await res.json();
    console.log('Friend Count:', data.friendCount);
    if (data.friends && data.friends.length > 0) {
      console.log('Friends:', JSON.stringify(data.friends, null, 2));
    } else {
      console.log('No friends found or empty friends list.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
