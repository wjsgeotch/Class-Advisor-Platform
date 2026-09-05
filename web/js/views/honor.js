// 模块三: 班级荣誉 (纪律/卫生/荣誉 加减分)
App.views.honor = async function (c) {
  const [students, dorms, duty, study] = await Promise.all([
    App.API.get('/students'), App.API.get('/dorms'), App.API.get('/duty-groups'), App.API.get('/study-groups')]);
  App.state.honorLook = { students, dorms, duty, study };

  const filter = App.state.honorFilter || (App.state.honorFilter = { category: '', scope: '' });
  let qs = '?';
  if (filter.category) qs += `category=${filter.category}&`;
  if (filter.scope) qs += `scope=${filter.scope}&`;
  const records = await App.API.get('/honor' + qs);
  App.state.honorRecords = records;

  const catName = { discipline: '纪律', hygiene: '卫生', honor: '荣誉' };
  const scopeName = { student: '学生', dorm: '寝室', study_group: '学习小组', duty_group: '值日小组' };

  c.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>荣誉加减分记录 (${records.length})</h3>
        <button class="btn" onclick="App.honorForm()">+ 新增记录</button>
      </div>
      <div class="panel-body">
        <div class="flex gap8 mb12" style="flex-wrap:wrap">
          <select id="flt_category" onchange="App.honorFilterChange('category', this.value)" style="padding:7px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px">
            <option value="">全部类别</option>
            ${Object.entries(catName).map(([k, v]) => `<option value="${k}" ${filter.category === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
          <select id="flt_scope" onchange="App.honorFilterChange('scope', this.value)" style="padding:7px 12px;border:1px solid var(--border);border-radius:20px;font-size:13px">
            <option value="">全部对象</option>
            ${Object.entries(scopeName).map(([k, v]) => `<option value="${k}" ${filter.scope === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <table>
          <thead><tr><th>日期</th><th>对象</th><th>类别</th><th>分值</th><th>原因</th><th>操作</th></tr></thead>
          <tbody>
          ${records.length ? records.map(r => `<tr>
            <td>${App.esc(r.record_date)}</td>
            <td>${r.scope === 'student' ? App.esc(r.student_name) : App.tag(scopeName[r.scope] + '整组', 'amber')}</td>
            <td>${App.tag(catName[r.category], r.category === 'honor' ? 'green' : 'red')}</td>
            <td>${r.delta > 0 ? `<span class="score-pill" style="background:#e8f6ee;color:var(--green)">+${r.delta}</span>` : `<span class="score-pill" style="background:#fdeaea;color:var(--red)">${r.delta}</span>`}</td>
            <td>${App.esc(r.reason) || '-'}</td>
            <td><button class="btn sm danger" onclick="App.honorDel(${r.id})">删</button></td>
          </tr>`).join('') : `<tr><td colspan=6 class="empty">暂无记录</td></tr>`}
          </tbody></table>
      </div>
    </div>`;
};

App.honorFilterChange = function (k, v) {
  App.state.honorFilter[k] = v;
  App.views.honor(document.getElementById('view'));
};

App.honorForm = async function () {
  const { students, dorms, duty, study } = App.state.honorLook;
  const today = new Date().toISOString().slice(0, 10);
  await App.modal('新增荣誉/扣分记录', `
    <div class="form-grid">
      <div class="field"><label>对象类型 *</label>
        <select id="h_scope" onchange="App.honorScopeChange()">
          <option value="student">单个学生</option>
          <option value="dorm">整个寝室</option>
          <option value="study_group">整个学习小组</option>
          <option value="duty_group">整个值日小组</option>
        </select></div>
      <div class="field"><label>对象 *</label><select id="h_target"></select></div>
      <div class="field"><label>类别 *</label>
        <select id="h_category">
          <option value="honor">荣誉加分</option>
          <option value="discipline">纪律</option>
          <option value="hygiene">卫生</option>
        </select></div>
      <div class="field"><label>分值 (正数加分, 负数扣分) *</label><input id="h_delta" type="number" step="0.5" value="1"></div>
      <div class="field"><label>日期</label><input id="h_date" type="date" value="${today}"></div>
      <div class="field"><label>原因</label><input id="h_reason" placeholder="如: 寝室卫生不合格"></div>
    </div>`,
    `<button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.honorSave()">保存</button>`);
  App.honorScopeChange();
};

App.honorScopeChange = function () {
  const scope = document.getElementById('h_scope').value;
  const look = App.state.honorLook;
  let arr = [];
  if (scope === 'student') arr = look.students.map(s => ({ id: s.id, label: `${s.name} (${s.student_no || '-'})` }));
  if (scope === 'dorm') arr = look.dorms.map(d => ({ id: d.id, label: `寝室 ${d.name}` }));
  if (scope === 'study_group') arr = look.study.map(g => ({ id: g.id, label: g.name }));
  if (scope === 'duty_group') arr = look.duty.map(g => ({ id: g.id, label: g.name }));
  document.getElementById('h_target').innerHTML = arr.map(o => `<option value="${o.id}">${App.esc(o.label)}</option>`).join('');
};

App.honorSave = async function () {
  const data = {
    scope: document.getElementById('h_scope').value,
    target_id: +document.getElementById('h_target').value,
    category: document.getElementById('h_category').value,
    delta: +document.getElementById('h_delta').value,
    record_date: document.getElementById('h_date').value,
    reason: document.getElementById('h_reason').value,
  };
  if (!data.target_id) return App.toast('请选择对象', 'error');
  if (Number.isNaN(data.delta)) return App.toast('分值必须为数字', 'error');
  try {
    const r = await App.API.post('/honor', data);
    App.closeModal(); App.toast(`已记录, 影响 ${r.applied_to} 人`); await App.views.honor(document.getElementById('view'));
  } catch (e) { App.toast(e.message, 'error'); }
};
App.honorDel = async function (id) {
  if (!confirm('删除该记录? (分组记录会同时撤销分发到成员的部分)')) return;
  await App.API.del(`/honor/${id}`); App.toast('已删除'); await App.views.honor(document.getElementById('view'));
};
