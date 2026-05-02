/**
 * notificationRepository.js
 * -----------------------------------------
 * MySQL data-access layer for notifications.
 * Implements all DB queries referenced in Stages 2-5.
 */

const { get_pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// ─── INSERT ──────────────────────────────────────────────────────

async function insert_notification({ studentID = null, type = "Event", message }) {
  const db = get_pool();
  const id = uuidv4();

  await db.execute(
    `INSERT INTO notifications (id, studentID, notificationType, message, isRead, createdAt)
     VALUES (?, ?, ?, ?, FALSE, NOW())`,
    [id, studentID, type, message]
  );

  return { id, studentID, type, message, isRead: false };
}

// ─── BATCH INSERT (Stage 5 – bulk) ──────────────────────────────

async function insert_notifications_batch(items) {
  const db = get_pool();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      const id = item.id || uuidv4();
      await connection.execute(
        `INSERT INTO notifications (id, studentID, notificationType, message, isRead, createdAt)
         VALUES (?, ?, ?, ?, FALSE, NOW())
         ON DUPLICATE KEY UPDATE message = VALUES(message)`,
        [id, item.studentID || null, item.type || "Event", item.message]
      );
    }

    await connection.commit();
    return { inserted: items.length };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ─── SELECT ALL ─────────────────────────────────────────────────

async function get_all_notifications() {
  const db = get_pool();
  const [rows] = await db.execute(
    `SELECT id AS ID, notificationType AS Type, message AS Message,
            createdAt AS Timestamp, isRead, studentID
     FROM notifications
     ORDER BY createdAt DESC`
  );
  return rows;
}

// ─── SELECT UNREAD for a student (Stage 3 – optimized) ──────────
// Uses the composite index idx_student_read (studentID, isRead)

async function get_unread_notifications(studentID) {
  const db = get_pool();
  const [rows] = await db.execute(
    `SELECT id AS ID, notificationType AS Type, message AS Message,
            createdAt AS Timestamp, isRead
     FROM notifications
     WHERE studentID = ? AND isRead = FALSE
     ORDER BY createdAt DESC`,
    [studentID]
  );
  return rows;
}

// ─── Placement notifications last 7 days (Stage 3) ─────────────

async function get_recent_placement_notifications() {
  const db = get_pool();
  const [rows] = await db.execute(
    `SELECT id AS ID, notificationType AS Type, message AS Message,
            createdAt AS Timestamp, studentID, isRead
     FROM notifications
     WHERE notificationType = 'Placement'
       AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY createdAt DESC`
  );
  return rows;
}

// ─── MARK AS READ ───────────────────────────────────────────────

async function mark_as_read(notificationId) {
  const db = get_pool();
  const [result] = await db.execute(
    `UPDATE notifications SET isRead = TRUE WHERE id = ?`,
    [notificationId]
  );

  if (result.affectedRows === 0) {
    throw new Error(`Notification not found: ${notificationId}`);
  }

  const [rows] = await db.execute(
    `SELECT id AS ID, notificationType AS Type, message AS Message,
            createdAt AS Timestamp, isRead
     FROM notifications WHERE id = ?`,
    [notificationId]
  );
  return rows[0];
}

// ─── QUEUE OPERATIONS (Stage 5) ─────────────────────────────────

async function enqueue_notification(notificationID, channel) {
  const db = get_pool();
  await db.execute(
    `INSERT INTO notification_queue (notificationID, channel, status)
     VALUES (?, ?, 'pending')`,
    [notificationID, channel]
  );
}

async function get_pending_queue_items(limit = 100) {
  const db = get_pool();
  const safeLimit = parseInt(limit, 10) || 100;
  const [rows] = await db.query(
    `SELECT * FROM notification_queue
     WHERE status = 'pending' AND retryCount < maxRetries
     ORDER BY createdAt ASC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

async function update_queue_status(queueID, status, error = null) {
  const db = get_pool();
  await db.execute(
    `UPDATE notification_queue
     SET status = ?, error = ?, processedAt = NOW(),
         retryCount = retryCount + CASE WHEN ? = 'failed' THEN 1 ELSE 0 END
     WHERE queueID = ?`,
    [status, error, status, queueID]
  );
}

// ─── STUDENT OPERATIONS ─────────────────────────────────────────

async function insert_student({ name, email, rollNo }) {
  const db = get_pool();
  const [result] = await db.execute(
    `INSERT INTO students (name, email, rollNo)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [name, email, rollNo]
  );
  return { studentID: result.insertId, name, email, rollNo };
}

async function get_all_students() {
  const db = get_pool();
  const [rows] = await db.execute(`SELECT * FROM students`);
  return rows;
}

// ─── TABLE STATS ────────────────────────────────────────────────

async function get_table_stats() {
  const db = get_pool();

  const [notifCount] = await db.execute(`SELECT COUNT(*) AS count FROM notifications`);
  const [studentCount] = await db.execute(`SELECT COUNT(*) AS count FROM students`);
  const [queueCount] = await db.execute(`SELECT COUNT(*) AS count FROM notification_queue`);

  return {
    notifications: notifCount[0].count,
    students: studentCount[0].count,
    queueItems: queueCount[0].count
  };
}

module.exports = {
  insert_notification,
  insert_notifications_batch,
  get_all_notifications,
  get_unread_notifications,
  get_recent_placement_notifications,
  mark_as_read,
  enqueue_notification,
  get_pending_queue_items,
  update_queue_status,
  insert_student,
  get_all_students,
  get_table_stats
};
