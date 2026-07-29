const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

code = code.replace(
  `<div className="w-full max-w-full overflow-x-auto pb-10 pt-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">`,
  `<div className="w-full max-w-full overflow-x-auto pb-4 pt-4 px-2 scroll-smooth">`
);

code = code.replace(
  `<div className="flex flex-row justify-start md:justify-center w-max min-w-full mx-auto -space-x-3 md:-space-x-8 px-4 pr-12 md:pr-4">`,
  `<div className="flex flex-row justify-start w-max min-w-full gap-2 md:gap-4 px-4 pb-4 mx-auto">`
);

code = code.replace(
  `className={\`relative transition-all duration-300 hover:z-[100] hover:-translate-y-6 \${colorPickerVisible?.cardId === card.id ? 'z-[100]' : 'z-10'}\`}`,
  `className={\`relative transition-transform duration-200 \${isMyTurn && isValid ? 'hover:-translate-y-2' : ''} \${colorPickerVisible?.cardId === card.id ? 'z-[50]' : 'z-10'}\`}`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
