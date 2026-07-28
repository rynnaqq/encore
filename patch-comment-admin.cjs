const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

code = code.replace(
  "const [username, setUsername] = useState('');",
  `const isAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === 'true';
  const [username, setUsername] = useState(isAdmin ? 'Admin kawaii' : '');`
);

code = code.replace(
  `<input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-800"
                />`,
  `<input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name"
                  readOnly={isAdmin}
                  className={\`w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 outline-none transition-all font-medium text-slate-800 \${isAdmin ? 'opacity-75 cursor-not-allowed' : 'focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'}\`}
                />`
);

fs.writeFileSync('src/components/CommentSection.tsx', code);
