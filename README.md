## Установка

### Требования
- Docker + Docker Compose (v2)

### Запуск тестового сервера (dev)
1) Создать `.env` в корне репозитория:
   - `cp .env.example .env`
2) Поднять сервисы:
   - `docker compose up --build`
   - При старте будет автоматически запущен сервис `db-load-test`: он применит миграции и заполнит БД тестовыми сотрудниками через `backend/DB_load_test.py`.
   - Скрипт создаёт 100 сотрудников только для пустой БД. Если в таблице `employees` уже есть записи, повторное заполнение будет пропущено.
3) Проверка:
   - `GET http://localhost:8000/health` → `{"status":"ok"}`
   - Swagger/OpenAPI: `http://localhost:8000/docs`

### Миграции БД (alembic)
Команды запускай внутри контейнера API (чтобы `DATABASE_URL` с host `db` работал):
- Применить миграции: `docker compose exec api uv run alembic -c alembic.ini upgrade head`
- Создать миграцию (autogenerate): `docker compose exec api uv run alembic -c alembic.ini revision --autogenerate -m "message"`

### Тестовые данные employees
- Отдельный скрипт загрузки: `backend/DB_load_test.py`
- Ручной запуск: `docker compose run --rm db-load-test`
- При автоматическом или ручном запуске скрипт не добавляет дубликаты поверх существующих сотрудников: если таблица `employees` уже заполнена, новые записи не создаются.

### Важные параметры `.env`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — учётка Postgres (контейнер `db`).
- `DATABASE_URL` — строка подключения для API (host должен быть `db`).
- `JWT_SECRET_KEY`, `JWT_ALGORITHM` — подпись и алгоритм JWT.
- `ACCESS_TOKEN_TTL_MINUTES`, `REFRESH_TOKEN_TTL_DAYS` — TTL токенов.
- `MEDIA_ROOT` — директория для локального хранения медиа (в т.ч. голосовых сообщений) внутри контейнера API.

### Порты (dev)
- API: `localhost:8000`
- Postgres: `localhost:5432`
