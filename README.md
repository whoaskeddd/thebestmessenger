## Установка

### Требования
- Docker + Docker Compose (v2)

### Запуск тестового сервера (dev)
1) Создать `.env` в корне репозитория:
   - `cp .env.example .env`
2) Поднять сервисы:
   - `docker compose up --build`
3) Проверка:
   - `GET http://localhost:8000/health` → `{"status":"ok"}`
   - Swagger/OpenAPI: `http://localhost:8000/docs`

### Миграции БД (alembic)
Команды запускай внутри контейнера API (чтобы `DATABASE_URL` с host `db` работал):
- Применить миграции: `docker compose exec api uv run alembic -c alembic.ini upgrade head`
- Создать миграцию (autogenerate): `docker compose exec api uv run alembic -c alembic.ini revision --autogenerate -m "message"`

### Bootstrap admin (dev)
Можно задать bootstrap admin через `.env`:
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`

На старте API пользователь с этой почтой будет создан автоматически с ролью `admin`, если его ещё нет.
Если пользователь уже существует, но имеет роль не `admin`, API завершит старт с ошибкой конфигурации.

### Важные параметры `.env`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — учётка Postgres (контейнер `db`).
- `DATABASE_URL` — строка подключения для API (host должен быть `db`).
- `JWT_SECRET_KEY`, `JWT_ALGORITHM` — подпись и алгоритм JWT.
- `ACCESS_TOKEN_TTL_MINUTES`, `REFRESH_TOKEN_TTL_DAYS` — TTL токенов.
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` — bootstrap admin для первого входа.
- `MEDIA_ROOT` — директория для локального хранения медиа (в т.ч. голосовых сообщений) внутри контейнера API.

### Порты (dev)
- API: `localhost:8000`
- Postgres: `localhost:${POSTGRES_PORT:-5433}` (внутри docker-сети всё равно `db:5432`)
