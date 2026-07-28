const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

// 1. Update Parsers
const oldParsers = `const parseCommentText = (rawText: string) => {
  let isPinned = false;
  let parentId: string | null = null;
  let text = rawText;

  if (text.startsWith('[PINNED]:')) {
    isPinned = true;
    text = text.substring(9);
  }

  const replyMatch = text.match(/^\\[REPLY_TO:([^\\]]+)\\](.*)/s);
  if (replyMatch) {
    parentId = replyMatch[1];
    text = replyMatch[2];
  }

  return { isPinned, parentId, text };
};

const serializeCommentText = (text: string, isPinned: boolean, parentId: string | null) => {
  let res = text;
  if (parentId) {
    res = \`[REPLY_TO:\${parentId}]\${res}\`;
  }
  if (isPinned) {
    res = \`[PINNED]:\${res}\`;
  }
  return res;
};`;

const newParsers = `const parseCommentText = (rawText: string) => {
  let isPinned = false;
  let parentId: string | null = null;
  let replyToUsername: string | null = null;
  let text = rawText;

  if (text.startsWith('[PINNED]:')) {
    isPinned = true;
    text = text.substring(9);
  }

  const replyMatch = text.match(/^\\[REPLY_TO:([^\\]:]+)(?::([^\\]]+))?\\](.*)/s);
  if (replyMatch) {
    parentId = replyMatch[1];
    replyToUsername = replyMatch[2] || null;
    text = replyMatch[3];
  }

  return { isPinned, parentId, replyToUsername, text };
};

const serializeCommentText = (text: string, isPinned: boolean, parentId: string | null, replyToUsername: string | null = null) => {
  let res = text;
  if (parentId) {
    if (replyToUsername) {
      res = \`[REPLY_TO:\${parentId}:\${replyToUsername}]\${res}\`;
    } else {
      res = \`[REPLY_TO:\${parentId}]\${res}\`;
    }
  }
  if (isPinned) {
    res = \`[PINNED]:\${res}\`;
  }
  return res;
};`;

code = code.replace(oldParsers, newParsers);

// 2. Add replyingToUser state
code = code.replace(
  "const [replyingToId, setReplyingToId] = useState<string | null>(null);",
  "const [replyingToId, setReplyingToId] = useState<string | null>(null);\n  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);"
);

// 3. Update handleSubmit
code = code.replace(
  "const serializedText = serializeCommentText(text.trim(), false, replyingToId);",
  "const serializedText = serializeCommentText(text.trim(), false, replyingToId, replyingToUser);"
);

code = code.replace(
  "setReplyingToId(null);\n        if (fileInputRef.current) fileInputRef.current.value = '';",
  "setReplyingToId(null);\n        setReplyingToUser(null);\n        if (fileInputRef.current) fileInputRef.current.value = '';"
);

// 4. Update handleEditSubmit and handlePin
code = code.replace(
  "const { isPinned, parentId } = parseCommentText(comment.text);",
  "const { isPinned, parentId, replyToUsername } = parseCommentText(comment.text);"
);
code = code.replace(
  "const finalString = serializeCommentText(editText.trim(), isPinned, parentId);",
  "const finalString = serializeCommentText(editText.trim(), isPinned, parentId, replyToUsername);"
);

code = code.replace(
  "const { isPinned, parentId, text } = parseCommentText(comment.text);",
  "const { isPinned, parentId, replyToUsername, text } = parseCommentText(comment.text);"
);
code = code.replace(
  "const finalString = serializeCommentText(text, !isPinned, parentId);",
  "const finalString = serializeCommentText(text, !isPinned, parentId, replyToUsername);"
);

