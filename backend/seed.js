// 演示数据填充 (仅当库为空时执行)
const db = require('./db');

const hasData = db.prepare('SELECT COUNT(*) c FROM students').get().c;
if (hasData) {
  console.log('数据库已有数据, 跳过填充.');
  process.exit(0);
}

// 分组与寝室
const dormA = db.prepare('INSERT INTO dorms (name, building, note) VALUES (?,?,?)')
  .run('301', '1号楼', '男生寝室').lastInsertRowid;
const dormB = db.prepare('INSERT INTO dorms (name, building, note) VALUES (?,?,?)')
  .run('402', '2号楼', '女生寝室').lastInsertRowid;

const duty1 = db.prepare('INSERT INTO duty_groups (name, note) VALUES (?,?)')
  .run('值日一组', '周一三五').lastInsertRowid;
const duty2 = db.prepare('INSERT INTO duty_groups (name, note) VALUES (?,?)')
  .run('值日二组', '周二四六').lastInsertRowid;

const sg1 = db.prepare('INSERT INTO study_groups (name, note) VALUES (?,?)')
  .run('学习A组', '互助小组').lastInsertRowid;
const sg2 = db.prepare('INSERT INTO study_groups (name, note) VALUES (?,?)')
  .run('学习B组', '冲刺小组').lastInsertRowid;

const students = [
  ['张伟', '202401', '男', dormA, '1', duty1, sg1],
  ['李娜', '202402', '女', dormB, '1', duty1, sg1],
  ['王芳', '202403', '女', dormB, '2', duty2, sg2],
  ['刘洋', '202404', '男', dormA, '2', duty2, sg2],
  ['陈杰', '202405', '男', dormA, '3', duty1, sg1],
  ['杨梅', '202406', '女', dormB, '3', duty1, sg2],
  ['赵磊', '202407', '男', dormA, '4', duty2, sg2],
  ['孙丽', '202408', '女', dormB, '4', duty2, sg1],
];
const insStu = db.prepare(`
  INSERT INTO students (name, student_no, gender, dorm_id, bed_no, duty_group_id, study_group_id)
  VALUES (?,?,?,?,?,?,?)
`);
const studentIds = students.map(s => insStu.run(...s).lastInsertRowid);

// 组长
db.prepare('UPDATE duty_groups SET leader_id=? WHERE id=?').run(studentIds[0], duty1);
db.prepare('UPDATE duty_groups SET leader_id=? WHERE id=?').run(studentIds[3], duty2);
db.prepare('UPDATE study_groups SET leader_id=? WHERE id=?').run(studentIds[0], sg1);
db.prepare('UPDATE study_groups SET leader_id=? WHERE id=?').run(studentIds[3], sg2);

// 两次考试
const exam1 = db.prepare('INSERT INTO exams (name, exam_date, note) VALUES (?,?,?)')
  .run('2024期中考试', '2024-11-10', '统考').lastInsertRowid;
const exam2 = db.prepare('INSERT INTO exams (name, exam_date, note) VALUES (?,?,?)')
  .run('2024期末考试', '2025-01-15', '期末').lastInsertRowid;

const scores = {
  [exam1]: [85, 92, 78, 88, 76, 95, 82, 70],
  [exam2]: [90, 88, 84, 91, 80, 93, 86, 75],
};
const upsert = db.prepare(`
  INSERT INTO grades (exam_id, student_id, score) VALUES (?,?,?)
  ON CONFLICT(exam_id, student_id) DO UPDATE SET score=excluded.score
`);
const tx = db.transaction(() => {
  Object.entries(scores).forEach(([eid, arr]) => {
    arr.forEach((sc, i) => upsert.run(eid, studentIds[i], sc));
  });
});
tx();

// 荣誉/扣分
const addHonor = db.prepare(`
  INSERT INTO honor_records (scope, target_id, category, delta, reason, record_date) VALUES (?,?,?,?,?,?)
`);
// scope student
addHonor.run('student', studentIds[1], 'honor', 5, '课堂表现优秀', '2024-11-20');
addHonor.run('student', studentIds[1], 'hygiene', -2, '寝室卫生不合格', '2024-11-22');
addHonor.run('student', studentIds[3], 'discipline', -3, '迟到', '2024-11-25');
addHonor.run('student', studentIds[0], 'honor', 3, '主动帮助同学', '2024-12-01');
addHonor.run('student', studentIds[5], 'honor', 4, '竞赛获奖', '2024-12-10');
// 按寝室整体扣分(会应用到每个成员)
addHonor.run('dorm', dormA, 'hygiene', -2, '寝室大扫除未达标(整寝)', '2024-12-15');
// 按学习小组整体加分
addHonor.run('study_group', sg2, 'honor', 2, '小组合作优秀(整组)', '2024-12-20');

console.log('演示数据已填充: 8名学生, 2个寝室, 2个值日组, 2个学习组, 2次考试, 多条荣誉记录.');
