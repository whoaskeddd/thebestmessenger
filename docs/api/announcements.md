# Announcements API (MVP)

Base URL (dev): `http://localhost:8000`

Auth:
- All endpoints require `Authorization: Bearer <access_token>`
- Create requires role `admin` or `hr`

## Endpoints

### GET `/announcements`
Returns announcements visible to the current user:
- HR/admin: all
- Employee: `is_global=true` or targeted to employee departments

### POST `/announcements`
```json
{
  "title": "string",
  "body": "string",
  "is_global": false,
  "department_ids": ["uuid"]
}
```

### GET `/announcements/{announcement_id}`

### POST `/announcements/{announcement_id}/read`
Marks announcement as read (idempotent).

