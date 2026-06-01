const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'studio_booking.db');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS studios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      district TEXT NOT NULL,
      size_category TEXT NOT NULL CHECK(size_category IN ('small','medium','large')),
      sqft INTEGER NOT NULL,
      hourly_price INTEGER NOT NULL,
      half_day_price INTEGER,
      full_day_price INTEGER,
      description TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      amenities TEXT NOT NULL DEFAULT '{}',
      rules TEXT NOT NULL DEFAULT '{}',
      contact_email TEXT,
      contact_phone TEXT,
      contact_whatsapp TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS availability_blocks (
      id TEXT PRIMARY KEY,
      studio_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_hour INTEGER NOT NULL,
      end_hour INTEGER NOT NULL,
      block_type TEXT NOT NULL DEFAULT 'available' CHECK(block_type IN ('available','booked','blocked')),
      booking_id TEXT,
      FOREIGN KEY(studio_id) REFERENCES studios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      studio_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT,
      user_company TEXT,
      date TEXT NOT NULL,
      start_hour INTEGER NOT NULL,
      end_hour INTEGER NOT NULL,
      duration_hours INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      addons_price INTEGER NOT NULL DEFAULT 0,
      total_price INTEGER NOT NULL,
      deposit_amount INTEGER NOT NULL,
      addons TEXT NOT NULL DEFAULT '[]',
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','deposit_paid','paid','refunded','failed')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','completed')),
      stripe_payment_intent_id TEXT,
      notes TEXT,
      contract_html TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(studio_id) REFERENCES studios(id)
    );

    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      studio_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      unit TEXT NOT NULL DEFAULT 'per_booking',
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_availability_studio_date 
      ON availability_blocks(studio_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_studio 
      ON bookings(studio_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_email 
      ON bookings(user_email);
  `);
}

module.exports = { getDb };
