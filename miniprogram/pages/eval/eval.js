const app = getApp();
Page({
  data: { rows: [], loading: true },
  onShow() { this.load(); },
  async load() {
    try {
      const rows = await app.api('/evaluation');
      this.setData({ rows, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message, icon: 'none' });
    }
  }
});
