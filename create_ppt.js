// ============================================================
// 高一学习适应主题班会PPT —— 从"优秀"到"卓越"
// ============================================================
const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

pres.layout = "LAYOUT_16x9";
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const MARGIN = 0.5;
const CONTENT_X = MARGIN;
const CONTENT_Y = MARGIN;
const CONTENT_W = SLIDE_W - 2 * MARGIN;
const CONTENT_H = SLIDE_H - 2 * MARGIN;
const CENTER_X = SLIDE_W / 2;
const CENTER_Y = SLIDE_H / 2;

// 配色方案：Growth & Warmth（成长与温度）
const C = {
  primary:   "264653",  // deep teal 主色
  secondary: "2A9D8F",  // teal 成长绿
  accent:    "E76F51",  // terracotta 暖橙
  gold:      "F4A261",  // 金色
  light:     "F4F1DE",  // cream 背景
  cream:     "FAF7F2",  // 浅米色
  text:      "264653",  // 主文字
  muted:     "6B7B7E",  // 次要文字
  white:     "FFFFFF",
  line:      "D8E4E8",
};

const FONT_TITLE = "Noto Serif CJK SC";
const FONT_BODY  = "Noto Sans CJK SC";

// ============================================================
// CONTAINER SYSTEM (required by skill)
// ============================================================
function parseImageDimensions(path){const m=path.match(/_(\d+)x(\d+)\.(png|jpg|jpeg|gif|webp)$/i);if(m)return{width:parseInt(m[1]),height:parseInt(m[2])};return null;}
function calculateScaledImageOpts(opts){const{path,w:tW,h:tH,x=0,y=0,...rest}=opts;if(!path||!tW||!tH)return opts;const d=parseImageDimensions(path);if(!d)return opts;const ia=d.width/d.height,ta=tW/tH;let sW,sH,ox=0,oy=0;if(ia>ta){sW=tW;sH=tW/ia;oy=(tH-sH)/2;}else{sH=tH;sW=tH*ia;ox=(tW-sW)/2;}return{path,x:x+ox,y:y+oy,w:sW,h:sH,...rest};}
function createVirtualNode(type,data,px=0,py=0){const o=data.opts||{};const n={type,data,absX:px+(o.x||0),absY:py+(o.y||0),w:o.w||0,h:o.h||0,children:[]};n.addShape=function(st,opts={}){const c=createVirtualNode('shape',{shapeType:st,opts},n.absX,n.absY);n.children.push(c);return c;};n.addText=function(t,opts={}){const so={fit:"shrink",...opts};const br=/^(?:[\u2022\u2023\u25E6\u2043\u2219\u00B7\u25CF\u25CB\u2013\u2014]\s*|\-\s+)/;if(Array.isArray(t)){t=t.map(i=>{if(i&&i.options&&i.options.bullet&&typeof i.text==='string')return{...i,text:i.text.replace(br,'')};return i;});}const c=createVirtualNode('text',{text:t,opts:so},n.absX,n.absY);n.children.push(c);return c;};n.addImage=function(opts={}){const so=calculateScaledImageOpts(opts);const c=createVirtualNode('image',{opts:so},n.absX,n.absY);n.children.push(c);return c;};n.addTable=function(td,opts={}){const c=createVirtualNode('table',{tableData:td,opts},n.absX,n.absY);n.children.push(c);return c;};return n;}
function flattenNode(node,realSlide,pres){const ao={...node.data.opts,x:node.absX,y:node.absY};if(node.type==='shape')realSlide.addShape(node.data.shapeType,ao);else if(node.type==='text')realSlide.addText(node.data.text,ao);else if(node.type==='image')realSlide.addImage(ao);else if(node.type==='table')realSlide.addTable(node.data.tableData,ao);node.children.forEach(c=>flattenNode(c,realSlide,pres));}
const originalAddSlide=pres.addSlide.bind(pres);
pres.addSlide=function(options){const real=originalAddSlide(options);const v={children:[],_realSlide:real,set background(val){real.background=val;},get background(){return real.background;},addShape:function(st,opts={}){const n=createVirtualNode('shape',{shapeType:st,opts},0,0);this.children.push(n);return n;},addText:function(t,opts={}){const so={fit:"shrink",...opts};const n=createVirtualNode('text',{text:t,opts:so},0,0);this.children.push(n);return n;},addImage:function(opts={}){const so=calculateScaledImageOpts(opts);const n=createVirtualNode('image',{opts:so},0,0);this.children.push(n);return n;},addTable:function(td,opts={}){const n=createVirtualNode('table',{tableData:td,opts},0,0);this.children.push(n);return n;},addChart:function(ct,data,opts={}){real.addChart(ct,data,opts);},render:function(){this.children.forEach(c=>flattenNode(c,real,pres));}};return v;};

// ============================================================
// 辅助函数
// ============================================================
function pageBg(slide, color=C.cream){ slide.background = { color }; }

function addHeader(slide, num, title, subtitle){
  // 顶部装饰条
  slide.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:SLIDE_W, h:0.08, fill:{color:C.accent}, line:{type:'none'}});
  // 编号圆形
  const badge = slide.addShape(pres.shapes.OVAL, {x:CONTENT_X, y:CONTENT_Y, w:0.55, h:0.5, fill:{color:C.primary}, line:{type:'none'}});
  badge.addText(num, {x:0,y:0,w:0.55,h:0.5, fontSize:17, bold:true, color:C.white, align:'center', valign:'middle', fontFace:FONT_TITLE});
  // 标题
  slide.addText(title, {x:CONTENT_X+0.7, y:CONTENT_Y, w:CONTENT_W-0.7, h:0.5, fontSize:24, bold:true, color:C.text, fontFace:FONT_TITLE, valign:'middle', charSpacing:1.2});
  if(subtitle){
    slide.addText(subtitle, {x:CONTENT_X+0.7, y:CONTENT_Y+0.5, w:CONTENT_W-0.7, h:0.18, fontSize:10, color:C.muted, fontFace:FONT_BODY});
  }
  // 底部页码条
  slide.addShape(pres.shapes.RECTANGLE, {x:CONTENT_X, y:SLIDE_H-0.25, w:0.3, h:0.04, fill:{color:C.secondary}, line:{type:'none'}});
}

