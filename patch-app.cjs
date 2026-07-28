const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add ChangelogModal import
code = code.replace(/import \{ AboutModal \} from '\.\/components\/AboutModal';/, "import { AboutModal } from './components/AboutModal';\nimport { ChangelogModal } from './components/ChangelogModal';");

// Add Changelog state logic to MainLayout
code = code.replace(/const \[isAboutModalOpen, setIsAboutModalOpen\] = useState<boolean>\(false\);/, 
`const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    // Check local storage for changelog seen status
    const hasSeen = localStorage.getItem('hasSeenChangelog_v1.2.0');
    if (hasSeen !== 'true') {
      // Small delay for better UX after load
      const t = setTimeout(() => setIsChangelogModalOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleCloseChangelog = () => {
    setIsChangelogModalOpen(false);
    localStorage.setItem('hasSeenChangelog_v1.2.0', 'true');
  };`);

code = code.replace(/<Footer \/>/, `<ChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={handleCloseChangelog}
      />
      <Footer />`);

fs.writeFileSync('src/App.tsx', code);
