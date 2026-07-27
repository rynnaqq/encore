const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

// The bottom should just close out the profile modal.
// Let's replace everything after `{/* PROFILE CONFIG MODAL */}` with a clean version.

const marker = '{/* PROFILE CONFIG MODAL */}';
const startIdx = content.indexOf(marker);

const newBottom = `      {/* PROFILE CONFIG MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showProfileModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm p-5 rounded-3xl bg-white shadow-2xl border-2 border-[#FFCCE1]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#E195AB]" />
                  <h3 className="text-sm font-bold text-slate-800">Your Chess Identity</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#E195AB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                    <select
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#E195AB] appearance-none"
                    >
                      <option value="ID">🇮🇩 Indonesia</option>
                      <option value="US">🇺🇸 United States</option>
                      <option value="GB">🇬🇧 United Kingdom</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="KR">🇰🇷 South Korea</option>
                      <option value="FR">🇫🇷 France</option>
                      <option value="DE">🇩🇪 Germany</option>
                      <option value="IN">🇮🇳 India</option>
                      <option value="BR">🇧🇷 Brazil</option>
                      <option value="RU">🇷🇺 Russia</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-5 py-2 rounded-xl bg-[#E195AB] hover:bg-[#d88299] text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
`;

content = content.substring(0, startIdx) + newBottom;
fs.writeFileSync(file, content);
