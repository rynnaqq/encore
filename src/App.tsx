import { FloatingBackground } from './components/FloatingBackground';
import { useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { CalculatorSection } from './components/CalculatorSection';
import { FishingGameSection } from './components/FishingGameSection';
import { Footer } from './components/Footer';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

function MainLayout() {
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
              <HeroSection />
              <AboutSection />
            </>
          } />
          <Route path="/game" element={<CalculatorSection />} />
          <Route path="/fishing" element={<FishingGameSection />} />
        </Routes>
      </main>
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
          <LoadingScreen onFinishLoading={handleFinishLoading} isDarkMode={false} />
        )}
        
        {!isLoading && <MainLayout />}
      </div>
    </BrowserRouter>
  );
}
