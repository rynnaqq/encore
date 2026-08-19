import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { User, CheckCircle2, Code, Terminal, Cpu } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface AboutSectionProps {
  onOpenModal?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenModal }) => {
  const containerRef = useRef<HTMLElement>(null);

  const highlights = [
    'Clean, Readable, & Scalable Codebase',
    'Pixel-Perfect Responsive Layout Execution',
    'Modern Component-Driven React Development',
    'Fast Load Times & Smooth UI Interactions',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.12,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1]
      } 
    }
  };

  return (
    <section id="about" ref={containerRef} className="py-16 sm:py-20 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionHeader
            title={
              <>
                Crafting Digital Experiences <span className="text-[#E195AB]">With Minimalist Precision</span>
              </>
            }
          />
        </motion.div>

        {/* Main Content Card with Double-Bezel Architecture */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="p-1.5 sm:p-2 rounded-[2rem] border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/30 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] dark:shadow-none gpu-smooth transform-gpu"
        >
          <div className="rounded-[calc(2rem-0.5rem)] p-5 sm:p-8 lg:p-10 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              {/* Left Column: Tech Stack Badges Card Pop-Up */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="lg:col-span-5 border rounded-2xl p-4 sm:p-5 relative bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 shadow-xs transform-gpu"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E195AB] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-extrabold text-sm sm:text-base tracking-tight">Encore's Stack</h3>
                    <p className="font-mono text-[11px] sm:text-xs text-[#E195AB] font-semibold">Frontend Engineering</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-2.5 font-sans">
                  <motion.div 
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={onOpenModal}
                    className="p-3 border rounded-xl flex flex-wrap items-center justify-between gap-1.5 transition-colors cursor-pointer bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 hover:border-[#E195AB] dark:hover:border-[#E195AB] shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-[#E195AB]" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Markup & Styling</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-[#E195AB] bg-[#E195AB]/10 px-2 py-0.5 rounded-md border border-[#E195AB]/20">
                      HTML5 / CSS3 / Tailwind
                    </span>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={onOpenModal}
                    className="p-3 border rounded-xl flex flex-wrap items-center justify-between gap-1.5 transition-colors cursor-pointer bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 hover:border-[#E195AB] dark:hover:border-[#E195AB] shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#E195AB]" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Scripting & Logic</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-[#E195AB] bg-[#E195AB]/10 px-2 py-0.5 rounded-md border border-[#E195AB]/20">
                      JavaScript / TypeScript
                    </span>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    onClick={onOpenModal}
                    className="p-3 border rounded-xl flex flex-wrap items-center justify-between gap-1.5 transition-colors cursor-pointer bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-700/80 hover:border-[#E195AB] dark:hover:border-[#E195AB] shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#E195AB]" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Frameworks</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-[#E195AB] bg-[#E195AB]/10 px-2 py-0.5 rounded-md border border-[#E195AB]/20">
                      React.js / Vite
                    </span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right Column: Bio Narrative & Staggered Highlights Pop-Up */}
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={containerVariants}
                className="lg:col-span-7 space-y-4"
              >
                <motion.h3 variants={itemVariants} className="font-sans text-lg sm:text-xl font-bold leading-snug tracking-tight">
                  Passionate Frontend Developer Focused on Clean Code & Engaging User Experiences
                </motion.h3>

                <motion.p variants={itemVariants} className="font-sans text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Hello! I am Encore, a dedicated frontend developer who bridges the gap between design and engineering. I specialize in transforming static design concepts into living, breathing web applications that are as visually stunning as they are technically robust.
                </motion.p>

                <motion.p variants={itemVariants} className="font-sans text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  My approach focuses on creating accessible, pixel-perfect interfaces that perform flawlessly across all devices. From architecting scalable component systems to refining subtle micro-interactions, I obsess over the details that elevate a good product into an unforgettable digital experience.
                </motion.p>

                <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {highlights.map((item, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                      onClick={onOpenModal}
                      className="p-3 rounded-xl border flex items-start gap-2.5 font-sans text-xs font-medium cursor-pointer transition-colors bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-[#E195AB] dark:hover:border-[#E195AB] shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#E195AB] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

