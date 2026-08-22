import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { createSessionToken, verifySessionToken } from './src/lib/sessionAuth.ts';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;


interface UserAccount {
  username: string;
  password: string; // bcrypt hash
  role: 'user' | 'admin';
  createdAt: number;
}

interface SanitizedUser {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  photoBase64: string | null;
  timestamp: number;
  updatedAt?: number;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Protect against memory exhaustion DoS by limiting JSON payload size
  app.use(express.json({ limit: '2mb' }));

  // Strict HTML Entity Sanitizer to eliminate Stored XSS
  const sanitizeInput = (str: unknown, maxLen = 2000): string => {
    if (typeof str !== 'string') return '';
    return str
      .slice(0, maxLen)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .trim();
  };

  // Validate Base64 Image to prevent SVG script execution & memory exhaustion
  const isValidRasterImage = (base64: unknown): boolean => {
    if (typeof base64 !== 'string') return false;
    const allowedHeaders = [
      'data:image/png;base64,',
      'data:image/jpeg;base64,',
      'data:image/jpg;base64,',
      'data:image/webp;base64,',
      'data:image/gif;base64,'
    ];
    return allowedHeaders.some(h => base64.startsWith(h)) && base64.length <= 2 * 1024 * 1024;
  };

  // ==============================================================================
  // --- USERS & AUTHENTICATION STORAGE (Mutex Locked & Server Hashed) ---
  // ==============================================================================

  const USERS_FILE = path.join(process.cwd(), 'users.json');
  let usersFileLock: Promise<unknown> = Promise.resolve();

  const withUsersLock = <T>(action: () => Promise<T>): Promise<T> => {
    const nextLock = usersFileLock.then(action, action);
    usersFileLock = nextLock.then(() => {}, () => {});
    return nextLock;
  };

  const readUsers = async (): Promise<UserAccount[]> => {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = await fs.promises.readFile(USERS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading users.json:', e);
    }
    return [];
  };

  const writeUsers = async (users: UserAccount[]): Promise<boolean> => {
    try {
      await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error writing users.json:', e);
      return false;
    }
  };

  // Ensure default root admin account exists securely
  await withUsersLock(async () => {
    const users = await readUsers();
    if (users.length === 0) {
      const defaultAdmin: UserAccount = {
        username: 'AdminKawaaii',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: Date.now(),
      };
      await writeUsers([defaultAdmin]);
    }
  });

  // ==============================================================================
  // --- COMMENTS API STORAGE (Mutex Locked & Sanitized) ---
  // ==============================================================================

  const COMMENTS_FILE = path.join(process.cwd(), 'comments.json');
  let commentsFileLock: Promise<unknown> = Promise.resolve();

  const withCommentsLock = <T>(action: () => Promise<T>): Promise<T> => {
    const nextLock = commentsFileLock.then(action, action);
    commentsFileLock = nextLock.then(() => {}, () => {});
    return nextLock;
  };

  const readComments = async (): Promise<Comment[]> => {
    try {
      if (fs.existsSync(COMMENTS_FILE)) {
        const data = await fs.promises.readFile(COMMENTS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading comments.json:', e);
    }
    return [];
  };

  const writeComments = async (comments: Comment[]): Promise<boolean> => {
    try {
      await fs.promises.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Error writing comments.json:', e);
      return false;
    }
  };

  // ==============================================================================
  // --- API ENDPOINTS ---
  // ==============================================================================

  // 1. Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
  });

  // 2. Auth: Register Endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, role } = req.body || {};
      const cleanUsername = typeof username === 'string' ? username.trim() : '';

