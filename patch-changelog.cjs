const fs = require('fs');
let code = fs.readFileSync('src/components/ChangelogModal.tsx', 'utf8');

const newEntry = `    {
      version: 'v1.2.2',
      date: 'July 27, 2026',
      type: 'update',
      title: 'Snake & Ladders Visual Redesign',
      items: [
        'Updated Snakes and Ladders board design and graphics.',
        'Matched the underlying game logic (snakes & ladders positions) to the new custom board layout.',
        'Removed all pink dots from the game board.',
      ],
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      border: 'border-amber-200'
    },
`;

code = code.replace(/const changelogs = \[\n/, 'const changelogs = [\n' + newEntry);

fs.writeFileSync('src/components/ChangelogModal.tsx', code);
