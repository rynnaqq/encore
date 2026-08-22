import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const result = await changePassword(oldPassword, newPassword);
      
      if (result.success) {
        setStatusMsg({ type: 'success', text: 'Password berhasil diubah!' });
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => {
          onClose();
          setStatusMsg(null);
        }, 2000);
      } else {
        setStatusMsg({ type: 'error', text: result.message || 'Gagal mengubah password' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Gagal mengubah password' });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl relative border border-slate-100 dark:border-slate-800 my-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <KeyRound className="w-8 h-8 text-[#E195AB]" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Profil Saya</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Kelola akun dan password Anda</p>
          </div>

          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Username</p>
              <p className="font-bold text-slate-800 dark:text-slate-100">{currentUser.username}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              currentUser.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700 dark:text-slate-300'
            }`}>
              {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
              {currentUser.role.toUpperCase()}
            </div>
          </div>

          {/* Theme Preference Row */}
          <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Tema Tampilan</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{theme === 'dark' ? 'Mode Gelap (Dark Mode)' : 'Mode Terang (Light Mode)'}</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              type="button"
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E195AB] text-white hover:bg-[#d68097] transition-colors cursor-pointer shadow-sm"
            >
              {theme === 'dark' ? 'Ke Terang' : 'Ke Gelap'}
            </motion.button>
          </div>
          
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
              className="w-full mb-6 py-3 px-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Buka Halaman Admin
            </button>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#E195AB]" />
              Ganti Password
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Password Lama</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950/30 outline-none transition-all font-medium text-sm"
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950/30 outline-none transition-all font-medium text-sm"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-bold ${
                  statusMsg.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                }`}>
                  {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#E195AB] hover:bg-[#d68097] text-white font-bold transition-colors shadow-lg shadow-pink-200 dark:shadow-none cursor-pointer"
              >
                Simpan Password Baru
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
