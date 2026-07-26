import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface InteractiveBackgroundProps {
  isDarkMode: boolean;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ isDarkMode }) => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 150); // Offset by half the width to center
      cursorY.set(e.clientY - 150);
    };
    
    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Interactive Cursor Follower */}
      <motion.div
        className={`absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-40 mix-blend-screen transition-colors duration-1000 ${
          isDarkMode ? 'bg-[#E195AB]' : 'bg-[#ff8a4c]'
        }`}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      />
      
      {/* Morphing Shape 1 */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 180, 270, 360],
          borderRadius: ["20% 80% 30% 70%", "70% 30% 80% 20%", "40% 60% 70% 30%", "20% 80% 30% 70%"]
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
        className={`absolute top-[10%] right-[10%] w-[400px] h-[400px] blur-[80px] opacity-20 ${
          isDarkMode ? 'bg-orange-600' : 'bg-orange-300'
        }`}
      />

      {/* Morphing Shape 2 */}
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 270, 180, 90, 0],
          borderRadius: ["70% 30% 80% 20%", "20% 80% 30% 70%", "70% 30% 80% 20%"]
        }}
        transition={{
          duration: 25,
          ease: "linear",
          repeat: Infinity,
        }}
        className={`absolute bottom-[10%] left-[5%] w-[350px] h-[350px] blur-[90px] opacity-20 ${
          isDarkMode ? 'bg-rose-600' : 'bg-rose-300'
        }`}
      />
    </div>
  );
};