function card(slide, x, y, w, h, fill=C.white, radius=0.12){
  return slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x,y,w,h, fill:{color:fill}, line:{color:C.line, width:0.5}, rectRadius:radius});
}

function iconCircle(slide, x, y, size, icon, bgColor=C.secondary){
  const c = slide.addShape(pres.shapes.OVAL, {x,y,w:size,h:size, fill:{color:bgColor}, line:{type:'none'}});
  c.addText(icon, {x:0,y:0,w:size,h:size, fontSize:size*0.55, color:C.white, align:'center', valign:'middle'});
  return c;
}

// ============================================================
// Slide 1: 封面
// ============================================================
(function(){
  const slide = pres.addSlide();
  slide.background = { color: C.primary };
  // 装饰圆
  slide.addShape(pres.shapes.OVAL, {x:7.7, y:0.1, w:2.2, h:2.2, fill:{color:C.secondary}, line:{type:'none'}});
  slide.addShape(pres.shapes.OVAL, {x:0.1, y:3.4, w:2.0, h:2.0, fill:{color:C.accent}, line:{type:'none'}});
  slide.addShape(pres.shapes.OVAL, {x:7.2, y:4.1, w:1.1, h:1.1, fill:{color:C.gold}, line:{type:'none'}});

  // 主题标签
  const tag = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y:1.3, w:2.6, h:0.45, fill:{color:C.accent}, line:{type:'none'}, rectRadius:0.2});
  tag.addText("高一 · 主题班会", {x:0,y:0,w:2.6,h:0.45, fontSize:13, color:C.white, align:'center', valign:'middle', fontFace:FONT_BODY, bold:true});

  // 主标题
  slide.addText("从「优秀」到「卓越」", {x:CONTENT_X, y:1.95, w:CONTENT_W, h:1.1, fontSize:44, bold:true, color:C.white, fontFace:FONT_TITLE, charSpacing:4});
  // 副标题
  slide.addText("——高一学习适应指南", {x:CONTENT_X, y:3.05, w:CONTENT_W, h:0.6, fontSize:24, color:C.gold, fontFace:FONT_TITLE, charSpacing:2});

  // 引言
  slide.addText("在一个不再承认你是第一的地方，\n你还愿不愿意继续努力？", {x:CONTENT_X, y:3.85, w:CONTENT_W, h:1.0, fontSize:15, color:"CADCFC", fontFace:FONT_BODY, valign:'top'});

  // 底部信息
  slide.addShape(pres.shapes.RECTANGLE, {x:CONTENT_X, y:SLIDE_H-0.5, w:1.5, h:0.04, fill:{color:C.gold}, line:{type:'none'}});
  slide.addText("2026 年秋", {x:CONTENT_X, y:SLIDE_H-0.42, w:3, h:0.3, fontSize:11, color:"9DB4C0", fontFace:FONT_BODY});
  slide.render();
})();

// ============================================================
// Slide 2: 目录
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "0", "本节课我们聊什么", "CONTENTS");

  const items = [
    {n:"01", t:"一个扎心的现象", d:"为什么优秀学生上了高中就「颓」了", color:C.primary},
    {n:"02", t:"三个底层机制", d:"身份坍塌 · 习得性无助 · 工具箱空", color:C.secondary},
    {n:"03", t:"三件能动的事", d:"参照系 · 弄会过程 · 锚点科目", color:C.accent},
    {n:"04", t:"落地工具与行动", d:"学习方法 + 我的适应承诺", color:C.gold},
  ];
  const cardW = (CONTENT_W - 0.3) / 2;
  const cardH = 1.55;
  const startY = 1.25;
  items.forEach((it, i)=>{
    const col = i % 2;
    const row = Math.floor(i/2);
    const x = CONTENT_X + col*(cardW+0.3);
    const y = startY + row*(cardH+0.25);
    const c = card(slide, x, y, cardW, cardH);
    // 编号大字
    c.addText(it.n, {x:0.2, y:0.15, w:1.2, h:1.0, fontSize:40, bold:true, color:it.color, fontFace:FONT_TITLE, valign:'top'});
    c.addText(it.t, {x:1.4, y:0.25, w:cardW-1.6, h:0.5, fontSize:19, bold:true, color:C.text, fontFace:FONT_TITLE});
    c.addText(it.d, {x:1.4, y:0.8, w:cardW-1.6, h:0.6, fontSize:12, color:C.muted, fontFace:FONT_BODY});
    // 侧边色条
    c.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:0.08, h:cardH, fill:{color:it.color}, line:{type:'none'}});
  });
  slide.render();
})();

// ============================================================
// Slide 3: 破冰引入
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "1", "先想一个问题", "ICE-BREAKER");

  // 左侧问题卡
  const left = card(slide, CONTENT_X, 1.2, CONTENT_W*0.52, 3.5, C.primary);
  left.addText("为什么很多初中的「优等生」，", {x:0.3, y:0.35, w:4.0, h:0.5, fontSize:17, color:C.white, fontFace:FONT_TITLE, bold:true});
  left.addText("上了高中就「颓废」了？", {x:0.3, y:0.85, w:4.0, h:0.55, fontSize:20, color:C.gold, fontFace:FONT_TITLE, bold:true});
  left.addShape(pres.shapes.RECTANGLE, {x:0.3, y:1.55, w:0.8, h:0.04, fill:{color:C.accent}, line:{type:'none'}});
  left.addText("你身边有这样的同学吗？\n或者……你自己有没有过这样的时刻？", {x:0.3, y:1.75, w:4.0, h:1.2, fontSize:13, color:"CADCFC", fontFace:FONT_BODY});
  left.addText("✋ 请举手 / 在心里想一想", {x:0.3, y:3.0, w:4.0, h:0.4, fontSize:12, color:C.gold, fontFace:FONT_BODY, italic:true});

  // 右侧三个关键词
  const rx = CONTENT_X + CONTENT_W*0.52 + 0.25;
  const rw = CONTENT_W*0.48 - 0.25;
  const keys = [
    {k:"成绩下滑", c:C.accent, e:"月考名次一落千丈"},
    {k:"不想努力", c:C.gold, e:"「我只是没认真学」"},
    {k:"沉迷手机", c:C.secondary, e:"游戏给即时反馈"},
  ];
  keys.forEach((k,i)=>{
    const y = 1.2 + i*1.2;
    const c = card(slide, rx, y, rw, 1.05);
    iconCircle(c, 0.2, 0.27, 0.5, k.k==="成绩下滑"?"📉":k.k==="不想努力"?"😮‍💨":"📱", k.c);
    c.addText(k.k, {x:0.85, y:0.2, w:rw-1.0, h:0.4, fontSize:16, bold:true, color:C.text, fontFace:FONT_TITLE});
    c.addText(k.e, {x:0.85, y:0.6, w:rw-1.0, h:0.35, fontSize:11, color:C.muted, fontFace:FONT_BODY});
  });
  slide.render();
})();

