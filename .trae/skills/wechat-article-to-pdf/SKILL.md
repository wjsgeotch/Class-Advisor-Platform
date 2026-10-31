---
name: "wechat-article-to-pdf"
description: "抓取微信公众号图文，下载正文图片、去除广告、增强清晰度并合成 A4 PDF。当用户给出微信公众号文章链接并要求下载图片、提取图文、提高清晰度、合并/合成 PDF 时调用。"
---

# 微信公众号图文 → 高清 PDF

把微信公众号图文文章批量下载为图片，过滤广告/二维码，做清晰度增强（对比度 + 锐化 + Unsharp Mask），并按页面排版合成 A4 多页 PDF。

## 何时使用

- 用户提供 `mp.weixin.qq.com/s/...` 链接
- 用户说"下载公众号图片并合成 PDF"、"提高清晰度"、"同样操作"、"抓公众号图文"等

## 环境依赖

- Python 3 + Pillow + reportlab
- curl（系统已自带）
- 不需要登录；走原图地址 `/0` 拿到最大分辨率

## 工作流

### 1. 抓取 HTML（处理风控）

微信偶发"环境异常"验证页。按以下顺序尝试 UA，直到 `js_content` 出现：

1. 桌面 Chrome：`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36`
2. 微信移动端：`Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.47(0x18002f2c) NetType/WIFI Language/zh_CN`
3. 仍被拦截 → 用浏览器子代理打开，提示用户完成滑块验证后再取 HTML。

```bash
mkdir -p /tmp/wx_art && curl -sL --compressed \
  -A "<UA>" -H "Accept-Language: zh-CN,zh;q=0.9" \
  -H "Referer: https://mp.weixin.qq.com/" \
  "<URL>" -o /tmp/wx_art/page.html
```

确认 `grep -c js_content page.html` 非 0。

### 2. 解析标题与图片 URL

```python
import re, html
h = open('/tmp/wx_art/page.html', encoding='utf-8').read()
title = re.findall(r'<meta property="og:title" content="([^"]*)"', h)
start = h.find('id="js_content"'); end = h.find('id="js_pc_qr_code"', start)
seg = h[start:end if end>0 else len(h)]
urls = []
for tag in re.findall(r'<img[^>]+>', seg, re.S):
    m = re.search(r'data-src="([^"]+)"', tag) or re.search(r'src="([^"]+)"', tag)
    if m: urls.append(html.unescape(m.group(1)))
# 去重保序
seen=set(); clean=[u for u in urls if not (u in seen or seen.add(u))]
open('/tmp/wx_art/urls.txt','w').write('\n'.join(clean))
```

### 3. 下载原图（用 `/0` 替代 `/640`）

微信图片路径里的 `/640` 是缩放版，替换为 `/0` 取最大分辨率（常见 1280× 或 2481×3508）。

```python
import os, subprocess, concurrent.futures
urls = [u.strip().replace('/640?', '/0?') for u in open('/tmp/wx_art/urls.txt')]
os.makedirs('/tmp/wx_art/hires', exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
def dl(p):
    i, u = p
    out = f'/tmp/wx_art/hires/{i:02d}.img'
    subprocess.run(["curl","-sL","--max-time","90","-A",UA,
                    "-e","https://mp.weixin.qq.com/","-o",out,u], capture_output=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    list(ex.map(dl, enumerate(urls, 1)))
```

### 4. 识别内容页 vs 广告

广告/二维码特征：**宽 > 高**（横幅），例如 1080×608、1280×720。
正文页特征：**高 > 宽**，比例接近 A4（0.707）或更长，常见 1080×1527、2481×3508。

用 PIL 打印每张尺寸，按尺寸过滤掉所有"宽>高"的图片即可。封面（宽<高）保留。
也可人工抽查首末几张确认。

### 5. 长图切分（仅当高度过大时）

部分文章会把连续页面拼成一张长图（高/宽 > 1.5）。按行空白带切分成接近 A4 的片段，避免文字过小：

```python
from PIL import Image
import numpy as np, math

def split_tall(im, max_ratio=1.45):
    a = np.array(im.convert('L'))
    rowmean = a.mean(axis=1)
    white = rowmean > 249
    runs = []; s = None
    for y, v in enumerate(white):
        if v and s is None: s = y
        elif not v and s is not None:
            if y - s >= 6: runs.append((s, y-1))
            s = None
    if s is not None and len(white)-s >= 6: runs.append((s, len(white)-1))
    w, h = im.size
    n = max(1, math.ceil(h / (max_ratio * w)))
    cuts = [0]
    for k in range(1, n):
        d = h * k / n
        cand = [r for r in runs if abs((r[0]+r[1])/2 - d) < 250]
        cut = (min(cand, key=lambda r: abs((r[0]+r[1])/2-d)) if cand else None)
        cuts.append((cut[0]+cut[1])//2 if cut else int(d))
    cuts.append(h)
    return [im.crop((0, cuts[k], w, cuts[k+1])) for k in range(len(cuts)-1)]
```

正常比例页面直接整页入 PDF。

### 6. 清晰度增强 + 合成 A4 PDF

```python
from PIL import Image, ImageEnhance, ImageFilter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
import io, os, glob

OUT = "/workspace/<标题>.pdf"
W, H = A4; mx = my = 20           # 页边距 pt
TARGET_W = 1654                   # 约 200 DPI，按需调大/小
c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("<标题>")
c.setSubject("<副标题>")

files = sorted(glob.glob('/tmp/wx_art/hires/*.img'))  # 已过滤广告后的内容页
for f in files:
    im = Image.open(f).convert('RGB')
    # 可选：限制宽度控制文件体积（不影响清晰度观感）
    if im.width > TARGET_W:
        nh = round(im.height * TARGET_W / im.width)
        im = im.resize((TARGET_W, nh), Image.LANCZOS)
    # 增强
    im = ImageEnhance.Contrast(im).enhance(1.13)
    im = ImageEnhance.Sharpness(im).enhance(1.2)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=2))
    # 放置到 A4
    aw, ah = W - 2*mx, H - 2*my
    sc = min(aw/im.width, ah/im.height)
    dw, dh = im.width*sc, im.height*sc
    x, y = (W-dw)/2, (H-dh)/2 + 4
    buf = io.BytesIO(); im.save(buf, format='JPEG', quality=86, optimize=True); buf.seek(0)
    c.drawImage(ImageReader(buf), x, y, width=dw, height=dh)
    c.showPage()
c.save()
```

### 7. 导出增强图片、清理

```bash
# 把增强后的 JPG 拷到 /workspace/<标题>-高清图片/
# 清理 /tmp/wx_art 和 /workspace 下的临时渲染图
```

### 8. 校验

- `pdfinfo` 确认页数、A4 尺寸、文件大小
- `pdftoppm -r 80` 抽 1/中/末 3 页目测：文字清晰、无切行、无广告页

## 输出文件命名

- PDF：`/workspace/<省份/卷别>高考地理官方解析-高清版.pdf`
- 图片文件夹：`/workspace/<省份/卷别>高考地理解析-高清图片/`（01.jpg … 编号）

## 注意事项

- 如果某篇文章图片全是 1080×1527 且数量很多，通常 01 和末张是广告横幅（1080×608），直接按"宽>高"过滤。
- PNG 源图（部分公众号）文件较大，转 JPEG q=86 能大幅压缩 PDF 体积。
- 遇到 `环境异常` 验证页时，**切 UA** 通常就能绕过；只有切 UA 无效才走浏览器人工验证。
