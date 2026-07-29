const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `<div className="flex gap-4 mb-8">`,
  `<div className="flex flex-wrap justify-center gap-4 mb-8">`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