// ============================================================
// Slide 4: 现象一 - 优秀是比较出来的
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "2", "现象一：「优秀」是比较出来的", "大多数初中优等生的优秀，建立在「我比周围人学得好」之上");

  // 两列对比
  const cardW = (CONTENT_W - 0.3) / 2;
  const cardH = 3.5;
  const y = 1.25;

  // 左：比较驱动（会消失）
  const left = card(slide, CONTENT_X, y, cardW, cardH, "FFF5F0");
  left.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:cardW, h:0.55, fill:{color:C.accent}, line:{type:'none'}});
  left.addText("❌ 比较驱动", {x:0.25, y:0, w:cardW-0.5, h:0.55, fontSize:17, bold:true, color:C.white, fontFace:FONT_TITLE, valign:'middle'});
  const lpoints = [
    "「我是班里最聪明的」",
    "「老师最喜欢我」",
    "「同学不会的来问我」",
  ];
  lpoints.forEach((p,i)=>{
    left.addText("• "+p, {x:0.3, y:0.75+i*0.55, w:cardW-0.6, h:0.5, fontSize:14, color:C.text, fontFace:FONT_BODY});
  });
  left.addShape(pres.shapes.RECTANGLE, {x:0.3, y:2.5, w:cardW-0.6, h:0.02, fill:{color:C.line}, line:{type:'none'}});
  left.addText("进了高中：周围全是各校「第一名」\n→ 自我定义的根基被抽掉", {x:0.3, y:2.6, w:cardW-0.6, h:0.8, fontSize:12, color:C.accent, fontFace:FONT_BODY, bold:true});

  // 右：内驱（会保留）
  const right = card(slide, CONTENT_X+cardW+0.3, y, cardW, cardH, "F0FAF8");
  right.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:cardW, h:0.55, fill:{color:C.secondary}, line:{type:'none'}});
  right.addText("✅ 内驱力", {x:0.25, y:0, w:cardW-0.5, h:0.55, fontSize:17, bold:true, color:C.white, fontFace:FONT_TITLE, valign:'middle'});
  const rpoints = [
    "好奇心——想知道「为什么」",
    "掌握新东西的满足感",
    "对某个领域真实的兴趣",
  ];
  rpoints.forEach((p,i)=>{
    right.addText("• "+p, {x:0.3, y:0.75+i*0.55, w:cardW-0.6, h:0.5, fontSize:14, color:C.text, fontFace:FONT_BODY});
  });
  right.addShape(pres.shapes.RECTANGLE, {x:0.3, y:2.5, w:cardW-0.6, h:0.02, fill:{color:C.line}, line:{type:'none'}});
  right.addText("换一个环境，内驱力还在\n→ 这才是能带走的「优秀」", {x:0.3, y:2.6, w:cardW-0.6, h:0.8, fontSize:12, color:C.secondary, fontFace:FONT_BODY, bold:true});

  // 底部金句
  const quote = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y:4.85, w:CONTENT_W, h:0.55, fill:{color:C.primary}, line:{type:'none'}, rectRadius:0.1});
  quote.addText("「我以为我是这样的人，原来我不是。」——这不是成绩下降，是自我认知系统失灵了。", {x:0.3, y:0, w:CONTENT_W-0.6, h:0.55, fontSize:12.5, color:C.white, fontFace:FONT_BODY, valign:'middle'});
  slide.render();
})();

// ============================================================
// Slide 5: 现象二 - 习得性无助
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "3", "现象二：习得性无助", "反复努力、反复失败 → 大脑判定「努力和结果之间没有稳定关系」");

  // 左侧：机制流程图
  const lx = CONTENT_X, ly = 1.25, lw = CONTENT_W*0.58, lh = 3.5;
  const flow = card(slide, lx, ly, lw, lh);
  flow.addText("心理机制：大脑的「性价比判断」", {x:0.25, y:0.2, w:lw-0.5, h:0.4, fontSize:15, bold:true, color:C.text, fontFace:FONT_TITLE});

  const steps = [
    {t:"认真复习了", e:"还是考得很差", c:C.accent},
    {t:"再认真一次", e:"大概也没用", c:C.gold},
    {t:"停止努力", e:"「我最近状态不好」", c:C.muted},
  ];
  const sx = 0.25, sy = 0.75;
  const stepW = (lw-0.5-0.6)/3;
  steps.forEach((s,i)=>{
    const x = sx + i*(stepW+0.3);
    const box = flow.addShape(pres.shapes.ROUNDED_RECTANGLE, {x, y:sy, w:stepW, h:1.5, fill:{color:s.c}, line:{type:'none'}, rectRadius:0.1});
    box.addText(s.t, {x:0.1, y:0.2, w:stepW-0.2, h:0.5, fontSize:14, bold:true, color:C.white, fontFace:FONT_TITLE, align:'center'});
    box.addText(s.e, {x:0.1, y:0.75, w:stepW-0.2, h:0.6, fontSize:11, color:C.white, fontFace:FONT_BODY, align:'center'});
    if(i<2){
      flow.addShape(pres.shapes.RIGHT_ARROW, {x:x+stepW+0.02, y:sy+0.55, w:0.26, h:0.4, fill:{color:C.muted}, line:{type:'none'}});
    }
  });

  flow.addShape(pres.shapes.RECTANGLE, {x:0.25, y:2.45, w:lw-0.5, h:0.02, fill:{color:C.line}, line:{type:'none'}});
  flow.addText("本质：他在保护自己", {x:0.25, y:2.52, w:lw-0.5, h:0.32, fontSize:13, bold:true, color:C.accent, fontFace:FONT_TITLE});
  flow.addText("「认真努力了还是失败」= 真的失败；\n「没认真就失败」= 还能告诉自己「我要是认真肯定不一样」。", {x:0.25, y:2.88, w:lw-0.5, h:0.55, fontSize:10.5, color:C.text, fontFace:FONT_BODY});

  // 右侧：核心金句
  const rx = lx+lw+0.25, rw = CONTENT_W*0.42-0.25;
  const r = card(slide, rx, ly, rw, lh, C.primary);
  r.addText("💡", {x:0, y:0.3, w:rw, h:0.6, fontSize:32, align:'center'});
  r.addText("不努力，\n是一种保留\n退路的方式。", {x:0.2, y:1.0, w:rw-0.4, h:1.6, fontSize:22, bold:true, color:C.white, fontFace:FONT_TITLE, align:'center', valign:'middle', charSpacing:1});
  r.addShape(pres.shapes.RECTANGLE, {x:rw/2-0.4, y:2.75, w:0.8, h:0.04, fill:{color:C.gold}, line:{type:'none'}});
  r.addText("高一这个过程发生得很快，\n快到当事人自己都没意识到。", {x:0.2, y:2.9, w:rw-0.4, h:0.5, fontSize:11, color:"CADCFC", fontFace:FONT_BODY, align:'center'});
  slide.render();
})();

