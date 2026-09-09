# 班主任工作平台 - 线上部署手册

网站 + 微信小程序共用同一个后端（Node + Express + SQLite），只要把一个后端部署到公网，
网站和小程序就自动通过同一个 API 互联，数据完全一致。

---

## 一、你需要准备

| 资源 | 说明 | 参考成本 |
|---|---|---|
| 云服务器 | 1核2G 起步，装 Ubuntu 20.04/22.04 | 约 60–100 元/年 |
| 域名 | 解析到服务器 IP | 约 10–50 元/年 |
| 微信小程序 | 个人/企业主体均可 | 认证费(企业) |

> 没有域名也能用，但**微信小程序强制要求 HTTPS**，所以正式上线必须域名 + SSL 证书（本脚本用免费的 Let's Encrypt）。

---

## 二、第一步：把项目上传到服务器

在服务器上创建目录并上传：

```bash
mkdir -p /var/www/class-platform
# 用 scp 从你的电脑上传整个项目(排除 node_modules)
scp -r /workspace/backend /workspace/web /workspace/miniprogram \
      /workspace/deploy.sh user@你的服务器IP:/var/www/class-platform/
```

> 只需上传 `backend`、`web`、`miniprogram`、`deploy.sh`。`node_modules` 不用传，脚本会在服务器上重新安装（含编译，确保与服务器平台匹配）。

---

## 三、第二步：一键部署

SSH 登录服务器后执行：

```bash
cd /var/www/class-platform
chmod +x deploy.sh
sudo bash deploy.sh 你的域名.com
```

脚本会自动：
1. 安装 Node.js、Nginx、certbot
2. 安装 pm2 进程管理器（常驻、开机自启）
3. 安装后端依赖、初始化数据库
4. 用 pm2 启动服务
5. 生成 Nginx 反向代理配置（自动跳转 HTTPS）
6. 免费申请 Let's Encrypt SSL 证书

---

## 四、验证部署

```bash
curl -s https://你的域名.com/api/health
# 应返回: {"ok":true,...}
pm2 status            # 看到 class-platform 在线
```

---

## 五、第三步：把小程序指向线上后端

修改 `miniprogram/app.js` 第 12 行的 `baseUrl`：

```js
baseUrl: 'https://你的域名.com/api',   // 改成你的线上域名
```

然后在微信公众平台：
1. 小程序后台 → 开发 → 开发管理 → 服务器域名
2. 「request 合法域名」添加：`https://你的域名.com`
3. 用微信开发者工具导入 `miniprogram`，点「工具 → 上传」发布

---

## 六、数据互联验证

- 浏览器打开 `https://你的域名.com` 添加一名学生 → 小程序「班级班情」立刻能看到
- 小程序里给学生加分 → 网站「综合评价」实时变化

---

## 七、日常运维

```bash
pm2 logs class-platform        # 实时日志
pm2 restart class-platform     # 重启
pm2 status                     # 状态
sudo systemctl status nginx    # 反向代理状态
```

数据备份（单文件直接拷贝即可）：

```bash
cp /var/www/class-platform/backend/data.db /backup/data-$(date +%F).db
```