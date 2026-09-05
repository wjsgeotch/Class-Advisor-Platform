// 模块三: 班级荣誉 (纪律/卫生扣分, 加分)
// scope: student | dorm | study_group | duty_group
// 分组操作会把 delta 应用到该分组的每个成员
const express = require('express');
const router = express.Router();
const db = require('../db');

// 取某分组的学生 id 列表
function groupMemberIds(scope, targetId) {
  if (scope === 'dorm') return db.prepare('SELECT id FROM students WHERE dorm_id=?').all(targetId).map(r => r.id);
  if (scope === 'study_group') return db.prepare('SELECT id FROM students WHERE study_group_id=?').all(targetId).map(r => r.id);
  if (scope === 'duty_group') return db.prepare('SELECT id FROM students WHERE duty_group_id=?').all(targetId).map(r => r.id);
  return [targetId]; // student
}

// 列表(可按学生/类别筛选)
router.get('/', (req, res) => {
  const { student_id, scope, category } = req.query;
  let sql = `SELECT h.*, s.name student_name
             FROM honor_records h
             LEFT JOIN students s ON s.id = h.target_id AND h.scope='student'
             WHERE 1=1`;
  const params = [];
  if (student_id) { sql += ' AND (h.scope=\'student\' AND h.target_id=?)'; params.push(student_id); }
  if (scope) { sql += ' AND h.scope=?'; params.push(scope); }
  if (category) { sql += ' AND h.category=?'; params.push(category); }
  sql += ' ORDER BY h.record_date DESC, h.id DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

// 新增记录
router.post('/', (req, res) => {
  const b = req.body || {};
  const scope = b.scope;
  const targetId = Number(b.target_id);
  const category = b.category;
  const delta = Number(b.delta);
  const reason = b.reason || '';
  const record_date = b.record_date || new Date().toISOString().slice(0, 10);

  if (!['student', 'dorm', 'study_group', 'duty_group'].includes(scope))
    return res.status(400).json({ error: 'scope 非法' });
  if (Number.isNaN(delta)) return res.status(400).json({ error: 'delta 必须为数字' });

  const insert = db.prepare(`
    INSERT INTO honor_records (scope, target_id, category, delta, reason, record_date)
    VALUES (?,?,?,?,?,?)
  `);
  const ids = groupMemberIds(scope, targetId);
  const tx = db.transaction((list) => {
    // 分组场景: 原始记录保留 (scope=分组), 同时给每个成员存一条 student 维度副本, 便于汇总
    if (scope !== 'student') {
      insert.run(scope, targetId, category, delta, reason, record_date);
    }
    for (const sid of list) {
      insert.run('student', sid, category, delta, reason, record_date);
    }
  });
  tx(ids);
  res.json({ ok: true, applied_to: ids.length });
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM honor_records WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '记录不存在' });
  // 删除时连同当时分发的学生副本一并删除(同一 reason+date+category+delta)
  if (row.scope !== 'student') {
    db.prepare(`DELETE FROM honor_records
      WHERE scope='student' AND category=? AND delta=? AND reason=? AND record_date=?`)
      .run(row.category, row.delta, row.reason, row.record_date);
  }
  db.prepare('DELETE FROM honor_records WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// 学生荣誉分汇总
router.get('/student/:id/summary', (req, res) => {
  const rows = db.prepare(`
    SELECT category, SUM(delta) total FROM honor_records
    WHERE scope='student' AND target_id=? GROUP BY category
  `).all(req.params.id);
  res.json(rows);
});

module.exports = router;
