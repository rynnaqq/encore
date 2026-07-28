const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  "alert('Failed to post comment. Image might be too large.');",
  "const errText = await res.text();\n        console.error('Response failed:', res.status, errText);\n        alert(`Failed to post comment (Status: ${res.status}). ${errText || 'Image might be too large.'}`);"
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
