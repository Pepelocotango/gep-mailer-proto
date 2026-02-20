import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  direction?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, className = "", direction = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isBottom = direction === 'bottom';

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-[10000] left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap
            ${isBottom ? 'top-full mt-2' : 'bottom-full mb-2'}`}
        >
          {text}
          {isBottom ? (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
          ) : (
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          )}
        </div>
      )}
    </div>
  );
};
