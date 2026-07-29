const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

// Replace flex layout for local player hand
code = code.replace(
  `className="flex flex-wrap justify-center gap-2 max-w-4xl"`,
  `className="flex flex-row justify-center max-w-full overflow-visible -space-x-6 md:-space-x-10 px-4 py-8"`
);

// We need to add hover:z-[100] hover:scale-110 in the card wrapper in hand.
code = code.replace(
  `<div key={card.id} className={\`relative \${colorPickerVisible?.cardId === card.id ? 'z-50' : 'z-10'}\`}>`,
  `<div key={card.id} className={\`relative transition-all duration-300 hover:z-[100] hover:-translate-y-6 \${colorPickerVisible?.cardId === card.id ? 'z-[100]' : 'z-10'}\`}>`
);

// We should remove hover:-translate-y-4 from renderCard because we are moving the wrapper.
code = code.replace(
  `\${isPlayable ? 'cursor-pointer hover:-translate-y-4 transition-transform z-10' : 'cursor-pointer opacity-90'}\``,
  `\${isPlayable ? 'cursor-pointer transition-transform' : 'cursor-pointer opacity-90 hover:opacity-100'}\``
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
