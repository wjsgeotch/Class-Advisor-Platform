// 模块一: 班级班情 (学生 / 寝室 / 值日小组 / 学习小组)
const express = require('express');
const router = express.Router();
const db = require('../db');

// ---------- 学生 ----------
router.get('/students', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, d.name dorm_name, dg.name duty_group_name, sg.name study_group_name
    FROM students s
    LEFT JOIN dorms d ON d.id = s.dorm_id
    LEFT JOIN duty_groups dg ON dg.id = s.duty_group_id
    LEFT JOIN study_groups sg ON sg.id = s.study_group_id
    ORDER BY s.student_no * 1, s.id
  `).all();
  res.json(rows);
});

router.post('/students', (req, res) => {
  const b = req.body || {};
  const info = db.prepare(`
    INSERT INTO students (name, student_no, gender, phone, dorm_id, bed_no, duty_group_id, study_group_id, role, note)
    VALUES (@name,@student_no,@gender,@phone,@dorm_id,@bed_no,@duty_group_id,@study_group_id,@role,@note)
  `).run({
    name: b.name, student_no: b.student_no || null, gender: b.gender || '男',
    phone: b.phone || null, dorm_id: b.dorm_id || null, bed_no: b.bed_no || null,
    duty_group_id: b.duty_group_id || null, study_group_id: b.study_group_id || null,
    role: b.role || '学生', note: b.note || null,
  });
  res.json({ id: info.lastInsertRowid });
});

router.put('/students/:id', (req, res) => {
  const b = req.body || {};
  db.prepare(`
    UPDATE students SET name=@name, student_no=@student_no, gender=@gender, phone=@phone,
      dorm_id=@dorm_id, bed_no=@bed_no, duty_group_id=@duty_group_id, study_group_id=@study_group_id,
      role=@role, note=@note WHERE id=@id
  `).run({
    id: req.params.id, name: b.name, student_no: b.student_no || null, gender: b.gender || '男',
    phone: b.phone || null, dorm_id: b.dorm_id || null, bed_no: b.bed_no || null,
    duty_group_id: b.duty_group_id || null, study_group_id: b.study_group_id || null,
    role: b.role || '学生', note: b.note || null,
  });
  res.json({ ok: true });
});

router.delete('/students/:id', (req, res) => {
  db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- 寝室 ----------
router.get('/dorms', (req, res) => {
  const dorms = db.prepare('SELECT * FROM dorms ORDER BY name').all();
  const members = db.prepare(`
    SELECT id, name, student_no, bed_no, gender FROM students WHERE dorm_id=? ORDER BY bed_no * 1, id
  `);
  const out = dorms.map(d => ({ ...d, members: members.all(d.id) }));
  res.json(out);
});

router.post('/dorms', (req, res) => {
  const b = req.body || {};
  const info = db.prepare('INSERT INTO dorms (name, building, note) VALUES (?,?,?)')
    .run(b.name, b.building || null, b.note || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/dorms/:id', (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE dorms SET name=?, building=?, note=? WHERE id=?')
    .run(b.name, b.building || null, b.note || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/dorms/:id', (req, res) => {
  db.prepare('UPDATE students SET dorm_id=NULL, bed_no=NULL WHERE dorm_id=?').run(req.params.id);
  db.prepare('DELETE FROM dorms WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- 值日小组 ----------
router.get('/duty-groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM duty_groups ORDER BY name').all();
  const members = db.prepare('SELECT id, name, student_no, role FROM students WHERE duty_group_id=? ORDER BY id');
  const out = groups.map(g => ({ ...g, members: members.all(g.id) }));
  res.json(out);
});

router.post('/duty-groups', (req, res) => {
  const b = req.body || {};
  const info = db.prepare('INSERT INTO duty_groups (name, leader_id, note) VALUES (?,?,?)')
    .run(b.name, b.leader_id || null, b.note || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/duty-groups/:id', (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE duty_groups SET name=?, leader_id=?, note=? WHERE id=?')
    .run(b.name, b.leader_id || null, b.note || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/duty-groups/:id', (req, res) => {
  db.prepare('UPDATE students SET duty_group_id=NULL WHERE duty_group_id=?').run(req.params.id);
  db.prepare('DELETE FROM duty_groups WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- 学习小组 ----------
router.get('/study-groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM study_groups ORDER BY name').all();
  const members = db.prepare('SELECT id, name, student_no, role FROM students WHERE study_group_id=? ORDER BY id');
  const out = groups.map(g => ({ ...g, members: members.all(g.id) }));
  res.json(out);
});

router.post('/study-groups', (req, res) => {
  const b = req.body || {};
  const info = db.prepare('INSERT INTO study_groups (name, leader_id, note) VALUES (?,?,?)')
    .run(b.name, b.leader_id || null, b.note || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/study-groups/:id', (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE study_groups SET name=?, leader_id=?, note=? WHERE id=?')
    .run(b.name, b.leader_id || null, b.note || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/study-groups/:id', (req, res) => {
  db.prepare('UPDATE students SET study_group_id=NULL WHERE study_group_id=?').run(req.params.id);
  db.prepare('DELETE FROM study_groups WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