// ============================================================
// Slide 6: 现象三 - 学习工具箱是空的
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "4", "现象三：学习工具箱是空的", "初中太容易，他们从没被迫建立「不会 → 弄会」的能力");

  // 上下对比
  const top = card(slide, CONTENT_X, 1.2, CONTENT_W, 1.65, "FFF8F0");
  top.addShape(pres.shapes.OVAL, {x:0.3, y:0.3, w:0.6, h:0.6, fill:{color:C.gold}, line:{type:'none'}}).addText("初中", {x:0,y:0,w:0.6,h:0.6,fontSize:13,bold:true,color:C.white,align:'center',valign:'middle',fontFace:FONT_TITLE});
  top.addText("内容太容易 → 不需要真正学习就能考好", {x:1.1, y:0.3, w:7.5, h:0.4, fontSize:15, bold:true, color:C.text, fontFace:FONT_TITLE});
  top.addText("上课听一遍记住了 · 题目见过一次会做了 · 考前随便翻翻还是第一", {x:1.1, y:0.75, w:7.5, h:0.35, fontSize:12, color:C.muted, fontFace:FONT_BODY});
  top.addText("隐患：从来没练过「在不会的情况下，如何把自己弄会」", {x:1.1, y:1.1, w:7.5, h:0.4, fontSize:13, bold:true, color:C.accent, fontFace:FONT_BODY});

  // 箭头
  slide.addShape(pres.shapes.DOWN_ARROW, {x:CENTER_X-0.15, y:2.88, w:0.3, h:0.3, fill:{color:C.secondary}, line:{type:'none'}});

  const bot = card(slide, CONTENT_X, 3.2, CONTENT_W, 1.65, "F0FAF8");
  bot.addShape(pres.shapes.OVAL, {x:0.3, y:0.3, w:0.6, h:0.6, fill:{color:C.secondary}, line:{type:'none'}}).addText("高中", {x:0,y:0,w:0.6,h:0.6,fontSize:13,bold:true,color:C.white,align:'center',valign:'middle',fontFace:FONT_TITLE});
  bot.addText("难度陡然上升 → 第一次听不懂、练了很久还是错", {x:1.1, y:0.3, w:7.5, h:0.4, fontSize:15, bold:true, color:C.text, fontFace:FONT_TITLE});
  bot.addText("他们唯一会的是「接收信息自然吸收」，但高中需要「主动加工、反复推敲、承受不会」", {x:1.1, y:0.75, w:7.5, h:0.45, fontSize:12, color:C.muted, fontFace:FONT_BODY});
  bot.addText("这是两套系统，而他们只练过第一套。", {x:1.1, y:1.2, w:7.5, h:0.4, fontSize:13, bold:true, color:C.secondary, fontFace:FONT_BODY});
  slide.render();
})();

// ============================================================
// Slide 7: 三件事同时发生 = 颓
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "5", "三件事撞在一起，外部表现就是「颓」", "这不是道德问题，是一个人在一件事上失去控制感后，去另一件事上找回控制感");

  // 三个原因卡
  const reasons = [
    {icon:"🏚️", t:"身份认同坍塌", d:"我以为我是优秀的那个，结果不是", c:C.accent},
    {icon:"🔁", t:"习得性无助积累", d:"努力了也没用，还不如不努力", c:C.gold},
    {icon:"🧰", t:"学习工具箱是空的", d:"遇到真正不会的，不知道怎么办", c:C.secondary},
  ];
  const rw = (CONTENT_W - 0.6)/3;
  reasons.forEach((r,i)=>{
    const x = CONTENT_X + i*(rw+0.3);
    const c = card(slide, x, 1.2, rw, 1.5);
    c.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:rw, h:0.08, fill:{color:r.c}, line:{type:'none'}});
    c.addText(r.icon, {x:0, y:0.2, w:rw, h:0.55, fontSize:28, align:'center'});
    c.addText(r.t, {x:0.15, y:0.8, w:rw-0.3, h:0.35, fontSize:15, bold:true, color:C.text, fontFace:FONT_TITLE, align:'center'});
    c.addText(r.d, {x:0.15, y:1.12, w:rw-0.3, h:0.36, fontSize:10, color:C.muted, fontFace:FONT_BODY, align:'center'});
  });

  // 加号
  slide.addText("+", {x:CONTENT_X+rw+0.05, y:1.7, w:0.2, h:0.5, fontSize:24, bold:true, color:C.muted, align:'center', fontFace:FONT_TITLE});
  slide.addText("+", {x:CONTENT_X+2*rw+0.35, y:1.7, w:0.2, h:0.5, fontSize:24, bold:true, color:C.muted, align:'center', fontFace:FONT_TITLE});

  // 结果
  const res = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y:3.0, w:CONTENT_W, h:1.85, fill:{color:C.primary}, line:{type:'none'}, rectRadius:0.12});
  res.addText("外部表现", {x:0.3, y:0.2, w:2, h:0.4, fontSize:14, color:C.gold, fontFace:FONT_TITLE, bold:true});
  res.addText("人散了，不学了，开始沉迷手机/游戏——因为游戏给即时反馈，让他感到「我是有能力的」", {x:0.3, y:0.6, w:CONTENT_W-0.6, h:0.6, fontSize:14, color:C.white, fontFace:FONT_BODY});
  res.addShape(pres.shapes.RECTANGLE, {x:0.3, y:1.3, w:1.2, h:0.03, fill:{color:C.gold}, line:{type:'none'}});
  res.addText("这不是意志力问题，是系统从未处理过的新情境。", {x:0.3, y:1.38, w:CONTENT_W-0.6, h:0.4, fontSize:13, color:"CADCFC", fontFace:FONT_BODY, italic:true});
  slide.render();
})();

