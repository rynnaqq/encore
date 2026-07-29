const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldCall = `{renderCard(card, isMyTurn, () => {
                            if (!isValid) {
                              // Maybe show a temporary error or just do nothing?
                              // But if isMyTurn is true, it will call this.
                              // Let's just make it playable only if isValid, but let's see.
                            } else {
                              handlePlayCard(card);
                            }
                          })}`;
const newCall = `{renderCard(card, isValid, () => handlePlayCard(card), isMyTurn)}`;

code = code.replace(oldCall, newCall);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
