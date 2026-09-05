// 模块一: 班级班情
App.views.class = async function (c) {
  App.state.classTab = App.state.classTab || 'students';
  const tab = App.state.classTab;
  c.innerHTML = `
    <div class="sub-tabs">
      <span class="sub-tab ${tab === 'students' ? 'active' : ''}" onclick="App.views.class_switch('students')">学生信息</span>
      <span class="sub-tab ${tab === 'dorms' ? 'active' : ''}" onclick="App.views.class_switch('dorms')">寝室信息</span>
      <span class="sub-tab ${tab === 'duty' ? 'active' : ''}" onclick="App.views.class_switch('duty')">值日小组</span>
      <span class="sub-tab ${tab === 'study' ? 'active' : ''}" onclick="App.views.class_switch('study')">学习小组</span>
    </div>
    <div id="class-body"><div class="empty">加载中...</div></div>`;
  try {
    App.state.classLook = await (async () => {
      const [dorms, duty, study] = await Promise.all([
        App.API.get('/dorms'), App.API.get('/duty-groups'), App.API.get('/study-groups')]);
      return { dorms, duty, study };
    })();
    await renderTab();
  } catch (e) { document.getElementById('class-body').innerHTML = `<div class="empty">加载失败: ${App.esc(e.message)}</div>`; }
};

App.views.class_switch = function (t) { App.state.classTab = t; App.views.class(document.getElementById('view')); };

async function renderTab() {
  const tab = App.state.classTab;
  const body = document.getElementById('class-body');
  const look = App.state.classLook;
  if (tab === 'students') return renderStudents(body, look);
  if (tab === 'dorms') return renderDorms(body, look);
  if (tab === 'duty') return renderDutyGroups(body, look);
  if (tab === 'study') return renderStudyGroups(body, look);
}

// ---- 学生 ----
async function renderStudents(body, look) {
  const list = await App.API.get('/students');
  body.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>学生名单 (${list.length} 人)</h3>
        <button class="btn" onclick="App.studentForm()">+ 添加学生</button>
      </div>
      <table>
        <thead><tr><th>学号</th><th>姓名</th><th>性别</th><th>寝室</th><th>床号</th><th>值日组</th><th>学习组</th><th>职务</th><th>操作</th></tr></thead>
        <tbody>
        ${list.map(s => `<tr>
          <td>${App.esc(s.student_no)}</td>
          <td><strong>${App.esc(s.name)}</strong></td>
          <td>${s.gender}</td>
          <td>${App.esc(s.dorm_name) || '-'}</td>
          <td>${App.esc(s.bed_no) || '-'}</td>
          <td>${App.esc(s.duty_group_name) || '-'}</td>
          <td>${App.esc(s.study_group_name) || '-'}</td>
          <td>${App.tag(s.role, 'blue')}</td>
          <td class="row-actions">
            <button class="btn sm ghost" onclick="App.studentForm(${s.id})">编辑</button>
            <button class="btn sm danger" onclick="App.studentDel(${s.id})">删</button>
          </td>
        </tr>`).join('')}
        </tbody></table>
    </div>`;
}

App.studentForm = async function (id) {
  const look = App.state.classLook;
  let s = { name: '', student_no: '', gender: '男', phone: '', dorm_id: '', bed_no: '', duty_group_id: '', study_group_id: '', role: '学生', note: '' };
  if (id) {
    const list = await App.API.get('/students');
    s = list.find(x => x.id === id) || s;
  }
  const opt = (arr, sel) => `<option value="">未分配</option>` + arr.map(o => `<option value="${o.id}" ${o.id == sel ? 'selected' : ''}>${App.esc(o.name)}</option>`).join('');
  await App.modal(id ? '编辑学生' : '添加学生', `
    <div class="form-grid">
      <div class="field"><label>姓名 *</label><input id="f_name" value="${App.esc(s.name)}"></div>
      <div class="field"><label>学号</label><input id="f_student_no" value="${App.esc(s.student_no)}"></div>
      <div class="field"><label>性别</label><select id="f_gender"><option ${s.gender === '男' ? 'selected' : ''}>男</option><option ${s.gender === '女' ? 'selected' : ''}>女</option></select></div>
      <div class="field"><label>电话</label><input id="f_phone" value="${App.esc(s.phone)}"></div>
      <div class="field"><label>寝室</label><select id="f_dorm_id">${opt(look.dorms, s.dorm_id)}</select></div>
      <div class="field"><label>床号</label><input id="f_bed_no" value="${App.esc(s.bed_no)}"></div>
      <div class="field"><label>值日小组</label><select id="f_duty_group_id">${opt(look.duty, s.duty_group_id)}</select></div>
      <div class="field"><label>学习小组</label><select id="f_study_group_id">${opt(look.study, s.study_group_id)}</select></div>
      <div class="field"><label>职务</label><input id="f_role" value="${App.esc(s.role)}"></div>
      <div class="field full"><label>备注</label><input id="f_note" value="${App.esc(s.note)}"></div>
    </div>`,
    `<button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.studentSave(${id || 0})">保存</button>`);
};
App.studentSave = async function (id) {
  const v = id => document.getElementById(id).value;
  const data = {
    name: v('f_name'), student_no: v('f_student_no'), gender: v('f_gender'),
    phone: v('f_phone'), dorm_id: +v('f_dorm_id') || null, bed_no: v('f_bed_no'),
    duty_group_id: +v('f_duty_group_id') || null, study_group_id: +v('f_study_group_id') || null,
    role: v('f_role'), note: v('f_note'),
  };
  if (!data.name) return App.toast('请填写姓名', 'error');
  try { id ? await App.API.put(`/students/${id}`, data) : await App.API.post('/students', data); }
  catch (e) { return App.toast(e.message, 'error'); }
  App.closeModal(); App.toast('已保存'); await App.views.class(document.getElementById('view'));
};
App.studentDel = async function (id) {
  if (!confirm('确定删除该学生?')) return;
  await App.API.del(`/students/${id}`); App.toast('已删除'); await App.views.class(document.getElementById('view'));
};

