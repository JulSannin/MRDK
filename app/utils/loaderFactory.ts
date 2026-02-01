type AsyncFetchFn<T> = () => Promise<T[]>;

interface LoaderDataResult<T> {
    [key: string]: T[];
}

/**
 * Создает функцию clientLoader для React Router
 * @param {AsyncFetchFn<T>} fetchFn - Асинхронная функция для загрузки данных
 * @param {string} dataKey - Ключ для сохранения данных в объекте результата
 * @returns {Function} Функция clientLoader
 */
export function createDataLoader<T>(
    fetchFn: AsyncFetchFn<T>,
    dataKey: string
) {
    return async () => {
        try {
            const data = await fetchFn();
            return { [dataKey]: data } as LoaderDataResult<T>;
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error(`Failed to load ${dataKey}:`, error);
            }
            return { [dataKey]: [] } as LoaderDataResult<T>;
        }
    };
}
