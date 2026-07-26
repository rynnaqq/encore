import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  pauseDuration?: number;
  className?: string;
  isDarkMode?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 40,
  pauseDuration = 4000,
  className = '',
  isDarkMode = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting && index < text.length) {
      // Typing phase
      timer = setTimeout(() => {
        setDisplayedText(text.substring(0, index + 1));
        setIndex((prev) => prev + 1);
      }, speed);
    } else if (!isDeleting && index === text.length) {
      // Finished typing, pause before deleting
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && index > 0) {
      // Deleting phase (faster)
      timer = setTimeout(() => {
        setDisplayedText(text.substring(0, index - 1));
        setIndex((prev) => prev - 1);
      }, speed / 2);
    } else if (isDeleting && index === 0) {
      // Reset for next iteration
      setIsDeleting(false);
    }

    return () => clearTimeout(timer);
  }, [index, isDeleting, text, speed, pauseDuration]);

  // Highlight special keywords in the typed substring if they are present
  const renderFormattedText = (fullTyped: string) => {
    const keywords = ["web developer", "HTML, CSS, and JavaScript"];
    let parts: { text: string; isHighlight: boolean }[] = [{ text: fullTyped, isHighlight: false }];

    keywords.forEach((keyword) => {
      const newParts: { text: string; isHighlight: boolean }[] = [];
      parts.forEach((part) => {
        if (part.isHighlight) {
          newParts.push(part);
        } else {
          const splitText = part.text.split(keyword);
          splitText.forEach((st, idx) => {
            if (st) newParts.push({ text: st, isHighlight: false });
            if (idx < splitText.length - 1) {
              newParts.push({ text: keyword, isHighlight: true });
            }
          });
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) =>
      part.isHighlight ? (
        <span key={i} className={isDarkMode ? "text-slate-800 font-semibold" : "text-slate-800 font-semibold"}>
          {part.text}
        </span>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  return (
    <div className={`relative leading-relaxed text-slate-600 ${className}`}>
      {/* Invisible full text block holding static layout height */}
      <p className="invisible select-none opacity-0 pointer-events-none" aria-hidden="true">
        {text}
        <span className="inline-block w-[2.5px] h-[1.2em] ml-1" />
      </p>

      {/* Visible typewriter overlay */}
      <p className="absolute inset-0 top-0 left-0">
        {renderFormattedText(displayedText)}
        <span className="inline-block w-[2.5px] h-[1.2em] ml-1 bg-[#E195AB] align-middle animate-cursor-blink" />
      </p>
    </div>
  );
};