// ============================================================
// Slide 8: 破局之道总览
// ============================================================
(function(){
  const slide = pres.addSlide();
  slide.background = { color: C.primary };
  slide.addShape(pres.shapes.OVAL, {x:0.05, y:0.05, w:2.8, h:2.8, fill:{color:C.secondary}, line:{type:'none'}});
  slide.addShape(pres.shapes.OVAL, {x:7.6, y:3.0, w:2.3, h:2.3, fill:{color:C.accent}, line:{type:'none'}});

  slide.addText("那怎么办？", {x:CONTENT_X, y:0.7, w:CONTENT_W, h:0.7, fontSize:36, bold:true, color:C.white, fontFace:FONT_TITLE, charSpacing:3});
  slide.addText("真正能动的三件事", {x:CONTENT_X, y:1.4, w:CONTENT_W, h:0.5, fontSize:20, color:C.gold, fontFace:FONT_TITLE});
  slide.addShape(pres.shapes.RECTANGLE, {x:CONTENT_X, y:2.0, w:1.2, h:0.05, fill:{color:C.accent}, line:{type:'none'}});

  const advices = [
    {n:"01", t:"重新定位「优秀」的参照系", d:"从「比别人好」→「比上个月的自己好」", c:C.accent},
    {n:"02", t:"主动经历「不会 → 弄会」", d:"越早越好，每完成一次就多一分真实自信", c:C.secondary},
    {n:"03", t:"找到一门「锚点科目」", d:"愿意主动花时间的那门，重建学习动力", c:C.gold},
  ];
  advices.forEach((a,i)=>{
    const y = 2.3 + i*0.95;
    const c = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y, w:CONTENT_W, h:0.82, fill:{color:"1A3A45", transparency:12}, line:{color:a.c, width:1}, rectRadius:0.1});
    c.addText(a.n, {x:0.2, y:0, w:0.8, h:0.82, fontSize:26, bold:true, color:a.c, fontFace:FONT_TITLE, valign:'middle'});
    c.addText(a.t, {x:1.1, y:0.1, w:CONTENT_W-1.3, h:0.4, fontSize:16, bold:true, color:C.white, fontFace:FONT_TITLE});
    c.addText(a.d, {x:1.1, y:0.45, w:CONTENT_W-1.3, h:0.35, fontSize:12, color:"CADCFC", fontFace:FONT_BODY});
  });
  slide.render();
})();

// ============================================================
// Slide 9: 方法一 - 重新定位参照系
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "6", "方法一：重新定位「优秀」的参照系", "从「我比周围人好」切换到「我比上个月的自己好」");

  // 左：旧参照系
  const cw = (CONTENT_W-0.3)/2;
  const left = card(slide, CONTENT_X, 1.2, cw, 2.3, "FFF5F0");
  left.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:cw, h:0.5, fill:{color:C.accent}, line:{type:'none'}});
  left.addText("❌ 旧参照系：和别人比", {x:0.2, y:0, w:cw-0.4, h:0.5, fontSize:15, bold:true, color:C.white, fontFace:FONT_TITLE, valign:'middle'});
  left.addText("• 看排名、看分数\n• 我有没有超过 XX\n→ 不可控，容易焦虑", {x:0.25, y:0.65, w:cw-0.5, h:1.5, fontSize:13, color:C.text, fontFace:FONT_BODY});

  // 右：新参照系
  const right = card(slide, CONTENT_X+cw+0.3, 1.2, cw, 2.3, "F0FAF8");
  right.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:cw, h:0.5, fill:{color:C.secondary}, line:{type:'none'}});
  right.addText("✅ 新参照系：和自己比", {x:0.2, y:0, w:cw-0.4, h:0.5, fontSize:15, bold:true, color:C.white, fontFace:FONT_TITLE, valign:'middle'});
  right.addText("• 哪类题比上次做得更好\n• 哪个知识点弄懂了\n→ 完全在你控制范围内", {x:0.25, y:0.65, w:cw-0.5, h:1.5, fontSize:13, color:C.text, fontFace:FONT_BODY});

  // 底部金句卡
  const q = card(slide, CONTENT_X, 3.65, CONTENT_W, 1.1, C.primary);
  q.addText("💡", {x:0.2, y:0.2, w:0.5, h:0.7, fontSize:28, valign:'middle'});
  q.addText("这不是阿Q精神，是真实有效的动机重建。\n进步5分的人，和原地踏步的人，时间拉长之后结果完全不一样——哪怕前者绝对成绩还不如后者。", {x:0.8, y:0.15, w:CONTENT_W-1.1, h:0.85, fontSize:13, color:C.white, fontFace:FONT_BODY, valign:'middle'});
  slide.render();
})();

