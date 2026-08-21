import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, User, Terminal, Code, Sparkles, CheckCircle, Cpu } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { CyberDecoderText } from './CyberDecoderText';

const CodeShowcaseScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-100 flex flex-col font-mono select-none overflow-hidden">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
          <span className="ml-1 text-slate-400 font-sans font-medium text-[10px] hidden sm:inline tracking-tight">encore-app.tsx</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'preview' ? 'bg-[#E195AB] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'code' ? 'bg-[#E195AB] text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Code
          </button>
        </div>
      </div>

      {/* Screen Body */}
      <div className={`flex-1 overflow-hidden relative flex flex-col justify-center ${activeTab === 'preview' ? 'p-0' : 'p-3.5 sm:p-5'}`}>
        {activeTab === 'preview' ? (
          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
            <video 
              src="/assets/videos/encore-preview.mp4" 
              className="w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline 
            />
            {/* Fallback text if video not found */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 text-slate-500 text-xs text-center p-4 font-sans">
              Encore Interactive Preview
            </div>
          </div>
        ) : (
          <div className="text-[10px] sm:text-xs space-y-1.5 leading-relaxed text-slate-300 font-mono">
            <div><span className="text-pink-400 font-semibold">const</span> <span className="text-sky-300">developer</span> = &#123;</div>
            <div className="pl-4"><span className="text-emerald-300">name</span>: <span className="text-amber-300">'Encore'</span>,</div>
            <div className="pl-4"><span className="text-emerald-300">role</span>: <span className="text-amber-300">'Frontend Craftsman'</span>,</div>
            <div className="pl-4"><span className="text-emerald-300">skills</span>: [<span className="text-amber-300">'React'</span>, <span className="text-amber-300">'TypeScript'</span>, <span className="text-amber-300">'Tailwind'</span>],</div>
            <div className="pl-4"><span className="text-emerald-300">status</span>: <span className="text-amber-300">'Available for project'</span>,</div>
            <div>&#125;;</div>
          </div>
        )}
      </div>
    </div>
  );
};

interface HeroSectionProps {
  onOpenAboutModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAboutModal }) => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yPhone = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacityPhone = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacityText = useTransform(scrollYProgress, [0, 0.9], [1, 0]);

  return (
    <section
      id="home"
      ref={containerRef}
      className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-16 flex items-center justify-center relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center">
        
        {/* TOP: Landscape HP Smartphone Mockup (with Parallax) */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: yPhone, opacity: opacityPhone }}
          className="w-full flex justify-center mb-8 sm:mb-12 relative gpu-smooth"
        >
          <div className="relative w-full max-w-[min(100%,560px)] sm:max-w-[620px] aspect-[16/9]">
            
            {/* Top Left Animated Smiley Sticker */}
            <motion.div
              animate={{
                y: [0, -6, 0],
                rotate: [-6, -2, -6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.12, rotate: 0 }}
              className="absolute -top-2.5 -left-1 sm:-top-5 sm:-left-5 z-30 cursor-pointer"
            >
              <div className="bg-[#FFDD00] text-slate-950 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border border-black/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)] -rotate-6 transition-transform">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
            </motion.div>

            {/* Bottom Right Animated Pill Sticker */}
            <motion.div
              animate={{
                y: [0, 6, 0],
                rotate: [3, 5, 3],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              whileHover={{ scale: 1.08, rotate: 0 }}
              className="absolute -bottom-2 right-1 sm:-bottom-3 sm:right-3 z-30 cursor-pointer"
            >
              <div className="bg-[#E195AB] text-white px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border border-black/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)] rotate-3 flex items-center justify-center">
                <span className="font-mono font-black text-[9px] sm:text-[10px] uppercase tracking-wider italic leading-none">Crafted</span>
              </div>
            </motion.div>
            
            {/* Minimal Smartphone Frame */}
            <motion.div
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full h-full rounded-3xl border shadow-[0_12px_40px_rgb(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.4)] overflow-hidden flex items-center justify-center border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5"
            >
              
              {/* Speaker / Notch Accent */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-300 dark:bg-slate-700 rounded-full z-30 hidden sm:block" />

              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden group border border-slate-800/40">
                <CodeShowcaseScreen />
              </div>
            </motion.div>

          </div>
        </motion.div>

        {/* BOTTOM: Main Content & Intro (with Parallax) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: yText, opacity: opacityText }}
          className="w-full flex flex-col items-start space-y-4 sm:space-y-5 max-w-2xl gpu-smooth"
        >
          
          {/* Main Heading */}
          <div className="space-y-1.5">
            <h1 className="font-sans text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight flex flex-col items-start gap-1">
              <span className="text-slate-800 dark:text-slate-100">
                Hello Everyone
              </span>
              <CyberDecoderText
                text="I'm Encore"
                highlightText="Encore"
                speed={35}
                repeatInterval={10000}
                className="text-slate-800 dark:text-slate-100"
              />
            </h1>
          </div>

          {/* Body Paragraph with Typewriter Effect */}
          <TypewriterText
            text="I craft modern, delightful web experiences. As a frontend developer, I transform ideas into beautifully responsive and efficient interfaces that users love to engage with."
            speed={35}
            pauseDuration={4500}
            className="font-sans text-sm sm:text-base lg:text-lg max-w-xl text-left leading-relaxed text-slate-600 dark:text-slate-300"
          />

          {/* View Profile Action Button with Button-in-Button architecture */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="pt-3 sm:pt-4 flex items-center gap-3 w-full xs:w-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onOpenAboutModal) {
                  onOpenAboutModal();
                } else {
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              id="hero-view-profile-btn"
              className="py-2.5 pl-5 pr-2.5 sm:py-3 sm:pl-6 sm:pr-3 w-full xs:w-auto rounded-full bg-[#E195AB] text-white font-sans font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-between xs:justify-center gap-3 hover:bg-[#d68097] transition-all cursor-pointer shadow-sm hover:shadow group/btn"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-white" />
                <span>View Profile</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};