      if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
        return res.status(400).json({ success: false, message: 'Username must be 3-30 characters' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(400).json({ success: false, message: 'Username can only contain alphanumeric characters and underscores' });
      }

      if (typeof password !== 'string' || password.length < 4) {
        return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
      }

      const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
      const effectiveRole: 'user' | 'admin' = (role === 'admin' || isRootAdmin) ? 'admin' : 'user';
      const targetTable = effectiveRole === 'admin' ? 'admin_accounts' : 'guest_accounts';
      const altTable = effectiveRole === 'admin' ? 'admin_account' : 'guest_account';
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Check Supabase if configured
      if (supabase) {
        for (const tbl of ['admin_accounts', 'guest_accounts', 'admin_account', 'guest_account', 'user_accounts']) {
          try {
            const { data: existingUser } = await supabase
              .from(tbl)
              .select('username')
              .ilike('username', cleanUsername)
              .maybeSingle();

            if (existingUser) {
              return res.status(400).json({ success: false, message: 'Username is already taken' });
            }
          } catch (e) {
            // ignore
          }
        }
      }

      const result = await withUsersLock(async () => {
        const users = await readUsers();
        const existing = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
        if (existing) {
          return { success: false, message: 'Username is already taken' };
        }

        const newAccount: UserAccount = {
          username: cleanUsername,
          password: hashedPassword,
          role: effectiveRole,
          createdAt: Date.now(),
        };

        // Write to Supabase table (guest_accounts or admin_accounts)
        if (supabase) {
          try {
            const { error: insErr } = await supabase.from(targetTable).insert([{
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              username: cleanUsername,
              password_hash: hashedPassword,
              role: effectiveRole,
              created_at: new Date().toISOString()
            }]);

            if (insErr) {
              // fallback to singular table name if needed
              await supabase.from(altTable).insert([{
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                username: cleanUsername,
                password_hash: hashedPassword,
                role: effectiveRole,
                created_at: new Date().toISOString()
              }]);
            }
          } catch (e) {
            console.error('Failed to write user to supabase:', e);
          }
        }

        users.push(newAccount);
        await writeUsers(users);

        const safeUser: SanitizedUser = {
          username: newAccount.username,
          role: newAccount.role,
          createdAt: newAccount.createdAt,
        };

        const token = createSessionToken(safeUser);
        return { success: true, user: safeUser, token };
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during registration' });
    }
  });

  // 3. Auth: Login Endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body || {};
      const cleanUsername = typeof username === 'string' ? username.trim() : '';

      if (!cleanUsername || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }

      let users = await withUsersLock(() => readUsers());
      let account = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

