const userId = 1;
fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`)
  .then(res => res.json())
  .then(data => {
    console.log("Avatar 2D Res:", data);
  });
