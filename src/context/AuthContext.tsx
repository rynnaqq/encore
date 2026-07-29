import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

interface StoredUserAccount extends User {
  password: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => { success: boolean; message?: string };
  register: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (username: string, password: string, role: 'user' | 'admin') => { success: boolean; message?: string };
  deleteUser: (username: string) => { success: boolean; message?: string };
  updateUserRole: (username: string, role: 'user' | 'admin') => { success: boolean; message?: string };
}

const STORAGE_USERS_KEY = 'app_users_v1';
const STORAGE_CURRENT_USER_KEY = 'app_current_user_v1';

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    username: 'player1',
    password: 'password123',
    role: 'user',
    createdAt: Date.now() - 86400000 * 7,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedAccounts, setStoredAccounts] = useState<StoredUserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(storedAccounts));
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

    // Allow admin123 or seramaula432 for admin
    const isAdminAccount = account.username.toLowerCase() === 'admin';
    const isPasswordValid =
      account.password === password || (isAdminAccount && password === 'seramaula432');

    if (!isPasswordValid) {
      return { success: false, message: 'Incorrect password' };
    }

    const userObj: User = {
      username: account.username,
      role: account.role,
      createdAt: account.createdAt,
    };

    setCurrentUser(userObj);
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

    const isFirstAdmin = cleanUsername.toLowerCase() === 'admin';
    const newAccount: StoredUserAccount = {
      username: cleanUsername,
      password,
      role: isFirstAdmin ? 'admin' : 'user',
      createdAt: Date.now(),
    };

    const updated = [...storedAccounts, newAccount];
    setStoredAccounts(updated);

    const userObj: User = {
      username: newAccount.username,
      role: newAccount.role,
      createdAt: newAccount.createdAt,
    };

    setCurrentUser(userObj);
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

    const newAccount: StoredUserAccount = {
      username: cleanUsername,
      password,
      role,
      createdAt: Date.now(),
    };

    setStoredAccounts((prev) => [...prev, newAccount]);
    return { success: true };
  };

  const deleteUser = (username: string) => {
    if (username.toLowerCase() === 'admin') {
      return { success: false, message: 'Cannot delete primary admin user' };
    }

    setStoredAccounts((prev) => prev.filter((u) => u.username.toLowerCase() !== username.toLowerCase()));

    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      setCurrentUser(null);
    }

    return { success: true };
  };

  const updateUserRole = (username: string, role: 'user' | 'admin') => {
    setStoredAccounts((prev) =>
      prev.map((acc) => {
        if (acc.username.toLowerCase() === username.toLowerCase()) {
          return { ...acc, role };
        }
        return acc;
      })
    );

    if (currentUser?.username.toLowerCase() === username.toLowerCase()) {
      setCurrentUser({ ...currentUser, role });
    }

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
        login,
        register,
        logout,
        addUser,
        deleteUser,
        updateUserRole,
      }}
    >
      {children}
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
