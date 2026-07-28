const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  'className="flex items-center gap-3 mt-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"',
  'className="flex items-center gap-3 mt-4 transition-opacity"'
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
