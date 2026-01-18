# Focus Timer API Requirements (v2)

This document describes the API endpoints required to support the enhanced Focus Timer feature with Forest visualization, points system, and browser leave detection.

## Overview

The Focus Timer feature (Forest-like) allows users to:
- Start focus sessions with configurable durations (15-120 minutes)
- Choose different tree types to plant
- Earn points based on focus duration (+100 points per 30 minutes)
- Lose points if they leave the page/browser during focus (-100 penalty)
- Track planted trees in a visual forest grid
- View daily and total statistics including streak days
- Listen to ambient white noise BGM during focus

## Points System

| Action | Points |
|--------|--------|
| Complete 30-minute session | +100 |
| Complete 60-minute session | +200 |
| Complete 90-minute session | +300 |
| Leave page/browser during focus | -100 |
| Give up / Cancel session | -100 |

## Data Models

### FocusSession

```typescript
interface FocusSession {
  id: string;                    // Unique session identifier
  userId: string;                // User who owns this session
  duration: number;              // Duration in minutes (e.g., 15, 25, 30, 45, 60, 90, 120)
  treeType: string;              // Type of tree: 'oak' | 'pine' | 'cherry' | 'maple' | 'willow' | 'sakura'
  potentialPoints: number;       // Points user will earn if session completes
  startTime: string;             // ISO 8601 timestamp when session started
  endTime?: string;              // ISO 8601 timestamp when session ended
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  completedAt?: string;          // ISO 8601 timestamp when marked completed
  cancelledAt?: string;          // ISO 8601 timestamp when cancelled
  failedAt?: string;             // ISO 8601 timestamp when failed (left page)
  failReason?: string;           // Reason for failure: 'left_page' | 'give_up' | 'browser_closed'
  points: number;                // Actual points earned (0 if failed, negative if penalty)
  penalty?: number;              // Penalty points deducted (if failed)
  createdAt: string;
  updatedAt: string;
}
```

### FocusStats

```typescript
interface FocusStats {
  userId: string;
  todayTrees: number;            // Number of completed sessions today
  todayMinutes: number;          // Total focused minutes today
  currentStreak: number;         // Consecutive days with at least 1 completed session
  totalTrees: number;            // All-time completed sessions
  totalMinutes: number;          // All-time focused minutes
  totalPoints: number;           // Cumulative points (can't go below 0)
  lastSessionDate?: string;      // YYYY-MM-DD of last completed session
  plantedTrees: PlantedTree[];   // Array of planted trees for forest visualization
}
```

### PlantedTree

```typescript
interface PlantedTree {
  id: string;
  type: string;                  // Tree type: 'oak' | 'pine' | 'cherry' | 'maple' | 'willow' | 'sakura'
  color: string;                 // Hex color of the tree
  plantedAt: string;             // ISO 8601 timestamp
  duration: number;              // Session duration in minutes
  points: number;                // Points earned from this session
  position?: number;             // Grid position (0-47 for 8x6 grid)
}
```

### TreeType (Reference)

```typescript
const TREE_TYPES = {
  oak: { name: 'Oak', color: '#4CAF50', colorDark: '#2E7D32' },
  pine: { name: 'Pine', color: '#1B5E20', colorDark: '#0D3D12' },
  cherry: { name: 'Cherry', color: '#E91E63', colorDark: '#AD1457' },
  maple: { name: 'Maple', color: '#FF5722', colorDark: '#BF360C' },
  willow: { name: 'Willow', color: '#8BC34A', colorDark: '#558B2F' },
  sakura: { name: 'Sakura', color: '#F48FB1', colorDark: '#C2185B' }
}
```

## API Endpoints

### 1. Get Focus Statistics

**GET** `/api/todo/focus/stats`

