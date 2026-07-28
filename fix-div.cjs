const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

code = code.replace(/<\/div>\n\s*\}\)\n\n\s*\{typeof document !== 'undefined'/m, 
`</div>
        )}
      </div>

      {/* Winner Modal */}
      {typeof document !== 'undefined'`);

fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
