import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, LogIn, UserPlus, AlertCircle, Eye, EyeOff, Sparkles, ArrowLeft, Gamepad2, Trophy, MessageSquare, Crown, Fish } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, register, currentUser } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // If already logged in, show logged-in welcome card with fast redirects
  if (currentUser) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex flex-col justify-center items-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl text-center"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E195AB] rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg shadow-[#E195AB]/25">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-1.5 tracking-tight">
            Halo, {currentUser.username}! 👋
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mb-5 leading-relaxed">
            Anda sudah berhasil masuk. Siap untuk bermain game atau menjelajah portofolio?
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
            <button
              onClick={() => navigate('/fishing')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center gap-1.5 hover:border-[#E195AB] hover:text-[#E195AB] dark:hover:border-[#E195AB] dark:hover:text-[#FFCCE1] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Fish className="w-4 h-4" />
              </div>
              <span className="font-semibold">Fishing Game</span>
            </button>

            <button
              onClick={() => navigate('/uno')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center gap-1.5 hover:border-[#E195AB] hover:text-[#E195AB] dark:hover:border-[#E195AB] dark:hover:text-[#FFCCE1] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="font-semibold">Main UNO</span>
            </button>

            <button
              onClick={() => navigate('/snake-ladders')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center gap-1.5 hover:border-[#E195AB] hover:text-[#E195AB] dark:hover:border-[#E195AB] dark:hover:text-[#FFCCE1] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="font-semibold">Ular Tangga</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center gap-1.5 hover:border-[#E195AB] hover:text-[#E195AB] dark:hover:border-[#E195AB] dark:hover:text-[#FFCCE1] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-[#E195AB]/10 text-[#E195AB] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="font-semibold">Beranda</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 sm:py-3.5 rounded-2xl bg-[#E195AB] hover:bg-[#d68097] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
          >
            Lanjut Ke Beranda
          </button>
        </motion.div>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLock(e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const res = await register(username, password);
        if (res.success) {
          setUsername('');
          setPassword('');
          navigate('/');
        } else {
          setErrorMsg(res.message || 'Gagal mendaftar');
        }
      } else {
        const res = await login(username, password);
        if (res.success) {
          setUsername('');
          setPassword('');
          navigate('/');
        } else {
          setErrorMsg(res.message || 'Gagal masuk');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-gradient-to-tr from-[#FFCCE1]/40 via-[#E195AB]/20 to-[#FFCCE1]/30 dark:from-pink-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#FFCCE1]/30 dark:bg-pink-900/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#E195AB]/15 dark:bg-indigo-900/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Home Link */}
      <div className="max-w-md w-full mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#E195AB] dark:hover:text-[#FFCCE1] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Main Glassmorphic Form Card with Double Bezel Architecture */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-md w-full p-1.5 sm:p-2 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/40 shadow-xl z-10"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[calc(1.5rem-0.375rem)] border border-slate-200/60 dark:border-slate-800 p-6 sm:p-8">
          {/* Animated Avatar Mascot */}
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              {/* Spinning Aura Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-3xl border-2 border-dashed border-[#E195AB]/60 dark:border-pink-500/50"
              />
              {/* Glowing Icon Badge */}
              <motion.div
                key={isRegisterMode ? 'reg-badge' : 'login-badge'}
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative z-10 w-16 h-16 bg-[#E195AB] rounded-2xl flex items-center justify-center shadow-lg shadow-[#E195AB]/30"
              >
                {isRegisterMode ? (
                  <UserPlus className="w-8 h-8 text-white drop-shadow" />
                ) : (
                  <LogIn className="w-8 h-8 text-white drop-shadow" />
                )}
              </motion.div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {isRegisterMode ? 'Buat Akun Baru' : 'Selamat Datang!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Format akun simpel menggunakan <strong className="text-slate-700 dark:text-slate-300">Username & Password</strong>
            </p>
          </div>

          {/* Tab Pill Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6 border border-slate-200 dark:border-slate-700/60 relative">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all relative z-10 cursor-pointer flex items-center justify-center gap-1.5 ${
              !isRegisterMode
                ? 'text-[#E195AB] dark:text-[#FFCCE1]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {!isRegisterMode && (
              <motion.div
                layoutId="auth-tab-pill-page"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 -z-10"
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
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all relative z-10 cursor-pointer flex items-center justify-center gap-1.5 ${
              isRegisterMode
                ? 'text-[#E195AB] dark:text-[#FFCCE1]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {isRegisterMode && (
              <motion.div
                layoutId="auth-tab-pill-page"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 -z-10"
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
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2 shadow-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Username
              </label>
              <span className="text-[10px] text-slate-400 font-medium">3-20 karakter</span>
            </div>
            <div className="relative group">
              <User className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#E195AB] transition-colors" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950/40 outline-none transition-all text-sm shadow-inner"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              {isCapsLock && (
                <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                  ⚠️ Caps Lock Aktif
                </span>
              )}
            </div>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#E195AB] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-[#E195AB] focus:ring-4 focus:ring-pink-100 dark:focus:ring-pink-950/40 outline-none transition-all text-sm shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password.trim()}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#E195AB] via-[#d68097] to-[#E195AB] hover:opacity-95 active:scale-98 disabled:opacity-50 text-white font-black shadow-xl shadow-pink-200 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm mt-3 cursor-pointer"
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

        {/* Benefits Preview Badge */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E195AB]" />
            <span>Benefit Akun Pemain:</span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 font-sans">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              🎣 Fishing Game
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              🎲 Ular Tangga
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              🃏 UNO Multiplayer
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              💬 Komentar Komunitas
            </span>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
};
