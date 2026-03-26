# Messenger API (MVP)

Base URL (dev): `http://localhost:8000`

OpenAPI/Swagger (dev): `http://localhost:8000/docs`

## REST

### GET `/chats`
Lists chats for current user.

Auth:
- Header `Authorization: Bearer <access_token>`

Query:
- `limit` (1..200, default 50)
- `offset` (default 0)

---

### POST `/chats`
Creates a direct or group chat.

Auth:
- Header `Authorization: Bearer <access_token>`

Request (direct):
```json
{
  "chatType": "direct",
  "otherUserId": "uuid"
}
```

Request (group):
```json
{
  "chatType": "group",
  "title": "Team chat",
  "memberUserIds": ["uuid", "uuid"]
}
```

---

### GET `/chats/{chat_id}/messages`
Loads message history (pagination by `before` datetime).

Auth:
- Header `Authorization: Bearer <access_token>`

Query:
- `limit` (1..200, default 50)
- `before` (optional ISO datetime)

---

### POST `/chats/{chat_id}/messages`
Sends a text message (HTTP alternative to WebSocket).

Auth:
- Header `Authorization: Bearer <access_token>`

Request:
```json
{
  "body": "hello"
}
```

---

### POST `/chats/{chat_id}/voice`
Uploads a voice message file (stored under `MEDIA_ROOT`, served via `/media/...`).

Auth:
- Header `Authorization: Bearer <access_token>`

Multipart form:
- `file` (required)
- `duration_seconds` (optional, max 120)

Limits (MVP):
- up to 10 MB

---

### POST `/chats/{chat_id}/read`
Marks chat as read for current user.

Auth:
- Header `Authorization: Bearer <access_token>`

## WebSocket

### WS `/ws/chats/{chat_id}?token=<access_token>`
Real-time chat stream.

Client → server events:
- `{"type":"chat.message","body":"text"}`
- `{"type":"chat.read"}`

Server → clients events:
- `{"type":"chat.message", ...MessageResponse }`
- `{"type":"chat.read", ...ChatReadResponse }`

