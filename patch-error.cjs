const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  "console.error('Error posting comment:', error);",
  "console.error('Error posting comment:', error);\n      alert('Failed to post comment. Please try again.');"
);

code = code.replace(
  "if (fileInputRef.current) fileInputRef.current.value = '';\n      }\n    } catch (error)",
  "if (fileInputRef.current) fileInputRef.current.value = '';\n      } else {\n        alert('Failed to post comment. Image might be too large.');\n      }\n    } catch (error)"
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
