const fs = require('fs');
let code = fs.readFileSync('src/components/SnakeAndLaddersSection.tsx', 'utf8');

const regex = /\{cells\.map\(\(cellNum\) => \{(.|\n)*?<\/div>\n\s*\);\n\s*\}\)\}/m;

const replacement = `{cells.map((cellNum) => {
                    const colors = ['bg-rose-100', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-purple-100'];
                    const colorClass = colors[cellNum % colors.length];
                    return (
                      <div 
                        key={cellNum}
                        className={\`relative flex items-center justify-center border-2 border-white/50 rounded-lg md:rounded-xl m-[1px] md:m-0.5 \${colorClass} shadow-sm\`}
                      >
                        <span className="text-[10px] sm:text-xs font-black text-slate-700/50 absolute top-1 left-1.5">{cellNum}</span>
                      </div>
                    );
                  })}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/SnakeAndLaddersSection.tsx', code);
