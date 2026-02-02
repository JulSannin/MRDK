import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from 'react-router';
import Header from './components/shared/ui/header';
import Footer from './components/shared/ui/footer';
import UsefulLinksCarousel from './components/main/useful-links/UsefulLinksCarousel';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmDialogProvider } from './contexts/ConfirmDialogContext';
import NotificationContainer from './components/shared/ui/notification/NotificationContainer';
import LoadingFallback from './components/shared/ui/LoadingFallback';

import type { Route } from './+types/root';
import './app.css';

// Link external resources (Google Fonts)
export const links: Route.LinksFunction = () => [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
    },
    {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
    },
];

// Root layout with HTML structure
export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

// Loading component during hydration
export function HydrateFallback() {
    return <LoadingFallback />;
}

// Main app component with providers and structure
export default function App() {
    return (
        <NotificationProvider>
            <ConfirmDialogProvider>
                <div className="min-h-screen flex flex-col app-bg-light">
                    <Header />
                    <main className="flex-1">
                        <Outlet />
                    </main>
                    <UsefulLinksCarousel />
                    <Footer />
                </div>
                <NotificationContainer />
            </ConfirmDialogProvider>
        </NotificationProvider>
    );
}

// Route error boundary
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = 'Oops!';
    let details = 'An unexpected error occurred.';
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error';
        details =
            error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
