import React, { useState, useEffect } from 'react';
import { getSupabaseClient, getSupabaseCredentials } from '../lib/supabaseClient';
import { Trash2, Users, MessageSquare, Shield, KeyRound, UserPlus, Search, LogOut, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth, User } from '../context/AuthContext';

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
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'system'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Add user modal / state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin session authentication
  const isAdminAuthenticated = currentUser?.role === 'admin';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login('AdminKawaaii', adminPassword);
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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);

    const res = addUser(newUsername, newPassword, newRole);
    if (res.success) {
      setUserActionMsg({ type: 'success', text: `User "${newUsername}" berhasil dibuat!` });
      setNewUsername('');
      setNewPassword('');
    } else {
      setUserActionMsg({ type: 'error', text: res.message || 'Gagal membuat user' });
    }
  };

  const handleDeleteUserClick = (targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'adminkawaaii') {
      alert('User admin utama tidak dapat dihapus!');
      return;
    }
    if (!confirm(`Hapus akun user "${targetUsername}"?`)) return;

    const res = deleteUser(targetUsername);
    if (res.success) {
      setUserActionMsg({ type: 'success', text: `User "${targetUsername}" telah dihapus.` });
    } else {
      setUserActionMsg({ type: 'error', text: res.message || 'Gagal menghapus user' });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 pt-24">
        <form onSubmit={handleAdminLogin} className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 max-w-md w-full">
          <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1 text-center">Universal Admin Login</h2>
          <p className="text-slate-400 text-xs text-center mb-6">
            Masukan password admin untuk mengakses kontrol universal
          </p>
          
          <div className="mb-6 relative">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Password Admin
            </label>
            <div className="relative">
              <input
                type={showAdminPassword ? "text" : "password"}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all text-sm"
                placeholder="Masukkan password admin"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 text-sm"
          >
            Masuk Ke Dashboard Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-slate-900 p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Universal Admin Dashboard</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola User, Game State, dan Komentar untuk Chess, Snake & Ladders, dan UNO
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Admin: {currentUser.username}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Kelola User ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'comments'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Kelola Komentar ({comments.length})
          </button>
        </div>

        {/* TAB 1: User Management */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create New User Box */}
            <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 h-fit">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah User Baru
              </h3>

              {userActionMsg && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2 ${
                    userActionMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
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

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: player_master"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full pl-4 pr-12 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Role Akun
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="user">User (Pemain)</option>
                    <option value="admin">Admin (Akses Penuh)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all mt-2 cursor-pointer"
                >
                  + Tambah Akun
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="lg:col-span-2 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Daftar Pengguna Terdaftar
                </h3>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari username..."
                    className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300 min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-500">
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Terdaftar</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => (
                      <tr key={u.username} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.username, e.target.value as 'user' | 'admin')}
                            className={`px-2.5 py-1 rounded-xl font-bold text-xs border outline-none ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {u.username.toLowerCase() !== 'adminkawaaii' ? (
                            <button
                              onClick={() => handleDeleteUserClick(u.username)}
                              className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Utama</span>
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
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" /> Komentar Pengguna
              </h3>

              <button
                onClick={fetchComments}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingComments ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {isLoadingComments ? (
              <p className="text-slate-500 text-sm py-8 text-center">Memuat komentar...</p>
            ) : comments.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">Belum ada komentar pengguna.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 border border-slate-800 bg-slate-950/60 rounded-2xl flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{comment.username}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(comment.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-2 leading-relaxed">{comment.text}</p>
                      {comment.photoBase64 && (
                        <img src={comment.photoBase64} alt="Attachment" className="max-h-28 mt-3 rounded-xl border border-slate-800 object-cover" />
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors shrink-0"
                      title="Hapus Komentar"
                    >
                      <Trash2 className="w-4 h-4" />
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
