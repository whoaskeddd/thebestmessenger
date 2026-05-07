# HR Tasks API (MVP)

Base URL (dev): `http://localhost:8000`

Auth:
- All endpoints require `Authorization: Bearer <access_token>`
- Create/list all require role `admin` or `hr`

## Endpoints

### POST `/hr-tasks`
```json
{
  "title": "string",
  "description": "string|null",
  "due_date": "2026-04-01|null",
  "announcement_id": "uuid|null",
  "assignee_user_ids": ["uuid"]
}
```

### GET `/hr-tasks/my`
Query params:
- `include_completed` (default false)

### POST `/hr-tasks/{task_id}/complete`

### GET `/hr-tasks`
HR/admin only.

