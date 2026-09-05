// 模块四: 综合评价 (成绩50% + 班级荣誉50%)
App.views.eval = async function (c) {
  const rows = await App.API.get('/evaluation');
  const medal = ['🥇', '🥈', '🥉'];
  c.innerHTML = `
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><h3>评价规则</h3></div>
      <div class="panel-body">
        <p class="muted" style="line-height:1.8">
          综合得分 = <strong>成绩分 × 50%</strong> + <strong>荣誉分 × 50%</strong><br>
          • 成绩分 = 该生历次平均分 ÷ 班级最高平均分 × 100 (满分100)<br>
          • 荣誉分 = 该生荣誉净值(加分-扣分) 经班内 min-max 归一化至 0–100; 全班相同时记为 50<br>
          • 数据来源于模块一(分组关联)、模块二(成绩)、模块三(荣誉), 实时计算。
        </p>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>综合评价排名 (${rows.length} 人)</h3></div>
      <table>
        <thead><tr><th>名次</th><th>学号</th><th>姓名</th><th>寝室</th><th>学习组</th><th>平均分</th><th>荣誉净值</th><th>成绩分</th><th>荣誉分</th><th>综合得分</th></tr></thead>
        <tbody>
        ${rows.length ? rows.map(r => `<tr>
          <td>${r.rank <= 3 ? `<span style="font-size:20px">${medal[r.rank - 1]}</span>` : `<span class="score-pill ${r.rank <= 3 ? 'rank-' + r.rank : ''}">${r.rank}</span>`}</td>
          <td>${App.esc(r.student_no)}</td>
          <td><strong>${App.esc(r.name)}</strong></td>
          <td>${App.esc(r.dorm_name) || '-'}</td>
          <td>${App.esc(r.study_group_name) || '-'}</td>
          <td>${r.avg_score == null ? '<span class="muted">无成绩</span>' : r.avg_score}</td>
          <td style="color:${r.honor_sum >= 0 ? 'var(--green)' : 'var(--red)'}">${r.honor_sum > 0 ? '+' : ''}${r.honor_sum}</td>
          <td><span class="score-pill">${r.grade_score}</span></td>
          <td><span class="score-pill">${r.honor_score}</span></td>
          <td><span class="score-pill rank-1" style="font-size:15px">${r.total}</span></td>
        </tr>`).join('') : `<tr><td colspan=10 class="empty">暂无数据</td></tr>`}
        </tbody></table>
    </div>`;
};
