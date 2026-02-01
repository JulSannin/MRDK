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
