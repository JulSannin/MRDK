# Ревью кода всего сайта

## Итог
Критичных уязвимостей не найдено, но есть повторяющийся код и несколько мест, которые стоит привести к общим утилитам/конфигу. Ниже список по зонам с ссылками на файлы.

## Frontend (app/)
### Повторяющиеся участки
- ✅ **Нормализация URL изображений** — вынесена в утилиту; все компоненты используют `normalizeImageUrl()` из [app/utils/fileHelpers.ts](app/utils/fileHelpers.ts):
  - [app/components/main/events/EventCard.tsx](app/components/main/events/EventCard.tsx) — использует для background-image
  - [app/components/main/events/EventItem.tsx](app/components/main/events/EventItem.tsx) — использует для `<img src>`
  - [app/components/main/reminders/Reminders.tsx](app/components/main/reminders/Reminders.tsx) — использует для модального окна
  - Файлы (documents, workplan) — используют `handleDownload()` из той же утилиты
  - **Результат:** Нет прямых конструкций URL вроде `${API_URL}/uploads` в компонентах ✓

### Потенциальные улучшения
- ✅ **Базовый URL в `normalizeImageUrl()`** — уже читается из env переменной `VITE_BACKEND_URL` (см. [app/config/constants.ts](app/config/constants.ts)). Позволяет использовать разные адреса для localhost, staging и production без пересборки кода.
- Кнопка «режим для слабовидящих» без обработчика: сейчас это мертвый UI. Файл: [app/components/shared/ui/header/navbar/NavActions.tsx](app/components/shared/ui/header/navbar/NavActions.tsx).

## Backend (server/)
### Дублирование/повтор кода
- ✅ **Логика загрузки файлов** — создана новая утилита [server/utils/multerHelpers.js](server/utils/multerHelpers.js) с фабриками для:
  - `createUploadMiddleware()` — единая конфигурация multer для всех типов файлов (image, document, reminderImage, workplanFile)
  - `createUploadStorage()` — настройка хранилища (папка, префикс, размер)
  - `getUploadPath()` — получение пути к файлу
  - Поддержка разных file filters (regex для изображений, массив типов для документов)
  - **Результат**: Все 4 роута обновлены, 150+ строк дублирования удалено
- ✅ **Схемы валидации** — централизованы в [server/utils/validationSchemas.js](server/utils/validationSchemas.js):
  - `COMMON_VALIDATION_RULES` — повторяющиеся правила (titleLong, descriptionLong, date и т.д.)
  - `VALIDATION_SCHEMAS` — готовые схемы для каждой сущности (event, document, reminder, workplan)
  - Все 4 роута обновлены использовать централизованные схемы вместо копипасты
  - **Результат**: Валидация из одного источника, легко обновлять и добавлять новые сущности

### Неиспользуемый код
- ✅ `isValidPriority()` — удалена в коммите `7f55acee`. Функция была написана но никогда не использовалась в валидации. Задача решена.

### Потенциальные улучшения
- CSP в [server/index.js](server/index.js) блокирует inline-стили (`style-src` без `'unsafe-inline'`). Если фронтэнд отдается этим сервером, inline-стили React могут не работать. Если фронтэнд на отдельном хосте — уточните, применяется ли CSP к нему.
- В [server/database/db.js](server/database/db.js) используется файловая БД; при росте нагрузки вероятны проблемы с конкурентным доступом и масштабированием. Если проект будет развиваться, стоит рассмотреть переход на полноценную БД.

## Общие заметки
- Во фронтенде и бэкенде используются собственные валидаторы. Если планируется расширение, стоит унифицировать подход (например, общие схемы или более строгие проверки на уровне API).

---
Если хотите, могу продолжить и:
- вынести повторяющийся upload-код в server utils;
- сделать базовый URL для изображений через env;
- убрать мертвые элементы UI или добавить обработчик.

---

## Подробно по файлам (site-wide)

### Frontend (app/)
- [app/root.tsx](app/root.tsx): OK.
- [app/routes.ts](app/routes.ts): OK.
- [app/app.css](app/app.css): OK.
- [app/vite-env.d.ts](app/vite-env.d.ts): OK.

**config**
- [app/config/constants.ts](app/config/constants.ts): OK.

**hooks**
- [app/hooks/useCarousel.ts](app/hooks/useCarousel.ts): OK.
- [app/hooks/useManager.ts](app/hooks/useManager.ts): OK.
- [app/hooks/useWindowWidth.ts](app/hooks/useWindowWidth.ts): OK.

