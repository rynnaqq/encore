const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove `saveSupabaseCredentials` import
content = content.replace(/import \{ getSupabaseCredentials, saveSupabaseCredentials \} from '\.\.\/lib\/supabaseClient';/, "import { getSupabaseCredentials } from '../lib/supabaseClient';");

// 2. Remove states
content = content.replace(/  const \[showSupabaseModal, setShowSupabaseModal\] = useState\(false\);\n/, '');
content = content.replace(/  const \[customSupaUrl, setCustomSupaUrl\] = useState\(supabaseCreds\.url\);\n/, '');
content = content.replace(/  const \[customSupaKey, setCustomSupaKey\] = useState\(supabaseCreds\.key\);\n/, '');

// 3. Remove `handleSaveSupabase`
const handleSaveStart = content.indexOf('const handleSaveSupabase = (e: React.FormEvent) => {');
if (handleSaveStart !== -1) {
  const handleSaveEnd = content.indexOf('  };\n', handleSaveStart) + 5;
  content = content.substring(0, handleSaveStart) + content.substring(handleSaveEnd);
}

// 4. Remove the Cloud Setup button
const buttonRegex = /<button\s+type="button"\s+onClick=\{\(\) => setShowSupabaseModal\(true\)\}[\s\S]*?<\/button>/;
content = content.replace(buttonRegex, '');

// 5. Remove the modal
const modalStart = content.indexOf('{/* SUPABASE CLOUD MULTIPLAYER CONFIG MODAL */}');
if (modalStart !== -1) {
  const modalEndMarker = '      )}\n';
  const modalEnd = content.indexOf(modalEndMarker, modalStart) + modalEndMarker.length;
  content = content.substring(0, modalStart) + content.substring(modalEnd);
}

fs.writeFileSync(file, content);
