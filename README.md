# TheBestMessenger

Демо-видео: [thebestmessenger.mp4](https://raw.githubusercontent.com/whoaskeddd/portfolio/main/assets/videos/thebestmessenger.mp4)

![TheBestMessenger Demo](https://raw.githubusercontent.com/whoaskeddd/portfolio/main/assets/videos/thebestmessenger.mp4)

## О проекте
TheBestMessenger — заготовка мессенджера. Сейчас в репозитории реализован минимальный backend на FastAPI, frontend пока отсутствует.

## Структура
- `backend` — FastAPI backend
- `docs` — документация

## Требования
- Python 3.14+ (по `pyproject.toml`)
- `uv` или `pip`

## Запуск backend
Вариант через `uv`:
```powershell
cd C:\develop\portfolio\repos\thebestmessenger\backend
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Вариант через `pip`:
```powershell
cd C:\develop\portfolio\repos\thebestmessenger\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install fastapi uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Проверка:
- `GET http://127.0.0.1:8000/` -> `"hello!"`

## Запуск frontend
Frontend в текущем состоянии проекта отсутствует. Для полной системы нужно добавить отдельный клиент (web/mobile).

## Использование функций (текущее состояние)
Сейчас доступна только базовая проверка backend:
1. Запустить API.
2. Открыть `http://127.0.0.1:8000/`.
3. Получить ответ `hello!`.

## Что нужно для следующего этапа
- Добавить frontend (React/React Native).
- Добавить модели пользователей, чатов и сообщений.
- Добавить авторизацию и REST/WebSocket API.
