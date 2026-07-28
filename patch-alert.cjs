const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  "alert('Failed to post comment. Image might be too large.');",
  "const errorText = await res.text();\n        alert(`Failed to post comment. Status: ${res.status} ${res.statusText}. Error: ${errorText}`);"
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
