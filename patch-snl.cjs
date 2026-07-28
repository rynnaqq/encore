const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

// Update SVG paths for snakes and ladders to be clearer
code = code.replace(/<line\s+x1=\{`\$\{startPos.x\}%`\}\s+y1=\{`\$\{startPos.y\}%`\}\s+x2=\{`\$\{endPos.x\}%`\}\s+y2=\{`\$\{endPos.y\}%`\}\s+stroke=\{isLadder \? "#10b981" : "#ef4444"\}\s+strokeWidth="4"\s+strokeDasharray=\{isLadder \? "8 4" : "none"\}\s+strokeLinecap="round"\s+opacity="0.6"\s+\/>\s+<circle cx=\{`\$\{startPos.x\}%`\} cy=\{`\$\{startPos.y\}%`\} r="4" fill=\{isLadder \? "#10b981" : "#ef4444"\} opacity="0.8" \/>\s+<circle cx=\{`\$\{endPos.x\}%`\} cy=\{`\$\{endPos.y\}%`\} r="4" fill=\{isLadder \? "#10b981" : "#ef4444"\} opacity="0.8" \/>/g,
`{/* Thicker background glow for better visibility */}
                      <line
                        x1={\`\${startPos.x}%\`}
                        y1={\`\${startPos.y}%\`}
                        x2={\`\${endPos.x}%\`}
                        y2={\`\${endPos.y}%\`}
                        stroke={isLadder ? "#10b981" : "#ef4444"}
                        strokeWidth={isLadder ? "14" : "10"}
                        strokeLinecap="round"
                        opacity="0.25"
                      />
                      {/* Foreground detailed line */}
                      <line
                        x1={\`\${startPos.x}%\`}
                        y1={\`\${startPos.y}%\`}
                        x2={\`\${endPos.x}%\`}
                        y2={\`\${endPos.y}%\`}
                        stroke={isLadder ? "#10b981" : "#ef4444"}
                        strokeWidth={isLadder ? "6" : "6"}
                        strokeDasharray={isLadder ? "12 8" : "none"}
                        strokeLinecap="round"
                        opacity="0.95"
                      />
                      <circle cx={\`\${startPos.x}%\`} cy={\`\${startPos.y}%\`} r="6" fill={isLadder ? "#10b981" : "#ef4444"} stroke="#ffffff" strokeWidth="2" opacity="1" />
                      <circle cx={\`\${endPos.x}%\`} cy={\`\${endPos.y}%\`} r="6" fill={isLadder ? "#10b981" : "#ef4444"} stroke="#ffffff" strokeWidth="2" opacity="1" />`);

// Remove backdrop blur (performance on low-end devices)
code = code.replaceAll('bg-white/90 backdrop-blur-md', 'bg-white');
code = code.replaceAll('bg-slate-900/60 backdrop-blur-md', 'bg-slate-900/80');

// Disable infinity scale animation which takes CPU on low end devices
code = code.replace(/scale: idx === room.currentPlayerIndex \? \[1, 1\.1, 1\] : 1\s+\}\}\s+transition=\{\{\s+duration: 0\.5,\s+type: "spring",\s+scale: \{ repeat: Infinity, duration: 1\.5 \}\s+\}\}/g,
`scale: idx === room.currentPlayerIndex ? 1.15 : 1
                    }}
                    transition={{ 
                      duration: 0.5, 
                      type: "spring"
                    }}`);

fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
