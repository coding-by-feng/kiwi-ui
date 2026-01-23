# Conversation API Updates - Favorite Feature

## Overview

Add favorite functionality to AI conversations, allowing users to mark conversations as favorites and filter by favorited status.

## Database Changes

### Table: `ai_conversation`

Add new column:
```sql
ALTER TABLE ai_conversation ADD COLUMN favorited TINYINT(1) DEFAULT 0 COMMENT 'Whether the conversation is favorited by user';
```

## API Changes

### 1. Toggle Favorite Status

**Endpoint:** `POST /conversation/{id}/favorite`

**Description:** Toggle the favorite status of a conversation.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | Long | Yes | Conversation ID |

**Request Body:** None

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 123,
    "favorited": true
  }
}
```

**Error Responses:**
- `404` - Conversation not found
- `403` - User does not own this conversation

---

### 2. Get Conversation List (Updated)

**Endpoint:** `GET /conversation/list`

**Description:** Get list of user's conversations. Now includes `favorited` flag and supports filtering.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| favoritedOnly | Boolean | No | false | If true, only return favorited conversations |

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 123,
      "topic": "Two friends discussing travel plans",
      "accent": "UK",
      "durationMinutes": 5,
      "status": "COMPLETED",
      "createTime": "2024-01-20T10:30:00",
      "favorited": true
    },
    {
      "id": 124,
      "topic": "Job interview practice",
      "accent": "US",
      "durationMinutes": 3,
      "status": "COMPLETED",
      "createTime": "2024-01-19T15:20:00",
      "favorited": false
    }
  ]
}
```

---

### 3. Get Conversation Detail (Updated)

**Endpoint:** `GET /conversation/{id}`

**Description:** Get conversation details with all messages. Now includes `favorited` flag.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | Long | Yes | Conversation ID |

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 123,
    "topic": "Two friends discussing travel plans",
    "accent": "UK",
    "durationMinutes": 5,
    "status": "COMPLETED",
    "createTime": "2024-01-20T10:30:00",
    "favorited": true,
    "speakers": [
      {
        "id": 1,
        "name": "Emma",
        "speakerIndex": 0
      },
      {
        "id": 2,
        "name": "James",
        "speakerIndex": 1
      }
    ],
    "messages": [
      {
        "id": 101,
        "speakerId": 1,
        "speakerName": "Emma",
        "text": "Have you decided where to go for your vacation?",
        "sequence": 1,
        "audioDurationMs": 2500
      }
    ]
  }
}
```

---

## Summary of Changes

### New Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversation/{id}/favorite` | Toggle favorite status |

### Modified Endpoints
| Method | Endpoint | Changes |
|--------|----------|---------|
| GET | `/conversation/list` | Added `favorited` field to response, added `favoritedOnly` query param |
| GET | `/conversation/{id}` | Added `favorited` field to response |

### Database
- Add `favorited` column (TINYINT/Boolean) to `ai_conversation` table
