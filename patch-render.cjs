const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

const sortCode = `
  const sortedComments = [...comments].sort((a, b) => {
    const aPinned = a.text.startsWith('[PINNED]:');
    const bPinned = b.text.startsWith('[PINNED]:');
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });
`;

code = code.replace("  return (", sortCode + "\n  return (");

code = code.replace("{comments.map((comment, index)", "{sortedComments.map((comment, index)");

code = code.replace(
  `<p className="text-slate-600 text-sm whitespace-pre-wrap">{comment.text}</p>`,
  `{comment.text.startsWith('[PINNED]:') && (
                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-500 mb-1">
                          📌 Pinned by Admin
                        </div>
                      )}
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">
                        {comment.text.startsWith('[PINNED]:') ? comment.text.substring(9) : comment.text}
                      </p>`
);

// Conditionally render buttons only for admin
const buttonsCode = `
                  {isAdmin && (
                    <div className="flex items-center gap-3 mt-4 transition-opacity">
                      <button 
                        onClick={() => handlePin(comment.id)}
                        className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                      >
                        📌 {comment.text.startsWith('[PINNED]:') ? 'Unpin' : 'Pin'}
                      </button>
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
                    </div>
                  )}
`;

code = code.replace(
  /<div className="flex items-center gap-3 mt-4 transition-opacity">[\s\S]*?<\/div>/,
  buttonsCode
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
