const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

const badCode = `{comment.text.startsWith('[PINNED]:') && (
                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-500 mb-1">
                          📌 Pinned by Admin
                        </div>
                      )}
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">
                        {comment.text.startsWith('[PINNED]:') ? comment.text.substring(9) : comment.text}
                      </p>`;

const goodCode = `<>
                      {comment.text.startsWith('[PINNED]:') && (
                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-500 mb-1">
                          📌 Pinned by Admin
                        </div>
                      )}
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">
                        {comment.text.startsWith('[PINNED]:') ? comment.text.substring(9) : comment.text}
                      </p>
                      </>`;

code = code.replace(badCode, goodCode);

fs.writeFileSync('src/components/CommentSection.tsx', code);
