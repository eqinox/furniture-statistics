import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "data")
    : path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "orders.db");

type DbGlobal = typeof globalThis & {
  __ordersDb__?: Database.Database;
  __ordersDbInitialized__?: boolean;
};

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location_type TEXT,
      location_name TEXT,
      district TEXT,
      final_price REAL,
      deposit REAL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      ordered_at TEXT,
      completed_at TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', '+2 hours')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', '+2 hours'))
    );

    CREATE TABLE IF NOT EXISTS order_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now', '+2 hours')),
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE
    );

    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      name TEXT NOT NULL COLLATE NOCASE,
      FOREIGN KEY(city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS years (
      year TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS villages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_city_name_nocase
      ON districts(city_id, name COLLATE NOCASE);
  `);

  const ordersColumns = db.prepare(`PRAGMA table_info(orders)`).all() as Array<{
    name: string;
  }>;
  const ordersColumnNames = new Set(ordersColumns.map((col) => col.name));

  if (!ordersColumnNames.has("city_id")) {
    db.exec(`ALTER TABLE orders ADD COLUMN city_id INTEGER;`);
  }
  if (!ordersColumnNames.has("district_id")) {
    db.exec(`ALTER TABLE orders ADD COLUMN district_id INTEGER;`);
  }
  if (!ordersColumnNames.has("updated_at")) {
    db.exec(
      `ALTER TABLE orders ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`,
    );
  }
  db.exec(`
    UPDATE orders
    SET updated_at = created_at
    WHERE updated_at IS NULL;
  `);

  const districtColumns = db
    .prepare(`PRAGMA table_info(districts)`)
    .all() as Array<{ name: string }>;
  const districtColumnNames = new Set(districtColumns.map((col) => col.name));

  if (!districtColumnNames.has("city_id")) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS districts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_id INTEGER NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE,
        FOREIGN KEY(city_id) REFERENCES cities(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_new_city_name_nocase
        ON districts_new(city_id, name COLLATE NOCASE);
    `);

    db.exec(`
      INSERT OR IGNORE INTO cities (name) VALUES ('София');
    `);
    const sofiaId = (
      db.prepare(`SELECT id FROM cities WHERE name = ?`).get("София") as
        | { id: number }
        | undefined
    )?.id;

    if (sofiaId) {
      db.prepare(
        `INSERT OR IGNORE INTO districts_new (city_id, name) SELECT ?, name FROM districts`,
      ).run(sofiaId);
    }

    db.exec(`
      DROP TABLE districts;
      ALTER TABLE districts_new RENAME TO districts;
      DROP INDEX IF EXISTS idx_districts_name_nocase;
    `);
  }

  const cityCount = db.prepare(`SELECT COUNT(*) as count FROM cities`).get() as {
    count: number;
  };
  if (cityCount.count === 0) {
    db.prepare(`INSERT INTO cities (name) VALUES (?)`).run("София");
  }

  db.exec(`
    INSERT OR IGNORE INTO years (year)
    SELECT DISTINCT substr(ordered_at, 1, 4)
    FROM orders
    WHERE ordered_at IS NOT NULL;
  `);

  db.exec(`
    INSERT OR IGNORE INTO years (year)
    SELECT DISTINCT substr(completed_at, 1, 4)
    FROM orders
    WHERE completed_at IS NOT NULL;
  `);
}

function getDb(): Database.Database {
  fs.mkdirSync(dataDir, { recursive: true });
  const globalForDb = globalThis as DbGlobal;

  if (!globalForDb.__ordersDb__) {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    globalForDb.__ordersDb__ = db;
  }

  if (!globalForDb.__ordersDbInitialized__) {
    initializeDb(globalForDb.__ordersDb__!);
    globalForDb.__ordersDbInitialized__ = true;
  }

  const db = globalForDb.__ordersDb__!;
  const hasCities = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='cities'`)
    .get() as { name?: string } | undefined;
  if (!hasCities) {
    initializeDb(db);
  }

  const hasYears = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='years'`)
    .get() as { name?: string } | undefined;
  if (!hasYears) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS years (
        year TEXT PRIMARY KEY
      );
    `);
    db.exec(`
      INSERT OR IGNORE INTO years (year)
      SELECT DISTINCT substr(ordered_at, 1, 4)
      FROM orders
      WHERE ordered_at IS NOT NULL;
    `);
    db.exec(`
      INSERT OR IGNORE INTO years (year)
      SELECT DISTINCT substr(completed_at, 1, 4)
      FROM orders
      WHERE completed_at IS NOT NULL;
    `);
  }

  const ordersColumns = db.prepare(`PRAGMA table_info(orders)`).all() as Array<{
    name: string;
  }>;
  const ordersColumnNames = new Set(ordersColumns.map((col) => col.name));
  if (!ordersColumnNames.has("city_id")) {
    db.exec(`ALTER TABLE orders ADD COLUMN city_id INTEGER;`);
  }
  if (!ordersColumnNames.has("district_id")) {
    db.exec(`ALTER TABLE orders ADD COLUMN district_id INTEGER;`);
  }
  if (!ordersColumnNames.has("updated_at")) {
    db.exec(
      `ALTER TABLE orders ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`,
    );
  }
  db.exec(`
    UPDATE orders
    SET updated_at = created_at
    WHERE updated_at IS NULL;
  `);

  return db;
}

export const db = getDb();
