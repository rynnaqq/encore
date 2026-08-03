const https = require('https');
const axios = require('axios'); // if we have it

async function test() {
  try {
    const res = await fetch('https://api.nyxs.pw/dl/yt-mac?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const data = await res.json();
    console.log("Nyxs:", data);
  } catch(e) { console.log("Nyxs failed"); }
}
test();