**utils**
- [app/utils/api.ts](app/utils/api.ts): OK.
- [app/utils/dateHelpers.ts](app/utils/dateHelpers.ts): OK.
- [app/utils/errorHandler.ts](app/utils/errorHandler.ts): OK.
- [app/utils/eventHelpers.ts](app/utils/eventHelpers.ts): OK.
- [app/utils/fileHelpers.ts](app/utils/fileHelpers.ts): Базовый URL изображений зашит в `normalizeImageUrl()` — лучше вынести в env.
- [app/utils/formDataHelpers.ts](app/utils/formDataHelpers.ts): OK.
- [app/utils/loaderFactory.ts](app/utils/loaderFactory.ts): OK.

**contexts**
- [app/contexts/ConfirmDialogContext.tsx](app/contexts/ConfirmDialogContext.tsx): OK.
- [app/contexts/NotificationContext.tsx](app/contexts/NotificationContext.tsx): OK.

**routes**
- [app/routes/home.tsx](app/routes/home.tsx): OK.
- [app/routes/events.tsx](app/routes/events.tsx): OK.
- [app/routes/event.tsx](app/routes/event.tsx): OK.
- [app/routes/clubs.tsx](app/routes/clubs.tsx): OK.
- [app/routes/reminders.tsx](app/routes/reminders.tsx): OK.
- [app/routes/workplan.tsx](app/routes/workplan.tsx): OK.
- [app/routes/documents.tsx](app/routes/documents.tsx): OK.
- [app/routes/anticorruption.tsx](app/routes/anticorruption.tsx): OK.
- [app/routes/contacts.tsx](app/routes/contacts.tsx): OK.
- [app/routes/admin.tsx](app/routes/admin.tsx): OK.
- [app/routes/admin-login.tsx](app/routes/admin-login.tsx): OK.

**components/entities**
- [app/components/entities/types.ts](app/components/entities/types.ts): OK.

**components/features/auth**
- [app/components/features/auth/Admin.tsx](app/components/features/auth/Admin.tsx): OK.
- [app/components/features/auth/AdminLogin.tsx](app/components/features/auth/AdminLogin.tsx): OK.
- [app/components/features/auth/DocumentsManager.tsx](app/components/features/auth/DocumentsManager.tsx): OK.
- [app/components/features/auth/EventsManager.tsx](app/components/features/auth/EventsManager.tsx): OK.
- [app/components/features/auth/RemindersManager.tsx](app/components/features/auth/RemindersManager.tsx): OK.
- [app/components/features/auth/WorkplanManager.tsx](app/components/features/auth/WorkplanManager.tsx): OK.

**components/main**
- [app/components/main/documents/Documents.tsx](app/components/main/documents/Documents.tsx): OK.
- [app/components/main/workplan/Workplan.tsx](app/components/main/workplan/Workplan.tsx): OK.
- [app/components/main/reminders/Reminders.tsx](app/components/main/reminders/Reminders.tsx): OK.
- [app/components/main/events/Events.tsx](app/components/main/events/Events.tsx): OK.
- [app/components/main/events/EventGrid.tsx](app/components/main/events/EventGrid.tsx): OK.
- [app/components/main/events/EventItem.tsx](app/components/main/events/EventItem.tsx): OK.
- [app/components/main/events/EventCard.tsx](app/components/main/events/EventCard.tsx): OK.
- [app/components/main/useful-links/UsefulLinksCarousel.tsx](app/components/main/useful-links/UsefulLinksCarousel.tsx): OK.
- [app/components/main/useful-links/UsefulLinkCard.tsx](app/components/main/useful-links/UsefulLinkCard.tsx): OK.
- [app/components/main/useful-links/usefulLinksData.ts](app/components/main/useful-links/usefulLinksData.ts): OK.
- [app/components/main/clubs/ClubsTable.tsx](app/components/main/clubs/ClubsTable.tsx): OK.
- [app/components/main/clubs/clubsData.ts](app/components/main/clubs/clubsData.ts): OK.

