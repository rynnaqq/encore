import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { User, CheckCircle2, Code, Terminal, Cpu } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface AboutSectionProps {
  isDarkMode: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isDarkMode }) => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], [-50, 50]);

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
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <section id="about" ref={containerRef} className="py-16 sm:py-20 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <SectionHeader
          isDarkMode={isDarkMode}
          title={
            <>
              Crafting Digital Experiences <span className="text-[#e8590c]">With Minimalist Precision</span>
            </>
          }
        />

        {/* Content Box */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`border rounded-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden transition-colors ${
            isDarkMode
              ? 'bg-[#121214]/80 backdrop-blur-xl border-[#27272a] text-zinc-100 shadow-xl'
              : 'bg-white/80 backdrop-blur-xl border-[#e4e4e7] text-zinc-900 shadow-lg shadow-zinc-200/50'
          }`}
        >

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Tech Stack Badges Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className={`lg:col-span-5 border rounded-xl p-5 relative ${
                isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-[#f4f4f5] border-[#e4e4e7]'
              }`}
            >
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#27272a]/40">
                <div className="w-9 h-9 rounded-xl bg-[#e8590c] text-white flex items-center justify-center font-bold shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-base">Ryan's Stack</h3>
                  <p className="font-mono text-xs text-[#e8590c] font-semibold">Frontend Engineering</p>
                </div>
              </div>

              <div className="space-y-2.5 font-sans">
                <motion.div 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121214] border-[#27272a] hover:border-[#e8590c]/50 hover:bg-[#e8590c]/5' : 'bg-white border-[#e4e4e7] hover:border-[#e8590c]/30 hover:bg-[#e8590c]/5'
                }`}>
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#e8590c]" />
                    <span className="text-xs font-semibold">Markup & Styling</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#e8590c] bg-[#e8590c]/10 px-2 py-0.5 rounded border border-[#e8590c]/20">
                    HTML5 / CSS3 / Tailwind
                  </span>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121214] border-[#27272a] hover:border-[#e8590c]/50 hover:bg-[#e8590c]/5' : 'bg-white border-[#e4e4e7] hover:border-[#e8590c]/30 hover:bg-[#e8590c]/5'
                }`}>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#e8590c]" />
                    <span className="text-xs font-semibold">Scripting & Logic</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#e8590c] bg-[#e8590c]/10 px-2 py-0.5 rounded border border-[#e8590c]/20">
                    JavaScript / TypeScript
                  </span>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`p-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#121214] border-[#27272a] hover:border-[#e8590c]/50 hover:bg-[#e8590c]/5' : 'bg-white border-[#e4e4e7] hover:border-[#e8590c]/30 hover:bg-[#e8590c]/5'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#e8590c]" />
                    <span className="text-xs font-semibold">Frameworks</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#e8590c] bg-[#e8590c]/10 px-2 py-0.5 rounded border border-[#e8590c]/20">
                    React.js / Vite
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column: Bio Narrative & Highlights */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={containerVariants}
              className="lg:col-span-7 space-y-4"
            >
              <motion.h3 variants={itemVariants} className="font-sans text-lg sm:text-xl font-bold leading-snug">
                Passionate Frontend Developer Focused on Clean Code & Aesthetics
              </motion.h3>

              <motion.p variants={itemVariants} className={`font-sans text-xs sm:text-sm leading-relaxed ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                Hello! I am Ryan, a dedicated web developer with a continuous drive for building pixel-perfect, responsive web applications. I turn design mockups into living, interactive web interfaces that perform seamlessly on any screen size.
              </motion.p>

              <motion.p variants={itemVariants} className={`font-sans text-xs sm:text-sm leading-relaxed ${
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                My approach combines clean architecture with sharp visual detail. Whether crafting fluid grid layouts, optimizing touch targets, or polishing micro-interactions, I treat every project with absolute dedication and a warm, collaborative spirit.
              </motion.p>

              <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {highlights.map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className={`p-2.5 rounded-xl border flex items-start gap-2 font-sans text-xs font-medium cursor-default transition-colors ${
                      isDarkMode ? 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:border-[#e8590c]/40' : 'bg-[#f4f4f5] border-[#e4e4e7] text-zinc-800 hover:border-[#e8590c]/40'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e8590c] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

          </div>

        </motion.div>

      </div>
    </section>
  );
};
