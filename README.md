# Campus Notification System

**Name:** Poreddy Lokesh Reddy  
**Roll No:** RA2311003011384  
**Email:** lp7074@srmist.edu.in

---

## About

This project implements a campus notification system built with Node.js, Express, and MySQL. It covers the full lifecycle of notification management — from basic REST API design and database schema creation to query optimization, bulk processing, and a priority-based inbox. The system fetches notifications from an external evaluation API and applies weighted ranking to surface the most relevant ones first.

---

## Project Structure

```
RA2311003011384/
|-- logging_middleware/
|   |-- authService.js        # Token-based auth for the evaluation API
|   |-- constants.js           # Shared config values and enums
|   |-- logger.js              # Centralized log dispatcher
|
|-- notification_app_be/
|   |-- config/
|   |   |-- api.config.js      # API base URL config
|   |   |-- authService.js     # Notification-specific auth handler
|   |   |-- constants.js       # Backend constants (env-driven)
|   |   |-- database.js        # MySQL connection pool and schema setup
|   |
|   |-- controllers/
|   |   |-- notificationController.js   # Route handlers for all endpoints
|   |
|   |-- routes/
|   |   |-- routes.js           # Express route definitions
|   |
|   |-- services/
|   |   |-- apiClient.js                    # HTTP client with auth headers
|   |   |-- bulkNotificationProcessor.js    # Batch processing with retry logic
|   |   |-- notification.service.js         # Core notification CRUD + caching
|   |   |-- notificationRepository.js       # MySQL data-access layer
|   |   |-- priorityNotificationService.js  # Priority score computation
|   |
|   |-- utils/
|   |   |-- priorityQueue.js    # Min-heap implementation for top-N retrieval
|   |
|   |-- demo_runner.js          # End-to-end demo script (all stages)
|   |-- index.js                # Server entry point
|
|-- vehicle_maintenance_scheduler/
|   |-- api.js
|   |-- index.js
|   |-- scheduler.js
|   |-- schedulerService.js
|   |-- vehicleController.js
|
|-- notification_system_design.md   # Full design document (Stages 1-6)
|-- package.json
|-- .gitignore
```

---

## Stages Covered

### Stage 1 — REST API Design

Defined a set of endpoints for notification management. Each notification carries an ID, type (Event, Result, or Placement), message body, and timestamp. The backend acts as a stateless proxy to the external evaluation service API.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | /notifications | Fetch all notifications |
| POST | /notifications | Create a new notification |
| PATCH | /notifications/:id/read | Mark a notification as read |
| GET | /notifications/priority | Get top-N priority notifications |
| POST | /notifications/bulk | Process bulk notifications |

### Stage 2 — Database Schema (MySQL)

Chose MySQL as the persistent storage layer. The schema includes three tables:

- **students** — stores registered student records with indexed email and roll number columns
- **notifications** — stores each notification with type, message, read status, and timestamps
- **notification_queue** — tracks async delivery jobs across email, push, and in-app channels

The schema uses InnoDB with foreign key constraints and composite indexes designed around the most frequent query patterns.

### Stage 3 — Query Optimization

The original slow query (`SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC`) was improved by adding a composite index on `(studentID, isRead)`. This allows MySQL to perform a single index lookup instead of a full table scan.

Adding indexes on every column (as one developer suggested) is not advisable because it increases write overhead, consumes extra memory, and slows down INSERT/UPDATE operations. Indexes should only be placed on columns that appear in WHERE, JOIN, or ORDER BY clauses of frequent queries.

A query for placement notifications in the last 7 days uses the `(notificationType, createdAt)` composite index for an efficient range scan.

### Stage 4 — Performance Improvements

To reduce load on the database and external API, the system uses:

- **In-memory caching** with a 30-second TTL to avoid redundant API calls
- **Lazy loading** so only the required subset of data is fetched per request
- **Background refresh** to keep cached data reasonably fresh

### Stage 5 — Bulk Notification Processing

The naive sequential approach (loop through 50,000 students, send email + save to DB + push notification one by one) has several problems: it is slow, tightly coupled, and any failure midway leaves the system in an inconsistent state.

The improved design uses:

- **Batch inserts** with transactions for atomicity
- **Async queue** that decouples email, push, and DB operations into separate jobs
- **Retry logic** with a configurable max retry count and dead-letter handling for persistent failures
- **Idempotent writes** using `ON DUPLICATE KEY UPDATE` to prevent duplicate notifications

### Stage 6 — Priority Inbox

The priority inbox ranks notifications using a weighted formula:

```
Priority Score = (Type Weight * 100) + Recency Score
```

Type weights: Placement = 3 (score 300), Result = 2 (score 200), Event = 1 (score 100).  
Recency score decays over time using `1 / (1 + age_in_hours)`.

A min-heap (priority queue) data structure is used instead of sorting the entire dataset. This gives O(n log n) insertion and O(k log n) extraction for the top-k items, which is more efficient than re-sorting on every request when new notifications keep arriving.

---

## How to Run

### Prerequisites

- Node.js (v16 or above)
- MySQL (v8 or above)
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/lokesh-poreddy/RA2311003011384.git
   cd RA2311003011384
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   BASE_URL=http://20.207.122.201/evaluation-service
   EMAIL=your_email
   NAME=Your Name
   ROLL_NO=your_roll_number
   ACCESS_CODE=your_access_code
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=notification_system
   ```

4. Make sure MySQL is running locally.

5. Run the demo (creates tables automatically and exercises all stages):
   ```bash
   node notification_app_be/demo_runner.js
   ```

6. Or start the Express server:
   ```bash
   npm start
   ```

---

## Output Screenshots

The following screenshots show the output of running the demo script (`node notification_app_be/demo_runner.js`), which exercises all six stages end to end with a live MySQL database.

### Screenshot 1 — Database Initialization and Student Registration

MySQL tables are created, sample students are registered, and notifications are inserted into the database.

![Database Init and Student Registration](https://drive.google.com/uc?export=view&id=1Z45XvEGu3rxkF7bRnrnzxkaCHCMljwV-)

### Screenshot 2 — Indexed Query Results

Unread notifications fetched using the composite index, and placement notifications from the last 7 days filtered with a range scan.

![Indexed Query Results](https://drive.google.com/uc?export=view&id=10FQZI0IKbMD24atKt-xQDqUpkwVRCQHe)

### Screenshot 3 — Bulk Processing and Async Queue

Batch insert of 20 notifications, followed by async queue processing across email and push channels with simulated success/failure outcomes.

![Bulk Processing and Queue](https://drive.google.com/uc?export=view&id=1ajyFPvRRRuwMUn2rq7iZ-3D4F7ajeNwz)

### Screenshot 4 — Priority Inbox and Database Statistics

Top 10 priority notifications ranked by type weight and recency, along with final database statistics and active index listing.

![Priority Inbox and Stats](https://drive.google.com/uc?export=view&id=1cRXnuodCjdO2_-Jj6L7kKczQYx6M1LIx)

---

## Technologies Used

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL (via mysql2 driver)
- **Authentication:** Token-based auth against the evaluation service API
- **Data Structures:** Min-heap priority queue for top-N retrieval

---

## Design Document

The detailed design rationale for each stage is documented in [notification_system_design.md](./notification_system_design.md).
