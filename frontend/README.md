# Frontend (Expo React Native)

Верстка сделана по `untitled.pen` (экраны Mobile + Module), с рабочей интеграцией авторизации к backend.

## Использованные источники API

- `docs/api/auth.md`
- `docs/api/employees.md`
- `docs/api/leave_requests.md`
- `docs/api/announcements.md`
- `docs/api/hr_tasks.md`
- `docs/openapi.json` (файл пустой в текущем состоянии)

## Что реализовано

- Экран `Login` и `Register` в стиле макета
- Реальные запросы:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/me`
  - `POST /auth/refresh` (автообновление access токена)
  - `POST /auth/logout`
- Пример запросов модулей после логина:
  - `GET /hr-tasks/my`
  - `GET /announcements`
  - `GET /employees`
- Хранение токенов в `AsyncStorage`
- Навигация по модульным экранам из макета

## Запуск

1. Убедитесь, что backend работает на `http://localhost:8000`
2. Веб:
```bash
cd frontend
npm run web
```
3. Android (эмулятор):
```bash
cd frontend
npm run android
```

## Важно для Web

Если web-клиент не может обратиться к backend (CORS), нужно включить CORS middleware в FastAPI.

## Base URL API

- Android emulator: `http://10.0.2.2:8000`
- Web/iOS/прочее: `http://localhost:8000`
