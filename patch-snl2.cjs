const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

// Remove pink dots
code = code.replace(/style=\{\{\s*backgroundImage: 'radial-gradient\(#FFCCE1 20%, transparent 20%\)',\s*backgroundSize: '20px 20px'\s*\}\}/, 'style={{}}');

// Update SVGs
code = code.replace(/\{Object\.entries\(SNAKES_AND_LADDERS\)\.map\(\(\[start, end\], idx\) => \{[\s\S]*?<\/svg>/,
`{Object.entries(SNAKES_AND_LADDERS).map(([start, end], idx) => {
                  const s = parseInt(start);
                  const startPos = getCellPercent(s);
                  const endPos = getCellPercent(end);
                  const isLadder = end > s;
                  
                  return (
                    <g key={idx}>
                      {isLadder ? (
                        <g opacity="0.9">
                          {/* Ladder Rails */}
                          <line
                            x1={\`\${startPos.x}%\`}
                            y1={\`\${startPos.y}%\`}
                            x2={\`\${endPos.x}%\`}
                            y2={\`\${endPos.y}%\`}
                            stroke="#b45309"
                            strokeWidth="16"
                            strokeLinecap="round"
                          />
                          {/* Ladder Inner (Hollow) */}
                          <line
                            x1={\`\${startPos.x}%\`}
                            y1={\`\${startPos.y}%\`}
                            x2={\`\${endPos.x}%\`}
                            y2={\`\${endPos.y}%\`}
                            stroke="#FFF5D7"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />
                          {/* Ladder Rungs */}
                          <line
                            x1={\`\${startPos.x}%\`}
                            y1={\`\${startPos.y}%\`}
                            x2={\`\${endPos.x}%\`}
                            y2={\`\${endPos.y}%\`}
                            stroke="#b45309"
                            strokeWidth="16"
                            strokeDasharray="4 12"
                          />
                        </g>
                      ) : (
                        <g opacity="0.9">
                          {/* Snake Body Outline */}
                          <line
                            x1={\`\${startPos.x}%\`}
                            y1={\`\${startPos.y}%\`}
                            x2={\`\${endPos.x}%\`}
                            y2={\`\${endPos.y}%\`}
                            stroke="#065f46"
                            strokeWidth="16"
                            strokeLinecap="round"
                          />
                          {/* Snake Body */}
                          <line
                            x1={\`\${startPos.x}%\`}
                            y1={\`\${startPos.y}%\`}
                            x2={\`\${endPos.x}%\`}
                            y2={\`\${endPos.y}%\`}
                            stroke="#10b981"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {/* Snake Pattern */}
                          <line
                            x1={\`\${startPos.x}%\`}
                            y1={\`\${startPos.y}%\`}
                            x2={\`\${endPos.x}%\`}
                            y2={\`\${endPos.y}%\`}
                            stroke="#065f46"
                            strokeWidth="12"
                            strokeDasharray="4 12"
                            strokeLinecap="round"
                          />
                          {/* Snake Head */}
                          <circle cx={\`\${startPos.x}%\`} cy={\`\${startPos.y}%\`} r="12" fill="#10b981" stroke="#065f46" strokeWidth="2" />
                          {/* Snake Eyes/Tongue */}
                          <circle cx={\`\${startPos.x}%\`} cy={\`\${startPos.y}%\`} r="4" fill="#ef4444" />
                          {/* Snake Tail */}
                          <circle cx={\`\${endPos.x}%\`} cy={\`\${endPos.y}%\`} r="6" fill="#10b981" stroke="#065f46" strokeWidth="2" />
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>`);

fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
