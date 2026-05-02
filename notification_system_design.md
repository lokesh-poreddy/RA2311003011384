# Notification System Design

## Overview
This document outlines the design and evolution of a Campus Notification System implemented in stages. The system delivers real-time updates to students regarding placements, results, and events. The design focuses on scalability, performance, and reliability.

---

## Stage 1: Basic Notification System Design

### Objective
Design a basic system to send and retrieve notifications.

### Approach
- Each notification contains:
  - ID
  - Type (Event, Result, Placement)
  - Message
  - Timestamp
- Notifications are fetched using an external API.
- No local database is used (as per constraints).

### Architecture
- Client → Backend Service → External Notification API

### Key Points
- Stateless backend
- Simple API integration
- No caching or optimization

---

## Stage 2: Data Handling and Structure

### Objective
Efficiently handle notification data.

### Approach
- Normalize incoming data from API
- Store in in-memory structures temporarily for processing
- Use arrays for initial implementation

### Improvements
- Clean data handling
- Separation of concerns (service layer)

---

## Stage 3: Query Optimization

### Problem
Need to filter notifications (e.g., placements in last 7 days)

### Solution
- Apply filtering at application layer
- Example:
  - Filter by Type = "Placement"
  - Filter by Timestamp ≥ current_date - 7 days

### Optimization
- Time complexity: O(n)
- No DB indexing (since no DB is used)

### Why not index every column?
- Not applicable (no DB)
- Even in DB:
  - Over-indexing increases write cost
  - Consumes memory
  - Slows inserts

---

## Stage 4: Performance Improvement

### Problem
Notifications are fetched on every request → high load on API

### Solutions

#### 1. Caching (Recommended)
- Cache API response for short duration (e.g., 30–60 sec)

**Pros:**
- Reduces API calls
- Faster response time

**Cons:**
- Slightly stale data

---

#### 2. Lazy Loading / Pagination
- Fetch only required notifications

**Pros:**
- Reduced payload

**Cons:**
- Additional complexity

---

#### 3. Background Refresh
- Periodically refresh notifications in background

**Pros:**
- Near real-time data

**Cons:**
- Requires scheduler

---

### Final Choice
- Lightweight caching + API fetch

---

## Stage 5: High Volume Notification Handling

### Problem
HR triggers "Notify All" for 50,000 users

### Issues in naive approach
- Sequential execution → slow
- Partial failures (e.g., email failed for 200 users)
- No retry mechanism
- Tight coupling (DB + email together)

---

### Improved Design

#### 1. Asynchronous Processing
- Use queue-based system (conceptually)

Flow:
Producer → Queue → Worker → Email / DB / Push

---

#### 2. Decoupling Operations
- Separate:
  - Email sending
  - DB persistence
  - Push notification

---

#### 3. Retry Mechanism
- Failed jobs retried
- Dead-letter queue for failures

---

#### 4. Idempotency
- Prevent duplicate notifications

---

### Trade-offs
| Strategy | Pros | Cons |
|--------|------|------|
| Sync | Simple | Slow, unreliable |
| Async | Scalable, reliable | More complex |

---

### Final Approach
- Asynchronous + decoupled system

---

## Stage 6: Priority Inbox (Top N Notifications)

### Objective
Display top 'N' most important unread notifications

---

### Priority Criteria

1. Type Importance:
   - Placement → Highest
   - Result → Medium
   - Event → Lowest

2. Recency:
   - Newer notifications → Higher priority

---

### Priority Formula

Priority Score =
(Type Weight × Constant) − Time Decay

---

### Implementation

- Use Min Heap / Priority Queue
- Insert all notifications with computed priority
- Extract top N (e.g., 10)

---

### Time Complexity
- Heap insert: O(log n)
- Extract top N: O(n log n)

---

### Why Priority Queue?
- Efficient top-N retrieval
- Better than sorting entire dataset repeatedly

---

### Handling Continuous Updates

#### Approach:
- Recompute priority on fetch
- Maintain dynamic heap

#### Alternative:
- Streaming / event-driven system

---

### Trade-offs
| Approach | Pros | Cons |
|--------|------|------|
| Sorting | Simple | O(n log n) every time |
| Heap | Efficient | Slightly complex |

---

### Final Choice
- Priority Queue (Heap)

---

## Conclusion

The system evolved from a basic notification fetcher to a scalable, optimized backend system with:

- Efficient data handling
- Performance optimizations
- Reliable notification delivery strategy
- Priority-based retrieval system

The design balances simplicity and scalability while adhering to given constraints.