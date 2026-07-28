const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

const regex = /\{\/\* SVG Overlay for Snakes and Ladders \*\/\}(.|\n)*?<\/svg>/m;

const replacement = `{/* SVG Overlay for Snakes and Ladders */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full z-20 pointer-events-none drop-shadow-lg">
                  {Object.entries(SNAKES_AND_LADDERS).map(([start, end], idx) => {
                    const s = parseInt(start);
                    const e = end;
                    const isLadder = e > s;
                    const startP = getCellPercent(s);
                    const endP = getCellPercent(e);
                    
                    const dx = endP.x - startP.x;
                    const dy = endP.y - startP.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    if (isLadder) {
                      const numRungs = Math.max(3, Math.floor(length / 4));
                      const rungs = [];
                      for (let i = 1; i <= numRungs; i++) {
                        rungs.push((i / (numRungs + 1)) * length);
                      }
                      
                      return (
                        <g key={idx} transform={\`translate(\${startP.x}, \${startP.y}) rotate(\${angle})\`}>
                          {/* Wood rails */}
                          <line x1={0} y1={-2.2} x2={length} y2={-2.2} stroke="#a7683c" strokeWidth="1.2" strokeLinecap="round" />
                          <line x1={0} y1={2.2} x2={length} y2={2.2} stroke="#a7683c" strokeWidth="1.2" strokeLinecap="round" />
                          
                          {/* Inner rails highlight */}
                          <line x1={0} y1={-2.5} x2={length} y2={-2.5} stroke="#8a532d" strokeWidth="0.4" strokeLinecap="round" />
                          <line x1={0} y1={1.9} x2={length} y2={1.9} stroke="#8a532d" strokeWidth="0.4" strokeLinecap="round" />
                          
                          {/* Rungs */}
                          {rungs.map((r, i) => (
                            <line key={i} x1={r} y1={-2.2} x2={r} y2={2.2} stroke="#8a532d" strokeWidth="1" strokeLinecap="round" />
                          ))}
                        </g>
                      );
                    } else {
                      // Snake body waves
                      const numWaves = Math.max(1, Math.floor(length / 12));
                      const points = [];
                      for (let i = 0; i <= 30; i++) {
                        const t = i / 30;
                        const x = t * length;
                        const y = Math.sin(t * numWaves * Math.PI * 2) * 3 * Math.sin(t * Math.PI); // taper amplitude at ends
                        points.push(\`\${x},\${y}\`);
                      }
                      const pathD = \`M \${points.join(' L ')}\`;

                      return (
                        <g key={idx} transform={\`translate(\${startP.x}, \${startP.y}) rotate(\${angle})\`}>
                          {/* Body outline (border) */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#166534"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Body inner */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Pattern / scales */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#15803d"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="1 3"
                          />
                          
                          {/* Snake Head (at 0,0, facing -x) */}
                          <circle cx={-0.5} cy={0} r={2.5} fill="#22c55e" stroke="#166534" strokeWidth="0.4" />
                          
                          {/* Eyes */}
                          <circle cx={-1.5} cy={-1.2} r={0.7} fill="#fff" />
                          <circle cx={-1.5} cy={1.2} r={0.7} fill="#fff" />
                          <circle cx={-1.8} cy={-1.2} r={0.3} fill="#000" />
                          <circle cx={-1.8} cy={1.2} r={0.3} fill="#000" />
                          
                          {/* Tongue */}
                          <path d="M -2.5 0 L -4.5 0 M -4.5 0 L -5.5 -1 M -4.5 0 L -5.5 1" stroke="#ef4444" strokeWidth="0.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      );
                    }
                  })}
                </svg>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
