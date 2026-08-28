import React, { useEffect, useState } from 'react';

interface TerminalTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  color?: 'green' | 'cyan' | 'magenta';
  className?: string;
}

const colorMap = {
  green: 'text-neon-green',
  cyan: 'text-neon-cyan',
  magenta: 'text-neon-magenta',
};

export const TerminalText: React.FC<TerminalTextProps> = ({
  text,
  speed = 25,
  onComplete,
  color = 'green',
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedText.length === text.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, text, speed, onComplete]);

  return (
    <div className={`${colorMap[color]} font-mono text-sm ${className}`}>
      <span>{displayedText}</span>
      {!isComplete && <span className="animate-pulse">▮</span>}
    </div>
  );
};

export default TerminalText;
