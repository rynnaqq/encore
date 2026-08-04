import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, changePassword } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const result = changePassword(oldPassword, newPassword);
    
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
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-slate-100"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <KeyRound className="w-8 h-8 text-[#E195AB]" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Profil Saya</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Kelola akun dan password Anda</p>
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Username</p>
              <p className="font-bold text-slate-800">{currentUser.username}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              currentUser.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
              {currentUser.role.toUpperCase()}
            </div>
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

          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#E195AB]" />
              Ganti Password
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Password Lama</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 outline-none transition-all font-medium text-sm"
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 outline-none transition-all font-medium text-sm"
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {statusMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-bold ${
                  statusMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
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
