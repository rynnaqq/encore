import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export const LoginSection: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Firebase requires an email format, so we append a dummy domain to the username
      const email = `${username.trim().toLowerCase()}@encore.com`;
      
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/game');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
      setIsLoading(false);
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
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {isSignUp ? 'Create Account' : 'Login to Play'}
          </h2>
          <p className="text-[#E195AB] mt-2 font-medium">Authentication required to access the calculator.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <form onSubmit={handleAuth} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border-2 border-[#FFCCE1] flex flex-col gap-5">
            {errorMsg && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-600 rounded-xl text-sm font-medium">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 font-sans">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#E195AB]">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#FFF5D7] border-2 border-[#FFCCE1] rounded-xl text-slate-800 placeholder-[#E195AB]/60 focus:outline-none focus:ring-4 focus:ring-[#FFCCE1]/50 focus:border-[#E195AB] transition-all font-medium"
                  placeholder="player123"
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
                <span className="animate-pulse">{isSignUp ? 'Creating...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Unlock Calculator'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <p className="text-center text-sm font-medium text-slate-500 mt-2">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#E195AB] hover:text-[#FF00E5] font-bold underline transition-colors cursor-pointer"
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </form>
        </motion.div>

      </div>
    </section>
  );
};
