'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export default function ThemeProvider({ children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        setMounted(true);
    }, []);

    if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>;

    return (
        <ThemeContext.Provider value={{ theme: 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}
