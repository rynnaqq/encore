const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

// 1. Add Reply and MessageSquare to imports
code = code.replace(
  "import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon, Pin, PinOff } from 'lucide-react';",
  "import { Send, Upload, Edit2, Trash2, X, Image as ImageIcon, Pin, PinOff, Reply, MessageSquare } from 'lucide-react';"
);

// 2. Add parser functions outside the component
const parsers = `
const parseCommentText = (rawText: string) => {
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
};
`;
code = code.replace(
  "export const CommentSection: React.FC = () => {",
  parsers + "\nexport const CommentSection: React.FC = () => {"
);

// 3. Add replyingToId state
code = code.replace(
  "const [isSubmitting, setIsSubmitting] = useState(false);",
  "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [replyingToId, setReplyingToId] = useState<string | null>(null);"
);

// 4. Update handleSubmit
const oldHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
        setIsSubmitting(false);
        return;
      }
      
      const newComment = {
        id: Date.now().toString(),
        username: loggedInUser.trim(),
        text: text.trim(),
        photo_base64: photoBase64,
        timestamp: Date.now()
      };`;

const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInUser.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        alert('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
        setIsSubmitting(false);
        return;
      }
      
      const serializedText = serializeCommentText(text.trim(), false, replyingToId);
      
      const newComment = {
        id: Date.now().toString(),
        username: loggedInUser.trim(),
        text: serializedText,
        photo_base64: photoBase64,
        timestamp: Date.now()
      };`;

code = code.replace(oldHandleSubmit, newHandleSubmit);

// 5. Also need to fix setText and setReplyingToId on success
code = code.replace(
  `        setText('');
        setPhotoBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {`,
  `        setText('');
        setPhotoBase64(null);
        setReplyingToId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {`
);

// 6. Update handleEditSubmit and handlePin
// Since we now have parseCommentText, we can use it to safely edit text.
code = code.replace(
  `      const comment = comments.find(c => c.id === id);
      const isPinned = comment?.text.startsWith('[PINNED]:');
      const finalString = isPinned ? '[PINNED]:' + editText.trim() : editText.trim();`,
  `      const comment = comments.find(c => c.id === id);
      if (!comment) return;
      const { isPinned, parentId } = parseCommentText(comment.text);
      const finalString = serializeCommentText(editText.trim(), isPinned, parentId);`
);

code = code.replace(
  `      const isPinned = comment.text.startsWith('[PINNED]:');
      const finalString = isPinned ? comment.text.substring(9) : '[PINNED]:' + comment.text;`,
  `      const { isPinned, parentId, text } = parseCommentText(comment.text);
      const finalString = serializeCommentText(text, !isPinned, parentId);`
);

// startEditing also needs parsing
code = code.replace(
  `    setEditText(comment.text.startsWith('[PINNED]:') ? comment.text.substring(9) : comment.text);`,
  `    setEditText(parseCommentText(comment.text).text);`
);

// 7. Update comments mapping
// We need to parse all comments and organize them into top level and replies
// Right now we have sortedComments.
const sortAndMap = `  const sortedComments = [...comments].sort((a, b) => {
    const aPinned = a.text.startsWith('[PINNED]:');
    const bPinned = b.text.startsWith('[PINNED]:');
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });`;

