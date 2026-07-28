const fs = require('fs');
let code = fs.readFileSync('src/components/ChangelogModal.tsx', 'utf8');

const newEntry = `    {
      version: 'v1.2.4',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Logic Finalized',
      items: [
        'Updated Snakes and Ladders coordinates logic.',
      ],
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
`;

code = code.replace(/const changelogs = \[\n/, 'const changelogs = [\n' + newEntry);

fs.writeFileSync('src/components/ChangelogModal.tsx', code);
