import UsefulLinkCard from './UsefulLinkCard';
import { usefulLinksData } from './usefulLinksData';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useCarousel } from '../../../hooks/useCarousel';

// Useful links carousel component
export default function UsefulLinksCarousel() {
    const windowWidth = useWindowWidth(1024);
    const cardsToShow = windowWidth < 1024 ? 2 : 3;
    const {
        currentIndex,
        totalSlides,
        handlePrev,
        handleNext,
        handleDotClick,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    } = useCarousel({
        totalItems: usefulLinksData.length,
        itemsPerSlide: cardsToShow,
        autoPlayMs: 5000,
        swipeThreshold: 50,
    });

    return (
        <div className="p-[40px]">
            <div className="max-w-[1260px] mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 app-text-dark">
                    Полезные ссылки
                </h2>

                <div className="relative">
                    {/* Кнопка "Назад" */}
                    <button
                        onClick={handlePrev}
                        aria-label="Предыдущий слайд"
                        className="hidden lg:block absolute left-4 2xl:left-[-50px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg hover:text-white transition-all duration-300 app-hover-primary"
                    >
                        <span className="text-2xl leading-none">‹</span>
                    </button>

                    {/* Карусель */}
                    <div
                        className="overflow-hidden"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentIndex * 100}%)`
                            }}
                        >
                            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                                <div
                                    key={slideIndex}
                                    className="w-full flex-shrink-0"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {usefulLinksData
                                            .slice(
                                                slideIndex * cardsToShow,
                                                slideIndex * cardsToShow + cardsToShow
                                            )
                                            .map((link) => (
                                                <UsefulLinkCard key={link.id} link={link} />
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Кнопка "Вперёд" */}
                    <button
                        onClick={handleNext}
                        aria-label="Следующий слайд"
                        className="hidden lg:block absolute right-4 2xl:right-[-50px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg hover:text-white transition-all duration-300 app-hover-primary"
                    >
                        <span className="text-2xl leading-none">›</span>
                    </button>
                </div>

                {/* Мобильные кнопки */}
                <div className="flex md:hidden justify-center gap-4 mt-6">
                    <button
                        onClick={handlePrev}
                        aria-label="Предыдущий слайд"
                        className="w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg hover:text-white transition-all app-hover-primary"
                    >
                        <span className="text-2xl leading-none">‹</span>
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label="Следующий слайд"
                        className="w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg hover:text-white transition-all app-hover-primary"
                    >
                        <span className="text-2xl leading-none">›</span>
                    </button>
                </div>

                {/* Индикаторы (точки) */}
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleDotClick(index)}
                            aria-label={`Перейти к слайду ${index + 1}`}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'w-8 app-bg-primary'
                                    : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
