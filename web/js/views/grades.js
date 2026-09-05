// 模块二: 成绩管理
App.views.grades = async function (c) {
  App.state.gradeExam = App.state.gradeExam || null;
  const exams = await App.API.get('/grades/exams');
  App.state.exams = exams;
  const sel = App.state.gradeExam || (exams[0] && exams[0].id) || null;
  App.state.gradeExam = sel;
  c.innerHTML = `
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head">
        <h3>考试列表 (${exams.length})</h3>
        <button class="btn" onclick="App.examForm()">+ 添加考试</button>
      </div>
      <div class="panel-body" style="display:flex;gap:10px;flex-wrap:wrap">
        ${exams.length ? exams.map(e => `
          <span class="sub-tab ${e.id === sel ? 'active' : ''}" onclick="App.pickExam(${e.id})">
            ${App.esc(e.name)} ${e.exam_date ? `(${e.exam_date})` : ''} <span class="muted">${e.n || 0}人</span>
          </span>`).join('') : `<span class="muted">暂无考试, 点击右上角添加</span>`}
      </div>
    </div>
    <div id="exam-detail"><div class="empty">加载中...</div></div>`;
  if (sel) await renderExamDetail(sel);
  else document.getElementById('exam-detail').innerHTML = `<div class="empty">请先添加考试</div>`;
};

App.pickExam = function (id) { App.state.gradeExam = id; App.views.grades(document.getElementById('view')); };

async function renderExamDetail(id) {
  const body = document.getElementById('exam-detail');
  try {
    const { exam, grades, stat } = await App.API.get(`/grades/exams/${id}`);
    const students = await App.API.get('/students');
    // 把成绩按 student_id 索引
    const map = {}; grades.forEach(g => map[g.student_id] = g);
    body.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h3>${App.esc(exam.name)} ${exam.exam_date ? `· ${exam.exam_date}` : ''}</h3>
          <div class="row-actions">
            <button class="btn sm ghost" onclick="App.examForm(${exam.id})">编辑</button>
            <button class="btn sm danger" onclick="App.examDel(${exam.id})">删除考试</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="cards" style="margin-bottom:14px">
            <div class="stat-card"><div class="num">${stat.count}</div><div class="label">参考人数</div></div>
            <div class="stat-card"><div class="num">${stat.avg}</div><div class="label">平均分</div></div>
            <div class="stat-card"><div class="num" style="color:var(--green)">${stat.max}</div><div class="label">最高分</div></div>
            <div class="stat-card"><div class="num" style="color:var(--red)">${stat.min}</div><div class="label">最低分</div></div>
          </div>
          <div class="flex between mb12">
            <span class="muted">直接修改分数后点击「保存成绩」即可批量保存 (同分同名次)</span>
            <button class="btn" onclick="App.saveGrades(${exam.id})">💾 保存成绩</button>
          </div>
          <table>
            <thead><tr><th>排名</th><th>学号</th><th>姓名</th><th>分数</th></tr></thead>
            <tbody>
            ${students.map(s => {
      const g = map[s.id];
      const rank = g ? g.rank : '';
      return `<tr>
                <td>${rank ? `<span class="score-pill ${rank <= 3 ? 'rank-' + rank : ''}">${rank}</span>` : '-'}</td>
                <td>${App.esc(s.student_no)}</td>
                <td><strong>${App.esc(s.name)}</strong></td>
                <td><input type="number" step="0.5" class="grade-input" data-sid="${s.id}" value="${g ? g.score : ''}" style="width:90px;padding:6px 8px;border:1px solid var(--border);border-radius:8px"></td>
              </tr>`;
    }).join('')}
            </tbody></table>
        </div>
      </div>`;
  } catch (e) { body.innerHTML = `<div class="empty">${App.esc(e.message)}</div>`; }
}

App.examForm = async function (id) {
  const list = App.state.exams || await App.API.get('/grades/exams');
  const e = id ? list.find(x => x.id === id) || {} : {};
  await App.modal(id ? '编辑考试' : '添加考试', `
    <div class="form-grid">
      <div class="field"><label>考试名称 *</label><input id="e_name" value="${App.esc(e.name)}"></div>
      <div class="field"><label>考试日期</label><input id="e_date" type="date" value="${App.esc(e.exam_date)}"></div>
      <div class="field full"><label>备注</label><input id="e_note" value="${App.esc(e.note)}"></div>
    </div>`,
    `<button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.examSave(${id || 0})">保存</button>`);
};
App.examSave = async function (id) {
  const data = { name: document.getElementById('e_name').value, exam_date: document.getElementById('e_date').value, note: document.getElementById('e_note').value };
  if (!data.name) return App.toast('请填写考试名称', 'error');
  try { id ? await App.API.put(`/grades/exams/${id}`, data) : await App.API.post('/grades/exams', data); }
  catch (e) { return App.toast(e.message, 'error'); }
  App.closeModal(); App.toast('已保存'); await App.views.grades(document.getElementById('view'));
};
App.examDel = async function (id) {
  if (!confirm('删除考试将连同成绩一并删除, 确定?')) return;
  await App.API.del(`/grades/exams/${id}`); App.state.gradeExam = null; App.toast('已删除'); await App.views.grades(document.getElementById('view'));
};
App.saveGrades = async function (examId) {
  const inputs = document.querySelectorAll('.grade-input');
  const list = [];
  inputs.forEach(i => {
    const val = i.value.trim();
    if (val !== '') list.push({ student_id: +i.dataset.sid, score: +val });
  });
  if (!list.length) return App.toast('未填写任何分数', 'error');
  try {
    await App.API.post(`/grades/exams/${examId}/grades`, list);
    App.toast(`已保存 ${list.length} 条成绩`);
    await App.views.grades(document.getElementById('view'));
  } catch (e) { App.toast(e.message, 'error'); }
};
