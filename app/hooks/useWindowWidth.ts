import { useEffect, useState } from 'react';

export function useWindowWidth(defaultWidth = 1024) {
    const [width, setWidth] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Устанавливаем isMounted ТОЛЬКО после гидрации
        setIsMounted(true);
        setWidth(window.innerWidth);

        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Во время SSR и гидрации возвращаем defaultWidth
    // После гидрации возвращаем реальную ширину
    return isMounted ? (width ?? defaultWidth) : defaultWidth;
}
