const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove import of saveSupabaseCredentials (not used now or doesn't exist)
content = content.replace(/import \{ getSupabaseCredentials, saveSupabaseCredentials \} from '\.\.\/lib\/supabaseClient';/, 'import { getSupabaseCredentials } from \'../lib/supabaseClient\';');

// Remove showSupabaseModal state
content = content.replace(/  const \[showSupabaseModal, setShowSupabaseModal\] = useState\(false\);\n/, '');

// Remove customSupaUrl, customSupaKey
content = content.replace(/  const \[customSupaUrl, setCustomSupaUrl\] = useState\(supabaseCreds\.url\);\n/, '');
content = content.replace(/  const \[customSupaKey, setCustomSupaKey\] = useState\(supabaseCreds\.key\);\n/, '');

// Remove the modal and button
content = content.replace(/          <button\s+type="button"\s+onClick=\{\(\) => setShowSupabaseModal\(true\)\}[\s\S]*?<\/button>/, '');

// Remove the modal itself. It starts with "{showSupabaseModal && (" and ends before "{/* ROOM LOBBY / FEED SCREEN */}"
const modalRegex = /\{showSupabaseModal && \([\s\S]*?\}\) \/\* End Supabase Modal \*\/\}/g;
if (modalRegex.test(content)) {
  content = content.replace(modalRegex, '');
} else {
  // If we can't find it with the comment, let's manually slice it out.
  const modalStart = content.indexOf('{showSupabaseModal && (');
  if (modalStart !== -1) {
    const feedStart = content.indexOf('{/* SUPABASE CLOUD MULTIPLAYER CONFIG MODAL */}');
    if (feedStart !== -1) {
        // Find the closing } of the modal
        const feedEnd = content.indexOf('</div>\n    </div>\n  );\n}\n');
        // Let's just remove the block from `{/* SUPABASE CLOUD MULTIPLAYER CONFIG MODAL */}` up to `  return (\n` minus whatever
    }
  }
}

fs.writeFileSync(file, content);
