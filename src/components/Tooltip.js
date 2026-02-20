import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const Tooltip = ({ text, children, className = "", direction = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const isBottom = direction === 'bottom';
    return (_jsxs("div", { className: `relative ${className}`, onMouseEnter: () => setIsVisible(true), onMouseLeave: () => setIsVisible(false), children: [children, isVisible && (_jsxs("div", { className: `absolute z-[10000] left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap
            ${isBottom ? 'top-full mt-2' : 'bottom-full mb-2'}`, children: [text, isBottom ? (_jsx("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" })) : (_jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" }))] }))] }));
};
