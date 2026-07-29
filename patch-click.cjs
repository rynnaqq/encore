const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `{renderCard(card, isValid, () => handlePlayCard(card))}`,
  `{renderCard(card, isMyTurn, () => {
                            if (!isValid) {
                              // Maybe show a temporary error or just do nothing?
                              // But if isMyTurn is true, it will call this.
                              // Let's just make it playable only if isValid, but let's see.
                            } else {
                              handlePlayCard(card);
                            }
                          })}`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
