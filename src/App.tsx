import { ThemeProvider } from "./context/ThemeContext";
import { FloatingBackground } from './components/FloatingBackground';
import React, { useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CommentSection } from './components/CommentSection';
import { AboutModal } from './components/AboutModal';
import { ChangelogModal } from './components/ChangelogModal';
import { FishingGameSection } from './components/FishingGameSection';
import { ChessGameSection } from './components/ChessGameSection';
import { UnoGameSection } from './components/UnoGameSection';
import { AdminPage } from './components/AdminPage';
import { SnakeAndLaddersSection } from './components/SnakeAndLaddersSection';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function ProtectedGameRoute({ children, targetPath }: { children: React.ReactNode; targetPath: string }) {
  const { currentUser, openLoginModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
      openLoginModal(() => {
        navigate(targetPath);
      });
    }
  }, [currentUser, navigate, openLoginModal, targetPath]);

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}

function ProtectedAdminRoute({ children, targetPath }: { children: React.ReactNode; targetPath: string }) {
  const { currentUser, openLoginModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
      openLoginModal(() => {
        navigate(targetPath);
      });
    } else if (currentUser.role !== 'admin') {
      alert("Akses Ditolak: Hanya Admin yang dapat mengakses halaman ini.");
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate, openLoginModal, targetPath]);

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

const pageVariants = {
  initial: { opacity: 0, x: -20, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    filter: 'blur(8px)',
    transition: {
      duration: 0.4,
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
              <CommentSection />
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
            <ProtectedGameRoute targetPath="/snake-ladders">
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
            </ProtectedGameRoute>
          }
        />
        <Route
          path="/uno"
          element={
            <ProtectedGameRoute targetPath="/uno">
              <motion.div
                key="route-uno"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="gpu-smooth"
              >
                <UnoGameSection />
              </motion.div>
            </ProtectedGameRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <motion.div
              key="route-admin"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="gpu-smooth"
            >
              <AdminPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function MainLayout({ isLoading }: { isLoading: boolean }) {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (isLoading) return;
    // Open changelog 1.5s after the website finishes loading
    const t = setTimeout(() => setIsChangelogModalOpen(true), 1500);
    return () => clearTimeout(t);
  }, [isLoading]);

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

  const isFullscreenGame = location.pathname === '/fishing';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoading ? 0.01 : 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-screen ${isLoading ? 'pointer-events-none select-none max-h-screen overflow-hidden' : ''}`}
    >
      <ScrollToTop />
      {!isFullscreenGame && (
        <Navbar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onOpenAboutModal={handleOpenAboutModal}
        />
      )}
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
      {!isFullscreenGame && <Footer />}
    </motion.div>
  );
}


export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleFinishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className={`min-h-screen relative font-sans transition-colors duration-300 selection:bg-[#FFCCE1] selection:text-zinc-800 bg-[#F2F9FF] dark:bg-slate-950 text-zinc-800 dark:text-slate-100`}>
            <FloatingBackground />
            
            {/* Pre-rendered Main Layout in Background */}
            <MainLayout isLoading={isLoading} />

            {/* Fullscreen Cybernetic Loading Screen Preloader Overlay */}
            <AnimatePresence>
              {isLoading && (
                <LoadingScreen onFinishLoading={handleFinishLoading} />
              )}
            </AnimatePresence>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

