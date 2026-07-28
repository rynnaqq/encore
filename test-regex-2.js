const rawText = "[REPLY_TO:1234:john_doe]This is a test reply";
const text = rawText;
const replyMatch = text.match(/^\[REPLY_TO:([^\]:]+)(?::([^\]]+))?\](.*)/s);
console.log(replyMatch);
