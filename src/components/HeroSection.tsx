import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, User } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { CyberDecoderText } from './CyberDecoderText';

interface HeroSectionProps {
  isDarkMode: boolean;
}

const PhoneVideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force native DOM properties for muted and playsInline to bypass browser autoplay blocks
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = () => {
      if (video && video.paused) {
        const promise = video.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Silence autoplay rejection if browser blocks initially
          });
        }
      }
    };

    // Initial play attempt on mount
    playVideo();

    // Watchdog interval: check every 800ms and resume play if video gets stuck or paused while idle
    const watchdogTimer = setInterval(() => {
      if (video.paused && !video.ended) {
        playVideo();
      }
    }, 800);

    // Event listeners to handle tab visibility and background idle restoration
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playVideo();
      }
    };

    const handleInteraction = () => {
      playVideo();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleInteraction, { passive: true });
    window.addEventListener('mousemove', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('focus', handleInteraction);

    return () => {
      clearInterval(watchdogTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('focus', handleInteraction);
    };
  }, []);

  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleStalled = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0d0d0e] overflow-hidden flex items-center justify-center">
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onPause={() => {
            if (videoRef.current) videoRef.current.play().catch(() => {});
          }}
          onEnded={handleEnded}
          onStalled={handleStalled}
          onWaiting={handleStalled}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center scale-105 pointer-events-none"
        >
          <source
            src="/assets/videos/encore-preview.mp4"
            type="video/mp4"
          />
        </video>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center text-zinc-500 font-mono text-xs">
          [ Live Preview Stream ]
        </div>
      )}
    </div>
  );
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  isDarkMode,
}) => {
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
            
            {/* Minimal Smartphone Frame */}
            <div className={`relative w-full h-full rounded-2xl border p-1.5 shadow-2xl overflow-hidden flex items-center justify-center transition-colors ${
              isDarkMode
                ? 'bg-[#18181b] border-[#27272a] shadow-black/60'
                : 'bg-white border-[#e4e4e7] shadow-zinc-200'
            }`}>
              
              {/* Speaker / Notch Accent */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-zinc-800 rounded-full z-30 hidden sm:block" />

              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-xl overflow-hidden group">
                <PhoneVideoPlayer />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Minimal Badge */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="absolute -bottom-2.5 right-4 bg-[#e8590c] text-white px-3 py-1 rounded-full font-mono font-medium text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1.5 z-20 cursor-default"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE PREVIEW</span>
            </motion.div>

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
              <span className={isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}>
                Hello Everyone
              </span>
              <CyberDecoderText
                text="I'm Ryan"
                highlightText="Ryan"
                speed={35}
                repeatInterval={10000}
                className={isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}
                isDarkMode={isDarkMode}
              />
            </h1>
          </div>

          {/* Body Paragraph with Typewriter Effect */}
          <TypewriterText
            text="I am a web developer focused on building modern, responsive, and efficient websites with expertise in HTML, CSS, and JavaScript."
            speed={35}
            pauseDuration={4500}
            isDarkMode={isDarkMode}
            className={`font-sans text-base sm:text-lg max-w-xl text-left leading-relaxed ${
              isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
            }`}
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
              className="py-2.5 px-6 rounded-xl bg-[#e8590c] text-white font-sans font-semibold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 hover:bg-[#d94e02] transition-all cursor-pointer shadow-md group/btn"
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

