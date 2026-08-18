import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, LogIn, UserPlus, Shield, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register, currentUser } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegisterMode) {
      const res = register(username, password);
      if (res.success) {
        setUsername('');
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || 'Gagal mendaftar');
      }
    } else {
      const res = login(username, password);
      if (res.success) {
        setUsername('');
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || 'Gagal masuk');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-pink-100 dark:border-slate-800 max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-8 z-10 my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            {!currentUser && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#E195AB] text-xs font-bold animate-pulse">
                <Shield className="w-3.5 h-3.5" />
                <span>Silakan Login / Daftar Terlebih Dahulu</span>
              </div>
            )}
            <div className="w-14 h-14 bg-gradient-to-tr from-[#E195AB] to-[#FFCCE1] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-200 dark:shadow-none">
              {isRegisterMode ? (
                <UserPlus className="w-7 h-7 text-white" />
              ) : (
                <LogIn className="w-7 h-7 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {isRegisterMode ? 'Buat Akun Baru' : 'Masuk Ke Akun'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Format akun menggunakan <strong className="text-slate-700 dark:text-slate-300">Username & Password</strong> (Tanpa Email)
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950/40 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-11 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950/40 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#E195AB] to-[#d68097] hover:opacity-95 text-white font-black shadow-lg shadow-pink-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
            >
              {isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4" /> Daftar Sekarang
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Masuk Aplikasi
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#E195AB] dark:hover:text-[#E195AB] transition-colors cursor-pointer"
            >
              {isRegisterMode ? (
                <span>Sudah punya akun? <span className="text-[#E195AB] underline">Masuk di sini</span></span>
              ) : (
                <span>Belum punya akun? <span className="text-[#E195AB] underline">Daftar sekarang</span></span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
