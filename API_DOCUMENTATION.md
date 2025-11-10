# API Documentation - Kanban Board

Base URL: `http://localhost:8000/api`

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Boards](#boards)
3. [Lists](#lists)
4. [Cards](#cards)
5. [Error Responses](#error-responses)

---

## Authentication

Semua endpoint (kecuali login dan register) memerlukan Bearer Token di header:

```
Authorization: Bearer {your-access-token}
```

### Register

Create a new user account.

**Endpoint**: `POST /auth/register`

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-10-18T10:00:00.000000Z",
    "updated_at": "2025-10-18T10:00:00.000000Z"
  },
  "access_token": "1a2b3c4d5e6f7g8h9i0j...",
  "token_type": "Bearer"
}
```

### Login

Authenticate existing user.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "access_token": "1a2b3c4d5e6f7g8h9i0j...",
  "token_type": "Bearer"
}
```

### Get Current User

Get authenticated user information.

**Endpoint**: `GET /auth/user`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "created_at": "2025-10-18T10:00:00.000000Z",
    "updated_at": "2025-10-18T10:00:00.000000Z"
  }
}
```

### Logout

Revoke current user's token.

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

### Refresh Token

Generate a new access token.

**Endpoint**: `POST /auth/refresh`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "access_token": "new-token-here",
  "token_type": "Bearer"
}
```

---

## Boards

### Get All Boards

Get all boards where user is owner or member.

**Endpoint**: `GET /boards`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "boards": [
    {
      "id": 1,
      "title": "Project Management",
      "description": "Main project board",
      "visibility": "private",
      "background_color": "#0079bf",
      "background_image": null,
      "owner_id": 1,
      "is_archived": false,
      "created_at": "2025-10-18T10:00:00.000000Z",
      "updated_at": "2025-10-18T10:00:00.000000Z",
      "owner": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "id": 1,
          "name": "John Doe",
          "pivot": {
            "role": "owner",
            "joined_at": "2025-10-18T10:00:00"
          }
        }
      ]
    }
  ]
}
```

### Create Board

Create a new board.

**Endpoint**: `POST /boards`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "title": "New Project",
  "description": "Project description",
  "visibility": "private",
  "background_color": "#0079bf"
}
```

**Validation Rules**:
- `title`: required, string, max 255
- `description`: nullable, string
- `visibility`: nullable, enum (private|team|public)
- `background_color`: nullable, string

**Response** (201 Created):
```json
{
  "message": "Board created successfully",
  "board": {
    "id": 2,
    "title": "New Project",
    "description": "Project description",
    "visibility": "private",
    "background_color": "#0079bf",
    "owner_id": 1,
    "created_at": "2025-10-18T11:00:00.000000Z"
  }
}
```

### Get Board Detail

Get single board with all lists, cards, and members.

**Endpoint**: `GET /boards/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "board": {
    "id": 1,
    "title": "Project Management",
    "description": "Main project board",
    "lists": [
      {
        "id": 1,
        "title": "To Do",
        "position": 0,
        "cards": [
          {
            "id": 1,
            "title": "Setup project",
            "description": "Initialize the project",
            "position": 0,
            "due_date": "2025-10-20",
            "is_completed": false,
            "cover_color": "#61bd4f",
            "labels": [],
            "members": [],
            "creator": {
              "id": 1,
              "name": "John Doe"
            }
          }
        ]
      }
    ],
    "members": [...],
    "labels": [...]
  }
}
```

### Update Board

Update board information.

**Endpoint**: `PATCH /boards/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "visibility": "team",
  "background_color": "#519839",
  "is_archived": false
}
```

**Response** (200 OK):
```json
{
  "message": "Board updated successfully",
  "board": {
    "id": 1,
    "title": "Updated Title",
    ...
  }
}
```

### Delete Board

Delete a board (owner only).

**Endpoint**: `DELETE /boards/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Board deleted successfully"
}
```

### Invite Member

Invite a user to board.

**Endpoint**: `POST /boards/{id}/invite`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "email": "jane@example.com",
  "role": "member"
}
```

**Validation Rules**:
- `email`: required, email, exists in users table
- `role`: nullable, enum (admin|member)

**Response** (200 OK):
```json
{
  "message": "Member invited successfully",
  "member": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Remove Member

Remove a member from board.

**Endpoint**: `DELETE /boards/{id}/members/{userId}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Member removed successfully"
}
```

---

## Lists

### Create List

Create a new list in a board.

**Endpoint**: `POST /boards/{boardId}/lists`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "title": "In Progress"
}
```

**Response** (201 Created):
```json
{
  "message": "List created successfully",
  "list": {
    "id": 2,
    "board_id": 1,
    "title": "In Progress",
    "position": 1,
    "is_archived": false,
    "created_at": "2025-10-18T12:00:00.000000Z"
  }
}
```

### Update List

Update list information.

**Endpoint**: `PATCH /lists/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "title": "Updated List Title",
  "is_archived": false
}
```

**Response** (200 OK):
```json
{
  "message": "List updated successfully",
  "list": {
    "id": 2,
    "title": "Updated List Title",
    ...
  }
}
```

### Delete List

Delete a list and all its cards.

**Endpoint**: `DELETE /lists/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "List deleted successfully"
}
```

### Move List

Reorder a list position.

**Endpoint**: `PATCH /lists/{id}/move`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "position": 2
}
```

