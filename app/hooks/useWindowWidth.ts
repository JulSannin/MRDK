import { useEffect, useState } from 'react';

export function useWindowWidth(defaultWidth = 1024) {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : defaultWidth
    );

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return width;
}
