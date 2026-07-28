const fs = require('fs');
let code = fs.readFileSync('src/components/ChangelogModal.tsx', 'utf8');

const newEntry = `    {
      version: 'v1.2.1',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Visual Overhaul',
      items: [
        'Improved visuals for snakes and ladders on the board.',
        'Removed pink dotted background for better clarity.',
        'Optimized animations for low-end devices.'
      ],
      icon: Sparkles,
      color: 'text-pink-500',
      bg: 'bg-pink-100',
      border: 'border-pink-200'
    },
`;

code = code.replace(/const changelogs = \[\n/, 'const changelogs = [\n' + newEntry);

fs.writeFileSync('src/components/ChangelogModal.tsx', code);
