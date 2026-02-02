// Download file from URL
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

// Normalize image URLs with backend base URL
export function normalizeImageUrl(
    url: string | null | undefined,
    baseUrl = import.meta.env.VITE_BACKEND_URL || ''
): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return baseUrl ? `${baseUrl}${url}` : url;
}
