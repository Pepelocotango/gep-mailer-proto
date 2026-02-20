import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const Tooltip = ({ text, children, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (_jsxs("div", { className: `relative ${className}`, onMouseEnter: () => setIsVisible(true), onMouseLeave: () => setIsVisible(false), children: [children, isVisible && (_jsxs("div", { className: "absolute z-[10000] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded shadow-lg whitespace-nowrap", children: [text, _jsx("div", { className: "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" })] }))] }));
};
