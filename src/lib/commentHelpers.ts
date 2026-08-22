export interface ParsedComment {
  isPinned: boolean;
  parentId: string | null;
  replyToUsername: string | null;
  text: string;
}

/**
 * Parses raw stored comment text to extract pinning and reply threading metadata.
 */
export const parseCommentText = (rawText: string | null | undefined): ParsedComment => {
  let isPinned = false;
  let parentId: string | null = null;
  let replyToUsername: string | null = null;
  let text = typeof rawText === 'string' ? rawText : '';

  if (text.startsWith('[PINNED]:')) {
    isPinned = true;
    text = text.substring(9);
  }

  const replyMatch = text.match(/^\[REPLY_TO:([^\]:]+)(?::([^\]]+))?\](.*)/s);
  if (replyMatch) {
    parentId = replyMatch[1];
    replyToUsername = replyMatch[2] || null;
    text = replyMatch[3];
  }

  return { isPinned, parentId, replyToUsername, text };
};

/**
 * Serializes comment text with optional pin and reply header prefixes.
 */
export const serializeCommentText = (
  text: string,
  isPinned: boolean,
  parentId: string | null,
  replyToUsername: string | null = null
): string => {
  let res = text;
  if (parentId) {
    if (replyToUsername) {
      res = `[REPLY_TO:${parentId}:${replyToUsername}]${res}`;
    } else {
      res = `[REPLY_TO:${parentId}]${res}`;
    }
  }
  if (isPinned) {
    res = `[PINNED]:${res}`;
  }
  return res;
};

/**
 * Sanitizes input text to prevent XSS.
 */
export const sanitizeText = (str: string, maxLen = 2000): string => {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLen)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
};
