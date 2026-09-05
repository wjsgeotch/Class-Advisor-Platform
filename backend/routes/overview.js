// 概览/仪表盘
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const counts = {
    students: db.prepare('SELECT COUNT(*) c FROM students').get().c,
    dorms: db.prepare('SELECT COUNT(*) c FROM dorms').get().c,
    duty_groups: db.prepare('SELECT COUNT(*) c FROM duty_groups').get().c,
    study_groups: db.prepare('SELECT COUNT(*) c FROM study_groups').get().c,
    exams: db.prepare('SELECT COUNT(*) c FROM exams').get().c,
    honor_records: db.prepare('SELECT COUNT(*) c FROM honor_records').get().c,
  };
  res.json(counts);
});

module.exports = router;
