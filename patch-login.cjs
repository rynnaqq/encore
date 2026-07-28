const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

// 1. Change username state
code = code.replace(
  "const [username, setUsername] = useState(isAdmin ? 'AdminKawaaii' : '');",
  `const [username, setUsername] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(isAdmin ? 'AdminKawaaii' : (typeof window !== 'undefined' ? localStorage.getItem('username') || '' : ''));`
);

// 2. Fix handleSubmit to use loggedInUser
code = code.replace(
  "if (!username.trim() || !text.trim()) return;",
  "if (!loggedInUser.trim() || !text.trim()) return;"
);
code = code.replace(
  "if (!isAdmin && username.trim().toLowerCase().includes('admin')) {",
  "if (!isAdmin && loggedInUser.trim().toLowerCase().includes('admin')) {"
);
code = code.replace(
  "username: username.trim(),",
  "username: loggedInUser.trim(),"
);

// 3. Add login/logout handlers
const handlers = `
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (!isAdmin && username.trim().toLowerCase().includes('admin')) {
      alert('You cannot use "Admin" in your username.');
      return;
    }
    localStorage.setItem('username', username.trim());
    setLoggedInUser(username.trim());
    setUsername('');
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setLoggedInUser('');
  };
`;

code = code.replace(
  "const handleSubmit = async (e: React.FormEvent) => {",
  handlers + "\n  const handleSubmit = async (e: React.FormEvent) => {"
);

// 4. Update the form UI
const formRegex = /<form onSubmit=\{handleSubmit\} className="space-y-4">[\s\S]*?<\/form>/;
const newFormUI = `
          {!loggedInUser ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Join the conversation</h3>
                <p className="text-slate-500 mb-6">Choose a username to start commenting</p>
                <div className="flex w-full max-w-sm gap-2">
                  <input
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors"
                    maxLength={30}
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  >
                    Log In
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 font-medium">Commenting as:</span>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {loggedInUser}
                  </span>
                </div>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Log Out
                  </button>
                )}
              </div>
              <div>
                <textarea
                  placeholder="Write your comment..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors resize-y min-h-[120px]"
                  maxLength={500}
                />
                <div className="text-right mt-1">
                  <span className={\`text-xs font-medium \${text.length >= 450 ? 'text-amber-500' : 'text-slate-400'}\`}>
                    {text.length}/500
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                  />
                  <label
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Attach Photo</span>
                  </label>
                  {photoBase64 && (
                    <div className="mt-3 relative inline-block">
                      <img src={photoBase64} alt="Preview" className="h-16 rounded-lg border border-slate-200 object-cover shadow-sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoBase64(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 transition-colors shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !loggedInUser.trim() || !text.trim()}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Posting...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
`;
code = code.replace(formRegex, newFormUI);

// 5. Update comment render actions for guests to edit/delete their own comments
// Currently:
// {isAdmin && (
//   <div className="flex items-center gap-3 mt-4 transition-opacity">

const oldButtons = /{isAdmin && \([\s\S]*?<\/div>\s*\)\}/;
const newButtons = `{(isAdmin || (loggedInUser && loggedInUser === comment.username)) && (
                    <div className="flex items-center gap-3 mt-4 transition-opacity">
                      {isAdmin && (
                        <button 
                          onClick={() => handlePin(comment.id)}
                          className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                        >
                          {comment.text.startsWith('[PINNED]:') ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                        </button>
                      )}
                      <button 
                        onClick={() => startEditing(comment)}
                        className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}`;
code = code.replace(oldButtons, newButtons);

fs.writeFileSync('src/components/CommentSection.tsx', code);
