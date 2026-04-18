async function test() {
  const userId = '4460761705';
  try {
    console.log(`Checking currently-wearing for ${userId}...`);
    const res = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing`);
    const data = await res.json();
    console.log('Currently Wearing Data:', JSON.stringify(data, null, 2));

    console.log(`\nChecking saved outfits for ${userId}...`);
    const outfitsRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/outfits?itemsPerPage=50`);
    const outfitsData = await outfitsRes.json();
    console.log('Saved Outfits Data (first 2):', JSON.stringify(outfitsData.data?.slice(0, 2), null, 2));
    
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
