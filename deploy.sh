#!/bin/bash
# 班主任工作平台 一键部署脚本 (Ubuntu 20.04+/Debian)
# 用法: sudo bash deploy.sh your-domain.com
# 例: sudo bash deploy.sh class.example.com

set -e

DOMAIN=$1
if [ -z "$DOMAIN" ]; then
  echo "用法: sudo bash deploy.sh 你的域名"
  echo "示例: sudo bash deploy.sh class.yourname.com"
  exit 1
fi

echo "=== 班主任工作平台一键部署 ==="
echo "域名: $DOMAIN"
echo ""

# 1. 安装基础依赖
echo "[1/5] 更新系统，安装 Node.js 和 Nginx..."
apt update
apt install -y nodejs npm nginx certbot python3-certbot-nginx

# 2. 安装 pm2 让进程常驻
echo "[2/5] 安装 pm2 进程管理器..."
npm install -g pm2

# 3. 安装后端依赖
echo "[3/5] 安装项目依赖..."
cd /var/www/class-platform/backend
npm install --production

# 4. 初始化数据库（如果不存在）
if [ ! -f "/var/www/class-platform/backend/data.db" ]; then
  echo "[4/5] 初始化数据库..."
  node seed.js
fi

# 5. 启动服务
echo "[5/5] 启动后端服务..."
pm2 start server.js --name "class-platform"
pm2 save
pm2 startup

# 生成 Nginx 配置
cat > /etc/nginx/sites-available/class-platform <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;
    client_max_body_size 10M;

    # 证书会由 certbot 自动填入

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/class-platform /etc/nginx/sites-enabled/

# 申请 Let's Encrypt 证书
echo ""
echo "申请 SSL 证书，请按 certbot 提示操作..."
certbot --nginx -d "$DOMAIN"

# 重启 Nginx
systemctl reload nginx

echo ""
echo "✅ 部署完成！"
echo "网站地址: https://$DOMAIN"
echo "API 地址: https://$DOMAIN/api"
echo ""
echo "小程序配置：修改 miniprogram/app.js 里的 baseUrl 为 \"https://$DOMAIN/api\""
echo "然后在微信小程序后台添加 request 合法域名: $DOMAIN"
echo ""
echo "管理命令:"
echo "  pm2 logs class-platform      # 查看日志"
echo "  pm2 restart class-platform   # 重启服务"
echo "  pm2 status                   # 查看状态"