const newSortAndMap = `  const commentsWithMeta = comments.map(c => {
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

code = code.replace(sortAndMap, newSortAndMap);

// 8. Update UI mapping
// Replace sortedComments.map with topLevelComments.map
const uiRenderBlock = /{sortedComments\.map\(\(comment, index\) => \([\s\S]*?<\/motion\.div>\s*\)\)}/s;
const newUiRenderBlock = `{topLevelComments.map((comment, index) => {
                const threadReplies = repliesByParentId[comment.id] || [];
                
                return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-3"
                >
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4 group">
                    {comment.username === 'AdminKawaaii' ? (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-indigo-200">
                        <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className={comment.username === 'AdminKawaaii' ? "font-bold text-red-600" : "font-bold text-slate-800"}>
                            {comment.username}
                          </h4>
                          <span className={\`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full \${
                            comment.username === 'AdminKawaaii' 
                              ? "bg-red-100 text-red-600" 
                              : "bg-slate-100 text-slate-500"
                          }\`}>
                            {comment.username === 'AdminKawaaii' ? 'Admin' : 'Guest'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {editingId === comment.id ? (
                        <div className="mt-2 space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-indigo-400 outline-none text-sm text-slate-700"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSubmit(comment.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                        {comment.isPinned && (
                          <div className="flex items-center gap-1 text-xs font-bold text-indigo-500 mb-1">
                            <Pin className="w-3 h-3" /> Pinned by Admin
                          </div>
                        )}
                        <p className="text-slate-600 text-sm whitespace-pre-wrap">
                          {comment.parsedText}
                        </p>
                        </>
                      )}
                      
                      {comment.photoBase64 && (
                        <div className="mt-3">
                          <img 
                             src={comment.photoBase64} 
                             alt="Attached" 
                             className="max-h-48 rounded-xl border border-slate-200 object-cover shadow-sm"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-4 transition-opacity">
                        {loggedInUser && (
                          <button 
                            onClick={() => {
                              setReplyingToId(comment.id);
                              document.getElementById('comment-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setText('');
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                        )}
                        {(isAdmin || (loggedInUser && loggedInUser === comment.username)) && (
                          <>
                            {isAdmin && (
                              <button 
                                onClick={() => handlePin(comment.id)}
                                className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                              >
                                {comment.isPinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                              </button>
                            )}
                            <button 
                              onClick={() => startEditing(comment)}
                              className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies List */}
                  {threadReplies.length > 0 && (
                    <div className="ml-8 pl-4 border-l-2 border-slate-100 space-y-3">
                      {threadReplies.map(reply => (
                        <div key={reply.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                          {reply.username === 'AdminKawaaii' ? (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border border-indigo-200">
                              <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0">
                              {reply.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className={reply.username === 'AdminKawaaii' ? "font-bold text-sm text-red-600" : "font-bold text-sm text-slate-800"}>
                                  {reply.username}
                                </h4>
                                <span className={\`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full \${
                                  reply.username === 'AdminKawaaii' 
                                    ? "bg-red-100 text-red-600" 
                                    : "bg-slate-200 text-slate-500"
                                }\`}>
                                  {reply.username === 'AdminKawaaii' ? 'Admin' : 'Guest'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(reply.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            {editingId === reply.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-400 outline-none text-sm text-slate-700"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSubmit(reply.id)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-600 text-sm whitespace-pre-wrap">
                                {reply.parsedText}
                              </p>
                            )}

                            {reply.photoBase64 && (
                              <div className="mt-2">
                                <img 
                                   src={reply.photoBase64} 
                                   alt="Attached" 
                                   className="max-h-32 rounded-lg border border-slate-200 object-cover shadow-sm"
                                />
                              </div>
                            )}

                            {(isAdmin || (loggedInUser && loggedInUser === reply.username)) && (
                              <div className="flex items-center gap-3 mt-3 transition-opacity">
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
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );})}`;
code = code.replace(uiRenderBlock, newUiRenderBlock);

// 9. Add ID to comment form and add replyingTo display
code = code.replace(
  '<form onSubmit={handleSubmit} className="space-y-4">',
  `<form onSubmit={handleSubmit} className="space-y-4" id="comment-form-section">
              {replyingToId && (
                <div className="flex items-center justify-between bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Replying to comment...</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setReplyingToId(null)}
                    className="p-1 hover:bg-indigo-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}`
);

// We need to use exact matching for Comment Form wrapper to add id="comment-form-section" if we didn't match exactly.
// Actually adding it to the form is good enough since scrollIntoView gets it.

fs.writeFileSync('src/components/CommentSection.tsx', code);
