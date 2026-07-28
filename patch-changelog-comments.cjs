const fs = require('fs');
let code = fs.readFileSync('src/components/ChangelogModal.tsx', 'utf8');

const newEntry = `    {
      version: 'v1.3.0',
      date: 'July 28, 2026',
      type: 'feature',
      title: 'Community Comments Section',
      items: [
        'Added a new community comment section on the home page.',
        'Users can now leave comments with their username.',
        'Added support for uploading small photos in comments.',
        'Comments are saved persistently and can be edited (text only) or deleted.'
      ],
      icon: Sparkles,
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200'
    },
`;

code = code.replace(/const changelogs = \[\n/, 'const changelogs = [\n' + newEntry);

fs.writeFileSync('src/components/ChangelogModal.tsx', code);