// ---- 寝室 ----
async function renderDorms(body, look) {
  body.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>寝室 (${look.dorms.length} 间)</h3>
        <button class="btn" onclick="App.dormForm()">+ 添加寝室</button>
      </div>
      <div class="panel-body">
        ${look.dorms.map(d => `
          <div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px">
            <div class="between flex" style="margin-bottom:8px">
              <div><strong>寝室 ${App.esc(d.name)}</strong> ${d.building ? App.esc('· ' + d.building) : ''} ${d.note ? `<span class="muted">${App.esc(d.note)}</span>` : ''}</div>
              <div class="row-actions">
                <button class="btn sm ghost" onclick="App.dormForm(${d.id})">编辑</button>
                <button class="btn sm danger" onclick="App.dormDel(${d.id})">删</button>
              </div>
            </div>
            <table><thead><tr><th>床号</th><th>姓名</th><th>学号</th><th>性别</th></tr></thead>
            <tbody>${d.members.length ? d.members.map(m => `<tr><td>${App.esc(m.bed_no) || '-'}</td><td>${App.esc(m.name)}</td><td>${App.esc(m.student_no)}</td><td>${m.gender}</td></tr>`).join('') : `<tr><td colspan=4 class="muted">暂无成员</td></tr>`}</tbody></table>
          </div>`).join('')}
      </div>
    </div>`;
}
App.dormForm = async function (id) {
  const list = await App.API.get('/dorms');
  const d = id ? list.find(x => x.id === id) || {} : {};
  await App.modal(id ? '编辑寝室' : '添加寝室', `
    <div class="form-grid">
      <div class="field"><label>寝室号 *</label><input id="d_name" value="${App.esc(d.name)}"></div>
      <div class="field"><label>楼栋</label><input id="d_building" value="${App.esc(d.building)}"></div>
      <div class="field full"><label>备注</label><input id="d_note" value="${App.esc(d.note)}"></div>
    </div>`,
    `<button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.dormSave(${id || 0})">保存</button>`);
};
App.dormSave = async function (id) {
  const data = { name: document.getElementById('d_name').value, building: document.getElementById('d_building').value, note: document.getElementById('d_note').value };
  if (!data.name) return App.toast('请填写寝室号', 'error');
  try { id ? await App.API.put(`/dorms/${id}`, data) : await App.API.post('/dorms', data); } catch (e) { return App.toast(e.message, 'error'); }
  App.closeModal(); App.toast('已保存'); await App.views.class(document.getElementById('view'));
};
App.dormDel = async function (id) {
  if (!confirm('删除寝室? (成员将解除绑定)')) return;
  await App.API.del(`/dorms/${id}`); App.toast('已删除'); await App.views.class(document.getElementById('view'));
};

