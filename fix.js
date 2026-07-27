const fs = require('fs');
let code = fs.readFileSync('src/components/ChessGameSection.tsx', 'utf8');
const lines = code.split('\n');
const fixedLines = lines.slice(0, lines.length - 8); // remove the last 8 lines
fixedLines.push("          document.body");
fixedLines.push("        )}");
fixedLines.push("      </div>");
fixedLines.push("    </section>");
fixedLines.push("  );");
fixedLines.push("};");
fs.writeFileSync('src/components/ChessGameSection.tsx', fixedLines.join('\n'));
