# Auth API (MVP)

Base URL (dev): `http://localhost:8000`

OpenAPI/Swagger (dev): `http://localhost:8000/docs`

## Models

### TokenPairResponse
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

### MeResponse
```json
{
  "id": "uuid-as-string",
  "email": "user@example.com",
  "role": "admin|hr|employee"
}
```

## Endpoints

### POST `/auth/register`
Creates a user and returns tokens.

Request:
```json
{
  "email": "user@example.com",
  "password": "min 8 chars"
}
```

Responses:
- `201` → `TokenPairResponse`
- `409` → `{ "detail": "email already exists" }`

---

### POST `/auth/login`
Authenticates by email + password and returns tokens.

Request:
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

Responses:
- `200` → `TokenPairResponse`
- `401` → `{ "detail": "invalid credentials" }`

---

### POST `/auth/refresh`
Rotates refresh token and returns a new token pair.

Request:
```json
{
  "refresh_token": "string"
}
```

Responses:
- `200` → `TokenPairResponse`
- `401` → `{ "detail": "invalid refresh token" }`

---

### POST `/auth/logout`
Revokes a refresh token (logout).

Request:
```json
{
  "refresh_token": "string"
}
```

Responses:
- `204` (no content)

---

### GET `/auth/me`
Returns current user data.

Auth:
- Header `Authorization: Bearer <access_token>`

Responses:
- `200` → `MeResponse`
- `401` → `{ "detail": "not authenticated" | "invalid token" | "token revoked" }`

## Notes (MVP)
- Role is stored as `users.role` string; values in MVP: `admin`, `hr`, `employee`.
- Refresh tokens are rotated; client must store the latest `refresh_token`.
