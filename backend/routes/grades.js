// 模块二: 成绩管理
const express = require('express');
const router = express.Router();
const db = require('../db');

// ---- 考试 ----
router.get('/exams', (req, res) => {
  const exams = db.prepare('SELECT * FROM exams ORDER BY exam_date DESC, id DESC').all();
  const out = exams.map(e => {
    const stat = db.prepare(`
      SELECT COUNT(*) n, ROUND(AVG(score),2) avg, MAX(score) max, MIN(score) min
      FROM grades WHERE exam_id=?
    `).get(e.id);
    return { ...e, ...stat };
  });
  res.json(out);
});

router.post('/exams', (req, res) => {
  const b = req.body || {};
  const info = db.prepare('INSERT INTO exams (name, exam_date, note) VALUES (?,?,?)')
    .run(b.name, b.exam_date || null, b.note || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/exams/:id', (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE exams SET name=?, exam_date=?, note=? WHERE id=?')
    .run(b.name, b.exam_date || null, b.note || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/exams/:id', (req, res) => {
  db.prepare('DELETE FROM grades WHERE exam_id=?').run(req.params.id);
  db.prepare('DELETE FROM exams WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---- 单场考试明细 + 排名 ----
router.get('/exams/:id', (req, res) => {
  const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(req.params.id);
  if (!exam) return res.status(404).json({ error: '考试不存在' });
  const rows = db.prepare(`
    SELECT g.id, g.student_id, s.name student_name, s.student_no, g.score, g.note
    FROM grades g JOIN students s ON s.id=g.student_id
    WHERE g.exam_id=? ORDER BY g.score DESC, s.id
  `).all(req.params.id);
  // 计算排名(同分同名)
  let last = null, rank = 0, sameCount = 0;
  rows.forEach((r, i) => {
    if (last === null || r.score !== last) { rank = i + 1; sameCount = 1; }
    else { sameCount++; }
    r.rank = rank;
    last = r.score;
  });
  const stat = {
    count: rows.length,
    avg: rows.length ? +(rows.reduce((a, b) => a + b.score, 0) / rows.length).toFixed(2) : 0,
    max: rows.length ? Math.max(...rows.map(r => r.score)) : 0,
    min: rows.length ? Math.min(...rows.map(r => r.score)) : 0,
  };
  res.json({ exam, grades: rows, stat });
});

// ---- 录入/更新单条成绩 ----
router.post('/exams/:id/grades', (req, res) => {
  const examId = req.params.id;
  const list = Array.isArray(req.body) ? req.body : [req.body];
  const upsert = db.prepare(`
    INSERT INTO grades (exam_id, student_id, score, note) VALUES (?,?,?,?)
    ON CONFLICT(exam_id, student_id) DO UPDATE SET score=excluded.score, note=excluded.note
  `);
  const tx = db.transaction((items) => {
    for (const it of items) {
      upsert.run(examId, it.student_id, it.score, it.note || null);
    }
  });
  tx(list);
  res.json({ ok: true, count: list.length });
});

router.delete('/grades/:id', (req, res) => {
  db.prepare('DELETE FROM grades WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---- 学生历次成绩趋势 ----
router.get('/student/:id/trend', (req, res) => {
  const rows = db.prepare(`
    SELECT e.id exam_id, e.name exam_name, e.exam_date, g.score, g.rank
    FROM exams e JOIN grades g ON g.exam_id=e.id
    WHERE g.student_id=? ORDER BY e.exam_date, e.id
  `).all(req.params.id);
  res.json(rows);
});

module.exports = router;
