import { FloatingBackground } from './components/FloatingBackground';
import { useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CalculatorSection } from './components/CalculatorSection';
import { LoginSection } from './components/LoginSection';
import { Footer } from './components/Footer';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';

function MainLayout({ isLoggedIn, setIsLoggedIn }: { isLoggedIn: boolean, setIsLoggedIn: (val: boolean) => void }) {
  const [activeSection, setActiveSection] = useState<string>('home');
  const location = useLocation();

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
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <HeroSection isDarkMode={false} />
              <AboutSection isDarkMode={false} />
            </>
          } />
          <Route path="/login" element={
            isLoggedIn ? <Navigate to="/game" replace /> : <LoginSection setIsLoggedIn={setIsLoggedIn} />
          } />
          <Route path="/game" element={
            isLoggedIn ? <CalculatorSection /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </main>
      <Footer isDarkMode={false} />
    </>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleFinishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <BrowserRouter>
      <div className={`min-h-screen relative font-sans transition-colors duration-300 selection:bg-[#FFCCE1] selection:text-zinc-800 bg-[#F2F9FF] text-zinc-800`}>
        <FloatingBackground />
        
        {/* Fullscreen Cybernetic Loading Screen */}
        {isLoading && (
          <LoadingScreen onFinishLoading={handleFinishLoading} isDarkMode={false} />
        )}
        
        <MainLayout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      </div>
    </BrowserRouter>
  );
}
