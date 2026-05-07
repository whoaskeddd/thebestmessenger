# Leave Requests API (MVP)

Base URL (dev): `http://localhost:8000`

Auth:
- All endpoints require `Authorization: Bearer <access_token>`
- Approve/Reject require role `admin` or `hr`

Statuses: `submitted`, `approved`, `rejected`, `canceled`

Types: `vacation`, `day_off`, `sick`

## Endpoints

### POST `/leave-requests`
```json
{
  "request_type": "vacation",
  "start_date": "2026-04-01",
  "end_date": "2026-04-05",
  "reason": "string|null"
}
```

### GET `/leave-requests`
Query params:
- `status` (optional)
- `type` (optional)
- `limit` (default 50)
- `offset` (default 0)

### GET `/leave-requests/{request_id}`

### GET `/leave-requests/{request_id}/history`

### POST `/leave-requests/{request_id}/approve`
```json
{ "hr_comment": "string|null" }
```

### POST `/leave-requests/{request_id}/reject`
```json
{ "hr_comment": "required string" }
```

### POST `/leave-requests/{request_id}/cancel`