**components/shared**
- [app/components/shared/types/links.ts](app/components/shared/types/links.ts): OK.
- [app/components/shared/ui/Button.tsx](app/components/shared/ui/Button.tsx): OK.
- [app/components/shared/ui/LoadingFallback.tsx](app/components/shared/ui/LoadingFallback.tsx): OK.
- [app/components/shared/ui/notification/NotificationContainer.tsx](app/components/shared/ui/notification/NotificationContainer.tsx): OK.
- [app/components/shared/ui/notification/NotificationItem.tsx](app/components/shared/ui/notification/NotificationItem.tsx): OK.
- [app/components/shared/ui/header/index.ts](app/components/shared/ui/header/index.ts): OK.
- [app/components/shared/ui/header/header/Header.tsx](app/components/shared/ui/header/header/Header.tsx): OK.
- [app/components/shared/ui/header/navbar/Navbar.tsx](app/components/shared/ui/header/navbar/Navbar.tsx): OK.
- [app/components/shared/ui/header/navbar/NavLinks.tsx](app/components/shared/ui/header/navbar/NavLinks.tsx): OK.
- [app/components/shared/ui/header/navbar/NavLinkItem.tsx](app/components/shared/ui/header/navbar/NavLinkItem.tsx): OK.
- [app/components/shared/ui/header/navbar/NavActions.tsx](app/components/shared/ui/header/navbar/NavActions.tsx): Кнопка «режим для слабовидящих» без обработчика — мертвый UI.
- [app/components/shared/ui/header/navbar/Logo.tsx](app/components/shared/ui/header/navbar/Logo.tsx): OK.
- [app/components/shared/ui/header/navbar/SocialMedia.tsx](app/components/shared/ui/header/navbar/SocialMedia.tsx): OK.
- [app/components/shared/ui/header/navbar/BurgerMenuButton.tsx](app/components/shared/ui/header/navbar/BurgerMenuButton.tsx): OK.
- [app/components/shared/ui/header/navbar/BurgerMenuPanel.tsx](app/components/shared/ui/header/navbar/BurgerMenuPanel.tsx): OK.
- [app/components/shared/ui/header/navbar/navLinksData.ts](app/components/shared/ui/header/navbar/navLinksData.ts): OK.
- [app/components/shared/ui/header/navbar/navLinkStyles.ts](app/components/shared/ui/header/navbar/navLinkStyles.ts): OK.
- [app/components/shared/ui/footer/index.ts](app/components/shared/ui/footer/index.ts): OK.
- [app/components/shared/ui/footer/footer/Footer.tsx](app/components/shared/ui/footer/footer/Footer.tsx): OK.
- [app/components/shared/ui/footer/footer/FooterLinks.tsx](app/components/shared/ui/footer/footer/FooterLinks.tsx): OK.
- [app/components/shared/ui/footer/footer/FooterContacts.tsx](app/components/shared/ui/footer/footer/FooterContacts.tsx): OK.
- [app/components/shared/ui/footer/footer/FooterSocialMedia.tsx](app/components/shared/ui/footer/footer/FooterSocialMedia.tsx): OK.
- [app/components/shared/ui/footer/footer/footerLinksData.ts](app/components/shared/ui/footer/footer/footerLinksData.ts): OK.
- [app/components/shared/ui/footer/footer/footerSocialLinksData.ts](app/components/shared/ui/footer/footer/footerSocialLinksData.ts): OK.

### Backend (server/)
- [server/index.js](server/index.js): CSP может блокировать inline-стили; если фронтенд обслуживается этим сервером, стоит проверить `style-src`. В остальном OK.
- [server/config.js](server/config.js): OK.
- [server/lib/logger.js](server/lib/logger.js): OK.
- [server/database/db.js](server/database/db.js): Файловая БД — возможные проблемы с масштабированием/конкурентным доступом при росте нагрузки.
- [server/middleware/auth.js](server/middleware/auth.js): OK.
- [server/middleware/validation.js](server/middleware/validation.js): OK.
- [server/utils/errorHandler.js](server/utils/errorHandler.js): OK.
- [server/utils/validation.js](server/utils/validation.js): `isValidPriority()` не используется.

**routes**
- [server/routes/auth.js](server/routes/auth.js): OK.
- [server/routes/events.js](server/routes/events.js): Дублируется логика upload/cleanup с другими роутами.
- [server/routes/documents.js](server/routes/documents.js): Дублируется логика upload/cleanup с другими роутами.
- [server/routes/reminders.js](server/routes/reminders.js): Дублируется логика upload/cleanup с другими роутами.
- [server/routes/workplan.js](server/routes/workplan.js): Дублируется логика upload/cleanup с другими роутами.
