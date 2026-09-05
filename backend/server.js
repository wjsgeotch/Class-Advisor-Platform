// 班主任工作平台 - 共享后端
// 提供给网站前端(静态托管) 和 微信小程序 共用的 REST API
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 简单日志
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API 路由
app.use('/api/overview', require('./routes/overview'));
app.use('/api', require('./routes/students'));      // students/dorms/groups
app.use('/api/grades', require('./routes/grades'));
app.use('/api/honor', require('./routes/honor'));
app.use('/api/evaluation', require('./routes/evaluation'));

// 健康检查
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 静态托管网站前端
const webDir = path.join(__dirname, '..', 'web');
app.use(express.static(webDir));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(webDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  班主任工作平台后端已启动`);
  console.log(`  网站:   http://localhost:${PORT}`);
  console.log(`  API:    http://localhost:${PORT}/api`);
  console.log(`  小程序配置 BASE_URL 为上方地址(局域网/公网IP)`);
  console.log(`========================================\n`);
});
