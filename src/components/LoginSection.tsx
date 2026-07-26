import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginSectionProps {
  setIsLoggedIn: (val: boolean) => void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      // Simulate network delay
      setTimeout(() => {
        setIsLoggedIn(true);
        navigate('/game');
      }, 800);
    }
  };

  return (
    <section className="min-h-screen py-24 flex items-center justify-center relative overflow-hidden">
      <div className="max-w-md mx-auto px-4 w-full relative z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFCCE1] text-[#E195AB] font-mono text-sm font-bold tracking-wide mb-4">
            <Lock className="w-4 h-4" />
            <span>SECURE ACCESS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Login to Play</h2>
          <p className="text-[#E195AB] mt-2 font-medium">Authentication required to access the calculator.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border-2 border-[#FFCCE1] flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 font-sans">Username / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#E195AB]">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#FFF5D7] border-2 border-[#FFCCE1] rounded-xl text-slate-800 placeholder-[#E195AB]/60 focus:outline-none focus:ring-4 focus:ring-[#FFCCE1]/50 focus:border-[#E195AB] transition-all font-medium"
                  placeholder="player@encore.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 font-sans">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#E195AB]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#FFF5D7] border-2 border-[#FFCCE1] rounded-xl text-slate-800 placeholder-[#E195AB]/60 focus:outline-none focus:ring-4 focus:ring-[#FFCCE1]/50 focus:border-[#E195AB] transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-[#E195AB] hover:bg-[#FF00E5] text-white font-bold py-3.5 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  <span>Unlock Calculator</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

      </div>
    </section>
  );
};