Returns the current user's focus statistics including planted trees.

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "todayTrees": 3,
    "todayMinutes": 90,
    "currentStreak": 5,
    "totalTrees": 42,
    "totalMinutes": 1260,
    "totalPoints": 4200,
    "lastSessionDate": "2026-01-18",
    "plantedTrees": [
      {
        "id": "tree_001",
        "type": "oak",
        "color": "#4CAF50",
        "plantedAt": "2026-01-18T10:55:00.000Z",
        "duration": 30,
        "points": 100,
        "position": 0
      },
      {
        "id": "tree_002",
        "type": "sakura",
        "color": "#F48FB1",
        "plantedAt": "2026-01-18T14:30:00.000Z",
        "duration": 60,
        "points": 200,
        "position": 1
      }
    ]
  }
}
```

---

### 2. Create Focus Session (Start Timer)

**POST** `/api/todo/focus/sessions`

Creates a new active focus session when user starts the timer.

**Request Body:**
```json
{
  "duration": 30,
  "treeType": "oak",
  "potentialPoints": 100
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| duration | number | Yes | Session duration in minutes (1-180) |
| treeType | string | Yes | Tree type: oak, pine, cherry, maple, willow, sakura |
| potentialPoints | number | No | Expected points (calculated as duration/30 * 100) |

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "session": {
      "id": "session_abc123",
      "duration": 30,
      "treeType": "oak",
      "potentialPoints": 100,
      "startTime": "2026-01-18T10:30:00.000Z",
      "status": "active",
      "points": 0,
      "createdAt": "2026-01-18T10:30:00.000Z",
      "updatedAt": "2026-01-18T10:30:00.000Z"
    }
  }
}
```

---

### 3. Complete Focus Session

**POST** `/api/todo/focus/sessions/:sessionId/complete`

Marks a focus session as completed and awards points.

**Request Body:**
```json
{
  "treeType": "oak",
  "duration": 30,
  "points": 100
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "session": {
      "id": "session_abc123",
      "duration": 30,
      "treeType": "oak",
      "startTime": "2026-01-18T10:30:00.000Z",
      "endTime": "2026-01-18T11:00:00.000Z",
      "status": "completed",
      "completedAt": "2026-01-18T11:00:00.000Z",
      "points": 100
    },
    "stats": {
      "todayTrees": 4,
      "todayMinutes": 120,
      "currentStreak": 5,
      "totalTrees": 43,
      "totalMinutes": 1290,
      "totalPoints": 4300,
      "lastSessionDate": "2026-01-18"
    },
    "plantedTree": {
      "id": "tree_043",
      "type": "oak",
      "color": "#4CAF50",
      "plantedAt": "2026-01-18T11:00:00.000Z",
      "duration": 30,
      "points": 100,
      "position": 42
    }
  }
}
```

---

### 4. Fail Focus Session (Left Page / Give Up)

**POST** `/api/todo/focus/sessions/:sessionId/fail`

Marks a focus session as failed and deducts penalty points.

**Request Body:**
```json
{
  "reason": "left_page",
  "penalty": 100
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Failure reason: 'left_page', 'give_up', 'browser_closed' |
| penalty | number | No | Penalty points (default: 100) |

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "session": {
      "id": "session_abc123",
      "duration": 30,
      "treeType": "oak",
      "startTime": "2026-01-18T10:30:00.000Z",
      "status": "failed",
      "failedAt": "2026-01-18T10:35:00.000Z",
      "failReason": "left_page",
      "penalty": 100,
      "points": 0
    },
    "stats": {
      "todayTrees": 3,
      "todayMinutes": 90,
      "currentStreak": 5,
      "totalTrees": 42,
      "totalMinutes": 1260,
      "totalPoints": 4100,
      "lastSessionDate": "2026-01-18"
    }
  }
}
```

**Backend Logic:**
1. Mark session as `failed`
2. Set `failReason` and `failedAt`
3. Deduct penalty points from `totalPoints` (minimum 0)
4. Do NOT increment tree counts or minutes

---

### 5. Cancel Focus Session

**POST** `/api/todo/focus/sessions/:sessionId/cancel`

Cancels an active focus session. Same as fail with reason 'give_up'.

**Response:** Same as Fail endpoint

---

### 6. List Focus Sessions (History)

**GET** `/api/todo/focus/sessions`

Returns paginated list of user's focus sessions.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| status | string | - | Filter by status: 'active', 'completed', 'cancelled', 'failed' |
| startDate | string | - | Filter sessions from this date (YYYY-MM-DD) |
| endDate | string | - | Filter sessions until this date (YYYY-MM-DD) |
| treeType | string | - | Filter by tree type |

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "data": [
      {
        "id": "session_abc123",
        "duration": 30,
        "treeType": "oak",
        "startTime": "2026-01-18T10:30:00.000Z",
        "endTime": "2026-01-18T11:00:00.000Z",
        "status": "completed",
        "completedAt": "2026-01-18T11:00:00.000Z",
        "points": 100
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 42
    }
  }
}
```

