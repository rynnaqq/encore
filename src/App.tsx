import { FloatingBackground } from './components/FloatingBackground';
import { useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<string>('home');

  const handleFinishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Active section scroll observer
  useEffect(() => {
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
  }, []);

  return (
    <div className={`min-h-screen relative font-sans transition-colors duration-300 selection:bg-[#FFCCE1] selection:text-zinc-800 bg-[#F2F9FF] text-zinc-800`}>
      <FloatingBackground />
      
      {/* Fullscreen Cybernetic Loading Screen */}
      {isLoading && (
        <LoadingScreen onFinishLoading={handleFinishLoading} isDarkMode={false} />
      )}

      {/* Navigation (Hamburger menu only) */}
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content */}
      <main>
        <HeroSection
          isDarkMode={false}
        />
        <AboutSection isDarkMode={false} />
      </main>

      {/* Footer */}
      <Footer isDarkMode={false} />
    </div>
  );
}
