// ============================================
// 末日准备者 - DIY避难所规划器
// 5步向导 | Canvas平面图编辑器 | 材料清单
// ============================================

var SHELTER_PLANNER = {
  currentStep: 1,
  plan: {
    type: '',
    people: 4,
    duration: 90,     // days
    threats: [],
    area: 100,        // m²
    budget: 'standard',
    rooms: [],
    canvasState: null
  },

  roomTypes: [
    { id: 'living', name: '居住区', color: '#f0883e', icon: '🛏️', minArea: 8, suggestArea: 12, desc: '睡眠+日常活动空间' },
    { id: 'kitchen', name: '厨房/餐饮', color: '#d29922', icon: '🍳', minArea: 4, suggestArea: 6, desc: '食物准备和烹饪' },
    { id: 'toilet', name: '卫生区', color: '#58a6ff', icon: '🚽', minArea: 2, suggestArea: 3, desc: '化学厕所+洗手' },
    { id: 'storage', name: '储藏室', color: '#3fb950', icon: '📦', minArea: 4, suggestArea: 8, desc: '食物+水+物资储存' },
    { id: 'equipment', name: '设备间', color: '#f85149', icon: '⚙️', minArea: 4, suggestArea: 6, desc: '发电机+电池+通风' },
    { id: 'medical', name: '医疗室', color: '#ffffff', icon: '🏥', minArea: 3, suggestArea: 5, desc: '急救+隔离' },
    { id: 'airlock', name: '气闸/通道', color: '#8b949e', icon: '🚪', minArea: 3, suggestArea: 4, desc: '双门气闸+走廊' },
    { id: 'hydroponics', name: '种植室', color: '#7ee787', icon: '🌱', minArea: 6, suggestArea: 10, desc: '室内种植蔬菜' }
  ],

  shelterTypes: [
    { id: 'underground', name: '地下掩体', icon: '🏠', desc: '地下挖掘+混凝土结构。最高防护力，适合核/生化威胁。造价高、工期长。', materials: { concrete: 40, steel: 3000, soil: true } },
    { id: 'above-ground', name: '地上堡垒', icon: '🏰', desc: '加固现有建筑或新建地上结构。成本适中、施工快。防护力中等。', materials: { concrete: 20, steel: 1500, soil: true } },
    { id: 'hidden', name: '隐蔽所', icon: '🌿', desc: '利用自然地形或伪装。防护力低但隐蔽性极高。适合避开人祸。', materials: { concrete: 10, steel: 500, soil: false } },
    { id: 'container', name: '集装箱改造', icon: '📦', desc: '基于二手海运集装箱改造。成本最低、工期最短。需额外加固防水。', materials: { concrete: 15, steel: 800, soil: true } },
    { id: 'saferoom', name: '安全屋(室内)', icon: '🚪', desc: '在现有建筑内加固一个房间。最快最简单。适合快速避难。', materials: { concrete: 5, steel: 300, soil: false } },
    { id: 'custom', name: '完全自定义', icon: '🔧', desc: '自由设计所有参数。适合有特殊需求的准备者。', materials: { concrete: 0, steel: 0, soil: false } }
  ],

  init() {
    this.currentStep = 1;
    this.plan.rooms = [];
    this.plan.threats = [];
    this.plan.canvasState = null;
    this.render();
  },

  render() {
    const container = document.getElementById('plannerContent');
    if (!container) return;
    container.innerHTML = this.renderStep();
    this.bindStepEvents();
    if (this.currentStep === 3) this.initCanvas();
  },

  renderStep() {
    switch(this.currentStep) {
      case 1: return this.renderStep1_Type();
      case 2: return this.renderStep2_Params();
      case 3: return this.renderStep3_Canvas();
      case 4: return this.renderStep4_Plan();
      case 5: return this.renderStep5_Export();
      default: return '';
    }
  },

  // --- Step 1: 选择类型 ---
  renderStep1_Type() {
    return `
      <div class="planner-step">
        <div class="planner-progress">
          ${this.progressBar()}
        </div>
        <h2>第1步：选择避难所类型</h2>
        <p class="step-desc">选择适合你威胁环境和预算的避难所类型。每种类型有不同的防护等级和建造成本。</p>
        <div class="shelter-type-grid">
          ${this.shelterTypes.map(t => `
            <div class="shelter-type-card ${this.plan.type === t.id ? 'selected' : ''}" data-type="${t.id}">
              <div class="stc-icon">${t.icon}</div>
              <div class="stc-name">${t.name}</div>
              <div class="stc-desc">${t.desc}</div>
              <div class="stc-check">${this.plan.type === t.id ? '✓ 已选' : '点击选择'}</div>
            </div>
          `).join('')}
        </div>
        <div class="planner-nav">
          <button class="pn-btn secondary" disabled>← 上一步</button>
          <button class="pn-btn primary" id="step1Next" ${!this.plan.type ? 'disabled' : ''}>下一步 →</button>
        </div>
      </div>
    `;
  },

  // --- Step 2: 设置参数 ---
  renderStep2_Params() {
    const threatOptions = [
      { id: 'nuclear', name: '☢️ 核战争/辐射' },
      { id: 'bio', name: '🦠 生物武器/疫情' },
      { id: 'chem', name: '⚗️ 化学泄漏/攻击' },
      { id: 'natural', name: '🌋 自然灾害' },
      { id: 'civil', name: '💥 社会崩溃/暴乱' }
    ];
    const budgetOptions = [
      { id: 'basic', name: '基础 (DIY最低成本)', factor: 1 },
      { id: 'standard', name: '标准 (性价比最优)', factor: 2.5 },
      { id: 'premium', name: '高级 (专业级品质)', factor: 6 },
      { id: 'unlimited', name: '不计成本 (最强防护)', factor: 15 }
    ];
    return `
      <div class="planner-step">
        <div class="planner-progress">${this.progressBar()}</div>
        <h2>第2步：设置参数</h2>
        <div class="param-form">
          <div class="param-group">
            <label>👥 容纳人数</label>
            <input type="range" id="paramPeople" min="1" max="50" value="${this.plan.people}" oninput="this.nextElementSibling.textContent=this.value+'人'">
            <span>${this.plan.people}人</span>
          </div>
          <div class="param-group">
            <label>⏱️ 预计封闭时长</label>
            <select id="paramDuration">
              <option value="7" ${this.plan.duration===7?'selected':''}>7天 (短期危机)</option>
              <option value="30" ${this.plan.duration===30?'selected':''}>30天 (一个月)</option>
              <option value="90" ${this.plan.duration===90?'selected':''}>90天 (三个月)</option>
              <option value="180" ${this.plan.duration===180?'selected':''}>180天 (半年)</option>
              <option value="365" ${this.plan.duration===365?'selected':''}>365天 (一年)</option>
              <option value="1825" ${this.plan.duration===1825?'selected':''}>5年 (长期生存)</option>
            </select>
          </div>
          <div class="param-group">
            <label>⚠️ 主要威胁类型（可多选）</label>
            <div class="threat-chips">
              ${threatOptions.map(t => `
                <label class="threat-chip ${this.plan.threats.includes(t.id)?'active':''}">
                  <input type="checkbox" value="${t.id}" ${this.plan.threats.includes(t.id)?'checked':''} hidden>
                  ${t.name}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="param-group">
            <label>📐 可用面积</label>
            <input type="range" id="paramArea" min="20" max="500" step="10" value="${this.plan.area}" oninput="this.nextElementSibling.textContent=this.value+' m²'">
            <span>${this.plan.area} m²</span>
          </div>
          <div class="param-group">
            <label>💰 预算等级</label>
            <div class="budget-grid">
              ${budgetOptions.map(b => `
                <div class="budget-card ${this.plan.budget===b.id?'selected':''}" data-budget="${b.id}">
                  <div class="bc-name">${b.name}</div>
                  <div class="bc-check">${this.plan.budget===b.id?'✓':''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="planner-nav">
          <button class="pn-btn secondary" id="step2Back">← 上一步</button>
          <button class="pn-btn primary" id="step2Next">下一步 →</button>
        </div>
      </div>
    `;
  },

  // --- Step 3: Canvas平面图编辑器 ---
  renderStep3_Canvas() {
    const roomList = this.roomTypes.map(r => `
      <div class="room-palette-item" data-room="${r.id}" style="border-left:3px solid ${r.color}">
        <span>${r.icon}</span>
        <div>
          <div class="rpi-name">${r.name}</div>
          <div class="rpi-size">最少${r.minArea}m² / 建议${r.suggestArea}m²</div>
        </div>
        <button class="rpi-add" data-room="${r.id}">+添加</button>
      </div>
    `).join('');

    return `
      <div class="planner-step">
        <div class="planner-progress">${this.progressBar()}</div>
        <h2>第3步：设计平面图</h2>
        <p class="step-desc">从左侧面板添加房间 → 在Canvas上拖拽调整位置和大小 → 设计你的避难所布局</p>
        <div class="canvas-workspace">
          <div class="room-palette">
            <h4>🏗️ 房间类型</h4>
            ${roomList}
            <div class="palette-info">
              <p>📐 总面积: <strong id="canvasTotalArea">0 m²</strong></p>
              <p>📏 可用面积: <strong>${this.plan.area} m²</strong></p>
              <p>💡 点击房间选中 → 拖拽移动 → 拖拽角落调整大小</p>
            </div>
            <button class="pn-btn secondary" id="clearRooms" style="width:100%;margin-top:8px;">🗑️ 清除所有房间</button>
          </div>
          <div class="canvas-container">
            <canvas id="shelterCanvas" width="700" height="500"></canvas>
            <div class="canvas-controls">
              <span>🖱️ 拖拽移动 | 拖拽四角调整大小 | 双击删除 | </span>
              <span style="font-family:var(--font-mono);font-size:12px;" id="canvasInfo">选中: 无</span>
            </div>
          </div>
        </div>
        <div class="planner-nav">
          <button class="pn-btn secondary" id="step3Back">← 上一步</button>
          <button class="pn-btn primary" id="step3Next">生成建造计划 →</button>
        </div>
      </div>
    `;
  },

  // --- Step 4: 建造计划 ---
  renderStep4_Plan() {
    const totalRoomArea = this.plan.rooms.reduce((s, r) => s + (r.w * r.h), 0);
    const foodDays = this.plan.people * this.plan.duration;
    const waterLiters = foodDays * 3;
    const foodKg = foodDays * 0.6;
    const shelterType = this.shelterTypes.find(t => t.id === this.plan.type) || this.shelterTypes[0];
    const budgetFactor = { basic: 1, standard: 2.5, premium: 6, unlimited: 15 }[this.plan.budget] || 2.5;

    const concreteNeeded = Math.max(0, (totalRoomArea * 0.3 * shelterType.materials.concrete / 40 * budgetFactor).toFixed(1));
    const steelNeeded = Math.max(0, (totalRoomArea * shelterType.materials.steel / 40 * budgetFactor).toFixed(0));

    const calcItems = [
      { label: '混凝土 (结构)', value: concreteNeeded + ' m³', note: '含底板+墙体+顶板' },
      { label: '钢筋', value: steelNeeded + ' kg', note: '结构加固' },
      { label: '防水材料', value: (totalRoomArea * 1.5).toFixed(0) + ' m²', note: '全面防水处理' },
      { label: '通风管道', value: (Math.sqrt(totalRoomArea) * 3).toFixed(1) + ' m', note: '进风+排风' },
      { label: '电缆', value: (Math.sqrt(totalRoomArea) * 5).toFixed(0) + ' m', note: '照明+插座+设备' },
      { label: 'NBC过滤器', value: Math.ceil(this.plan.people / 2) + ' 套', note: '每2人配1套' },
      { label: '饮用水储备', value: (waterLiters / 1000).toFixed(1) + ' 吨(' + waterLiters + 'L)', note: '按每人3L/天' },
      { label: '食物储备', value: (foodKg * budgetFactor).toFixed(0) + ' kg', note: '谷物+豆类+罐头' },
      { label: '燃料储备', value: (this.plan.duration * this.plan.people * 0.05).toFixed(0) + ' L', note: '烹饪+应急发电' },
      { label: '太阳能板(建议)', value: Math.ceil(this.plan.people * 0.2) + ' kW', note: '基础电力供应' },
      { label: '电池容量(建议)', value: (this.plan.people * this.plan.duration * 0.02).toFixed(0) + ' kWh', note: '储能' }
    ];

    return `
      <div class="planner-step">
        <div class="planner-progress">${this.progressBar()}</div>
        <h2>第4步：建造与物资计划</h2>
        <div class="plan-summary">
          <div class="plan-summary-card">
            <div class="psc-icon">${shelterType.icon}</div>
            <div class="psc-detail">
              <strong>${shelterType.name}</strong> | ${this.plan.people}人 | ${this.plan.duration}天 | ${totalRoomArea.toFixed(0)}m²使用面积
            </div>
          </div>
        </div>
        <div class="plan-sections">
          <div class="plan-section">
            <h3>🧱 建材清单</h3>
            <table class="plan-table">
              <tr><th>项目</th><th>数量</th><th>说明</th></tr>
              ${calcItems.filter(i => ['混凝土','钢筋','防水材料','通风管道','电缆','NBC过滤器'].includes(i.label.split('(')[0].trim())).map(i => `
                <tr><td>${i.label}</td><td>${i.value}</td><td>${i.note}</td></tr>
              `).join('')}
            </table>
          </div>
          <div class="plan-section">
            <h3>📦 物资储备建议</h3>
            <table class="plan-table">
              <tr><th>项目</th><th>数量</th><th>说明</th></tr>
              ${calcItems.filter(i => ['饮用水','食物','燃料','太阳能','电池'].includes(i.label.split('(')[0].trim())).map(i => `
                <tr><td>${i.label}</td><td>${i.value}</td><td>${i.note}</td></tr>
              `).join('')}
            </table>
          </div>
          <div class="plan-section">
            <h3>⏱️ 估算建造时间</h3>
            <table class="plan-table">
              <tr><th>施工方式</th><th>预计时间</th></tr>
              <tr><td>专业施工队</td><td>${Math.ceil(totalRoomArea/5)}-${Math.ceil(totalRoomArea/3)} 周</td></tr>
              <tr><td>自助施工(有经验)</td><td>${Math.ceil(totalRoomArea/2)}-${Math.ceil(totalRoomArea)} 周</td></tr>
              <tr><td>应急搭建(基础版)</td><td>${Math.ceil(totalRoomArea/1.5)}-${Math.ceil(totalRoomArea*2)} 天</td></tr>
            </table>
          </div>
        </div>
        <div class="planner-nav">
          <button class="pn-btn secondary" id="step4Back">← 返回编辑</button>
          <button class="pn-btn primary" id="step4Next">导出计划 →</button>
        </div>
      </div>
    `;
  },

  // --- Step 5: 导出 ---
  renderStep5_Export() {
    return `
      <div class="planner-step">
        <div class="planner-progress">${this.progressBar()}</div>
        <h2>第5步：导出你的避难所计划</h2>
        <div class="export-options">
          <div class="export-card" id="exportPrint">
            <div class="ec-icon">🖨️</div>
            <div class="ec-title">打印计划</div>
            <div class="ec-desc">生成可打印的完整计划书，包含所有清单</div>
            <button class="pn-btn primary">立即打印</button>
          </div>
          <div class="export-card" id="exportSave">
            <div class="ec-icon">💾</div>
            <div class="ec-title">保存计划</div>
            <div class="ec-desc">保存到本地存储，随时回来编辑修改</div>
            <button class="pn-btn primary">保存</button>
          </div>
          <div class="export-card" id="exportText">
            <div class="ec-icon">📋</div>
            <div class="ec-title">复制文本清单</div>
            <div class="ec-desc">生成纯文本的物资清单，可粘贴到笔记本</div>
            <button class="pn-btn primary">复制</button>
          </div>
        </div>
        <div class="planner-nav">
          <button class="pn-btn secondary" id="step5Back">← 返回上一步</button>
          <button class="pn-btn primary" id="step5Restart">🔄 开始新规划</button>
        </div>
      </div>
    `;
  },

  progressBar() {
    const steps = ['选择类型', '设置参数', '设计平面图', '建造计划', '导出'];
    return `
      <div class="progress-track">
        ${steps.map((s, i) => `
          <div class="progress-step ${i+1 < this.currentStep ? 'done' : ''} ${i+1 === this.currentStep ? 'current' : ''}">
            <div class="ps-dot">${i+1 < this.currentStep ? '✓' : i+1}</div>
            <div class="ps-label">${s}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // --- Canvas 编辑器 ---
  initCanvas() {
    const canvas = document.getElementById('shelterCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // If no rooms yet, add suggested defaults
    if (this.plan.rooms.length === 0) {
      const defaults = [
        { type: 'living', x: 420, y: 30, w: 140, h: 120 },
        { type: 'kitchen', x: 420, y: 180, w: 100, h: 80 },
        { type: 'toilet', x: 560, y: 180, w: 80, h: 80 },
        { type: 'storage', x: 30, y: 200, w: 130, h: 120 },
        { type: 'equipment', x: 180, y: 350, w: 100, h: 80 },
        { type: 'airlock', x: 30, y: 30, w: 100, h: 120 },
      ];
      defaults.forEach(d => {
        this.plan.rooms.push({
          id: 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: d.type,
          x: d.x, y: d.y, w: d.w, h: d.h,
        });
      });
    }

    let selectedRoom = null;
    let dragMode = null; // 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se'
    let dragStart = { x: 0, y: 0 };
    let roomStart = { x: 0, y: 0, w: 0, h: 0 };
    const GRID = 10;
    const HANDLE_SIZE = 8;

    const getRoomAt = (mx, my) => {
      for (let i = this.plan.rooms.length - 1; i >= 0; i--) {
        const r = this.plan.rooms[i];
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return { room: r, index: i };
      }
      return null;
    };

    const getHandleAt = (mx, my, room) => {
      const h = HANDLE_SIZE;
      if (Math.abs(mx - room.x) < h && Math.abs(my - room.y) < h) return 'nw';
      if (Math.abs(mx - (room.x + room.w)) < h && Math.abs(my - room.y) < h) return 'ne';
      if (Math.abs(mx - room.x) < h && Math.abs(my - (room.y + room.h)) < h) return 'sw';
      if (Math.abs(mx - (room.x + room.w)) < h && Math.abs(my - (room.y + room.h)) < h) return 'se';
      return null;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#21262d';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Boundary
      ctx.strokeStyle = '#f0883e';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(20, 20, 660, 460);
      ctx.setLineDash([]);

      // Dimensions label
      ctx.fillStyle = '#8b949e';
      ctx.font = '11px sans-serif';
      ctx.fillText(`可用范围: 660×460 (网格=${GRID}px)  代表 ${this.plan.area}m² 可用面积`, 25, 15);

      // Rooms
      this.plan.rooms.forEach(r => {
        const rt = this.roomTypes.find(t => t.id === r.type);
        const color = rt ? rt.color : '#888';

        // Fill
        ctx.fillStyle = color + '30';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        // Border
        ctx.strokeStyle = (selectedRoom && selectedRoom.id === r.id) ? '#fff' : color;
        ctx.lineWidth = (selectedRoom && selectedRoom.id === r.id) ? 3 : 2;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        const label = rt ? rt.icon + ' ' + rt.name : r.type;
        ctx.fillText(label, r.x + 4, r.y + 16);
        ctx.fillStyle = '#8b949e';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${(r.w*r.w*this.plan.area/(660*460)).toFixed(1)}m²`, r.x + 4, r.y + 30);

        // Handles (only for selected)
        if (selectedRoom && selectedRoom.id === r.id) {
          [[r.x, r.y], [r.x+r.w, r.y], [r.x, r.y+r.h], [r.x+r.w, r.y+r.h]].forEach(([hx, hy]) => {
            ctx.fillStyle = '#fff';
            ctx.fillRect(hx-HANDLE_SIZE/2, hy-HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(hx-HANDLE_SIZE/2, hy-HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
          });
        }
      });

      updateTotalArea();
    };

    const updateTotalArea = () => {
      const total = this.plan.rooms.reduce((s, r) => s + (r.w * r.h * this.plan.area / (660 * 460)), 0);
      const el = document.getElementById('canvasTotalArea');
      if (el) el.textContent = total.toFixed(1) + ' m²';
    };

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const hit = getRoomAt(mx, my);
      if (hit) {
        selectedRoom = hit.room;
        const handle = getHandleAt(mx, my, hit.room);
        if (handle) {
          dragMode = 'resize-' + handle;
        } else {
          dragMode = 'move';
        }
        dragStart = { x: mx, y: my };
        roomStart = { x: hit.room.x, y: hit.room.y, w: hit.room.w, h: hit.room.h };
        document.getElementById('canvasInfo').textContent = `选中: ${this.roomTypes.find(t=>t.id===hit.room.type)?.name || hit.room.type}`;
      } else {
        selectedRoom = null;
        dragMode = null;
        document.getElementById('canvasInfo').textContent = '选中: 无';
      }
      draw();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (!dragMode || !selectedRoom) {
        // Change cursor on handles
        const hit = getRoomAt(mx, my);
        if (hit && getHandleAt(mx, my, hit.room)) {
          canvas.style.cursor = 'nwse-resize';
        } else if (hit) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
        return;
      }

      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      const snap = (v) => Math.round(v / GRID) * GRID;

      if (dragMode === 'move') {
        selectedRoom.x = snap(roomStart.x + dx);
        selectedRoom.y = snap(roomStart.y + dy);
        selectedRoom.x = Math.max(20, Math.min(680 - selectedRoom.w, selectedRoom.x));
        selectedRoom.y = Math.max(20, Math.min(480 - selectedRoom.h, selectedRoom.y));
      } else {
        if (dragMode.includes('nw')) {
          selectedRoom.x = Math.min(roomStart.x + roomStart.w - 30, snap(roomStart.x + dx));
          selectedRoom.y = Math.min(roomStart.y + roomStart.h - 30, snap(roomStart.y + dy));
          selectedRoom.w = roomStart.x + roomStart.w - selectedRoom.x;
          selectedRoom.h = roomStart.y + roomStart.h - selectedRoom.y;
        }
        if (dragMode.includes('ne')) {
          selectedRoom.w = Math.max(30, snap(roomStart.w + dx));
          selectedRoom.y = Math.min(roomStart.y + roomStart.h - 30, snap(roomStart.y + dy));
          selectedRoom.h = roomStart.y + roomStart.h - selectedRoom.y;
        }
        if (dragMode.includes('sw')) {
          selectedRoom.x = Math.min(roomStart.x + roomStart.w - 30, snap(roomStart.x + dx));
          selectedRoom.w = roomStart.x + roomStart.w - selectedRoom.x;
          selectedRoom.h = Math.max(30, snap(roomStart.h + dy));
        }
        if (dragMode.includes('se')) {
          selectedRoom.w = Math.max(30, snap(roomStart.w + dx));
          selectedRoom.h = Math.max(30, snap(roomStart.h + dy));
        }
      }
      draw();
    });

    canvas.addEventListener('mouseup', () => {
      dragMode = null;
      this.plan.canvasState = JSON.parse(JSON.stringify(this.plan.rooms));
    });

    canvas.addEventListener('dblclick', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = getRoomAt(mx, my);
      if (hit) {
        this.plan.rooms.splice(hit.index, 1);
        if (selectedRoom === hit.room) selectedRoom = null;
        draw();
      }
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY });
        canvas.dispatchEvent(mouseEvent);
      }
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY });
        canvas.dispatchEvent(mouseEvent);
      }
    });
    canvas.addEventListener('touchend', () => {
      canvas.dispatchEvent(new MouseEvent('mouseup'));
    });

    draw();
  },

  // --- Event binding ---
  bindStepEvents() {
    // Step 1
    document.querySelectorAll('.shelter-type-card').forEach(card => {
      card.addEventListener('click', () => {
        this.plan.type = card.dataset.type;
        document.querySelectorAll('.shelter-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.querySelectorAll('.stc-check').forEach(c => c.textContent = '点击选择');
        card.querySelector('.stc-check').textContent = '✓ 已选';
        const btn = document.getElementById('step1Next');
        if (btn) btn.disabled = false;
      });
    });
    const btn1 = document.getElementById('step1Next');
    if (btn1) btn1.addEventListener('click', () => { this.currentStep = 2; this.render(); });

    // Step 2
    const btn2Back = document.getElementById('step2Back');
    if (btn2Back) btn2Back.addEventListener('click', () => { this.currentStep = 1; this.render(); });
    const btn2Next = document.getElementById('step2Next');
    if (btn2Next) btn2Next.addEventListener('click', () => {
      const peopleEl = document.getElementById('paramPeople');
      const durationEl = document.getElementById('paramDuration');
      const areaEl = document.getElementById('paramArea');
      if (peopleEl) this.plan.people = parseInt(peopleEl.value);
      if (durationEl) this.plan.duration = parseInt(durationEl.value);
      if (areaEl) this.plan.area = parseInt(areaEl.value);
      // Collect threats
      this.plan.threats = [];
      document.querySelectorAll('.threat-chip input:checked').forEach(cb => {
        this.plan.threats.push(cb.value);
      });
      // Budget
      const budgetEl = document.querySelector('.budget-card.selected');
      if (budgetEl) this.plan.budget = budgetEl.dataset.budget;

      this.currentStep = 3;
      this.render();
    });

    // Threat chip toggles
    document.querySelectorAll('.threat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cb = chip.querySelector('input');
        cb.checked = !cb.checked;
        chip.classList.toggle('active', cb.checked);
      });
    });
    document.querySelectorAll('.budget-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.budget-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });

    // Step 3
    const btn3Back = document.getElementById('step3Back');
    if (btn3Back) btn3Back.addEventListener('click', () => { this.currentStep = 2; this.render(); });
    const btn3Next = document.getElementById('step3Next');
    if (btn3Next) btn3Next.addEventListener('click', () => {
      this.plan.canvasState = JSON.parse(JSON.stringify(this.plan.rooms));
      this.currentStep = 4; this.render();
    });

    // Add room buttons
    document.querySelectorAll('.rpi-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const roomType = btn.dataset.room;
        const rt = this.roomTypes.find(t => t.id === roomType);
        const newRoom = {
          id: 'room_' + Date.now(),
          type: roomType,
          x: 50 + Math.random() * 400,
          y: 50 + Math.random() * 200,
          w: rt ? rt.suggestArea * 5 : 50,
          h: rt ? rt.suggestArea * 4 : 40
        };
        this.plan.rooms.push(newRoom);
        // Redraw canvas
        const canvas = document.getElementById('shelterCanvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const drawEvent = new Event('mousedown');
          canvas.dispatchEvent(drawEvent);
        }
        this.initCanvas();
      });
    });

    // Clear rooms
    const clearBtn = document.getElementById('clearRooms');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      this.plan.rooms = [];
      this.initCanvas();
    });

    // Step 4
    const btn4Back = document.getElementById('step4Back');
    if (btn4Back) btn4Back.addEventListener('click', () => { this.currentStep = 3; this.render(); });
    const btn4Next = document.getElementById('step4Next');
    if (btn4Next) btn4Next.addEventListener('click', () => { this.currentStep = 5; this.render(); });

    // Step 5
    const btn5Back = document.getElementById('step5Back');
    if (btn5Back) btn5Back.addEventListener('click', () => { this.currentStep = 4; this.render(); });
    const btn5Restart = document.getElementById('step5Restart');
    if (btn5Restart) btn5Restart.addEventListener('click', () => { this.init(); });

    // Export actions
    const exportPrint = document.getElementById('exportPrint');
    if (exportPrint) exportPrint.addEventListener('click', () => window.print());
    const exportSave = document.getElementById('exportSave');
    if (exportSave) exportSave.addEventListener('click', () => {
      try {
        const saved = JSON.parse(localStorage.getItem('shelter_plans') || '[]');
        saved.push({ date: new Date().toISOString(), plan: JSON.parse(JSON.stringify(this.plan)) });
        localStorage.setItem('shelter_plans', JSON.stringify(saved));
        alert('✅ 计划已保存！下次打开规划器时可继续编辑。');
      } catch(e) {
        alert('保存失败：' + e.message);
      }
    });
    const exportText = document.getElementById('exportText');
    if (exportText) exportText.addEventListener('click', () => {
      const text = this.generateTextPlan();
      navigator.clipboard.writeText(text).then(() => alert('✅ 文本清单已复制到剪贴板！')).catch(() => prompt('手动复制：', text));
    });
  },

  generateTextPlan() {
    const totalArea = this.plan.rooms.reduce((s, r) => s + (r.w * r.h * this.plan.area / (660 * 460)), 0);
    let text = '══════════════════════════════\n';
    text += '  末日避难所建造计划\n';
    text += '══════════════════════════════\n\n';
    text += `类型: ${this.shelterTypes.find(t=>t.id===this.plan.type)?.name || '未指定'}\n`;
    text += `人数: ${this.plan.people}人 | 时长: ${this.plan.duration}天\n`;
    text += `总使用面积: ${totalArea.toFixed(1)} m²\n\n`;
    text += '--- 房间列表 ---\n';
    this.plan.rooms.forEach(r => {
      const rt = this.roomTypes.find(t => t.id === r.type);
      const area = (r.w * r.h * this.plan.area / (660 * 460)).toFixed(1);
      text += `  ${rt?.icon || '?'} ${rt?.name || r.type}: ${area} m²\n`;
    });
    text += '\n--- 物资储备 ---\n';
    text += `  水: ${(this.plan.people * this.plan.duration * 3 / 1000).toFixed(1)} 吨\n`;
    text += `  食物: ${(this.plan.people * this.plan.duration * 0.6).toFixed(0)} kg\n`;
    text += `  燃料: ${(this.plan.people * this.plan.duration * 0.05).toFixed(0)} L\n`;
    text += '\n══════════════════════════════\n';
    text += `  生成时间: ${new Date().toLocaleString()}\n`;
    text += '  末日准备者知识库 - shelter-planner\n';
    return text;
  }
};

// Expose globally
window.SHELTER_PLANNER = SHELTER_PLANNER;
