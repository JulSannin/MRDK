import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

type UseCarouselOptions = {
    totalItems: number;
    itemsPerSlide: number;
    autoPlayMs?: number;
    swipeThreshold?: number;
};

export function useCarousel({
    totalItems,
    itemsPerSlide,
    autoPlayMs = 5000,
    swipeThreshold = 50,
}: UseCarouselOptions) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const touchEndXRef = useRef<number | null>(null);

    const totalSlides = Math.max(1, Math.ceil(totalItems / itemsPerSlide));

    useEffect(() => {
        if (!isAutoPlaying) return;

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides);
        }, autoPlayMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isAutoPlaying, totalSlides, autoPlayMs]);

    useEffect(() => {
        setCurrentIndex((prev) => (prev >= totalSlides ? 0 : prev));
    }, [totalSlides]);

    const handlePrev = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const handleNext = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };

    const handleDotClick = (index: number) => {
        setIsAutoPlaying(false);
        setCurrentIndex(index);
    };

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        touchStartXRef.current = event.touches[0]?.clientX ?? null;
        touchEndXRef.current = null;
        setIsAutoPlaying(false);
    };

    const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        touchEndXRef.current = event.touches[0]?.clientX ?? null;
    };

    const handleTouchEnd = () => {
        const startX = touchStartXRef.current;
        const endX = touchEndXRef.current;

        if (startX === null || endX === null) return;

        const distance = startX - endX;

        if (distance > swipeThreshold) {
            handleNext();
        } else if (distance < -swipeThreshold) {
            handlePrev();
        }
    };

    return {
        currentIndex,
        totalSlides,
        handlePrev,
        handleNext,
        handleDotClick,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}
