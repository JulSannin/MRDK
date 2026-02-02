/**
 * Инициирует скачивание файла через создание временной ссылки
 * @param {string} fileUrl - URL файла для скачивания
 * @param {string} fileName - Имя файла для сохранения
 * @returns {void}
 */
export function handleDownload(fileUrl: string, fileName: string): void {
    try {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Failed to download file:', error);
        throw error;
    }
}

/**
 * Нормализует URL изображения с учетом относительных путей
 * @param {string | null | undefined} url - Исходный URL
 * @param {string} baseUrl - Базовый URL бэкенда
 * @returns {string} Нормализованный URL
 */
export function normalizeImageUrl(
    url: string | null | undefined,
    baseUrl = import.meta.env.VITE_BACKEND_URL || ''
): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return baseUrl ? `${baseUrl}${url}` : url;
}
