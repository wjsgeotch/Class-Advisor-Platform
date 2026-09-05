// 模块四: 综合评价 = 成绩(50%) + 班级荣誉(50%)
// 成绩分: 学生历次平均分 / 班级最高平均分 * 100
// 荣誉分: 学生荣誉净值 min-max 归一化到 0-100 (若全相同记 50)
// 总分 = 成绩分*0.5 + 荣誉分*0.5
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const students = db.prepare(`
    SELECT s.*, d.name dorm_name, sg.name study_group_name
    FROM students s
    LEFT JOIN dorms d ON d.id=s.dorm_id
    LEFT JOIN study_groups sg ON sg.id=s.study_group_id
    ORDER BY s.student_no * 1, s.id
  `).all();

  if (!students.length) return res.json([]);

  // 每个学生的成绩平均分
  const avgStmt = db.prepare(`SELECT AVG(score) avg FROM grades WHERE student_id=?`);
  // 每个学生的荣誉净值(按 student 维度汇总)
  const honorStmt = db.prepare(`SELECT COALESCE(SUM(delta),0) total FROM honor_records WHERE scope='student' AND target_id=?`);

  const rows = students.map(s => {
    const avgRow = avgStmt.get(s.id);
    const avg = avgRow && avgRow.avg != null ? +(+avgRow.avg).toFixed(2) : null;
    const honor = +(honorStmt.get(s.id).total).toFixed(2);
    return { ...s, avg_score: avg, honor_sum: honor };
  });

  const maxAvg = Math.max(...rows.map(r => r.avg_score == null ? -Infinity : r.avg_score), 0) || 1;
  const honors = rows.map(r => r.honor_sum);
  const minH = Math.min(...honors), maxH = Math.max(...honors);

  const out = rows.map(r => {
    const grade_score = r.avg_score == null ? 0
      : Math.min(100, +(r.avg_score / maxAvg * 100).toFixed(2));
    let honor_score;
    if (maxH === minH) honor_score = 50;
    else honor_score = +((r.honor_sum - minH) / (maxH - minH) * 100).toFixed(2);
    const total = +(grade_score * 0.5 + honor_score * 0.5).toFixed(2);
    return {
      id: r.id, name: r.name, student_no: r.student_no, dorm_name: r.dorm_name,
      study_group_name: r.study_group_name,
      avg_score: r.avg_score, honor_sum: r.honor_sum,
      grade_score, honor_score, total
    };
  }).sort((a, b) => b.total - a.total);

  // 排名
  let last = null, rank = 0;
  out.forEach((r, i) => {
    if (last === null || r.total !== last) { rank = i + 1; }
    r.rank = rank;
    last = r.total;
  });

  res.json(out);
});

module.exports = router;
