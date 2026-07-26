import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const LoginSection: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setErrorMsg('');
    try {
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

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/game');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed');
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
              <label className="block text-sm font-bold text-slate-700 mb-2 font-sans">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#E195AB]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
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
                <span className="animate-pulse">{isSignUp ? 'Creating...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Unlock Calculator'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#FFCCE1]"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-bold">OR</span>
              <div className="flex-grow border-t border-[#FFCCE1]"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl border-2 border-[#FFCCE1] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
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
