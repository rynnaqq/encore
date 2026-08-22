import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LoginModal } from '../components/LoginModal';
import {
  fetchPublicProfilesFromSupabase,
  registerUserInSupabase,
  loginUserWithSupabase,
  changeUserPasswordInSupabase,
  deleteUserFromSupabase,
  updateUserRoleInSupabase
} from '../lib/supabaseAuth';
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
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addUser: (username: string, password: string, role: 'user' | 'admin') => Promise<{ success: boolean; message?: string }>;
  deleteUser: (username: string) => Promise<{ success: boolean; message?: string }>;
  updateUserRole: (username: string, role: 'user' | 'admin') => Promise<{ success: boolean; message?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    let fetchedUsers: User[] = [];

    // 1. Try Supabase public profiles first
    try {
      const remoteProfiles = await fetchPublicProfilesFromSupabase();
      if (remoteProfiles && remoteProfiles.length > 0) {
        fetchedUsers = remoteProfiles;
      }
    } catch (e) {
      console.warn('Supabase users refresh warning:', e);
    }

    // 2. Fallback to local server API if Supabase didn't yield profiles
    if (fetchedUsers.length === 0) {
      try {
        const res = await fetch('/api/auth/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            fetchedUsers = data;
          }
        }
      } catch (e) {
        // ignore server offline
      }
    }

    if (fetchedUsers.length > 0) {
      // Ensure AdminKawaaii is in the directory
      if (!fetchedUsers.some(u => u.username.toLowerCase() === 'adminkawaaii')) {
        fetchedUsers.unshift({ username: 'AdminKawaaii', role: 'admin', createdAt: Date.now() });
      }
      setUsers(fetchedUsers);
      try {
        localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(fetchedUsers));
      } catch (e) {
        // ignore
      }
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

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, message: 'Username dan password wajib diisi' };
    }

    // 1. Try local server API if running
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.token) setSessionToken(data.token);
          setIsLoginModalOpen(false);
          refreshUsersList();
          return { success: true };
        } else if (data.message) {
          return { success: false, message: data.message };
        }
      }
    } catch (e) {
      // Server API unreachable, fall through to Supabase direct auth
    }

    // 2. Direct Supabase Verification (Static frontend / Vercel deployment)
    const supabaseRes = await loginUserWithSupabase(cleanUsername, password);
    if (supabaseRes.success && supabaseRes.user) {
      setCurrentUser(supabaseRes.user);
      setIsLoginModalOpen(false);
      refreshUsersList();
      return { success: true };
    }

    return {
      success: false,
      message: supabaseRes.message || 'Username tidak ditemukan atau password salah.'
    };
  };

  const register = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      return { success: false, message: 'Username harus memiliki panjang 3-30 karakter' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return { success: false, message: 'Username hanya boleh berisi huruf, angka, dan underscore (_)' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'Password minimal 4 karakter' };
    }

    // 1. Try local server API if running
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.token) setSessionToken(data.token);
          setIsLoginModalOpen(false);
          refreshUsersList();
          return { success: true };
        } else if (data.message) {
          return { success: false, message: data.message };
        }
      }
    } catch (e) {
      // Server API unreachable, fall through to Supabase direct register
    }

    // 2. Direct Supabase Registration
    const isRootAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
    const supabaseRes = await registerUserInSupabase(cleanUsername, password, isRootAdmin ? 'admin' : 'user');
    if (supabaseRes.success && supabaseRes.user) {
      setCurrentUser(supabaseRes.user);
      setIsLoginModalOpen(false);
      refreshUsersList();
      return { success: true };
    }

    return {
      success: false,
      message: supabaseRes.message || 'Gagal mendaftarkan akun ke database'
    };
  };

  const logout = () => {
    setCurrentUser(null);
    setSessionToken(null);
  };

  const addUser = async (username: string, password: string, role: 'user' | 'admin'): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, message: 'Username dan password wajib diisi' };
    }

    // 1. Try local server API
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

      await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ username: cleanUsername, password, role })
      });
    } catch (e) {
      // ignore
    }

    // 2. Direct Supabase
    const res = await registerUserInSupabase(cleanUsername, password, role);
    refreshUsersList();
    return res;
  };

  const deleteUser = async (username: string): Promise<{ success: boolean; message?: string }> => {
    const clean = username.toLowerCase();
    if (clean === 'encore' || clean === 'developer' || clean === 'adminkawaaii') {
      return { success: false, message: 'Akun Master Developer tidak dapat dihapus' };
    }

    // 1. Try server API
    try {
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

      await fetch(`/api/auth/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers
      });
    } catch (e) {
      // ignore
    }

    // 2. Direct Supabase
    const res = await deleteUserFromSupabase(username);
    
    setUsers(prev => {
      const updated = prev.filter(u => u.username.toLowerCase() !== clean);
      try {
        localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.username.toLowerCase() === clean) {
      setCurrentUser(null);
      setSessionToken(null);
    }

    return res;
  };

  const updateUserRole = async (username: string, role: 'user' | 'admin'): Promise<{ success: boolean; message?: string }> => {
    const clean = username.toLowerCase();
    if (clean === 'encore' || clean === 'developer' || clean === 'adminkawaaii') {
      return { success: false, message: 'Role Akun Master Developer tidak dapat diubah' };
    }

    // 1. Try server API
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

      await fetch(`/api/auth/users/${encodeURIComponent(username)}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role })
      });
    } catch (e) {
      // ignore
    }

    // 2. Direct Supabase
    const res = await updateUserRoleInSupabase(username, role);

    setUsers(prev => {
      const updated = prev.map(u => u.username.toLowerCase() === clean ? { ...u, role } : u);
      try {
        localStorage.setItem(STORAGE_USERS_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser?.username.toLowerCase() === clean) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }

    return res;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Anda belum masuk ke akun' };

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'Password baru minimal 4 karakter' };
    }

    // 1. Try server API
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;

      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: currentUser.username,
          oldPassword,
          newPassword
        })
      });
    } catch (e) {
      // ignore
    }

    // 2. Direct Supabase
    return await changeUserPasswordInSupabase(currentUser.username, oldPassword, newPassword);
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
