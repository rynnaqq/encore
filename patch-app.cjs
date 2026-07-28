const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { AboutSection } from './components/AboutSection';", 
  "import { AboutSection } from './components/AboutSection';\nimport { CommentSection } from './components/CommentSection';"
);

code = code.replace(
  "<AboutSection onOpenModal={handleOpenAboutModal} />\n            </motion.div>",
  "<AboutSection onOpenModal={handleOpenAboutModal} />\n              <CommentSection />\n            </motion.div>"
);

fs.writeFileSync('src/App.tsx', code);
