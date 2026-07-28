const fs = require('fs');
let code = fs.readFileSync('src/components/ChangelogModal.tsx', 'utf8');

const newEntry = `    {
      version: 'v1.2.3',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Logic Fixed',
      items: [
        'Updated Snakes and Ladders board logic to perfectly match the custom board image.',
        'Fixed board design issue where edges were cut off on some devices.',
      ],
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
`;

code = code.replace(/const changelogs = \[\n/, 'const changelogs = [\n' + newEntry);

fs.writeFileSync('src/components/ChangelogModal.tsx', code);
