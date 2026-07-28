const fs = require('fs');
let code = fs.readFileSync('src/components/CommentSection.tsx', 'utf8');

// 1. Add password, isLoginMode, authError states
code = code.replace(
  "const [loggedInUser, setLoggedInUser] = useState(isAdmin ? 'AdminKawaaii' : (typeof window !== 'undefined' ? localStorage.getItem('username') || '' : ''));",
  `const [loggedInUser, setLoggedInUser] = useState(isAdmin ? 'AdminKawaaii' : (typeof window !== 'undefined' ? localStorage.getItem('username') || '' : ''));
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');`
);

// 2. Replace handleLogin and handleLogout
const authHandlers = `
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required');
      return;
    }
    
    if (!isAdmin && username.trim().toLowerCase().includes('admin')) {
      setAuthError('You cannot use "Admin" in your username.');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      if (isLoginMode) {
        // Log in
        const { data, error } = await supabase
          .from('comment_users')
          .select('*')
          .eq('username', username.trim())
          .eq('password', password)
          .single();

        if (error || !data) {
          setAuthError('Invalid username or password. (Note: Ensure comment_users table exists with username and password columns)');
          return;
        }

        localStorage.setItem('username', username.trim());
        setLoggedInUser(username.trim());
        setUsername('');
        setPassword('');
      } else {
        // Sign up
        const { data: existingUser } = await supabase
          .from('comment_users')
          .select('username')
          .eq('username', username.trim())
          .single();
          
        if (existingUser) {
          setAuthError('Username already taken');
          return;
        }

        const { error } = await supabase
          .from('comment_users')
          .insert([{ username: username.trim(), password: password }]);

        if (error) {
          setAuthError('Signup failed: ' + error.message + ' (Note: Ensure comment_users table exists)');
          return;
        }

        localStorage.setItem('username', username.trim());
        setLoggedInUser(username.trim());
        setUsername('');
        setPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    setLoggedInUser('');
  };
`;

code = code.replace(
  /  const handleLogin = \(e: React\.FormEvent\) => \{[\s\S]*?const handleLogout = \(\) => \{[\s\S]*?\};\n/,
  authHandlers
);

// 3. Replace the form UI
const formRegex = /<form onSubmit=\{handleLogin\} className="space-y-4">[\s\S]*?<\/form>/;
const newFormUI = `
            <form onSubmit={handleAuth} className="space-y-4 max-w-md mx-auto bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-slate-500 text-sm">{isLoginMode ? 'Log in to continue commenting' : 'Sign up to start commenting'}</p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold text-center border border-rose-100">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors"
                    maxLength={30}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {isLoginMode ? 'Log In' : 'Sign Up'}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setAuthError('');
                  }}
                  className="text-sm font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  {isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
              </div>
            </form>
`;

code = code.replace(formRegex, newFormUI);

fs.writeFileSync('src/components/CommentSection.tsx', code);
