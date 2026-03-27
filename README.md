# TheBestMessenger

Интегрированная HR-система с внутренним мессенджером.

Проект состоит из:
- `backend/` — FastAPI + PostgreSQL (SQLAlchemy, Alembic, JWT, WebSocket).
- `frontend/` — React Native (Expo) клиент, включая web-сборку.

## Функционал проекта

### Аутентификация и роли
- JWT-аутентификация (`access` + `refresh`).
- Роли: `admin`, `hr`, `employee`.
- Проверка прав доступа на backend (RBAC).
- Bootstrap admin из `.env` при старте API.

### Сотрудники и оргструктура
- Справочник сотрудников.
- Отделы (departments): создание, редактирование, удаление.
- Профиль сотрудника (`/employees/me`) и редактирование своих данных.
- Для `hr`: создание сотрудников с учёткой.
- Для `admin`: создание новых пользователей с ролью `hr` через frontend и API.

### Заявки на отпуск
- Создание заявок (`vacation`, `day_off`, `sick`).
- Статусы заявок: `submitted`, `approved`, `rejected`, `canceled`.
- Согласование HR/админом.
- История событий по заявке.

### Объявления и HR-задачи
- Публикация объявлений для всех или по отделам.
- Лента объявлений и отметка о прочтении.
- HR-задачи, получение «моих задач», отметка выполнения.

### Мессенджер
- Личные и групповые чаты.
- Сообщения через REST + WebSocket.
- Непрочитанные счётчики.
- Голосовые сообщения:
  - загрузка на backend,
  - хранение файлов в `MEDIA_ROOT`,
  - воспроизведение в клиенте.

## Технологии
- Backend: `FastAPI`, `SQLAlchemy (async)`, `Alembic`, `PostgreSQL`, `python-jose`, `passlib`.
- Frontend: `React Native`, `Expo`, `TypeScript`, `React Navigation`.
- Инфраструктура: `Docker Compose`.

## Быстрый старт (Docker)

### 1. Подготовка `.env`
В корне репозитория:

```bash
cp .env.example .env
```

Проверь значения минимум:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`

### 2. Запуск

```bash
docker compose up --build
```

### 3. Проверка
- API health: `http://localhost:8000/health`
- Swagger: `http://localhost:8000/docs`
- Frontend (web): `http://localhost:3000`

## Логин под админом

Укажи в `.env`:

```env
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=Admin12345
```

Важно:
- Bootstrap admin создаётся только если пользователя с таким email ещё нет.
- Если пользователь уже существует, пароль автоматически не перезаписывается.

## Создание HR из-под admin

Backend endpoint:

```http
POST /auth/admin/users
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "email": "hr1@example.com",
  "password": "HrPass123",
  "role": "hr"
}
```

На frontend это уже встроено: под ролью `admin` на экране сотрудников кнопка `+` создаёт нового HR.

## Локальный запуск без Docker

## Backend

Требования:
- Python 3.12+
- PostgreSQL
- `uv`

Запуск:

```bash
cd backend
uv sync
uv run alembic -c alembic.ini upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend

Требования:
- Node.js `>=18 <24` (рекомендуется `22`, см. `frontend/.nvmrc`)

Запуск:

```bash
cd frontend
npm install
npm run start
```

Платформы:
- Android: `npm run android`
- Web: `npm run web`

## Миграции БД

Применить:

```bash
docker compose exec api uv run alembic -c alembic.ini upgrade head
```

Создать новую миграцию:

```bash
docker compose exec api uv run alembic -c alembic.ini revision --autogenerate -m "message"
```

## Структура репозитория

```text
.
├── backend/
│   ├── app/
│   ├── alembic/
│   └── tests/
├── frontend/
│   └── src/
├── docker-compose.yml
├── plan.md
└── README.md
```

## Полезные файлы
- `plan.md` — общий план продукта.
- `backend/plan.md` — детальный план backend и статусы этапов.
- `AGENTS.md` — архитектурные и инженерные правила для изменений.