// ============================================================
// Slide 10: 方法二 - 主动经历不会→弄会
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "7", "方法二：主动经历「不会 → 弄会」", "越早越好 —— 这是在搭建你真正的「学习工具箱」");

  // 流程步骤
  const steps = [
    {n:"1", t:"挑一道完全不会的题", d:"不看答案，死磕30分钟"},
    {n:"2", t:"想不出来再看答案", d:"看懂解题思路和关键步骤"},
    {n:"3", t:"合上答案自己写一遍", d:"检验是否真的弄懂了"},
    {n:"4", t:"积累「我能弄会」的证据", d:"这才是真实的自信"},
  ];
  const sw = (CONTENT_W - 0.45)/4;
  steps.forEach((s,i)=>{
    const x = CONTENT_X + i*(sw+0.15);
    const c = card(slide, x, 1.2, sw, 2.0);
    const circ = c.addShape(pres.shapes.OVAL, {x:sw/2-0.3, y:0.2, w:0.6, h:0.6, fill:{color:C.accent}, line:{type:'none'}});
    circ.addText(s.n, {x:0,y:0,w:0.6,h:0.6,fontSize:20,bold:true,color:C.white,align:'center',valign:'middle',fontFace:FONT_TITLE});
    c.addText(s.t, {x:0.1, y:0.95, w:sw-0.2, h:0.5, fontSize:13, bold:true, color:C.text, fontFace:FONT_TITLE, align:'center'});
    c.addText(s.d, {x:0.1, y:1.4, w:sw-0.2, h:0.5, fontSize:10.5, color:C.muted, fontFace:FONT_BODY, align:'center'});
    if(i<3){
      slide.addShape(pres.shapes.RIGHT_ARROW, {x:x+sw+0.02, y:2.05, w:0.11, h:0.3, fill:{color:C.secondary}, line:{type:'none'}});
    }
  });

  // 注意事项
  const warn = card(slide, CONTENT_X, 3.4, CONTENT_W, 1.35, "FFF8F0");
  warn.addText("⚠️  短期保护自信 vs 长期搭建工具箱", {x:0.25, y:0.15, w:CONTENT_W-0.5, h:0.4, fontSize:15, bold:true, color:C.accent, fontFace:FONT_TITLE});
  warn.addText("很多人第一反应是「回避难题，只做有把握的」——短期保护了自信，但长期工具箱建不起来。\n反过来做：专门挑不会的题死磕。过程很痛苦，但每完成一次，就多一分「我能把不会的东西弄会」的证据。\n这种自信不是「我天生聪明」那种一遇挫折就碎的自信。", {x:0.25, y:0.55, w:CONTENT_W-0.5, h:0.75, fontSize:11.5, color:C.text, fontFace:FONT_BODY});
  slide.render();
})();

// ============================================================
// Slide 11: 方法三 - 锚点科目
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "8", "方法三：找到一门「锚点科目」", "不需要喜欢所有科目，但至少有一门，你愿意因为好奇而主动多花时间");

  // 左：锚点说明
  const left = card(slide, CONTENT_X, 1.2, CONTENT_W*0.5, 3.5, "F0FAF8");
  left.addShape(pres.shapes.OVAL, {x:0.3, y:0.3, w:0.7, h:0.7, fill:{color:C.secondary}, line:{type:'none'}}).addText("⚓", {x:0,y:0,w:0.7,h:0.7,fontSize:28,align:'center',valign:'middle'});
  left.addText("什么是「锚点科目」？", {x:1.15, y:0.4, w:3.5, h:0.5, fontSize:16, bold:true, color:C.text, fontFace:FONT_TITLE});
  left.addText("不是你成绩最好的那门，\n而是你愿意在课外主动多看一点的那门——\n不是因为要考试，是因为你有点好奇。", {x:0.3, y:1.2, w:CONTENT_W*0.5-0.6, h:1.3, fontSize:13, color:C.text, fontFace:FONT_BODY});
  left.addShape(pres.shapes.RECTANGLE, {x:0.3, y:2.65, w:1, h:0.03, fill:{color:C.secondary}, line:{type:'none'}});
  left.addText("这门科目会成为你重建学习动力的锚点，\n从这里慢慢扩散，比「我要全面提升」\n容易得多。", {x:0.3, y:2.75, w:CONTENT_W*0.5-0.6, h:0.7, fontSize:12, color:C.secondary, fontFace:FONT_BODY, bold:true});

  // 右：分享卡
  const rx = CONTENT_X+CONTENT_W*0.5+0.25, rw = CONTENT_W*0.5-0.25;
  const share = card(slide, rx, 1.2, rw, 1.6, C.primary);
  share.addText("🎓 分享", {x:0.2, y:0.15, w:rw-0.4, h:0.35, fontSize:13, color:C.gold, fontFace:FONT_TITLE, bold:true});
  share.addText("「我高中最开始能撑下来，是因为数学。不是因为我数学最好，是因为数学题解出来那一刻的感觉，对我来说是真实的满足，不是表演。」", {x:0.2, y:0.5, w:rw-0.4, h:1.0, fontSize:12, color:C.white, fontFace:FONT_BODY, italic:true});

  const act = card(slide, rx, 2.95, rw, 1.75, "FFF8F0");
  act.addText("✍️  现在想一想", {x:0.2, y:0.15, w:rw-0.4, h:0.35, fontSize:14, bold:true, color:C.accent, fontFace:FONT_TITLE});
  act.addText("你的「锚点科目」可能是哪一门？\n为什么它让你愿意多花时间？\n（成绩好坏不重要，重要的是「好奇」）", {x:0.2, y:0.55, w:rw-0.4, h:1.1, fontSize:12.5, color:C.text, fontFace:FONT_BODY});
  slide.render();
})();

