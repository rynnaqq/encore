const parseCommentText = (rawText) => {
  let isPinned = false;
  let parentId = null;
  let text = rawText;

  if (text.startsWith('[PINNED]:')) {
    isPinned = true;
    text = text.substring(9);
  }

  const replyMatch = text.match(/^\[REPLY_TO:([^\]]+)\](.*)/s);
  if (replyMatch) {
    parentId = replyMatch[1];
    text = replyMatch[2];
  }

  return { isPinned, parentId, text };
};

const serializeCommentText = (text, isPinned, parentId) => {
  let res = text;
  if (parentId) {
    res = `[REPLY_TO:${parentId}]${res}`;
  }
  if (isPinned) {
    res = `[PINNED]:${res}`;
  }
  return res;
};

console.log(parseCommentText("[PINNED]:[REPLY_TO:123]Hello world"));
console.log(serializeCommentText("Hello world", true, "123"));
