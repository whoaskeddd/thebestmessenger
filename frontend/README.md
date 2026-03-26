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

- Полная web-навигация по страницам:
  - `Login`
  - `Register`
  - `Dashboard`
  - `Employees` (поиск + переход в карточку)
  - `EmployeeCard`
  - `Leaves` (создание + история)
  - `News` (лента + детали + mark read)
  - `Chats` (список + поиск)
  - `ChatRoom` (локальная отправка сообщений)
- Реальные запросы авторизации:
  - `POST /auth/login`
  - `POST /auth/register`
  - `GET /auth/me`
  - `POST /auth/refresh` (автообновление access токена)
  - `POST /auth/logout`
- Реальные запросы модулей:
  - `GET /employees`
  - `GET /employees/{employee_id}`
  - `GET /leave-requests`
  - `POST /leave-requests`
  - `GET /announcements`
  - `GET /announcements/{announcement_id}`
  - `POST /announcements/{announcement_id}/read`
  - `GET /hr-tasks/my`
- Хранение токенов в `AsyncStorage`
- Поддержка web-сборки (`expo export --platform web`) и строгой проверки TS (`npm run typecheck`)

## Что пока mock-only

- `Chats` и `ChatRoom` работают полностью на frontend (локальные данные/состояние), так как в текущем backend нет REST/WebSocket эндпоинтов мессенджера.

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

## Dev-режим без backend (bypass auth)

Если нужно открыть `Dashboard` и остальные приватные экраны без поднятого backend:

1. Создайте env-файл:
```bash
cd frontend
cp .env.example .env
```
2. Включите флаг:
```env
EXPO_PUBLIC_DEV_BYPASS_AUTH=true
EXPO_PUBLIC_DEV_BYPASS_ROLE=hr
```
3. Запустите web:
```bash
npm run web
```

При включенном флаге приложение сразу логинит dev-пользователя (`role` можно переключать между `hr` и `employee`) и пропускает проверку `/auth/me`.
Чтобы вернуть обычный режим, поставьте `EXPO_PUBLIC_DEV_BYPASS_AUTH=false`.

## Ограничение текущего backend

Сейчас `POST /auth/register` в backend сохраняет роль по умолчанию как `employee`.  
Поле `role` уже отправляется с фронтенда, но начнет работать только после обновления backend-контракта.

## Важно для Web

Если web-клиент не может обратиться к backend (CORS), нужно включить CORS middleware в FastAPI.

## Base URL API

- Android emulator: `http://10.0.2.2:8000`
- Web/iOS/прочее: `http://localhost:8000`
