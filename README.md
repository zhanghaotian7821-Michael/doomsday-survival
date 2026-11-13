# 末日准备者 · 综合生存知识库

一个**纯静态**的末日/应急准备知识库：17 个知识分类、80 篇深度指南、5000+ 条物资数据库、智能方案推荐、避难所规划器与生存计算器。无后端、无追踪、可离线自托管。

> 状态：v1.1（2026-11 工程化改造）。内容与界面与 v1.0 一致，新增构建流程、数据校验门禁与自动部署。

## 快速开始

```bash
npm ci          # 安装依赖（仅 vite，无运行时依赖）
npm run dev     # 开发服务器 http://localhost:5173，改文件热更新
npm run build   # 生产构建 → dist/（构建前自动跑数据校验）
npm run preview # 本地预览 dist/
```

不想装依赖也可以：任何静态服务器直接指向仓库根目录即可运行（旧行为，仍然有效）。

## 目录结构

```
index.html            页面骨架（唯一入口，脚本由 src/main.js 引入）
src/main.js           迁移过渡入口：按顺序装载 6 个旧脚本（后续逐步模块化）
js/
  data.js             知识库数据：17 分类 / 85 子类 / 80 篇文章（正文为 HTML 字符串）
  resources.js        物资数据库生成器（5028 条，4 个档位）
  advisor.js          智能方案推荐引擎（预算/人数/威胁/地点 → 三阶段方案）
  calc.js             5 个生存计算器（水/食物/辐射/负重/燃料）
  shelter-planner.js  避难所规划器（5 步流程 + Canvas 平面图）
  app.js              应用主逻辑：路由、搜索、收藏、渲染
css/style.css         全站样式（深色主题，31 个 CSS 变量）
scripts/
  load-data.mjs       Node 侧读取 data.js（vm 沙箱，不需要 window）
  validate-data.mjs   数据完整性门禁（见下）
.github/workflows/    ci.yml（校验+构建）、pages.yml（自动部署）
```

## 数据校验（门禁）

```bash
npm run lint:data
```

校验 5 类规则，任何一条不过就以退出码 1 失败（CI 会拦下）：

1. 文章 `id` 唯一
2. `category` 必须存在于 `categories`
3. `category/subcategory` 组合必须存在
4. `related[]` 每项必须指向真实文章，且不得自引用
5. `importance` / `difficulty` 为 1–5 整数；`title`、`tags`、`content` 非空

当前基线：`✔ 17 分类 / 85 子类 / 80 篇文章`。

## 内容约定

新增一篇文章时，请在 `js/data.js` 的 `articles` 数组里追加对象，字段完整照抄同分类现有条目：

```js
{
  id: 'unique-kebab-id',          // 必填，全站唯一，被 related 引用
  category: 'shelter',            // 必须是 categories 里的 id
  subcategory: 'underground-bunker', // 必须是该分类下已声明的子类 id
  title: '标题',
  tags: ['关键词', '...'],         // 至少 1 个，搜索权重来源
  importance: 5,                  // 1–5
  difficulty: 4,                  // 1–5
  related: ['other-article-id'],  // 必须是已存在的 id
  content: `
<h2>小节标题</h2>
<p>……</p>
<div class="highlight-box"><strong>⚠️ 要点：</strong>……</div>
`
}
```

正文是原始 HTML：可用 `h2/h3`、`ul/li`、`table`（配 `.plan-table`）、`.highlight-box`。写完跑一次 `npm run lint:data` 再提交。

## 部署

推送到 `main` 后由 `.github/workflows/pages.yml` 自动构建并发布到 GitHub Pages。首次使用需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

构建使用 `base: './'`，因此 Pages 子路径（`/doomsday-survival/`）下可直接访问。

## 已知待办

- 数据层：`js/data.js` 仍是单体文件，计划拆成 `data/articles/*.md` + 构建期打包
- 性能：物资库 5028 条在首屏同步生成（约 2.2 MB），计划改为按分类懒加载
- 架构：6 个脚本仍通过 `window` 桥接连通，计划转为真正的 ES 模块
- 产品：PWA 离线、物资台账（保质期提醒）、30 天计划打卡尚未实现

完整任务拆解见 `docs/superpowers/plans/2026-11-12-doomsday-survival-upgrade.md`。

## 许可

未指定（作者未选定 LICENSE 前，默认保留所有权利）。