**Response** (200 OK):
```json
{
  "message": "List moved successfully",
  "list": {
    "id": 2,
    "position": 2,
    ...
  }
}
```

---

## Cards

### Create Card

Create a new card in a list.

**Endpoint**: `POST /lists/{listId}/cards`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Task description",
  "due_date": "2025-10-25"
}
```

**Validation Rules**:
- `title`: required, string, max 255
- `description`: nullable, string
- `due_date`: nullable, date

**Response** (201 Created):
```json
{
  "message": "Card created successfully",
  "card": {
    "id": 5,
    "list_id": 1,
    "title": "New Task",
    "description": "Task description",
    "position": 3,
    "due_date": "2025-10-25",
    "is_completed": false,
    "created_by": 1,
    "creator": {
      "id": 1,
      "name": "John Doe"
    },
    "labels": [],
    "members": []
  }
}
```

### Get Card Detail

Get detailed card information with comments.

**Endpoint**: `GET /cards/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "card": {
    "id": 5,
    "title": "New Task",
    "description": "Task description",
    "due_date": "2025-10-25",
    "is_completed": false,
    "cover_color": "#0079bf",
    "list": {
      "id": 1,
      "title": "To Do"
    },
    "creator": {...},
    "labels": [...],
    "members": [...],
    "comments": [
      {
        "id": 1,
        "content": "This is a comment",
        "user": {
          "id": 1,
          "name": "John Doe"
        },
        "created_at": "2025-10-18T13:00:00.000000Z"
      }
    ]
  }
}
```

### Update Card

Update card information.

**Endpoint**: `PATCH /cards/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Task",
  "description": "Updated description",
  "due_date": "2025-10-26",
  "is_completed": true,
  "is_archived": false,
  "cover_color": "#61bd4f"
}
```

**Response** (200 OK):
```json
{
  "message": "Card updated successfully",
  "card": {
    "id": 5,
    "title": "Updated Task",
    ...
  }
}
```

### Delete Card

Delete a card.

**Endpoint**: `DELETE /cards/{id}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Card deleted successfully"
}
```

### Move Card

Move card to another list or change position.

**Endpoint**: `PATCH /cards/{id}/move`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "list_id": 2,
  "position": 1
}
```

**Validation Rules**:
- `list_id`: required, exists in lists table
- `position`: required, integer, min 0

**Response** (200 OK):
```json
{
  "message": "Card moved successfully",
  "card": {
    "id": 5,
    "list_id": 2,
    "position": 1,
    ...
  }
}
```

### Toggle Card Member

Add or remove a member from card.

**Endpoint**: `POST /cards/{id}/members/{userId}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Member added to card",
  "card": {
    "id": 5,
    "members": [
      {
        "id": 2,
        "name": "Jane Doe",
        "pivot": {
          "assigned_at": "2025-10-18T14:00:00"
        }
      }
    ]
  }
}
```

### Add Comment

Add a comment to a card.

**Endpoint**: `POST /cards/{id}/comments`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "content": "This is my comment on the card"
}
```

**Response** (201 Created):
```json
{
  "message": "Comment added successfully",
  "comment": {
    "id": 3,
    "card_id": 5,
    "user_id": 1,
    "content": "This is my comment on the card",
    "created_at": "2025-10-18T14:30:00.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "message": "Cannot move card to a list in a different board."
}
```

### 401 Unauthorized

```json
{
  "message": "Unauthenticated. Bearer token is required."
}
```

or

```json
{
  "message": "Invalid or expired token."
}
```

### 403 Forbidden

```json
{
  "message": "Unauthorized to access this board."
}
```

### 404 Not Found

```json
{
  "message": "No query results for model [App\\Models\\Board] 999"
}
```

### 422 Validation Error

```json
{
  "message": "The email field is required. (and 1 more error)",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password field is required."
    ]
  }
}
```

### 500 Internal Server Error

```json
{
  "message": "Server Error"
}
```

---

## Rate Limiting

API endpoints menggunakan Laravel's default rate limiting:

- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 60 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
Retry-After: 60
```

---

## cURL Examples

### Complete Workflow Example

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'

# Save the token from response

# 2. Create Board
curl -X POST http://localhost:8000/api/boards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Project",
    "visibility": "private"
  }'

# Save board_id from response

# 3. Create List
curl -X POST http://localhost:8000/api/boards/1/lists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "To Do"
  }'

# Save list_id from response

# 4. Create Card
curl -X POST http://localhost:8000/api/lists/1/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "First Task",
    "description": "Complete this task"
  }'

# 5. Get Board with all data
curl -X GET http://localhost:8000/api/boards/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Postman Collection

Import this JSON into Postman for ready-to-use API collection:

[Download Postman Collection](#) (create a separate JSON file if needed)

---

## Need Help?

- Check Laravel logs: `storage/logs/laravel.log`
- Enable debug mode: Set `APP_DEBUG=true` in `.env`
- Check database queries: Install Laravel Debugbar

---

**Happy API Testing! 🚀**