// ============================================================
// Slide 12: 初高中学习差异对比
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "9", "初高中学习差异一览", "「陡坡效应」——初中到高中不是一步，是一次跨越");

  const tableData = [
    [{text:"维度", options:{bold:true, color:C.white, fill:{color:C.primary}, fontFace:FONT_TITLE, fontSize:13, align:'center'}},
     {text:"初中", options:{bold:true, color:C.white, fill:{color:C.secondary}, fontFace:FONT_TITLE, fontSize:13, align:'center'}},
     {text:"高中", options:{bold:true, color:C.white, fill:{color:C.accent}, fontFace:FONT_TITLE, fontSize:13, align:'center'}}],
    [{text:"知识特点", options:{bold:true, color:C.text, fill:{color:C.light}, fontSize:12}},
     {text:"基础、直观、记忆为主", options:{color:C.text, fontSize:11.5}},
     {text:"抽象、综合、逻辑链条长", options:{color:C.text, fontSize:11.5}}],
    [{text:"课堂节奏", options:{bold:true, color:C.text, fill:{color:C.light}, fontSize:12}},
     {text:"掰开揉碎，反复练", options:{color:C.text, fontSize:11.5}},
     {text:"容量大、进度快、一节多知识点", options:{color:C.text, fontSize:11.5}}],
    [{text:"学习方式", options:{bold:true, color:C.text, fill:{color:C.light}, fontSize:12}},
     {text:"被动接收 + 大量刷题", options:{color:C.text, fontSize:11.5}},
     {text:"主动加工 + 反复推敲", options:{color:C.text, fontSize:11.5}}],
    [{text:"核心能力", options:{bold:true, color:C.text, fill:{color:C.light}, fontSize:12}},
     {text:"记忆、模仿", options:{color:C.text, fontSize:11.5}},
     {text:"理解、迁移、自主学习", options:{color:C.text, fontSize:11.5}}],
    [{text:"对「不会」的态度", options:{bold:true, color:C.text, fill:{color:C.light}, fontSize:12}},
     {text:"很少遇到", options:{color:C.text, fontSize:11.5}},
     {text:"需要学会「承受不会→弄会」", options:{color:C.text, fontSize:11.5}}],
  ];
  slide.addTable(tableData, {
    x: CONTENT_X, y: 1.2, w: CONTENT_W, h: 3.5,
    border: {type:'solid', pt:0.5, color:C.line},
    rowH: [0.5, 0.55, 0.55, 0.55, 0.55, 0.6],
    valign:'middle', align:'left',
  });
  // 底部提示
  const tip = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y:4.85, w:CONTENT_W, h:0.55, fill:{color:C.primary}, line:{type:'none'}, rectRadius:0.08});
  tip.addText("🎯  重点：不是你变笨了，是「照着菜谱做菜」升级成了「用冰箱现有食材做一桌菜」。", {x:0.3, y:0, w:CONTENT_W-0.6, h:0.55, fontSize:12.5, color:C.white, fontFace:FONT_BODY, valign:'middle'});
  slide.render();
})();

// ============================================================
// Slide 13: 实操工具 - 高效学习五件套
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "10", "落地工具：高效学习五件套", "把「不会→弄会」的能力，变成每天可执行的习惯");

  const tools = [
    {icon:"📖", t:"课前预习", d:"标出不懂的地方，\n带着问题听课", c:C.primary},
    {icon:"✍️", t:"课堂专注", d:"记思路而非抄板书，\n紧跟老师逻辑", c:C.secondary},
    {icon:"🔄", t:"及时复习", d:"当天回顾、思维导图\n梳理知识框架", c:C.accent},
    {icon:"📕", t:"错题本", d:"记录错因 + 正确思路，\n定期二刷", c:C.gold},
    {icon:"📅", t:"学习计划", d:"周日列周计划，\n完成一项打一个勾", c:"6D597A"},
  ];
  const tw = (CONTENT_W - 0.4)/5;
  tools.forEach((t,i)=>{
    const x = CONTENT_X + i*(tw+0.1);
    const c = card(slide, x, 1.2, tw, 3.4);
    c.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:tw, h:0.08, fill:{color:t.c}, line:{type:'none'}});
    const num = c.addShape(pres.shapes.OVAL, {x:tw/2-0.25, y:0.25, w:0.5, h:0.5, fill:{color:t.c}, line:{type:'none'}});
    num.addText(String(i+1), {x:0,y:0,w:0.5,h:0.5,fontSize:16,bold:true,color:C.white,align:'center',valign:'middle',fontFace:FONT_TITLE});
    c.addText(t.icon, {x:0, y:0.85, w:tw, h:0.5, fontSize:26, align:'center'});
    c.addText(t.t, {x:0.1, y:1.4, w:tw-0.2, h:0.4, fontSize:14, bold:true, color:C.text, fontFace:FONT_TITLE, align:'center'});
    c.addText(t.d, {x:0.1, y:1.85, w:tw-0.2, h:1.2, fontSize:10.5, color:C.muted, fontFace:FONT_BODY, align:'center'});
  });

  const bot = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y:4.75, w:CONTENT_W, h:0.6, fill:{color:C.light}, line:{type:'none'}, rectRadius:0.08});
  bot.addText("💡  关键不是「全部做到」，而是从其中一两个开始，坚持21天形成习惯。", {x:0.3, y:0, w:CONTENT_W-0.6, h:0.6, fontSize:12.5, color:C.text, fontFace:FONT_BODY, valign:'middle', bold:true});
  slide.render();
})();

// ============================================================
// Slide 14: 思维导图与错题本详解
// ============================================================
(function(){
  const slide = pres.addSlide();
  pageBg(slide);
  addHeader(slide, "11", "两个提效利器：思维导图 & 错题本", "让零散的知识各归其所，让每一次错误都成为进步的台阶");

  // 左：思维导图
  const cw = (CONTENT_W-0.3)/2;
  const left = card(slide, CONTENT_X, 1.2, cw, 3.5, "F0FAF8");
  left.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:cw, h:0.55, fill:{color:C.secondary}, line:{type:'none'}});
  left.addText("🧠  思维导图：搭建知识框架", {x:0.2, y:0, w:cw-0.4, h:0.55, fontSize:15, bold:true, color:C.white, fontFace:FONT_TITLE, valign:'middle'});
  const mindmap = [
    {l:"搭建框架", d:"以核心概念为中心，列出主要分支"},
    {l:"优化框架", d:"补充分支之间的逻辑关联"},
    {l:"填充框架", d:"把零散知识点「按图」归位"},
  ];
  mindmap.forEach((m,i)=>{
    const y = 0.75 + i*0.8;
    left.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:0.25, y, w:cw-0.5, h:0.65, fill:{color:C.white}, line:{color:C.line, width:0.5}, rectRadius:0.06});
    left.addText("▸ "+m.l, {x:0.4, y:y+0.05, w:cw-0.7, h:0.28, fontSize:13, bold:true, color:C.secondary, fontFace:FONT_TITLE});
    left.addText(m.d, {x:0.4, y:y+0.32, w:cw-0.7, h:0.3, fontSize:10.5, color:C.muted, fontFace:FONT_BODY});
  });

  // 右：错题本
  const right = card(slide, CONTENT_X+cw+0.3, 1.2, cw, 3.5, "FFF8F0");
  right.addShape(pres.shapes.RECTANGLE, {x:0, y:0, w:cw, h:0.55, fill:{color:C.accent}, line:{type:'none'}});
  right.addText("📕  错题本：正确打开方式", {x:0.2, y:0, w:cw-0.4, h:0.55, fontSize:15, bold:true, color:C.white, fontFace:FONT_TITLE, valign:'middle'});
  const wrong = [
    {l:"不是抄题，是抄「思路」", d:"记下为什么错、卡在哪一步"},
    {l:"分类收录", d:"按知识点/题型分类，便于归纳"},
    {l:"定期二刷", d:"遮住答案重做，确认真的会了"},
  ];
  wrong.forEach((w,i)=>{
    const y = 0.75 + i*0.8;
    right.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:0.25, y, w:cw-0.5, h:0.65, fill:{color:C.white}, line:{color:C.line, width:0.5}, rectRadius:0.06});
    right.addText("▸ "+w.l, {x:0.4, y:y+0.05, w:cw-0.7, h:0.28, fontSize:13, bold:true, color:C.accent, fontFace:FONT_TITLE});
    right.addText(w.d, {x:0.4, y:y+0.32, w:cw-0.7, h:0.3, fontSize:10.5, color:C.muted, fontFace:FONT_BODY});
  });
  slide.render();
})();

