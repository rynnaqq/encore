import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { LoginModal } from '../components/LoginModal';
import {
  fetchUsersFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  updateUserRoleInSupabase,
  StoredUserAccount,
  DEFAULT_USERS,
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

const STORAGE_USERS_KEY = 'app_users_v3';
const STORAGE_CURRENT_USER_KEY = 'app_current_user_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedAccounts, setStoredAccounts] = useState<StoredUserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return [];
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

  // Sync state with Supabase database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseAccounts() {
      const remoteUsers = await fetchUsersFromSupabase();
      if (isMounted) {
        setStoredAccounts(remoteUsers || []);
      }
    }
    loadSupabaseAccounts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(storedAccounts));
      // Register all admin usernames so isAdminName returns true for them in games
      const adminNames = storedAccounts
        .filter((acc) => acc.role === 'admin')
        .map((acc) => acc.username);
      registerAdminUsernames(adminNames);
    } catch (e) {
      console.error('Error persisting users:', e);
    }
  }, [storedAccounts]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Error persisting current user:', e);
    }
  }, [currentUser]);

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

    const account = storedAccounts.find(
      (acc) => acc.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!account) {
      return { success: false, message: 'Username not found. Please register first.' };
    }

    // Password verification against account password
    let isPasswordValid = false;
    let needsHashing = false;

    if (account.password && (account.password.startsWith('$2a$') || account.password.startsWith('$2b$'))) {
      isPasswordValid = bcrypt.compareSync(password, account.password);
    } else {
      isPasswordValid = account.password === password;
      if (isPasswordValid) {
        needsHashing = true;
      }
    }

    if (!isPasswordValid) {
      return { success: false, message: 'Incorrect password' };
    }

    if (needsHashing) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const updatedAccount = { ...account, password: hashedPassword };
      setStoredAccounts((prev) =>
        prev.map((a) => (a.username.toLowerCase() === updatedAccount.username.toLowerCase() ? updatedAccount : a))
      );
      saveUserToSupabase(updatedAccount);
    }

    const userObj: User = {
      username: account.username,
      role: account.role,
      createdAt: account.createdAt,
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

    const existing = storedAccounts.find(
      (acc) => acc.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (existing) {
      return { success: false, message: 'Username is already taken' };
    }

    const isFirstAdmin = cleanUsername.toLowerCase() === 'adminkawaaii';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAccount: StoredUserAccount = {
      username: cleanUsername,
      password: hashedPassword,
      role: isFirstAdmin ? 'admin' : 'user',
      createdAt: Date.now(),
    };

    const updated = [...storedAccounts, newAccount];
    setStoredAccounts(updated);

    // Save asynchronously to Supabase database
    saveUserToSupabase(newAccount);

    const userObj: User = {
      username: newAccount.username,
      role: newAccount.role,
      createdAt: newAccount.createdAt,
    };

    setCurrentUser(userObj);
    setIsLoginModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (username: string, password: string, role: 'user' | 'admin') => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, message: 'Username and password are required' };
    }

    const existing = storedAccounts.find(
      (acc) => acc.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (existing) {
      return { success: false, message: 'User already exists' };
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAccount: StoredUserAccount = {
      username: cleanUsername,
      password: hashedPassword,
      role,
      createdAt: Date.now(),
    };

    setStoredAccounts((prev) => [...prev, newAccount]);

    // Save asynchronously to Supabase database
    saveUserToSupabase(newAccount);

    return { success: true };
  };

  const deleteUser = (username: string) => {
    setStoredAccounts((prev) => prev.filter((u) => u.username.toLowerCase() !== username.toLowerCase()));

    // Delete asynchronously from Supabase database
    deleteUserFromSupabase(username);

    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      setCurrentUser(null);
    }

    return { success: true };
  };

  const updateUserRole = (username: string, role: 'user' | 'admin') => {
    let accountToUpdate: StoredUserAccount | undefined;

    setStoredAccounts((prev) =>
      prev.map((acc) => {
        if (acc.username.toLowerCase() === username.toLowerCase()) {
          const updated = { ...acc, role };
          accountToUpdate = updated;
          return updated;
        }
        return acc;
      })
    );

    // Update asynchronously in Supabase database
    if (accountToUpdate) {
      updateUserRoleInSupabase(username, role, accountToUpdate.password);
    }

    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      setCurrentUser({ ...currentUser, role });
    }

    return { success: true };
  };

  const changePassword = (oldPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };

    const account = storedAccounts.find(
      (acc) => acc.username.toLowerCase() === currentUser.username.toLowerCase()
    );

    if (!account) return { success: false, message: 'Account not found' };

    let isPasswordValid = false;
    if (account.password && (account.password.startsWith('$2a$') || account.password.startsWith('$2b$'))) {
      isPasswordValid = bcrypt.compareSync(oldPassword, account.password);
    } else {
      isPasswordValid = account.password === oldPassword;
    }

    if (!isPasswordValid) return { success: false, message: 'Incorrect old password' };

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters' };
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const updatedAccount = { ...account, password: hashedPassword };

    setStoredAccounts((prev) =>
      prev.map((a) => (a.username.toLowerCase() === updatedAccount.username.toLowerCase() ? updatedAccount : a))
    );
    saveUserToSupabase(updatedAccount);

    return { success: true };
  };

  const users: User[] = storedAccounts.map((acc) => ({
    username: acc.username,
    role: acc.role,
    createdAt: acc.createdAt,
  }));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
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

