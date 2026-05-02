#!/usr/bin/env node
/**
 * demo_runner.js
 * ═══════════════════════════════════════════════════════════════
 * Comprehensive demonstration of the Notification System with MySQL.
 * Exercises all stages (1-6) and prints formatted output.
 *
 * Usage:  node notification_app_be/demo_runner.js
 * ═══════════════════════════════════════════════════════════════
 */

require("dotenv").config();
const { initialize_database, close_database, get_pool } = require("./config/database");
const {
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
} = require("./services/notificationRepository");
const PriorityQueue = require("./utils/priorityQueue");

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function banner(title) {
  const line = "═".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}`);
}

function sub(title) {
  console.log(`\n  ── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}`);
}

function table(rows, keys) {
  if (!rows.length) {
    console.log("    (no rows)");
    return;
  }
  const headers = keys || Object.keys(rows[0]);
  const widths = headers.map((h) =>
    Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length))
  );
  // Cap column widths
  widths.forEach((w, i) => { widths[i] = Math.min(w, 40); });

  const sep = widths.map((w) => "─".repeat(w + 2)).join("┼");
  const header = headers.map((h, i) => ` ${h.padEnd(widths[i])} `).join("│");

  console.log(`    ┌${sep.replace(/┼/g, "┬")}┐`);
  console.log(`    │${header}│`);
  console.log(`    ├${sep}┤`);

  for (const row of rows) {
    const line = headers
      .map((h, i) => {
        let val = String(row[h] ?? "");
        if (val.length > 40) val = val.substring(0, 37) + "...";
        return ` ${val.padEnd(widths[i])} `;
      })
      .join("│");
    console.log(`    │${line}│`);
  }
  console.log(`    └${sep.replace(/┼/g, "┴")}┘`);
}

// ═══════════════════════════════════════════════════════════════
// Priority score calculator (Stage 6)
// ═══════════════════════════════════════════════════════════════

function calculate_priority(notification) {
  const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 1;

  const ts = new Date(notification.Timestamp).getTime();
  const ageMs = Math.max(0, Date.now() - ts);
  const recencyScore = 1 / (1 + ageMs / (1000 * 60 * 60));

  return typeWeight * 100 + recencyScore;
}

// ═══════════════════════════════════════════════════════════════
// Main Demo
// ═══════════════════════════════════════════════════════════════

async function run_demo() {
  banner("🚀 NOTIFICATION SYSTEM – FULL DEMO");
  console.log("  Timestamp:", new Date().toISOString());

  // ── Step 1: Initialize MySQL ──────────────────────────────
  banner("STAGE 1 │ MySQL Database Initialization");
  await initialize_database();

  const db = get_pool();

  // Clean slate for repeatable demo
  await db.execute("DELETE FROM notification_queue");
  await db.execute("DELETE FROM notifications");
  await db.execute("DELETE FROM students");
  console.log("  🧹 Tables cleared for clean demo run");

  // ── Step 2: Insert sample students ────────────────────────
  banner("STAGE 2 │ Student Registration (MySQL INSERT)");

  const students = [
    { name: "Poreddy Lokesh Reddy", email: "lp7074@srmist.edu.in", rollNo: "RA2311003011384" },
    { name: "Rahul Sharma", email: "rs1234@srmist.edu.in", rollNo: "RA2311003011001" },
    { name: "Priya Patel", email: "pp5678@srmist.edu.in", rollNo: "RA2311003011002" },
    { name: "Ankit Kumar", email: "ak9012@srmist.edu.in", rollNo: "RA2311003011003" },
    { name: "Sneha Reddy", email: "sr3456@srmist.edu.in", rollNo: "RA2311003011004" }
  ];

  const insertedStudents = [];
  for (const s of students) {
    const result = await insert_student(s);
    insertedStudents.push(result);
  }

  const allStudents = await get_all_students();
  sub("Registered Students");
  table(allStudents, ["studentID", "name", "email", "rollNo"]);

  // ── Step 3: Insert notifications ──────────────────────────
  banner("STAGE 2 │ Notification Insertion (MySQL INSERT)");

  const sampleNotifications = [
    { studentID: allStudents[0].studentID, type: "Placement", message: "CSX Corporation hiring" },
    { studentID: allStudents[0].studentID, type: "Placement", message: "Advanced Micro Devices Inc. hiring" },
    { studentID: allStudents[0].studentID, type: "Result", message: "mid-sem results published" },
    { studentID: allStudents[0].studentID, type: "Result", message: "project-review grades out" },
    { studentID: allStudents[0].studentID, type: "Result", message: "external exam scores" },
    { studentID: allStudents[0].studentID, type: "Event", message: "tech-fest registrations open" },
    { studentID: allStudents[0].studentID, type: "Event", message: "farewell party RSVP" },
    { studentID: allStudents[1].studentID, type: "Placement", message: "Google Summer Internship" },
    { studentID: allStudents[1].studentID, type: "Result", message: "end-sem results published" },
    { studentID: allStudents[2].studentID, type: "Event", message: "hackathon registration" },
    { studentID: allStudents[2].studentID, type: "Placement", message: "Microsoft campus drive" },
    { studentID: allStudents[3].studentID, type: "Result", message: "lab evaluation marks" },
    { studentID: allStudents[4].studentID, type: "Placement", message: "Amazon SDE-1 hiring" }
  ];

  for (const n of sampleNotifications) {
    await insert_notification(n);
  }

  const allNotifs = await get_all_notifications();
  sub("All Notifications in DB");
  table(allNotifs.slice(0, 13), ["ID", "Type", "Message", "Timestamp", "isRead"]);

  // ── Step 4: Stage 3 – Query Optimization ──────────────────
  banner("STAGE 3 │ Optimized Queries (Indexed MySQL)");

  sub("Unread Notifications for Student #" + allStudents[0].studentID);
  const unread = await get_unread_notifications(allStudents[0].studentID);
  table(unread, ["ID", "Type", "Message", "Timestamp", "isRead"]);
  console.log(`\n  📊 Query uses composite index (studentID, isRead) – O(log n) lookup`);

  sub("Placement Notifications (Last 7 Days)");
  const placements = await get_recent_placement_notifications();
  table(placements, ["ID", "Type", "Message", "Timestamp", "studentID"]);
  console.log(`\n  📊 Query uses index (notificationType, createdAt) – efficient range scan`);

  // ── Step 5: Mark some as read ─────────────────────────────
  banner("STAGE 3 │ Mark Notifications as Read");

  if (allNotifs.length >= 2) {
    const updated1 = await mark_as_read(allNotifs[0].ID);
    const updated2 = await mark_as_read(allNotifs[1].ID);
    sub("Updated Notifications");
    table([updated1, updated2], ["ID", "Type", "Message", "isRead"]);
  }

  sub("Unread Count After Marking");
  const unreadAfter = await get_unread_notifications(allStudents[0].studentID);
  console.log(`  📬 Unread count: ${unreadAfter.length} (was ${unread.length})`);

  // ── Step 6: Batch insert (Stage 5) ────────────────────────
  banner("STAGE 5 │ Bulk Notification Processing");

  const bulkItems = [];
  for (let i = 0; i < 20; i++) {
    bulkItems.push({
      studentID: allStudents[i % allStudents.length].studentID,
      type: ["Event", "Result", "Placement"][i % 3],
      message: `Bulk notification #${i + 1}`
    });
  }

  const batchResult = await insert_notifications_batch(bulkItems);
  console.log(`  ✅ Batch inserted: ${batchResult.inserted} notifications`);

  // Enqueue for async processing
  sub("Async Queue (Email + Push channels)");
  const latestNotifs = await get_all_notifications();
  for (let i = 0; i < Math.min(5, latestNotifs.length); i++) {
    await enqueue_notification(latestNotifs[i].ID, "email");
    await enqueue_notification(latestNotifs[i].ID, "push");
  }

  const pendingItems = await get_pending_queue_items(10);
  table(pendingItems.slice(0, 10), ["queueID", "notificationID", "channel", "status", "retryCount"]);

  // Simulate processing
  sub("Processing Queue Items");
  for (const item of pendingItems.slice(0, 6)) {
    const success = Math.random() > 0.3; // 70% success rate
    await update_queue_status(
      item.queueID,
      success ? "completed" : "failed",
      success ? null : "Simulated failure"
    );
    console.log(`    ${success ? "✅" : "❌"} Queue #${item.queueID} (${item.channel}): ${success ? "completed" : "failed"}`);
  }

  // ── Step 7: Priority Inbox (Stage 6) ──────────────────────
  banner("STAGE 6 │ Priority Inbox – Top 10 Notifications");

  const freshNotifs = await get_all_notifications();
  const queue = new PriorityQueue();

  for (const n of freshNotifs) {
    queue.push({
      ...n,
      priorityScore: calculate_priority(n),
      priority: -calculate_priority(n) // min-heap, so negate
    });
  }

  const topN = [];
  for (let i = 0; i < 10 && queue.size(); i++) {
    const item = queue.pop();
    topN.push({
      Rank: i + 1,
      Type: item.Type,
      Message: item.Message,
      Priority: item.priorityScore.toFixed(2),
      Timestamp: item.Timestamp
    });
  }

  sub("Top 10 Priority Notifications (Heap-based)");
  table(topN, ["Rank", "Type", "Message", "Priority", "Timestamp"]);

  console.log(`\n  📊 Priority Formula: (TypeWeight × 100) + RecencyScore`);
  console.log(`     Placement=300, Result=200, Event=100 + time decay`);

  // ── Step 8: Database Stats ────────────────────────────────
  banner("DATABASE STATISTICS");

  const stats = await get_table_stats();
  console.log(`  📊 Total Students:       ${stats.students}`);
  console.log(`  📊 Total Notifications:  ${stats.notifications}`);
  console.log(`  📊 Queue Items:          ${stats.queueItems}`);

  // Show indexes
  sub("Active Indexes on notifications table");
  const [indexes] = await db.execute("SHOW INDEX FROM notifications");
  const indexSummary = indexes.map((idx) => ({
    Key: idx.Key_name,
    Column: idx.Column_name,
    Unique: idx.Non_unique === 0 ? "YES" : "NO",
    Type: idx.Index_type
  }));
  table(indexSummary, ["Key", "Column", "Unique", "Type"]);

  // ── Done ──────────────────────────────────────────────────
  banner("✅ DEMO COMPLETE");
  console.log("  All stages demonstrated successfully with MySQL integration.\n");

  await close_database();
}

run_demo().catch(async (err) => {
  console.error("\n❌ Demo failed:", err.message);
  console.error(err.stack);
  await close_database();
  process.exit(1);
});
