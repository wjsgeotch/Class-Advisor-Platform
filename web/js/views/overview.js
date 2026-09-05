// 概览仪表盘
App.views.overview = async function (c) {
  const s = await App.API.get('/overview');
  const cards = [
    { ic: '👦', num: s.students, label: '学生人数' },
    { ic: '🛏️', num: s.dorms, label: '寝室数' },
    { ic: '🧹', num: s.duty_groups, label: '值日小组' },
    { ic: '📚', num: s.study_groups, label: '学习小组' },
    { ic: '📝', num: s.exams, label: '考试次数' },
    { ic: '🏆', num: s.honor_records, label: '荣誉记录' },
  ];
  c.innerHTML = `
    <div class="cards">
      ${cards.map(x => `
        <div class="stat-card">
          <div class="ic">${x.ic}</div>
          <div class="num">${x.num}</div>
          <div class="label">${x.label}</div>
        </div>`).join('')}
    </div>
    <div class="panel">
      <div class="panel-head"><h3>平台简介</h3></div>
      <div class="panel-body">
        <p class="muted" style="line-height:1.8">
          本平台为班主任日常工作量身打造, 含四大模块:<br>
          ① <strong>班级班情</strong> — 学生信息、寝室(成员/床号)、值日小组、学习小组, 分组互通; <br>
          ② <strong>成绩管理</strong> — 记录历次考试成绩, 自动排名与统计; <br>
          ③ <strong>班级荣誉</strong> — 纪律/卫生/荣誉加减分, 支持按学生、整寝、学习小组、值日小组操作; <br>
          ④ <strong>综合评价</strong> — 成绩占比 50% + 班级荣誉 50% 定量评价, 自动排名。<br><br>
          网站与微信小程序共用同一后端, 数据实时互通。
        </p>
        <div class="sub-tabs mt12">
          <a class="sub-tab" href="#class">→ 班级班情</a>
          <a class="sub-tab" href="#grades">→ 成绩管理</a>
          <a class="sub-tab" href="#honor">→ 班级荣誉</a>
          <a class="sub-tab" href="#eval">→ 综合评价</a>
        </div>
      </div>
    </div>`;
};
