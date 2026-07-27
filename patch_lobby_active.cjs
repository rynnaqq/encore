const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

const newActiveRoom = `      {activeRoom ? (
        <div className="bg-white/80 p-5 rounded-3xl border border-[#FFCCE1]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E195AB]" /> {activeRoom.roomName}
            </h3>
            <div className="flex items-center gap-2 bg-[#FFF5D7] px-3 py-1.5 rounded-xl border border-[#FFCCE1]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Code</span>
              <span className="text-sm font-mono font-bold text-slate-800">{activeRoom.roomId}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?room=' + activeRoom.roomId);
                  setCopiedCodeOnly(true);
                  setTimeout(() => setCopiedCodeOnly(false), 2000);
                }}
                className="p-1 hover:bg-[#FFCCE1]/50 rounded-lg transition-colors cursor-pointer text-[#E195AB]"
                title="Copy Invite Link"
              >
                {copiedCodeOnly ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">{activeRoom.whitePlayer?.flag || '⚪'}</div>
                 <div>
                   <div className="font-bold text-xs text-slate-800">{activeRoom.whitePlayer?.name || 'Waiting...'}</div>
                   <div className="text-[10px] text-slate-500">White • {activeRoom.timeControl} min</div>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">VS</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">{activeRoom.blackPlayer?.flag || '⚫'}</div>
                 <div>
                   <div className="font-bold text-xs text-white">{activeRoom.blackPlayer?.name || 'Waiting...'}</div>
                   <div className="text-[10px] text-slate-400">Black • {activeRoom.timeControl} min</div>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="mt-5 flex justify-end">
            <button onClick={onLeaveRoom} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100">
              Leave Room
            </button>
          </div>
        </div>
      ) : (`;

content = content.replace('      {!activeRoom ? (', newActiveRoom);
content = content.replace('      ) : null}', '      )}');
fs.writeFileSync(file, content);
