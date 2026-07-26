import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, User, Terminal, Code, Sparkles, CheckCircle, Cpu } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { CyberDecoderText } from './CyberDecoderText';

const CodeShowcaseScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  return (
    <div className="relative w-full h-full bg-[#0f172a] text-slate-100 flex flex-col font-mono select-none overflow-hidden">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e293b] border-b border-slate-700/60 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-1 text-slate-400 font-sans font-medium text-[10px] hidden sm:inline">encore-app.tsx</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
              activeTab === 'preview' ? 'bg-[#E195AB] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
              activeTab === 'code' ? 'bg-[#E195AB] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Code
          </button>
        </div>
      </div>

      {/* Screen Body */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden relative flex flex-col justify-center">
        {activeTab === 'preview' ? (
          <div className="w-full h-full relative rounded-lg overflow-hidden bg-black flex items-center justify-center">
            <video 
              src="/assets/videos/video.mp4" 
              className="w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline 
            />
            {/* Fallback text if video not found */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 text-slate-500 text-xs text-center p-4">
              Video will appear here<br/>(public/assets/videos/video.mp4)
            </div>
          </div>
        ) : (
          <div className="text-[10px] sm:text-xs space-y-1 leading-relaxed text-slate-300">
            <div><span className="text-pink-400">const</span> <span className="text-sky-300">developer</span> = &#123;</div>
            <div className="pl-3"><span className="text-emerald-300">name</span>: <span className="text-amber-300">'Encore'</span>,</div>
            <div className="pl-3"><span className="text-emerald-300">role</span>: <span className="text-amber-300">'Frontend Craftsman'</span>,</div>
            <div className="pl-3"><span className="text-emerald-300">skills</span>: [<span className="text-amber-300">'React'</span>, <span className="text-amber-300">'TypeScript'</span>, <span className="text-amber-300">'Tailwind'</span>],</div>
            <div className="pl-3"><span className="text-emerald-300">status</span>: <span className="text-amber-300">'Available for project'</span>,</div>
            <div>&#125;;</div>
          </div>
        )}
      </div>
    </div>
  );
};

export const HeroSection: React.FC = () => {
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
      className="min-h-screen pt-16 sm:pt-20 md:pt-24 pb-16 flex items-center justify-center relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center">
        
        {/* TOP: Landscape HP Smartphone Mockup (with Parallax) */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: yPhone, opacity: opacityPhone }}
          className="w-full flex justify-center mb-8 sm:mb-12 relative"
        >
          <div className="relative w-full max-w-[560px] sm:max-w-[620px] aspect-[16/9]">
            
            {/* Top Left Animated Smiley */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-30"
            >
              <div className="bg-[#FFDD00] text-black w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] flex items-center justify-center border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
            </motion.div>

            {/* Bottom Right Animated Pill */}
            <motion.div
              animate={{
                y: [0, 8, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-3 right-2 sm:-bottom-4 sm:right-4 z-30"
            >
              <div className="bg-[#FF00E5] text-white px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 flex items-center justify-center">
                <span className="font-sans font-black text-[10px] sm:text-xs uppercase tracking-widest italic leading-none mt-0.5">Woah!</span>
              </div>
            </motion.div>
            
            {/* Minimal Smartphone Frame */}
            <div className="relative w-full h-full rounded-2xl border p-1.5 shadow-2xl overflow-hidden flex items-center justify-center transition-colors bg-[#FFF5D7] border-[#FFCCE1] shadow-pink-200/50">
              
              {/* Speaker / Notch Accent */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFCCE1] rounded-full z-30 hidden sm:block" />

              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-xl overflow-hidden group">
                <CodeShowcaseScreen />
              </div>
            </div>

          </div>
        </motion.div>

        {/* BOTTOM: Main Content & Intro (with Parallax) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{ y: yText, opacity: opacityText }}
          className="w-full flex flex-col items-start space-y-5 max-w-2xl"
        >
          
          {/* Main Heading */}
          <div className="space-y-2">
            <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight flex flex-col items-start gap-1">
              <span className="text-slate-800">
                Hello Everyone
              </span>
              <CyberDecoderText
                text="I'm Encore"
                highlightText="Encore"
                speed={35}
                repeatInterval={10000}
                className="text-slate-800"
              />
            </h1>
          </div>

          {/* Body Paragraph with Typewriter Effect */}
          <TypewriterText
            text="I craft modern, delightful web experiences. As a frontend developer, I transform ideas into beautifully responsive and efficient interfaces that users love to engage with."
            speed={35}
            pauseDuration={4500}
            className="font-sans text-base sm:text-lg max-w-xl text-left leading-relaxed text-slate-600"
          />

          {/* View Profile Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="pt-5 sm:pt-6 flex items-center gap-3 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}
              id="hero-view-profile-btn"
              className="py-2.5 px-6 rounded-xl bg-[#E195AB] text-white font-sans font-semibold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-[#FFCCE1] hover:text-[#E195AB] transition-all cursor-pointer shadow-md group/btn"
            >
              <User className="w-4 h-4 text-white" />
              <span>View Profile</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

