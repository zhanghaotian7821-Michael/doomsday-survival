// ============================================
// 迁移过渡入口
// 目的：先把 6 个旧脚本按原有顺序纳入模块依赖图，行为与改造前完全一致。
// 后续按计划（Task 3–6）逐块改写成真正的 ES 模块，最终删掉这里的副作用导入。
// 顺序不可调整：app.js 依赖前面几个文件挂到 window 上的全局对象。
// ============================================
import '../js/data.js';
import '../js/resources.js';
import '../js/advisor.js';
import '../js/calc.js';
import '../js/shelter-planner.js';
import '../js/theme.js';
import '../js/icons.js';
import '../js/app.js';
