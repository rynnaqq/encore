import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

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
      const { username, password } = req.body || {};
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

      const result = await withUsersLock(async () => {
        const users = await readUsers();
        const existing = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
        if (existing) {
          return { success: false, message: 'Username is already taken' };
        }

        const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newAccount: UserAccount = {
          username: cleanUsername,
          password: hashedPassword,
          role: isRootAdmin ? 'admin' : 'user',
          createdAt: Date.now(),
        };

        users.push(newAccount);
        await writeUsers(users);

        const safeUser: SanitizedUser = {
          username: newAccount.username,
          role: newAccount.role,
          createdAt: newAccount.createdAt,
        };

        return { success: true, user: safeUser };
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

      const users = await withUsersLock(() => readUsers());
      const account = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

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

      return res.json({ success: true, user: safeUser });
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

        account.password = bcrypt.hashSync(newPassword, 10);
        await writeUsers(users);
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
      const users = await withUsersLock(() => readUsers());
      const sanitizedUsers: SanitizedUser[] = users.map(u => ({
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      }));
      res.json(sanitizedUsers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  });

  // 6. Auth: Update User Role (Admin management)
  app.put('/api/auth/users/:username/role', async (req, res) => {
    try {
      const { username } = req.params;
      const { role } = req.body || {};

      if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      if (username.toLowerCase() === 'adminkawaaii' || username.toLowerCase() === 'encore' || username.toLowerCase() === 'developer') {
        return res.status(403).json({ error: 'Master developer account role cannot be changed' });
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
  app.delete('/api/auth/users/:username', async (req, res) => {
    try {
      const { username } = req.params;

      if (username.toLowerCase() === 'adminkawaaii' || username.toLowerCase() === 'encore' || username.toLowerCase() === 'developer') {
        return res.status(403).json({ error: 'Master developer account cannot be deleted' });
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
