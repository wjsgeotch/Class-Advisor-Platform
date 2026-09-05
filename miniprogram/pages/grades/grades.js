const app = getApp();
Page({
  data: {
    exams: [], examIdx: 0,
    detail: null, students: [], scoreMap: {}
  },
  onShow() { this.load(); },
  async load() {
    try {
      const exams = await app.api('/grades/exams');
      const students = await app.api('/students');
      this.setData({ exams, students, examIdx: 0 });
      if (exams.length) await this.loadDetail(exams[0].id);
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  async onExamChange(e) {
    this.setData({ examIdx: e.detail.value });
    const exam = this.data.exams[e.detail.value];
    if (exam) await this.loadDetail(exam.id);
  },
  async loadDetail(examId) {
    try {
      const detail = await app.api('/grades/exams/' + examId);
      const map = {};
      detail.grades.forEach(g => { map[g.student_id] = g.score; });
      this.setData({ detail, scoreMap: map });
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  onScore(e) {
    const sid = e.currentTarget.dataset.sid;
    const map = this.data.scoreMap;
    map[sid] = e.detail.value;
    this.setData({ scoreMap: map });
  },
  async saveGrades() {
    const exam = this.data.exams[this.data.examIdx];
    if (!exam) return;
    const list = [];
    Object.keys(this.data.scoreMap).forEach(sid => {
      const v = this.data.scoreMap[sid];
      if (v !== '' && v != null) list.push({ student_id: +sid, score: +v });
    });
    if (!list.length) return wx.showToast({ title: '未填写分数', icon: 'none' });
    try {
      await app.api('/grades/exams/' + exam.id + '/grades', 'POST', list);
      wx.showToast({ title: '已保存' });
      await this.loadDetail(exam.id);
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  async addExam() {
    const res = await new Promise(r => wx.showModal({
      title: '新增考试', editable: true, placeholderText: '考试名称', success: r
    }));
    if (!res.confirm || !res.content) return;
    const d = new Date();
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    await app.api('/grades/exams', 'POST', { name: res.content, exam_date: date });
    wx.showToast({ title: '已添加' }); this.load();
  },
  async delExam() {
    const exam = this.data.exams[this.data.examIdx];
    if (!exam) return;
    const ok = await new Promise(r => wx.showModal({ title: '删除该考试?', success: r }));
    if (!ok.confirm) return;
    await app.api('/grades/exams/' + exam.id, 'DELETE');
    wx.showToast({ title: '已删除' }); this.load();
  },
  gradeOf(sid) { return this.data.scoreMap[sid]; }
});
function pad(n) { return n < 10 ? '0' + n : '' + n; }
