import { ThemeProvider } from "./context/ThemeContext";
import { FloatingBackground } from './components/FloatingBackground';
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CommentSection } from './components/CommentSection';
import { AboutModal } from './components/AboutModal';
import { BetaNoticeModal } from './components/ChangelogModal';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load heavy game sections and pages for optimal performance
const FishingGameSection = lazy(() =>
  import('./components/FishingGameSection').then((m) => ({ default: m.FishingGameSection }))
);
const ChessGameSection = lazy(() =>
  import('./components/ChessGameSection').then((m) => ({ default: m.ChessGameSection }))
);
const UnoGameSection = lazy(() =>
  import('./components/UnoGameSection').then((m) => ({ default: m.UnoGameSection }))
);
const SnakeAndLaddersSection = lazy(() =>
  import('./components/SnakeAndLaddersSection').then((m) => ({ default: m.SnakeAndLaddersSection }))
);
const AdminPage = lazy(() =>
  import('./components/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const LoginPage = lazy(() =>
  import('./components/LoginPage').then((m) => ({ default: m.LoginPage }))
);

const SuspenseFallback: React.FC = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
    <div className="w-8 h-8 rounded-full border-2 border-[#E195AB] border-t-transparent animate-spin" />
    <span className="text-xs font-mono tracking-wider text-slate-500 uppercase">Loading game module...</span>
  </div>
);

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
  const [showBetaModal, setShowBetaModal] = useState<boolean>(true);

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

  return (
    <>
      <BetaNoticeModal isOpen={showBetaModal} onClose={() => setShowBetaModal(false)} />
      {children}
    </>
  );
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
      <Suspense fallback={<SuspenseFallback />}>
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
              <ProtectedGameRoute targetPath="/fishing">
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
              </ProtectedGameRoute>
            }
          />
          <Route
            path="/chess"
            element={
              <ProtectedGameRoute targetPath="/chess">
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
              </ProtectedGameRoute>
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
          <Route
            path="/login"
            element={
              <motion.div
                key="route-login"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="gpu-smooth"
              >
                <LoginPage />
              </motion.div>
            }
          />
          <Route
            path="/register"
            element={
              <motion.div
                key="route-register"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="gpu-smooth"
              >
                <LoginPage />
              </motion.div>
            }
          />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function MainLayout({ isLoading }: { isLoading: boolean }) {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
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
