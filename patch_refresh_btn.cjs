const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('RefreshCw')) {
  content = content.replace("import { Users, User, Share2, Clipboard, Trophy, Hash, Activity }", "import { Users, User, Share2, Clipboard, Trophy, Hash, Activity, RefreshCw }");
}

const target = `<h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-[#E195AB]" /> Public Rooms</span>
                <span className="text-xs font-mono bg-[#FFF5D7] px-2 py-1 rounded-full">{roomsList.length} Active</span>
             </h3>`;
const replace = `<div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#E195AB]" /> Public Rooms
                  <span className="text-xs font-mono bg-[#FFF5D7] px-2 py-1 rounded-full">{roomsList.length} Active</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    // Trigger manual refresh
                    const event = new CustomEvent('manual_refresh_rooms');
                    window.dispatchEvent(event);
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
                  title="Refresh Rooms"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
             </div>`;
content = content.replace(target, replace);
fs.writeFileSync(file, content);
