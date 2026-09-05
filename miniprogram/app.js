// 班主任工作平台 - 微信小程序
// ====================================================
// ⚠️ 重要: 后端地址配置
// 小程序运行在手机上, 无法访问 localhost。
// 请把 baseUrl 改成你的后端可访问地址:
//   - 局域网测试:  http://<你的电脑IP>:3000/api
//   - 公网部署:    https://<你的域名>/api  (生产需 HTTPS + 配置合法域名)
// 开发期可勾选「微信开发者工具 → 详情 → 本地设置 → 不校验合法域名」直接用 HTTP。
// ====================================================
App({
  globalData: {
    baseUrl: 'http://localhost:3000/api',  // ← 改成你的后端地址
    userInfo: null
  },
  onLaunch() {
    // 启动自检
    this.api('/health').then(r => {
      console.log('后端连接成功', r);
    }).catch(e => {
      console.warn('后端连接失败, 请检查 baseUrl', e);
    });
  },
  // 统一请求封装
  api(path, method = 'GET', data) {
    const base = this.globalData.baseUrl;
    return new Promise((resolve, reject) => {
      wx.request({
        url: base + path,
        method,
        data,
        header: { 'Content-Type': 'application/json' },
        success: res => {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
          else reject(new Error((res.data && res.data.error) || ('请求失败 ' + res.statusCode)));
        },
        fail: reject
      });
    });
  }
});
