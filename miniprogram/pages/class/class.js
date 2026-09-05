const app = getApp();
const GENDERS = ['男', '女'];
const CAT_LABELS = { discipline: '纪律', hygiene: '卫生', honor: '荣誉' };

Page({
  data: {
    tab: 'students',
    students: [], dorms: [], duty: [], study: [],
    showForm: false,
    form: emptyForm()
  },
  onShow() { this.load(); },
  async load() {
    try {
      const [students, dorms, duty, study] = await Promise.all([
        app.api('/students'), app.api('/dorms'),
        app.api('/duty-groups'), app.api('/study-groups')
      ]);
      this.setData({ students, dorms, duty, study });
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  switchTab(e) { this.setData({ tab: e.currentTarget.dataset.t, showForm: false }); },
  toggleForm() { this.setData({ showForm: !this.data.showForm, form: emptyForm() }); },

  // 文本输入
  onInput(e) {
    const f = this.data.form;
    f[e.currentTarget.dataset.k] = e.detail.value;
    this.setData({ form: f });
  },
  // 性别 picker -> 存文字
  onGender(e) {
    const f = this.data.form; f.gender = GENDERS[e.detail.value];
    this.setData({ form: f });
  },
  // 寝室/小组 picker -> 存数组下标
  onPick(e) {
    const f = this.data.form;
    f[e.currentTarget.dataset.k] = e.detail.value;
    this.setData({ form: f });
  },
  async saveStudent() {
    const f = this.data.form;
    if (!f.name) return wx.showToast({ title: '请填写姓名', icon: 'none' });
    const d = this.data;
    const body = {
      name: f.name, student_no: f.student_no, gender: f.gender,
      dorm_id: f.dorm_idx !== '' && f.dorm_idx != null ? d.dorms[f.dorm_idx].id : null,
      bed_no: f.bed_no,
      duty_group_id: f.duty_idx !== '' && f.duty_idx != null ? d.duty[f.duty_idx].id : null,
      study_group_id: f.study_idx !== '' && f.study_idx != null ? d.study[f.study_idx].id : null,
      role: f.role || '学生', note: f.note
    };
    try {
      await app.api('/students', 'POST', body);
      wx.showToast({ title: '已添加' });
      this.setData({ showForm: false, form: emptyForm() });
      this.load();
    } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); }
  },
  async delStudent(e) {
    const id = e.currentTarget.dataset.id;
    const ok = await confirm('删除学生?');
    if (!ok) return;
    await app.api('/students/' + id, 'DELETE');
    wx.showToast({ title: '已删除' }); this.load();
  },
  async addGroup(e) {
    const type = e.currentTarget.dataset.type;
    const path = type === 'dorm' ? '/dorms' : (type === 'duty' ? '/duty-groups' : '/study-groups');
    const res = await new Promise(r => wx.showModal({
      title: '新增', editable: true, placeholderText: '名称', success: res => r(res)
    }));
    if (!res.confirm || !res.content) return;
    await app.api(path, 'POST', { name: res.content });
    wx.showToast({ title: '已添加' }); this.load();
  },
  async delGroup(e) {
    const { type, id } = e.currentTarget.dataset;
    const path = type === 'dorm' ? '/dorms' : (type === 'duty' ? '/duty-groups' : '/study-groups');
    if (!await confirm('删除?')) return;
    await app.api(`${path}/${id}`, 'DELETE');
    wx.showToast({ title: '已删除' }); this.load();
  }
});

function emptyForm() {
  return { name: '', student_no: '', gender: '男', dorm_idx: '', bed_no: '', duty_idx: '', study_idx: '', role: '学生', note: '' };
}
function confirm(title) {
  return new Promise(r => wx.showModal({ title, success: res => r(res.confirm) }));
}