// ============================================================
// Slide 15: 互动 - 我的适应行动卡
// ============================================================
(function(){
  const slide = pres.addSlide();
  slide.background = { color: C.primary };
  slide.addShape(pres.shapes.OVAL, {x:7.9, y:0.1, w:2.0, h:2.0, fill:{color:C.accent}, line:{type:'none'}});
  slide.addShape(pres.shapes.OVAL, {x:0.1, y:3.8, w:1.7, h:1.7, fill:{color:C.secondary}, line:{type:'none'}});

  slide.addText("✍️  我的适应行动卡", {x:CONTENT_X, y:0.6, w:CONTENT_W, h:0.6, fontSize:28, bold:true, color:C.white, fontFace:FONT_TITLE, charSpacing:2});
  slide.addText("请在纸上写下你的三个承诺 —— 从今天开始", {x:CONTENT_X, y:1.15, w:CONTENT_W, h:0.35, fontSize:13, color:"CADCFC", fontFace:FONT_BODY});

  const cards = [
    {n:"1", q:"我的「锚点科目」", a:"是 ______，因为 ______", c:C.accent},
    {n:"2", q:"我要主动「弄会」一道题", a:"今天/本周，我选择死磕 ______", c:C.secondary},
    {n:"3", q:"我只和自己比", a:"这周我要比上周进步：______", c:C.gold},
  ];
  cards.forEach((card,i)=>{
    const y = 1.7 + i*1.15;
    const c = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y, w:CONTENT_W, h:1.0, fill:{color:"1A3A45", transparency:15}, line:{color:card.c, width:1.2}, rectRadius:0.1});
    c.addShape(pres.shapes.OVAL, {x:0.25, y:0.25, w:0.5, h:0.5, fill:{color:card.c}, line:{type:'none'}}).addText(card.n, {x:0,y:0,w:0.5,h:0.5,fontSize:18,bold:true,color:C.white,align:'center',valign:'middle',fontFace:FONT_TITLE});
    c.addText(card.q, {x:0.95, y:0.12, w:CONTENT_W-1.2, h:0.38, fontSize:15, bold:true, color:C.white, fontFace:FONT_TITLE});
    c.addText(card.a, {x:0.95, y:0.52, w:CONTENT_W-1.2, h:0.4, fontSize:13, color:"E8F4F8", fontFace:FONT_BODY, italic:true});
  });
  slide.render();
})();

// ============================================================
// Slide 16: 结语
// ============================================================
(function(){
  const slide = pres.addSlide();
  slide.background = { color: C.primary };
  slide.addShape(pres.shapes.OVAL, {x:0.05, y:0.05, w:2.5, h:2.5, fill:{color:C.secondary}, line:{type:'none'}});
  slide.addShape(pres.shapes.OVAL, {x:7.7, y:3.2, w:2.2, h:2.2, fill:{color:C.accent}, line:{type:'none'}});

  slide.addText("说到底", {x:CONTENT_X, y:0.7, w:CONTENT_W, h:0.6, fontSize:24, color:C.gold, fontFace:FONT_TITLE});

  const main = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {x:CONTENT_X, y:1.4, w:CONTENT_W, h:2.6, fill:{color:"1A3A45", transparency:10}, line:{color:C.gold, width:1}, rectRadius:0.12});
  main.addText("那些进了高中就「颓了」的优秀学生，\n大多不是变坏了，不是堕落了。", {x:0.4, y:0.25, w:CONTENT_W-0.8, h:0.9, fontSize:16, color:C.white, fontFace:FONT_BODY});
  main.addText("他们遇到了一个系统从未处理过的情境：", {x:0.4, y:1.15, w:CONTENT_W-0.8, h:0.4, fontSize:14, color:"CADCFC", fontFace:FONT_BODY});
  main.addText("在一个不再承认你是第一的地方，\n你还愿不愿意继续努力？", {x:0.4, y:1.55, w:CONTENT_W-0.8, h:0.9, fontSize:19, bold:true, color:C.gold, fontFace:FONT_TITLE, charSpacing:1});

  slide.addText("这个问题的答案，可能比高考成绩更重要。\n因为高考之后，这样的情境还会再来——在大学，在工作。", {x:CONTENT_X, y:4.1, w:CONTENT_W, h:0.8, fontSize:12.5, color:"CADCFC", fontFace:FONT_BODY});

  slide.addShape(pres.shapes.RECTANGLE, {x:CENTER_X-0.6, y:5.0, w:1.2, h:0.04, fill:{color:C.gold}, line:{type:'none'}});
  slide.addText("高一这段灰暗的日子，不是 bug，是一次被迫的版本更新。\n装系统的过程会卡、会慢，但装完了，记得回来接着用。", {x:CONTENT_X, y:5.08, w:CONTENT_W, h:0.5, fontSize:11, color:"9DB4C0", fontFace:FONT_BODY, align:'center', italic:true});
  slide.render();
})();

// ============================================================
// 保存
// ============================================================
pres.writeFile({ fileName: "/workspace/高一学习适应班会课.pptx" })
  .then(() => console.log("PPT generated successfully!"))
  .catch(err => console.error("Error:", err));
