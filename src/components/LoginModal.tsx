import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, LogIn, UserPlus, Shield, X, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLock(e.getModifierState('CapsLock'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
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
      setIsSubmitting(false);
    }, 150);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop with Ambient Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-7 z-10 my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header & Avatar */}
          <div className="text-center mb-5">
            {!currentUser && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E195AB]/10 border border-[#E195AB]/25 text-[#E195AB] text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>Masuk untuk Akses Game & Komentar</span>
              </div>
            )}
            
            {/* Mascot Avatar with Rotating Aura */}
            <div className="relative w-14 h-14 mx-auto mb-3 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl border border-dashed border-[#E195AB]/40"
              />
              <motion.div
                key={isRegisterMode ? 'reg-icon' : 'login-icon'}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative z-10 w-11 h-11 bg-[#E195AB] rounded-xl flex items-center justify-center shadow-xs"
              >
                {isRegisterMode ? (
                  <UserPlus className="w-5 h-5 text-white" />
                ) : (
                  <LogIn className="w-5 h-5 text-white" />
                )}
              </motion.div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {isRegisterMode ? 'Buat Akun Baru' : 'Masuk Ke Akun'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Format akun menggunakan <strong className="text-slate-700 dark:text-slate-300">Username & Password</strong> (Tanpa Email)
            </p>
          </div>

          {/* Tab Pill Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-4 border border-slate-200 dark:border-slate-700/60 relative">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all relative z-10 cursor-pointer flex items-center justify-center gap-1.5 ${
                !isRegisterMode
                  ? 'text-[#E195AB]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {!isRegisterMode && (
                <motion.div
                  layoutId="auth-tab-pill-modal"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700/60 -z-10"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all relative z-10 cursor-pointer flex items-center justify-center gap-1.5 ${
                isRegisterMode
                  ? 'text-[#E195AB]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {isRegisterMode && (
                <motion.div
                  layoutId="auth-tab-pill-modal"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700/60 -z-10"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-2xl text-xs font-semibold mb-4 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Username
                </label>
                <span className="text-[10px] text-slate-400 font-mono">3-20 karakter</span>
              </div>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#E195AB] transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-mono">
                  Password
                </label>
                {isCapsLock && (
                  <span className="text-[10px] text-amber-500 font-bold font-mono">
                    Caps Lock Aktif
                  </span>
                )}
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#E195AB] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || !password.trim()}
              className="w-full py-3 px-4 rounded-xl bg-[#E195AB] hover:bg-[#d68097] active:scale-98 disabled:opacity-50 text-white font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 text-xs sm:text-sm mt-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Memproses...</span>
              ) : isRegisterMode ? (
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

          {/* Benefits Preview */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-center gap-1 font-mono uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#E195AB]" />
              <span>Akses Penuh:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                Memancing
              </span>
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                Ular Tangga
              </span>
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                UNO
              </span>
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                Buku Tamu
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

