// 数据库初始化与 Schema
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

// 自动开启外键
db.pragma('foreign_keys = ON');

// ============ 建表 ============
db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  student_no TEXT,
  gender TEXT DEFAULT '男',
  phone TEXT,
  dorm_id INTEGER,
  bed_no TEXT,
  duty_group_id INTEGER,
  study_group_id INTEGER,
  role TEXT DEFAULT '学生',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS dorms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  building TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS duty_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  leader_id INTEGER,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS study_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  leader_id INTEGER,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  exam_date TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score REAL NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS honor_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,             -- student | dorm | study_group | duty_group
  target_id INTEGER NOT NULL,      -- 对应学生id 或 分组id
  category TEXT NOT NULL,          -- discipline(纪律) | hygiene(卫生) | honor(荣誉加分)
  delta REAL NOT NULL,             -- 正数加分, 负数扣分
  reason TEXT,
  record_date TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

module.exports = db;
