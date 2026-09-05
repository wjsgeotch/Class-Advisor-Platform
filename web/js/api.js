// 网站前端共享 API 封装 (与小程序共用同一套后端)
const API = {
  base: '/api',
  async req(path, opts = {}) {
    const res = await fetch(this.base + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || '请求失败 ' + res.status);
    }
    return res.json();
  },
  get(p) { return this.req(p); },
  post(p, body) { return this.req(p, { method: 'POST', body }); },
  put(p, body) { return this.req(p, { method: 'PUT', body }); },
  del(p) { return this.req(p, { method: 'DELETE' }); },
};

// 全局命名空间
window.App = {
  API,
  views: {},
  state: {},
  async modal(title, bodyHtml, footHtml = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml
      + (footHtml ? `<div class="modal-foot">${footHtml}</div>` : '');
    document.getElementById('modal-mask').hidden = false;
  },
  closeModal() { document.getElementById('modal-mask').hidden = true; },
  // 简易提示
  toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);
      background:${type === 'error' ? '#e23b3b' : '#21a366'};color:#fff;padding:10px 18px;
      border-radius:8px;z-index:99;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.2);`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  },
  // 小辅助
  esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  tag(text, cls) { return `<span class="tag ${cls}">${this.esc(text)}</span>`; },
};
