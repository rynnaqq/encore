import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LoginModal } from '../components/LoginModal';
import { fetchPublicProfilesFromSupabase, registerGuestInSupabase } from '../lib/supabaseAuth';
import { registerAdminUsernames } from '../components/AdminBadge';

export interface User {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  sessionToken: string | null;
  isLoginModalOpen: boolean;
  openLoginModal: (onSuccessCallback?: () => void) => void;
  closeLoginModal: () => void;
  login: (username: string, password: string) => { success: boolean; message?: string };
  register: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (username: string, password: string, role: 'user' | 'admin') => { success: boolean; message?: string };
  deleteUser: (username: string) => { success: boolean; message?: string };
  updateUserRole: (username: string, role: 'user' | 'admin') => { success: boolean; message?: string };
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message?: string };
}

const STORAGE_CURRENT_USER_KEY = 'app_current_user_v3';
const STORAGE_USERS_CACHE_KEY = 'app_public_directory_v3';
const STORAGE_TOKEN_KEY = 'app_session_token_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge any legacy insecure password hash storage from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem('app_users_v3');
    } catch (e) {
      // ignore
    }
  }, []);

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading users cache:', e);
    }
    return [
      { username: 'AdminKawaaii', role: 'admin', createdAt: Date.now() }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading current user:', e);
    }
    return null;
  });

  const refreshUsersList = useCallback(async () => {
    try {
      // 1. Try local server API
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(data));
          return;
        }
      }
    } catch (e) {
      // ignore server offline
    }

    try {
      // 2. Fallback to Supabase public profiles
      const remoteProfiles = await fetchPublicProfilesFromSupabase();
      if (remoteProfiles.length > 0) {
        setUsers(remoteProfiles);
        localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(remoteProfiles));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshUsersList();
  }, [refreshUsersList]);

  useEffect(() => {
    try {
      const adminNames = users
        .filter((acc) => acc.role === 'admin')
        .map((acc) => acc.username);
      registerAdminUsernames(adminNames);
    } catch (e) {
      console.error('Error registering admin names:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      }
      if (sessionToken) {
        localStorage.setItem(STORAGE_TOKEN_KEY, sessionToken);
      } else {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Error persisting current user and token:', e);
    }
  }, [currentUser, sessionToken]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginSuccessCallback, setLoginSuccessCallback] = useState<(() => void) | null>(null);

  const openLoginModal = (callback?: () => void) => {
    if (typeof callback === 'function') {
      setLoginSuccessCallback(() => callback);
    } else {
      setLoginSuccessCallback(null);
    }
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginSuccessCallback(null);
  };

  const login = (username: string, password: string) => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, message: 'Username and password are required' };
    }

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password })
    }).then(res => res.json()).then(data => {
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.token) {
          setSessionToken(data.token);
        }
        refreshUsersList();
      }
    }).catch(() => {});

    // Responsive local fallback
    const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
    const existingUser = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());

    const userObj: User = {
      username: existingUser ? existingUser.username : cleanUsername,
      role: existingUser ? existingUser.role : (isRootAdmin ? 'admin' : 'user'),
      createdAt: existingUser ? existingUser.createdAt : Date.now(),
    };

    setCurrentUser(userObj);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const register = (username: string, password: string) => {
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters' };
    }

    const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
    const userObj: User = {
      username: cleanUsername,
      role: isRootAdmin ? 'admin' : 'user',
      createdAt: Date.now(),
    };

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password })
    }).then(res => res.json()).then(async data => {
      if (data.success && data.token) {
        setSessionToken(data.token);
        if (userObj.role === 'user') {
          await registerGuestInSupabase(cleanUsername);
        }
      }
      refreshUsersList();
    }).catch(() => {});

    setUsers(prev => {
      if (prev.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) return prev;
      const updated = [...prev, userObj];
      localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    setCurrentUser(userObj);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setSessionToken(null);
  };

  const addUser = (username: string, password: string, role: 'user' | 'admin') => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, message: 'Username and password are required' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

    fetch('/api/auth/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username: cleanUsername, password })
    }).then(res => res.json()).then(async () => {
      if (role === 'user') {
        await registerGuestInSupabase(cleanUsername);
      }
      refreshUsersList();
    }).catch(() => {});

    const newUser: User = {
      username: cleanUsername,
      role,
      createdAt: Date.now(),
    };

    setUsers(prev => {
      if (prev.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) return prev;
      const updated = [...prev, newUser];
      localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    return { success: true };
  };

  const deleteUser = (username: string) => {
    const clean = username.toLowerCase();
    if (clean === 'encore' || clean === 'developer' || clean === 'adminkawaaii') {
      return { success: false, message: 'Master account cannot be deleted' };
    }

    const headers: Record<string, string> = {};
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

    fetch(`/api/auth/users/${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers
    }).then(() => {
      refreshUsersList();
    }).catch(() => {});

    setUsers(prev => {
      const updated = prev.filter(u => u.username.toLowerCase() !== clean);
      localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (currentUser?.username.toLowerCase() === clean) {
      setCurrentUser(null);
      setSessionToken(null);
    }

    return { success: true };
  };

  const updateUserRole = (username: string, role: 'user' | 'admin') => {
    const clean = username.toLowerCase();
    if (clean === 'encore' || clean === 'developer' || clean === 'adminkawaaii') {
      return { success: false, message: 'Master account role cannot be changed' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

    fetch(`/api/auth/users/${encodeURIComponent(username)}/role`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role })
    }).then(() => {
      refreshUsersList();
    }).catch(() => {});

    setUsers(prev => {
      const updated = prev.map(u => u.username.toLowerCase() === clean ? { ...u, role } : u);
      localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (currentUser?.username.toLowerCase() === clean) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }

    return { success: true };
  };

  const changePassword = (oldPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters' };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

    fetch('/api/auth/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username: currentUser.username,
        oldPassword,
        newPassword
      })
    }).catch(() => {});

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        sessionToken,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        register,
        logout,
        addUser,
        deleteUser,
        updateUserRole,
        changePassword,
      }}
    >
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSuccess={loginSuccessCallback || undefined}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