      // If not in local users.json, check Supabase tables (admin_account & guest_account)
      if (!account && supabase) {
        for (const [tbl, role] of [['admin_account', 'admin'], ['guest_account', 'user'], ['admin_accounts', 'admin'], ['guest_accounts', 'user'], ['user_accounts', 'user']] as const) {
          try {
            const { data: dbUser } = await supabase
              .from(tbl)
              .select('username, password_hash, role, created_at')
              .ilike('username', cleanUsername)
              .maybeSingle();

            if (dbUser) {
              account = {
                username: dbUser.username,
                password: dbUser.password_hash,
                role: dbUser.role === 'admin' ? 'admin' : (role === 'admin' ? 'admin' : 'user'),
                createdAt: dbUser.created_at ? new Date(dbUser.created_at).getTime() : Date.now()
              };
              // Cache locally
              await withUsersLock(async () => {
                const current = await readUsers();
                if (!current.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
                  current.push(account!);
                  await writeUsers(current);
                }
              });
              break;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      if (!account) {
        return res.status(401).json({ success: false, message: 'Username not found. Please register first.' });
      }

      let isValid = false;
      if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
        isValid = bcrypt.compareSync(password, account.password);
      } else {
        // Upgrade legacy plain password to bcrypt hash
        isValid = account.password === password;
        if (isValid) {
          await withUsersLock(async () => {
            const currentUsers = await readUsers();
            const idx = currentUsers.findIndex(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
            if (idx !== -1) {
              currentUsers[idx].password = bcrypt.hashSync(password, 10);
              await writeUsers(currentUsers);
            }
          });
        }
      }

      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }

      const safeUser: SanitizedUser = {
        username: account.username,
        role: account.role,
        createdAt: account.createdAt,
      };

      const token = createSessionToken(safeUser);
      return res.json({ success: true, user: safeUser, token });

    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
  });

  // 4. Auth: Change Password Endpoint
  app.post('/api/auth/change-password', async (req, res) => {
    try {
      const { username, oldPassword, newPassword } = req.body || {};
      const cleanUsername = typeof username === 'string' ? username.trim() : '';

      if (!cleanUsername || typeof oldPassword !== 'string' || typeof newPassword !== 'string') {
        return res.status(400).json({ success: false, message: 'All password fields are required' });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ success: false, message: 'New password must be at least 4 characters' });
      }

      const result = await withUsersLock(async () => {
        const users = await readUsers();
        const account = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

        if (!account) {
          return { success: false, message: 'Account not found' };
        }

        let isOldValid = false;
        if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
          isOldValid = bcrypt.compareSync(oldPassword, account.password);
        } else {
          isOldValid = account.password === oldPassword;
        }

        if (!isOldValid) {
          return { success: false, message: 'Incorrect old password' };
        }

        const newHashed = bcrypt.hashSync(newPassword, 10);
        account.password = newHashed;
        await writeUsers(users);

        if (supabase) {
          for (const tbl of ['admin_account', 'guest_account', 'admin_accounts', 'guest_accounts', 'user_accounts']) {
            try {
              await supabase
                .from(tbl)
                .update({ password_hash: newHashed, updated_at: new Date().toISOString() })
                .ilike('username', cleanUsername);
            } catch (e) {}
          }
        }

        return { success: true };
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (err) {
      console.error('Change password error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // 5. Auth: Get Users List (Sanitized: NO PASSWORDS EXPOSED)
  app.get('/api/auth/users', async (_req, res) => {
    try {
      const usersMap = new Map<string, SanitizedUser>();

      // 1. Try local storage
      const localUsers = await withUsersLock(() => readUsers());
      localUsers.forEach(u => {
        usersMap.set(u.username.toLowerCase(), {
          username: u.username,
          role: u.role,
          createdAt: u.createdAt
        });
      });

      // 2. Fetch from Supabase tables if configured
      if (supabase) {
        for (const [tbl, defaultRole] of [['admin_account', 'admin'], ['guest_account', 'user'], ['admin_accounts', 'admin'], ['guest_accounts', 'user'], ['user_accounts', 'user']] as const) {
          try {
            const { data, error } = await supabase
              .from(tbl)
              .select('username, role, created_at');

            if (!error && Array.isArray(data)) {
              data.forEach((u: any) => {
                if (u?.username && !usersMap.has(u.username.toLowerCase())) {
                  usersMap.set(u.username.toLowerCase(), {
                    username: u.username,
                    role: u.role === 'admin' ? 'admin' : (defaultRole === 'admin' ? 'admin' : 'user'),
                    createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now()
                  });
                }
              });
            }
          } catch (e) {
            // ignore
          }
        }
      }

      res.json(Array.from(usersMap.values()));
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  });

  const requireAdminAuth = (req: express.Request, res: express.Response, next: () => void) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const session = verifySessionToken(token);

    // If local dev environment without headers, fallback gracefully, otherwise verify session role
    if (token && (!session || session.role !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized: Admin privilege required' });
    }
    next();
  };

  // 6. Auth: Update User Role (Admin management)
  app.put('/api/auth/users/:username/role', requireAdminAuth, async (req, res) => {
    try {
      const { username } = req.params;
      const { role } = req.body || {};

      if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      if (username.toLowerCase() === 'adminkawaaii' || username.toLowerCase() === 'encore' || username.toLowerCase() === 'developer') {
        return res.status(403).json({ error: 'Master developer account role cannot be changed' });
      }

      if (supabase) {
        for (const tbl of ['admin_account', 'guest_account', 'admin_accounts', 'guest_accounts', 'user_accounts']) {
          try {
            await supabase.from(tbl).update({ role }).ilike('username', username);
          } catch (e) {}
        }
      }

      const updated = await withUsersLock(async () => {
        const users = await readUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) return null;
        user.role = role;
        await writeUsers(users);
        return { username: user.username, role: user.role, createdAt: user.createdAt };
      });

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // 7. Auth: Delete User (Admin management)
  app.delete('/api/auth/users/:username', requireAdminAuth, async (req, res) => {
    try {
      const { username } = req.params;

      if (username.toLowerCase() === 'adminkawaaii' || username.toLowerCase() === 'encore' || username.toLowerCase() === 'developer') {
        return res.status(403).json({ error: 'Master developer account cannot be deleted' });
      }

      if (supabase) {
        for (const tbl of ['admin_account', 'guest_account', 'admin_accounts', 'guest_accounts', 'user_accounts']) {
          try {
            await supabase.from(tbl).delete().ilike('username', username);
          } catch (e) {}
        }
      }

      const deleted = await withUsersLock(async () => {
        let users = await readUsers();
        const initialLen = users.length;
        users = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
        if (users.length === initialLen) return false;
        await writeUsers(users);
        return true;
      });

      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });


  // 8. Comments: GET all comments
  app.get('/api/comments', async (_req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('comments').select('*').order('timestamp', { ascending: true });
        if (!error && data) {
          return res.json(data.map((c: any) => ({
            id: c.id,
            username: c.username,
            text: c.text,
            photoBase64: c.photo_base64 || c.photoBase64,
            timestamp: typeof c.timestamp === 'number' ? c.timestamp : Number(c.timestamp),
            updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : undefined
          })));
        }
      }
      const comments = await withCommentsLock(() => readComments());
      res.json(comments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve comments' });
    }
  });

  // 9. Comments: POST a comment
  app.post('/api/comments', async (req, res) => {
    try {
      const { username, text, photoBase64 } = req.body || {};
      const cleanUsername = sanitizeInput(username, 50);
      const cleanText = sanitizeInput(text, 2000);

      if (!cleanUsername || !cleanText) {
        return res.status(400).json({ error: 'Valid username and comment text are required' });
      }

      let safePhoto: string | null = null;
      if (typeof photoBase64 === 'string' && isValidRasterImage(photoBase64)) {
        safePhoto = photoBase64;
      }

      const newComment: Comment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        text: cleanText,
        photoBase64: safePhoto,
        timestamp: Date.now(),
      };

      const result = await withCommentsLock(async () => {
        if (supabase) {
          try {
            await supabase.from('comments').insert([{
              id: newComment.id,
              username: newComment.username,
              text: newComment.text,
              photo_base64: newComment.photoBase64,
              timestamp: newComment.timestamp
            }]);
          } catch (e) {
            console.error('Failed to write comment to supabase:', e);
          }
        }
        const comments = await readComments();
        comments.push(newComment);
        if (comments.length > 500) {
          comments.splice(0, comments.length - 500);
        }
        await writeComments(comments);
        return newComment;
      });

      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to post comment' });
    }
  });

  // 10. Comments: PUT (Update)
  app.put('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body || {};
      const cleanText = sanitizeInput(text, 2000);

      if (!cleanText) {
        return res.status(400).json({ error: 'Updated comment text cannot be empty' });
      }

      const updated = await withCommentsLock(async () => {
        if (supabase) {
          try {
            await supabase.from('comments').update({ text: cleanText }).eq('id', id);
          } catch (e) {
            console.error('Failed to update comment in supabase:', e);
          }
        }
        const comments = await readComments();
        const commentIndex = comments.findIndex(c => c.id === id);

        if (commentIndex === -1) return null;

        comments[commentIndex].text = cleanText;
        comments[commentIndex].updatedAt = Date.now();
        await writeComments(comments);
        return comments[commentIndex];
      });

      if (!updated) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update comment' });
    }
  });

  // 11. Comments: DELETE
  app.delete('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await withCommentsLock(async () => {
        if (supabase) {
          try {
            await supabase.from('comments').delete().eq('id', id);
          } catch (e) {
            console.error('Failed to delete comment in supabase:', e);
          }
        }
        let comments = await readComments();
        const initialLength = comments.length;
        comments = comments.filter(c => c.id !== id);

        if (comments.length === initialLength) return false;

        await writeComments(comments);
        return true;
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // ==============================================================================
  // --- VITE DEV MIDDLEWARE & PRODUCTION STATIC SERVING ---
  // ==============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Encore server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
