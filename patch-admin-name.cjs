const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  "useState(isAdmin ? 'Admin kawaii' : '');",
  "useState(isAdmin ? 'AdminKawaaii' : '');"
);

const avatarReplacement = `
                  {comment.username === 'AdminKawaaii' ? (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-indigo-200">
                      <img src="/assets/images/favicon.png" alt="Admin" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0">
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                  )}
`;

code = code.replace(
  /<div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center shrink-0">\s*\{comment\.username\.charAt\(0\)\.toUpperCase\(\)\}\s*<\/div>/,
  avatarReplacement
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
