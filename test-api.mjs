import ytdl from '@hiudyy/ytdl';
async function test() {
  try {
    const res = await ytdl('https://www.tiktok.com/@mrbeast/video/7303038612170886405');
    console.log("tiktok:", res);
  } catch(e) { console.log("failed", e); }
}
test();
