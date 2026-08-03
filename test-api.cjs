async function test() {
  try {
    const res = await fetch("https://api.tiklydown.eu.org/api/download?url=https://www.tiktok.com/@mrbeast/video/7303038612170886405");
    const data = await res.json();
    console.log(data);
  } catch(e) { console.log("failed", e.message); }
}
test();
