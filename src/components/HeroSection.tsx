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
    <div className="relative w-full h-full bg-[#FFF5D7] overflow-hidden flex items-center justify-center">
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
        <div className="w-full h-full bg-gradient-to-br from-[#FFF5D7] to-[#FFCCE1] flex items-center justify-center text-[#E195AB] font-mono text-xs">
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
            <div className={`relative w-full h-full rounded-2xl border p-1.5 shadow-2xl overflow-hidden flex items-center justify-center transition-colors bg-[#FFF5D7] border-[#FFCCE1] shadow-pink-200/50`}>
              
              {/* Speaker / Notch Accent */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FFCCE1] rounded-full z-30 hidden sm:block" />

              {/* Inner Screen Display */}
              <div className="relative w-full h-full rounded-xl overflow-hidden group">
                <PhoneVideoPlayer />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
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
              <span className={'text-slate-800'}>
                Hello Everyone
              </span>
              <CyberDecoderText
                text="I'm Encore"
                highlightText="Encore"
                speed={35}
                repeatInterval={10000}
                className={'text-slate-800'}
                isDarkMode={isDarkMode}
              />
            </h1>
          </div>

          {/* Body Paragraph with Typewriter Effect */}
          <TypewriterText
            text="I craft modern, delightful web experiences. As a frontend developer, I transform ideas into beautifully responsive and efficient interfaces that users love to engage with."
            speed={35}
            pauseDuration={4500}
            isDarkMode={isDarkMode}
            className={`font-sans text-base sm:text-lg max-w-xl text-left leading-relaxed text-slate-600`}
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
