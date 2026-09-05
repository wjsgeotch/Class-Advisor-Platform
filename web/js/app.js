// 路由与启动
const TITLES = { overview: '概览', class: '班级班情', grades: '成绩管理', honor: '班级荣誉', eval: '综合评价' };

const App = window.App;
App.render = async function () {
  const hash = (location.hash || '#overview').slice(1);
  const view = App.views[hash] ? hash : 'overview';
  document.querySelectorAll('.nav-link').forEach(a =>
    a.classList.toggle('active', a.dataset.view === view));
  document.getElementById('page-title').textContent = TITLES[view];
  const c = document.getElementById('view');
  c.innerHTML = `<div class="empty">加载中...</div>`;
  try {
    await App.views[view](c);
    document.getElementById('conn-badge').textContent = '已连接';
    document.getElementById('conn-badge').style.background = '#e8f6ee';
    document.getElementById('conn-badge').style.color = '#21a366';
  } catch (e) {
    c.innerHTML = `<div class="empty">加载失败: ${App.esc(e.message)}</div>`;
    document.getElementById('conn-badge').textContent = '连接失败';
    document.getElementById('conn-badge').style.background = '#fdeaea';
    document.getElementById('conn-badge').style.color = '#e23b3b';
  }
};

window.addEventListener('hashchange', () => App.render());
window.addEventListener('DOMContentLoaded', () => App.render());
