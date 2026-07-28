const rawText = "[REPLY_TO:1712312312]Ini test reply";
const text = rawText;
const replyMatch = text.match(/^\[REPLY_TO:([^\]]+)\](.*)/s);
console.log(replyMatch);
