# API Reference

Base URL: `http://localhost:8000`

All protected endpoints require a Bearer token in the `Authorization` header obtained from an auth endpoint.

---

## Auth

### POST /auth/register
Register a new user with email and password.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "access_token": "<jwt_token>"
}
```

---

### POST /auth/login
Login with email and password.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "access_token": "<jwt_token>"
}
```

---

### POST /auth/google
Login or register using a Google OAuth ID token.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "id_token": "<google_id_token>"
}
```

**Response:**
```json
{
  "access_token": "<jwt_token>"
}
```

---

## Locations

### GET /locations/popular
Returns the most popular locations ranked by `avg_rating × total_reviews`. Locations with zero reviews are excluded.

**Headers:** None required

**Query Params:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| limit | int | No | 10 | Number of results (1–50) |

**Example:**
```
GET /locations/popular?limit=5
```

**Response:** Array of location objects.

---

### GET /locations/search
Search and filter locations. All filters are optional and combinable.

**Headers:** None required

**Query Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| keyword | string | No | Search in name and description (case-insensitive) |
| category | string | No | One of: `food`, `tourist_attraction`, `mall`, `hotel`, `beach`, `nature`, `entertainment` |
| city | string | No | Filter by city (partial match) |
| country | string | No | Filter by country (partial match) |
| min_rating | float | No | Minimum avg_rating (0–5) |
| price_level | int | No | 1=budget, 2=mid-range, 3=upscale, 4=luxury |
| limit | int | No | Max results (1–100, default 20) |
| offset | int | No | Pagination offset (default 0) |

**Example:**
```
GET /locations/search?keyword=beach&category=beach&country=vietnam&min_rating=4.0&limit=10
```

**Response:** Array of location objects.

---

### POST /locations/ai-search
Natural-language location search powered by AI. The AI extracts intent from the prompt, queries the DB for candidates, then re-ranks and returns the top 5 matches.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "prompt": "I want to find a nice beach to relax and swim"
}
```

**Response:** Array of up to 5 location objects ordered by relevance.

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Prompt is not travel-related |

---

## Plans

All plan endpoints require authentication.

**Headers for all plan endpoints:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

### POST /plans/
Create a new plan. The authenticated user becomes the owner and is automatically added as a member with role `owner`.

**Body:**
```json
{
  "title": "Beach Trip 2026",
  "description": "A relaxing beach vacation",
  "start_date": "2026-06-01",
  "end_date": "2026-06-07"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Plan title |
| description | string | No | Optional description |
| start_date | date (YYYY-MM-DD) | Yes | Trip start date |
| end_date | date (YYYY-MM-DD) | Yes | Trip end date |

**Response:** Plan summary object (201 Created).

---

### GET /plans/
Returns all plans the authenticated user is a member of (any role), ordered by most recently created.

**Body:** None

**Response:** Array of plan summary objects.

---

### GET /plans/{plan_id}
Returns full plan details including members and activities grouped by day. User must be a member of the plan.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |

**Body:** None

**Response:** Plan detail object with `members` and `days` arrays.

**Errors:**
| Code | Reason |
|------|--------|
| 404 | Plan not found |
| 403 | User is not a member of the plan |

---

### PUT /plans/{plan_id}
Update plan details. User must be a member of the plan (any role). All fields are optional.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |

**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "start_date": "2026-06-01",
  "end_date": "2026-06-10"
}
```

**Response:** Updated plan summary object.

---

### DELETE /plans/{plan_id}
Delete a plan and all its activities and members. Only the plan owner can delete.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |

**Body:** None

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 403 | User is not the owner |
| 404 | Plan not found |

---

## Plan Members

### POST /plans/{plan_id}/members
Add a new member to a plan by their email. Only the plan owner can add members.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |

**Body:**
```json
{
  "user_email": "member@example.com",
  "role": "editor"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| user_email | string | Yes | Email of the user to add |
| role | string | No | `editor` or `viewer` (default: `editor`) |

**Response:** Member object (201 Created).

**Errors:**
| Code | Reason |
|------|--------|
| 403 | Requester is not the owner |
| 404 | User with that email not found |
| 409 | User is already a member |

---

### DELETE /plans/{plan_id}/members/{target_user_id}
Remove a member from a plan. Only the owner can remove others. A member can remove themselves. The owner cannot be removed.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |
| target_user_id | UUID | The user ID to remove |

**Body:** None

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Cannot remove the owner |
| 403 | Non-owner trying to remove someone else |
| 404 | Member not found in this plan |

---

## Plan Activities

### POST /plans/{plan_id}/activities
Add an activity to a plan. User must be a member of the plan (any role).

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |

**Body:**
```json
{
  "location_id": "6fb8a658-80cd-4f44-8b2a-46e51be16870",
  "activity_date": "2026-06-03",
  "start_time": "09:00",
  "end_time": "12:00",
  "notes": "Morning beach session",
  "order_index": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| location_id | UUID | No | Link to a location |
| activity_date | date (YYYY-MM-DD) | Yes | The day for this activity |
| start_time | time (HH:MM) | No | Start time |
| end_time | time (HH:MM) | No | End time |
| notes | string | No | Optional notes |
| order_index | int | Yes | Order within the day (1, 2, 3...) |

**Response:** Activity object (201 Created).

---

### PUT /plans/{plan_id}/activities/{activity_id}
Update an existing activity. User must be a member of the plan. All fields are optional.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |
| activity_id | UUID | The activity ID |

**Body:**
```json
{
  "start_time": "14:00",
  "end_time": "18:00",
  "notes": "Updated notes",
  "order_index": 2
}
```

**Response:** Updated activity object.

**Errors:**
| Code | Reason |
|------|--------|
| 404 | Activity not found |

---

### DELETE /plans/{plan_id}/activities/{activity_id}
Delete an activity from a plan. User must be a member of the plan.

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| plan_id | UUID | The plan ID |
| activity_id | UUID | The activity ID |

**Body:** None

**Response:** 204 No Content

**Errors:**
| Code | Reason |
|------|--------|
| 404 | Activity not found |