// ---- 值日小组 ----
async function renderDutyGroups(body, look) {
  body.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>值日小组 (${look.duty.length})</h3>
        <button class="btn" onclick="App.groupForm('duty')">+ 添加小组</button></div>
      <div class="panel-body">
        ${look.duty.map(g => {
    const lead = g.members.find(m => m.id === g.leader_id);
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px">
            <div class="between flex" style="margin-bottom:8px">
              <div><strong>${App.esc(g.name)}</strong> ${lead ? App.tag('组长:' + lead.name, 'blue') : ''} ${g.note ? `<span class="muted">${App.esc(g.note)}</span>` : ''}</div>
              <div class="row-actions"><button class="btn sm ghost" onclick="App.groupForm('duty',${g.id})">编辑</button><button class="btn sm danger" onclick="App.groupDel('duty',${g.id})">删</button></div>
            </div>
            <div class="muted">${g.members.length ? g.members.map(m => App.esc(m.name)).join('、') : '暂无成员'}</div>
          </div>`;
  }).join('')}
      </div>
    </div>`;
}
// ---- 学习小组 ----
async function renderStudyGroups(body, look) {
  body.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>学习小组 (${look.study.length})</h3>
        <button class="btn" onclick="App.groupForm('study')">+ 添加小组</button></div>
      <div class="panel-body">
        ${look.study.map(g => {
    const lead = g.members.find(m => m.id === g.leader_id);
    return `<div style="border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px">
            <div class="between flex" style="margin-bottom:8px">
              <div><strong>${App.esc(g.name)}</strong> ${lead ? App.tag('组长:' + lead.name, 'blue') : ''} ${g.note ? `<span class="muted">${App.esc(g.note)}</span>` : ''}</div>
              <div class="row-actions"><button class="btn sm ghost" onclick="App.groupForm('study',${g.id})">编辑</button><button class="btn sm danger" onclick="App.groupDel('study',${g.id})">删</button></div>
            </div>
            <div class="muted">${g.members.length ? g.members.map(m => App.esc(m.name)).join('、') : '暂无成员'}</div>
          </div>`;
  }).join('')}
      </div>
    </div>`;
}
App.groupForm = async function (type, id) {
  const path = type === 'duty' ? '/duty-groups' : '/study-groups';
  const list = await App.API.get(path);
  const g = id ? list.find(x => x.id === id) || {} : {};
  const opt = `<option value="">无</option>` + (g.members || []).map(m => `<option value="${m.id}" ${m.id === g.leader_id ? 'selected' : ''}>${App.esc(m.name)}</option>`).join('');
  await App.modal(id ? '编辑小组' : '添加小组', `
    <div class="form-grid">
      <div class="field"><label>小组名 *</label><input id="g_name" value="${App.esc(g.name)}"></div>
      <div class="field"><label>组长</label><select id="g_leader">${opt}</select></div>
      <div class="field full"><label>备注</label><input id="g_note" value="${App.esc(g.note)}"></div>
    </div>`,
    `<button class="btn ghost" onclick="App.closeModal()">取消</button><button class="btn" onclick="App.groupSave('${type}',${id || 0})">保存</button>`);
};
App.groupSave = async function (type, id) {
  const path = type === 'duty' ? '/duty-groups' : '/study-groups';
  const data = { name: document.getElementById('g_name').value, leader_id: +document.getElementById('g_leader').value || null, note: document.getElementById('g_note').value };
  if (!data.name) return App.toast('请填写小组名', 'error');
  try { id ? await App.API.put(`${path}/${id}`, data) : await App.API.post(path, data); } catch (e) { return App.toast(e.message, 'error'); }
  App.closeModal(); App.toast('已保存'); await App.views.class(document.getElementById('view'));
};
App.groupDel = async function (type, id) {
  const path = type === 'duty' ? '/duty-groups' : '/study-groups';
  if (!confirm('删除小组? (成员将解除绑定)')) return;
  await App.API.del(`${path}/${id}`); App.toast('已删除'); await App.views.class(document.getElementById('view'));
};
