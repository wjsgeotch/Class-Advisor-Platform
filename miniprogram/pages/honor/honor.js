const app = getApp();
const SCOPES = [
  { key: 'student', label: '单个学生' },
  { key: 'dorm', label: '整个寝室' },
  { key: 'study_group', label: '整个学习小组' },
  { key: 'duty_group', label: '整个值日小组' }
];
const CATS = [
  { key: 'honor', label: '荣誉加分' },
  { key: 'discipline', label: '纪律' },
  { key: 'hygiene', label: '卫生' }
];
const CAT_LABELS = { discipline: '纪律', hygiene: '卫生', honor: '荣誉' };
const SCOPE_LABELS = { student: '学生', dorm: '寝室整组', study_group: '学习小组整组', duty_group: '值日小组整组' };

Page({
  data: {
    records: [], students: [], dorms: [], duty: [], study: [],
    scopes: SCOPES, cats: CATS, catLabel: CAT_LABELS, scopeNames: SCOPE_LABELS,
    scopeIdx: 0, catIdx: 0, targetIdx: 0,
    targets: [], targetLabel: '',
    scopeLabel: SCOPES[0].label,
    delta: '1', reason: '', date: today()
  },
  onShow() { this.refresh(); },
  async refresh() {
    try {
      const [records, students, dorms, duty, study] = await Promise.all([
        app.api('/honor'), app.api('/students'), app.api('/dorms'),
        app.api('/duty-groups'), app.api('/study-groups')
      ]);
      this.setData({ records: records.slice(0, 200), students, dorms, duty, study });
      this.rebuildTargets();
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  rebuildTargets() {
    const scope = SCOPES[this.data.scopeIdx].key;
    const map = {
      student: this.data.students.map(s => ({ id: s.id, label: `${s.name}(${s.student_no || '-'})` })),
      dorm: this.data.dorms.map(d => ({ id: d.id, label: `寝室${d.name}` })),
      study_group: this.data.study.map(g => ({ id: g.id, label: g.name })),
      duty_group: this.data.duty.map(g => ({ id: g.id, label: g.name }))
    };
    const targets = map[scope] || [];
    this.setData({ targets, targetIdx: 0, targetLabel: targets[0] ? targets[0].label : '无' });
  },
  onScope(e) {
    const idx = e.detail.value;
    this.setData({ scopeIdx: idx, scopeLabel: SCOPES[idx].label }, () => this.rebuildTargets());
  },
  onCat(e) { this.setData({ catIdx: e.detail.value }); },
  onTarget(e) {
    const idx = e.detail.value;
    this.setData({ targetIdx: idx, targetLabel: this.data.targets[idx].label });
  },
  onInput(e) { this.setData({ [e.currentTarget.dataset.k]: e.detail.value }); },
  onDate(e) { this.setData({ date: e.detail.value }); },
  async save() {
    const scope = SCOPES[this.data.scopeIdx].key;
    const t = this.data.targets[this.data.targetIdx];
    if (!t) return wx.showToast({ title: '请选择对象', icon: 'none' });
    const body = {
      scope, target_id: t.id,
      category: CATS[this.data.catIdx].key,
      delta: +this.data.delta,
      reason: this.data.reason,
      record_date: this.data.date
    };
    if (isNaN(body.delta)) return wx.showToast({ title: '分值非法', icon: 'none' });
    try {
      const r = await app.api('/honor', 'POST', body);
      wx.showToast({ title: `已记录 ${r.applied_to}人` });
      this.setData({ delta: '1', reason: '' });
      this.refresh();
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  async del(e) {
    const id = e.currentTarget.dataset.id;
    const ok = await new Promise(r => wx.showModal({ title: '删除?', success: r }));
    if (!ok.confirm) return;
    await app.api('/honor/' + id, 'DELETE');
    wx.showToast({ title: '已删除' }); this.refresh();
  }
});

function today() {
  const d = new Date();
  const p = n => n < 10 ? '0' + n : '' + n;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
