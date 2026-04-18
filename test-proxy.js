const rawUrl = 'https://tr.rbxcdn.com/30DAY-Avatar-310966282D3529E36976BF6B07B1DC90-Png/720/720/Avatar/Png/noFilter';
const proxyUrl = `http://localhost:3000/api/proxy-asset?url=${encodeURIComponent(rawUrl)}`;
fetch(proxyUrl).then(res => {
  console.log("Status:", res.status);
  console.log("Headers:", res.headers);
  return res.text();
}).then(err => console.log("Body length:", err.length));
