import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const Tooltip = ({ text, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (_jsxs("div", { className: "relative flex items-center", onMouseEnter: () => setIsVisible(true), onMouseLeave: () => setIsVisible(false), children: [children, isVisible && (_jsxs("div", { className: "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none", children: [text, _jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" })] }))] }));
};