---

### 7. Get Planted Trees (Forest Data)

**GET** `/api/todo/focus/forest`

Returns the user's planted trees for forest visualization.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 48 | Max trees to return (for grid display) |
| offset | number | 0 | Offset for pagination |

**Response:**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "trees": [
      {
        "id": "tree_001",
        "type": "oak",
        "color": "#4CAF50",
        "plantedAt": "2026-01-18T10:55:00.000Z",
        "duration": 30,
        "points": 100,
        "position": 0
      }
    ],
    "meta": {
      "totalTrees": 42,
      "gridSize": 48
    }
  }
}
```

---

## Database Schema

### MySQL / PostgreSQL

```sql
-- Focus sessions table
CREATE TABLE focus_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  duration INT NOT NULL,
  tree_type VARCHAR(20) NOT NULL DEFAULT 'oak',
  potential_points INT NOT NULL DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  status ENUM('active', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'active',
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  fail_reason VARCHAR(50) NULL,
  points INT NOT NULL DEFAULT 0,
  penalty INT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time),
  INDEX idx_tree_type (tree_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Focus stats table (one row per user)
CREATE TABLE focus_stats (
  user_id VARCHAR(36) PRIMARY KEY,
  today_trees INT NOT NULL DEFAULT 0,
  today_minutes INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  total_trees INT NOT NULL DEFAULT 0,
  total_minutes INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  last_session_date DATE NULL,
  stats_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Planted trees table (for forest visualization)
CREATE TABLE planted_trees (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  tree_type VARCHAR(20) NOT NULL,
  color VARCHAR(10) NOT NULL,
  planted_at TIMESTAMP NOT NULL,
  duration INT NOT NULL,
  points INT NOT NULL,
  position INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_planted_at (planted_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE
);
```

---

## Error Responses

### Session Already Active
```json
{
  "code": 400,
  "msg": "An active focus session already exists"
}
```

### Session Not Found
```json
{
  "code": 404,
  "msg": "Focus session not found"
}
```

### Invalid Tree Type
```json
{
  "code": 400,
  "msg": "Invalid tree type. Must be one of: oak, pine, cherry, maple, willow, sakura"
}
```

### Invalid Duration
```json
{
  "code": 400,
  "msg": "Duration must be between 1 and 180 minutes"
}
```

### Session Already Completed
```json
{
  "code": 400,
  "msg": "Session has already been completed"
}
```

---

## Frontend-Backend Sync Notes

### Browser Leave Detection (Frontend)

The frontend implements leave detection using:
1. `visibilitychange` event - detects tab switching/minimizing
2. `beforeunload` event - detects browser close/navigation

When user leaves during focus:
1. Show warning overlay with 5-second grace period
2. If user returns within grace period, continue session
3. If grace period expires, call `/fail` endpoint with reason `left_page`
4. Deduct 100 penalty points

### White Noise BGM (Frontend)

BGM is handled entirely on frontend using HTML5 Audio:
- Rain, Forest, Ocean, Fireplace, Cafe, Wind sounds
- Audio files stored in `/assets/audio/bgm/`
- No backend API needed for BGM

### Tree Color Mapping

Frontend defines tree colors - backend should store the color value from frontend:
```javascript
const TREE_COLORS = {
  oak: '#4CAF50',
  pine: '#1B5E20',
  cherry: '#E91E63',
  maple: '#FF5722',
  willow: '#8BC34A',
  sakura: '#F48FB1'
}
```

---

## Implementation Notes

1. **Points Floor**: Total points can never go below 0. Apply `Math.max(0, totalPoints - penalty)`.

2. **Streak Logic**: Streak increments only on first completed session of each new day. Multiple sessions on same day don't affect streak.

3. **Grid Position**: Frontend manages grid positions locally. Backend can optionally store position for cross-device sync.

4. **Concurrent Sessions**: Ensure only one active session per user at a time.

5. **Daily Reset**: When fetching stats, check if `lastSessionDate` is not today. If so, reset `todayTrees` and `todayMinutes` to 0.

6. **Caching**: Consider caching stats and recent planted trees for performance.
