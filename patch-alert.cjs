const fs = require('fs');
let code = fs.readFileSync('src/components/UnoGameSection.tsx', 'utf8');

const oldRenderCard = `  const renderCard = (card: Card, isPlayable = false, onClick?: () => void) => {
    let bg = 'bg-slate-800';
    if (card.color === 'Red') bg = 'bg-red-500';
    if (card.color === 'Blue') bg = 'bg-blue-500';
    if (card.color === 'Green') bg = 'bg-green-500';
    if (card.color === 'Yellow') bg = 'bg-yellow-400';
    
    let displayValue: string = card.value;
    if (card.value === 'Reverse') displayValue = '⇌';
    if (card.value === 'Skip') displayValue = '⊘';
    if (card.value === 'DrawTwo') displayValue = '+2';
    if (card.value === 'Wild') displayValue = 'W';
    if (card.value === 'WildDrawFour') displayValue = '+4';

    return (
      <div 
        key={card.id}
        onClick={isPlayable ? onClick : undefined}
        className={\`relative w-20 h-32 md:w-24 md:h-36 rounded-xl border-4 border-white shadow-xl flex flex-col justify-between p-2 flex-shrink-0 select-none \${bg} \${isPlayable ? 'cursor-pointer hover:-translate-y-4 transition-transform z-10' : 'opacity-90'}\`}
      >`;

const newRenderCard = `  const renderCard = (card: Card, isPlayable = false, onClick?: () => void, isMyTurn = false) => {
    let bg = 'bg-slate-800';
    if (card.color === 'Red') bg = 'bg-red-500';
    if (card.color === 'Blue') bg = 'bg-blue-500';
    if (card.color === 'Green') bg = 'bg-green-500';
    if (card.color === 'Yellow') bg = 'bg-yellow-400';
    
    let displayValue: string = card.value;
    if (card.value === 'Reverse') displayValue = '⇌';
    if (card.value === 'Skip') displayValue = '⊘';
    if (card.value === 'DrawTwo') displayValue = '+2';
    if (card.value === 'Wild') displayValue = 'W';
    if (card.value === 'WildDrawFour') displayValue = '+4';

    const handleClick = () => {
      if (isPlayable && onClick) {
        onClick();
      } else if (isMyTurn && !isPlayable) {
        setErrorMsg('Invalid card! Must match color or number. Draw a card if you have no playable cards.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    };

    return (
      <div 
        key={card.id}
        onClick={handleClick}
        className={\`relative w-20 h-32 md:w-24 md:h-36 rounded-xl border-4 border-white shadow-xl flex flex-col justify-between p-2 flex-shrink-0 select-none \${bg} \${isPlayable ? 'cursor-pointer hover:-translate-y-4 transition-transform z-10' : 'cursor-pointer opacity-90'}\`}
      >`;

code = code.replace(oldRenderCard, newRenderCard);

code = code.replace(
  `{renderCard(card, isValid, () => handlePlayCard(card))}`,
  `{renderCard(card, isValid, () => handlePlayCard(card), isMyTurn)}`
);

fs.writeFileSync('src/components/UnoGameSection.tsx', code);
