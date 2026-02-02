/** Компонент загрузки для HydrateFallback */
export default function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-75 animate-pulse"></div>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Загрузка...</h2>
                <p className="text-gray-600">Пожалуйста, подождите</p>
            </div>
        </div>
    );
}