// 5. Update comments mapping and grouping
const oldGrouping = `  const commentsWithMeta = comments.map(c => {
    const { isPinned, parentId, text } = parseCommentText(c.text);
    return { ...c, isPinned, parentId, parsedText: text };
  });

  const topLevelComments = commentsWithMeta
    .filter(c => !c.parentId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const repliesByParentId = commentsWithMeta
    .filter(c => c.parentId)
    .reduce((acc, reply) => {
      if (!acc[reply.parentId!]) acc[reply.parentId!] = [];
      acc[reply.parentId!].push(reply);
      return acc;
    }, {} as Record<string, typeof commentsWithMeta>);`;

const newGrouping = `  const commentsWithMeta = comments.map(c => {
    const { isPinned, parentId, replyToUsername, text } = parseCommentText(c.text);
    return { ...c, isPinned, parentId, replyToUsername, parsedText: text };
  });

  const resolveRootId = (commentId: string): string => {
    let currentId = commentId;
    let maxDepth = 10;
    while (maxDepth > 0) {
      const parent = commentsWithMeta.find(c => c.id === currentId);
      if (!parent || !parent.parentId) break;
      currentId = parent.parentId;
      maxDepth--;
    }
    return currentId;
  };

  const topLevelComments = commentsWithMeta
    .filter(c => !c.parentId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const repliesByRootId = commentsWithMeta
    .filter(c => c.parentId)
    .reduce((acc, reply) => {
      const rootId = resolveRootId(reply.id);
      if (rootId !== reply.id) {
        if (!acc[rootId]) acc[rootId] = [];
        acc[rootId].push(reply);
      }
      return acc;
    }, {} as Record<string, typeof commentsWithMeta>);`;

code = code.replace(oldGrouping, newGrouping);

// 6. Update threadReplies resolution
code = code.replace(
  "const threadReplies = repliesByParentId[comment.id] || [];",
  "const threadReplies = repliesByRootId[comment.id] || [];"
);

// 7. Update Reply button click for top level comments
code = code.replace(
  "setReplyingToId(comment.id);\n                              document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });",
  "setReplyingToId(comment.id);\n                              setReplyingToUser(comment.username);\n                              document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });"
);

// 8. Update Reply message in UI
code = code.replace(
  "<span>Replying to comment...</span>",
  "<span>Replying to {replyingToUser ? <span className=\"font-bold\">@{replyingToUser}</span> : 'comment'}</span>"
);
code = code.replace(
  "onClick={() => setReplyingToId(null)}",
  "onClick={() => { setReplyingToId(null); setReplyingToUser(null); }}"
);

// 9. Update rendering of reply (show @username) and add Reply button to reply
const replyRenderRegex = /<p className="text-slate-600 text-sm whitespace-pre-wrap">\s*\{reply\.parsedText\}\s*<\/p>/s;
const newReplyRender = `<p className="text-slate-600 text-sm whitespace-pre-wrap">
                                {reply.replyToUsername && <span className="text-indigo-600 font-bold mr-1">@{reply.replyToUsername}</span>}
                                {reply.parsedText}
                              </p>`;
code = code.replace(replyRenderRegex, newReplyRender);

// Add Reply Button to Reply
const replyButtonsRegex = /\{\(isAdmin \|\| \(loggedInUser && loggedInUser === reply\.username\)\) && \([\s\S]*?<\/div>\s*\)\}/;
const newReplyButtons = `<div className="flex items-center gap-4 mt-3 transition-opacity">
                              {loggedInUser && (
                                <button 
                                  onClick={() => {
                                    setReplyingToId(reply.id);
                                    setReplyingToUser(reply.username);
                                    document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    setText('');
                                  }}
                                  className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                >
                                  <Reply className="w-3 h-3" /> Reply
                                </button>
                              )}
                              {(isAdmin || (loggedInUser && loggedInUser === reply.username)) && (
                                <>
                                  <button 
                                    onClick={() => startEditing(reply)}
                                    className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(reply.id)}
                                    className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </>
                              )}
                              </div>`;
code = code.replace(replyButtonsRegex, newReplyButtons);

fs.writeFileSync('src/components/CommentSection.tsx', code);
