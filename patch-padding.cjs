const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldHand2 = `                  <div className="w-full max-w-full overflow-x-auto pb-10 pt-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex flex-row justify-start md:justify-center w-max min-w-full mx-auto -space-x-3 md:-space-x-8 px-4">`;

const newHand2 = `                  <div className="w-full max-w-full overflow-x-auto pb-10 pt-6 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex flex-row justify-start md:justify-center w-max min-w-full mx-auto -space-x-3 md:-space-x-8 px-4 pr-12 md:pr-4">`;

code = code.replace(oldHand2, newHand2);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
