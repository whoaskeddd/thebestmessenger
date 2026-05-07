# Employees & Departments API (MVP)

Base URL (dev): `http://localhost:8000`

Auth:
- All endpoints require `Authorization: Bearer <access_token>`
- Write operations require role `admin` or `hr`

## Departments

### GET `/departments`
Query params:
- `search` (optional)
- `limit` (default 50)
- `offset` (default 0)

### POST `/departments`
```json
{ "name": "HR" }
```

### GET `/departments/{department_id}`

### PATCH `/departments/{department_id}`
```json
{ "name": "People Ops" }
```

### DELETE `/departments/{department_id}`

## Employees

### GET `/employees`
Query params:
- `search` (optional): matches name/email
- `department_id` (optional UUID)
- `limit` (default 50)
- `offset` (default 0)

### POST `/employees`
```json
{
  "user_id": "uuid-or-null",
  "first_name": "Ivan",
  "last_name": "Petrov",
  "middle_name": null,
  "work_email": "ivan.petrov@company.com",
  "phone": "+79990000000",
  "position": "Engineer",
  "department_ids": ["uuid"]
}
```

### GET `/employees/{employee_id}`

### PATCH `/employees/{employee_id}`
Supports partial update. To clear nullable fields pass `null`.

### DELETE `/employees/{employee_id}`

