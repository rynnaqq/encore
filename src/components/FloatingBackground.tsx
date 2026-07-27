import React, { useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Star, Circle, Triangle } from 'lucide-react';

export const FloatingBackground: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 2000], [0, -300]);
  const y2 = useTransform(scrollY, [0, 2000], [0, 400]);
  const y3 = useTransform(scrollY, [0, 2000], [0, -500]);
  const y4 = useTransform(scrollY, [0, 2000], [0, 200]);

  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const springConfig = { stiffness: 40, damping: 20 };
  const mouseX = useSpring(rawMouseX, springConfig);
  const mouseY = useSpring(rawMouseY, springConfig);

  const mx1 = useTransform(mouseX, (x) => x * 1.5);
  const my1 = useTransform(mouseY, (y) => y * 1.5);

  const mx2 = useTransform(mouseX, (x) => x * -1);
  const my2 = useTransform(mouseY, (y) => y * -1);

  const mx3 = useTransform(mouseX, (x) => x * 2);
  const my3 = useTransform(mouseY, (y) => y * 2);

  const mx4 = useTransform(mouseX, (x) => x * -2);
  const my4 = useTransform(mouseY, (y) => y * -2);

  const combinedY1 = useTransform([y1, my1], ([v1, v2]) => Number(v1) + Number(v2));
  const combinedY2 = useTransform([y2, my2], ([v1, v2]) => Number(v1) + Number(v2));
  const combinedY3 = useTransform([y3, my3], ([v1, v2]) => Number(v1) + Number(v2));
  const combinedY4 = useTransform([y4, my4], ([v1, v2]) => Number(v1) + Number(v2));

  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          rawMouseX.set((e.clientX / window.innerWidth - 0.5) * 40);
          rawMouseY.set((e.clientY / window.innerHeight - 0.5) * 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rawMouseX, rawMouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating Plus */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" } }}
        style={{ x: mx1, y: combinedY1 }}
        className="absolute top-[15%] left-[10%] text-[#E195AB] opacity-40 transform-gpu"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </motion.div>

      {/* Floating Circle */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{ scale: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        style={{ x: mx2, y: combinedY2 }}
        className="absolute top-[40%] right-[15%] text-[#FFDD00] opacity-50 transform-gpu"
      >
        <Circle size={48} strokeWidth={2.5} />
      </motion.div>

      {/* Floating Triangle */}
      <motion.div
        animate={{
          rotate: -360,
        }}
        transition={{ rotate: { duration: 30, repeat: Infinity, ease: "linear" } }}
        style={{ x: mx3, y: combinedY3 }}
        className="absolute bottom-[30%] left-[20%] text-[#FF00E5] opacity-30 transform-gpu"
      >
        <Triangle size={36} strokeWidth={3} />
      </motion.div>

      {/* Floating Star */}
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 0.85, 1],
        }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
        style={{ x: mx4, y: combinedY4 }}
        className="absolute top-[70%] right-[25%] text-[#E195AB] opacity-40 transform-gpu"
      >
        <Star size={42} strokeWidth={2.5} />
      </motion.div>
      
      {/* Abstract Blob 1 */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: { duration: 45, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#FFF5D7] to-[#FFCCE1] rounded-full blur-2xl opacity-25 -z-10 transform-gpu pointer-events-none"
      />
      
      {/* Abstract Blob 2 */}
      <motion.div
        animate={{
          rotate: -360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 55, repeat: Infinity, ease: "linear" },
          scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#F2F9FF] to-[#E195AB] rounded-full blur-2xl opacity-20 -z-10 transform-gpu pointer-events-none"
      />
    </div>
  );
};
