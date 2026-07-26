import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { Star, Circle, Triangle, Square, Hexagon } from 'lucide-react';

export const FloatingBackground: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 2000], [0, -300]);
  const y2 = useTransform(scrollY, [0, 2000], [0, 400]);
  const y3 = useTransform(scrollY, [0, 2000], [0, -500]);
  const y4 = useTransform(scrollY, [0, 2000], [0, 200]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating Plus */}
      <motion.div
        animate={{
          rotate: 360,
          x: mousePosition.x * 1.5,
          y: mousePosition.y * 1.5,
        }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, x: { type: "spring", stiffness: 50 }, y: { type: "spring", stiffness: 50 } }}
        style={{ y: y1 }}
        className="absolute top-[15%] left-[10%] text-[#E195AB] opacity-40"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </motion.div>

      {/* Floating Circle */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: mousePosition.x * -1,
          y: mousePosition.y * -1,
        }}
        transition={{ scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }, x: { type: "spring", stiffness: 40 }, y: { type: "spring", stiffness: 40 } }}
        style={{ y: y2 }}
        className="absolute top-[40%] right-[15%] text-[#FFDD00] opacity-50"
      >
        <Circle size={48} strokeWidth={2.5} />
      </motion.div>

      {/* Floating Triangle */}
      <motion.div
        animate={{
          rotate: -360,
          x: mousePosition.x * 2,
          y: mousePosition.y * 2,
        }}
        transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, x: { type: "spring", stiffness: 60 }, y: { type: "spring", stiffness: 60 } }}
        style={{ y: y3 }}
        className="absolute bottom-[30%] left-[20%] text-[#FF00E5] opacity-30"
      >
        <Triangle size={36} strokeWidth={3} />
      </motion.div>

      {/* Floating Star */}
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 0.8, 1],
          x: mousePosition.x * -2,
          y: mousePosition.y * -2,
        }}
        transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }, x: { type: "spring", stiffness: 40 }, y: { type: "spring", stiffness: 40 } }}
        style={{ y: y4 }}
        className="absolute top-[70%] right-[25%] text-[#E195AB] opacity-40"
      >
        <Star size={42} strokeWidth={2.5} />
      </motion.div>
      
      {/* Abstract Blob 1 */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#FFF5D7] to-[#FFCCE1] rounded-full blur-3xl opacity-30 -z-10"
      />
      
      {/* Abstract Blob 2 */}
      <motion.div
        animate={{
          rotate: -360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          rotate: { duration: 50, repeat: Infinity, ease: "linear" },
          scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#F2F9FF] to-[#E195AB] rounded-full blur-3xl opacity-20 -z-10"
      />
    </div>
  );
};
