import { FloatingBackground } from './components/FloatingBackground';
import { useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { AboutModal } from './components/AboutModal';
import { ChangelogModal } from './components/ChangelogModal';
import { CalculatorSection } from './components/CalculatorSection';
import { FishingGameSection } from './components/FishingGameSection';
import { ChessGameSection } from './components/ChessGameSection';
import { SnakeAndLaddersSection } from './components/SnakeAndLaddersSection';
import { Footer } from './components/Footer';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.99,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function AnimatedRoutes({
  handleOpenAboutModal,
}: {
  handleOpenAboutModal: () => void;
}) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route
          path="/"
          element={
            <motion.div
              key="route-home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="gpu-smooth"
            >
              <HeroSection onOpenAboutModal={handleOpenAboutModal} />
              <AboutSection onOpenModal={handleOpenAboutModal} />
            </motion.div>
          }
        />
        <Route
          path="/game"
          element={
            <motion.div
              key="route-game"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="gpu-smooth"
            >
              <CalculatorSection />
            </motion.div>
          }
        />
        <Route
          path="/fishing"
          element={
            <motion.div
              key="route-fishing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="gpu-smooth"
            >
              <FishingGameSection />
            </motion.div>
          }
        />
        <Route
          path="/chess"
          element={
            <motion.div
              key="route-chess"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="gpu-smooth"
            >
              <ChessGameSection />
            </motion.div>
          }
        />
        <Route
          path="/snake-ladders"
          element={
            <motion.div
              key="route-snake-ladders"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="gpu-smooth"
            >
              <SnakeAndLaddersSection />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function MainLayout() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    // Open changelog every time the website is loaded
    const t = setTimeout(() => setIsChangelogModalOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleCloseChangelog = () => {
    setIsChangelogModalOpen(false);
  };
  const location = useLocation();

  const handleOpenAboutModal = () => {
    setIsAboutModalOpen(true);
  };

  const handleCloseAboutModal = () => {
    setIsAboutModalOpen(false);
  };

  // Redirect to chess section if room code is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('room') && location.pathname !== '/chess') {
      window.location.href = `/chess${location.search}`;
    }
  }, [location]);

  // Active section scroll observer
  useEffect(() => {
    if (location.pathname !== '/') return;
    const handleScroll = () => {
      const sections = ['home', 'about'];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenAboutModal={handleOpenAboutModal}
      />
      <main>
        <AnimatedRoutes handleOpenAboutModal={handleOpenAboutModal} />
      </main>

      {/* Pop-Up Animated About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={handleCloseAboutModal}
      />

      <ChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={handleCloseChangelog}
      />
      <Footer />
    </>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleFinishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <BrowserRouter>
      <div className={`min-h-screen relative font-sans transition-colors duration-300 selection:bg-[#FFCCE1] selection:text-zinc-800 bg-[#F2F9FF] text-zinc-800`}>
        <FloatingBackground />
        
        {/* Fullscreen Cybernetic Loading Screen */}
        {isLoading && (
          <LoadingScreen onFinishLoading={handleFinishLoading} />
        )}
        
        {!isLoading && <MainLayout />}
      </div>
    </BrowserRouter>
  );
}

