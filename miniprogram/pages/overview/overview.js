const app = getApp();
Page({
  data: { stats: null, loading: true },
  onShow() { this.load(); },
  async load() {
    try {
      const s = await app.api('/overview');
      this.setData({
        stats: [
          { ic: '👦', num: s.students, label: '学生人数' },
          { ic: '🛏️', num: s.dorms, label: '寝室数' },
          { ic: '🧹', num: s.duty_groups, label: '值日小组' },
          { ic: '📚', num: s.study_groups, label: '学习小组' },
          { ic: '📝', num: s.exams, label: '考试次数' },
          { ic: '🏆', num: s.honor_records, label: '荣誉记录' }
        ],
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  go(e) {
    const url = e.currentTarget.dataset.url;
    wx.switchTab({ url });
  }
});
