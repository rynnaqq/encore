import React, { useState, useEffect } from 'react';
import { getSupabaseClient, getSupabaseCredentials } from '../lib/supabaseClient';
import { Trash2, Users, MessageSquare, Shield, KeyRound, UserPlus, Search, LogOut, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Sparkles, Activity } from 'lucide-react';
import { useAuth, User } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  username: string;
  text: string;
  photoBase64: string | null;
  timestamp: number;
}

export const AdminPage: React.FC = () => {
  const { currentUser, users, addUser, deleteUser, updateUserRole, login, logout } = useAuth();
  
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'comments'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Add user modal / state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin session authentication
  const isAdminAuthenticated = currentUser?.role === 'admin';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login('AdminKawaaii', adminPassword);
    if (!res.success) {
      alert(res.message || 'Password Admin salah!');
    }
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const supabase = getSupabaseClient();
      let rawData: any[] | null = null;

      // 1. Try Supabase SDK
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('timestamp', { ascending: false });

          if (!error && Array.isArray(data) && data.length > 0) {
            rawData = data;
          }
        } catch (e) {
          console.warn('Supabase SDK fetch failed in AdminPage:', e);
        }
      }

      // 2. Try Direct REST API
      if (!rawData || rawData.length === 0) {
        try {
          const { url, key } = getSupabaseCredentials();
          if (url && key) {
            const restRes = await fetch(`${url}/rest/v1/comments?select=*&order=timestamp.desc`, {
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`
              }
            });
            if (restRes.ok) {
              const resData = await restRes.json();
              if (Array.isArray(resData) && resData.length > 0) {
                rawData = resData;
              }
            }
          }
        } catch (e) {
          console.warn('Direct REST fetch failed in AdminPage:', e);
        }
      }

      // 3. Try local /api/comments
      if (!rawData || rawData.length === 0) {
        try {
          const res = await fetch('/api/comments');
          if (res.ok) {
            const localData = await res.json();
            if (Array.isArray(localData) && localData.length > 0) {
              rawData = localData;
            }
          }
        } catch (e) {
          // ignore
        }
      }
        
      if (rawData && Array.isArray(rawData)) {
        setComments(rawData.map((c: any) => ({
          id: String(c.id || Date.now()),
          username: String(c.username || 'Anonymous'),
          text: String(c.text || ''),
          photoBase64: c.photo_base64 || c.photoBase64 || null,
          timestamp: typeof c.timestamp === 'number' ? c.timestamp : Number(c.timestamp) || Date.now()
        })));
      }
    } catch (error) {
      console.error('Error fetching comments in AdminPage:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchComments();
    }
  }, [isAdminAuthenticated]);

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;
    
    try {
      const supabase = getSupabaseClient();
      const { url, key } = getSupabaseCredentials();
      let success = false;

      if (supabase) {
        try {
          const { error } = await supabase.from('comments').delete().eq('id', id);
          if (!error) success = true;
        } catch (e) {
          console.warn('Supabase SDK delete failed:', e);
        }
      }

      if (!success && url && key) {
        try {
          const restRes = await fetch(`${url}/rest/v1/comments?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            }
          });
          if (restRes.ok) success = true;
        } catch (e) {
          console.warn('Direct REST delete failed:', e);
        }
      }

      if (!success) {
        try {
          const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
          if (res.ok) success = true;
        } catch (e) {
          // ignore
        }
      }

      if (success) {
        setComments(comments.filter(c => c.id !== id));
      } else {
        alert('Gagal menghapus komentar. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);

    const res = await addUser(newUsername, newPassword, newRole);
    if (res.success) {
      setUserActionMsg({ type: 'success', text: `User "${newUsername}" berhasil dibuat!` });
      setNewUsername('');
      setNewPassword('');
    } else {
      setUserActionMsg({ type: 'error', text: res.message || 'Gagal membuat user' });
    }
  };

  const handleDeleteUserClick = async (targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'adminkawaaii') {
      alert('User admin utama tidak dapat dihapus!');
      return;
    }
    if (!confirm(`Hapus akun user "${targetUsername}"?`)) return;

    const res = await deleteUser(targetUsername);
    if (res.success) {
      setUserActionMsg({ type: 'success', text: `User "${targetUsername}" telah dihapus.` });
    } else {
      setUserActionMsg({ type: 'error', text: res.message || 'Gagal menghapus user' });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-16 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl z-10"
        >
          <div className="w-14 h-14 bg-[#E195AB]/10 text-[#E195AB] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E195AB]/25">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1 text-center tracking-tight">Admin Portal</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-6 leading-relaxed">
            Masukkan password master admin untuk mengakses dashboard
          </p>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                Password Admin
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? "text" : "password"}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:border-[#E195AB] focus:ring-2 focus:ring-[#E195AB]/20 outline-none transition-all text-sm"
                  placeholder="Masukkan password admin"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#E195AB] hover:bg-[#d68097] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
            >
              Masuk Ke Dashboard Admin
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="p-1.5 sm:p-2 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/40 shadow-xs"
        >
          <div className="p-5 sm:p-6 rounded-[calc(1.5rem-0.375rem)] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E195AB]/10 text-[#E195AB] border border-[#E195AB]/25 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Admin Dashboard</h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E195AB]/10 text-[#E195AB] border border-[#E195AB]/20 uppercase">
                    Root
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                  Manajemen akun pemain, moderasi komentar, dan pemantauan sistem
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {currentUser.username}
              </span>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E195AB]/10 text-[#E195AB] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{users.length}</div>
              <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Akun</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{adminCount}</div>
              <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admin Role</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{comments.length}</div>
              <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Komentar Aktif</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#E195AB] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Kelola User ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-[#E195AB] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Moderasi Komentar ({comments.length})
          </button>
        </div>

        {/* TAB 1: User Management */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Create New User Box */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 tracking-tight">
                <UserPlus className="w-4 h-4 text-[#E195AB]" /> Tambah User Baru
              </h3>

              {userActionMsg && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2 ${
                    userActionMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                  }`}
                >
                  {userActionMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{userActionMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: player_master"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold focus:border-[#E195AB] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold focus:border-[#E195AB] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Role Akun
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold focus:border-[#E195AB] outline-none"
                  >
                    <option value="user">User (Pemain)</option>
                    <option value="admin">Admin (Akses Penuh)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#E195AB] hover:bg-[#d68097] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all mt-2 cursor-pointer active:scale-[0.98]"
                >
                  + Tambah Akun
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-5">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                  <Users className="w-4 h-4 text-[#E195AB]" /> Daftar Pengguna Terdaftar
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari username..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-[#E195AB] outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Terdaftar</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#E195AB]/15 text-[#E195AB] font-mono font-bold text-xs flex items-center justify-center border border-[#E195AB]/25">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.username, e.target.value as 'user' | 'admin')}
                            className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] border outline-none ${
                              u.role === 'admin'
                                ? 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {u.username.toLowerCase() !== 'adminkawaaii' ? (
                            <button
                              onClick={() => handleDeleteUserClick(u.username)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Hapus User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Master</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Comments Management */}
        {activeTab === 'comments' && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <MessageSquare className="w-4 h-4 text-[#E195AB]" /> Komentar Pengguna
              </h3>

              <button
                onClick={fetchComments}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingComments ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {isLoadingComments ? (
              <p className="text-slate-500 text-xs py-8 text-center font-mono">Memuat komentar...</p>
            ) : comments.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center font-mono">Belum ada komentar pengguna.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{comment.username}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(comment.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-1.5 leading-relaxed break-words">{comment.text}</p>
                      {comment.photoBase64 && (
                        <img src={comment.photoBase64} alt="Attachment" className="max-h-24 mt-2.5 rounded-xl border border-slate-200 dark:border-slate-700 object-cover" />
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                      title="Hapus Komentar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

