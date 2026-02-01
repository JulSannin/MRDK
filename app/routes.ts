import { type RouteConfig, index, route } from '@react-router/dev/routes';

/** Конфигурация маршрутов приложения */
export default [
    index('routes/home.tsx'),
    route('events', 'routes/events.tsx'),
    route('events/event/:eventId', 'routes/event.tsx'),
    route('clubs', 'routes/clubs.tsx'),
    route('reminders', 'routes/reminders.tsx'),
    route('workplan', 'routes/workplan.tsx'),
    route('documents', 'routes/documents.tsx'),
    route('anticorruption', 'routes/anticorruption.tsx'),
    route('contacts', 'routes/contacts.tsx'),
    route('admin', 'routes/admin.tsx'),
    route('admin/login', 'routes/admin-login.tsx'),
] satisfies RouteConfig;
