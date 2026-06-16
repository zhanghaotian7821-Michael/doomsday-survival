// ============================================
// 末日准备者 - 生存计算器
// 水量、食物、辐射衰减、BOB负重、燃料
// ============================================

function renderCalculator() {
  return `
    <!-- 水量计算器 -->
    <div class="calc-section">
      <div class="calc-section-header">💧 饮用水需求计算器</div>
      <div class="calc-section-body">
        <div class="calc-row">
          <label>人数：</label>
          <input type="number" id="calcPeople" value="4" min="1" max="100">
          <span style="font-size:12px;color:var(--text-muted)">人</span>
        </div>
        <div class="calc-row">
          <label>预计时间：</label>
          <input type="number" id="calcDays" value="30" min="1" max="3650">
          <span style="font-size:12px;color:var(--text-muted)">天</span>
        </div>
        <div class="calc-row">
          <label>活动水平：</label>
          <select id="calcActivity">
            <option value="low">静坐/掩体生活 (2L/天)</option>
            <option value="medium" selected>中等活动 (3L/天)</option>
            <option value="high">高强度 (4L/天)</option>
            <option value="extreme">极热/极寒环境 (6L/天)</option>
          </select>
        </div>
        <div class="calc-result" id="waterResult">
          <h4>📊 计算结果</h4>
          <div class="cr-row"><span>每日需水量：</span><span class="cr-val" id="waterDaily">-</span></div>
          <div class="cr-row"><span>总需水量：</span><span class="cr-val" id="waterTotal">-</span></div>
          <div class="cr-row"><span>推荐储水容器：</span><span class="cr-val" id="waterContainers">-</span></div>
          <div class="cr-note">* 含饮用+基本卫生用水，不含洗浴</div>
        </div>
      </div>
    </div>

    <!-- 食物计算器 -->
    <div class="calc-section">
      <div class="calc-section-header">🍖 食物热量需求计算器</div>
      <div class="calc-section-body">
        <div class="calc-row">
          <label>人数：</label>
          <input type="number" id="calcFoodPeople" value="4" min="1" max="100">
          <span style="font-size:12px;color:var(--text-muted)">人</span>
        </div>
        <div class="calc-row">
          <label>预计时间：</label>
          <input type="number" id="calcFoodDays" value="30" min="1" max="3650">
          <span style="font-size:12px;color:var(--text-muted)">天</span>
        </div>
        <div class="calc-row">
          <label>活动水平：</label>
          <select id="calcFoodLevel">
            <option value="low">静坐 (1800 cal/天)</option>
            <option value="medium" selected>中等 (2200 cal/天)</option>
            <option value="high">高强度 (3000 cal/天)</option>
            <option value="extreme">极寒/战斗 (4500 cal/天)</option>
          </select>
        </div>
        <div class="calc-result" id="foodResult">
          <h4>📊 计算结果</h4>
          <div class="cr-row"><span>每日总热量：</span><span class="cr-val" id="foodDaily">-</span></div>
          <div class="cr-row"><span>总需热量：</span><span class="cr-val" id="foodTotal">-</span></div>
          <div class="cr-row"><span>大米等效重量：</span><span class="cr-val" id="foodRice">-</span></div>
          <div class="cr-row"><span>推荐粮食储备：</span><span class="cr-val" id="foodGrain">-</span></div>
          <div class="cr-row"><span>推荐蛋白质储备：</span><span class="cr-val" id="foodProtein">-</span></div>
          <div class="cr-note">* 粮食=谷物+豆类；蛋白质=肉干/冻干肉/奶粉。建议按碳水60%+蛋白质20%+脂肪20%配比</div>
        </div>
      </div>
    </div>

    <!-- 辐射衰减计算器 -->
    <div class="calc-section">
      <div class="calc-section-header">☢️ 放射性沉降物衰减计算器（7/10法则）</div>
      <div class="calc-section-body">
        <div class="calc-row">
          <label>当前辐射剂量率：</label>
          <input type="number" id="calcRadDose" value="100" min="0.01" max="10000" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">mSv/h (或任意单位)</span>
        </div>
        <div class="calc-row">
          <label>爆炸后时间：</label>
          <input type="number" id="calcRadTime" value="1" min="0.1" max="8760" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">小时</span>
        </div>
        <div class="calc-result" id="radResult">
          <h4>📊 辐射衰减预测</h4>
          <div class="cr-row"><span>7小时后：</span><span class="cr-val" id="rad7h">-</span></div>
          <div class="cr-row"><span>24小时（1天）后：</span><span class="cr-val" id="rad24h">-</span></div>
          <div class="cr-row"><span>48小时（2天）后：</span><span class="cr-val" id="rad48h">-</span></div>
          <div class="cr-row"><span>7天（1周）后：</span><span class="cr-val" id="rad7d">-</span></div>
          <div class="cr-row"><span>14天（2周）后：</span><span class="cr-val" id="rad14d">-</span></div>
          <div class="cr-row"><span>30天后：</span><span class="cr-val" id="rad30d">-</span></div>
          <div class="cr-row"><span>90天（3个月）后：</span><span class="cr-val" id="rad90d">-</span></div>
          <div class="cr-row"><span>降到安全水平(0.01)需要：</span><span class="cr-val" id="radSafe">-</span></div>
          <div class="cr-note">
            * 使用7/10近似法则：时间×7 → 辐射÷10<br>
            * 此为理论估算，实际受天气、地形、沉降物类型影响<br>
            * 安全水平因不同国家/标准而异，0.01 mSv/h ≈ 自然背景辐射的100倍
          </div>
        </div>
      </div>
    </div>

    <!-- BOB负重计算器 -->
    <div class="calc-section">
      <div class="calc-section-header">🎒 BOB逃生包负重计算器</div>
      <div class="calc-section-body">
        <div class="calc-row">
          <label>自身体重：</label>
          <input type="number" id="calcBobBase" value="70" min="30" max="150">
          <span style="font-size:12px;color:var(--text-muted)">kg</span>
        </div>
        <div class="calc-row">
          <label>水（3L=3kg建议）：</label>
          <input type="number" id="calcBobWater" value="3" min="0" max="20" step="0.5">
          <span style="font-size:12px;color:var(--text-muted)">kg</span>
        </div>
        <div class="calc-row">
          <label>食物：</label>
          <input type="number" id="calcBobFood" value="2" min="0" max="10" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">kg</span>
        </div>
        <div class="calc-row">
          <label>装备（刀/工具/庇护/衣物）：</label>
          <input type="number" id="calcBobGear" value="5" min="0" max="15" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">kg</span>
        </div>
        <div class="calc-row">
          <label>武器/弹药（如有）：</label>
          <input type="number" id="calcBobWeapon" value="3" min="0" max="15" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">kg</span>
        </div>
        <div class="calc-row">
          <label>其他（急救包/电子设备等）：</label>
          <input type="number" id="calcBobExtra" value="2" min="0" max="10" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">kg</span>
        </div>
        <div class="calc-result" id="bobResult">
          <h4>📊 负重评估</h4>
          <div class="cr-row"><span>BOB总重量：</span><span class="cr-val" id="bobTotal">-</span></div>
          <div class="cr-row"><span>占体重百分比：</span><span class="cr-val" id="bobPercent">-</span></div>
          <div class="cr-row"><span>推荐上限（15%体重）：</span><span class="cr-val" id="bobMax">-</span></div>
          <div class="cr-row"><span>负重状态：</span><span class="cr-val" id="bobStatus">-</span></div>
          <div class="cr-note">* 理想BOB重量 ≤ 体重的15%（训练有素者可放宽至20%）<br>* 超重的BOB你在第1小时就会后悔</div>
        </div>
      </div>
    </div>

    <!-- 燃料计算器 -->
    <div class="calc-section">
      <div class="calc-section-header">⛽ 发电机燃料消耗计算器</div>
      <div class="calc-section-body">
        <div class="calc-row">
          <label>发电机功率：</label>
          <select id="calcFuelDevice">
            <option value="1">小型逆变发电机 1kW (0.3L/h)</option>
            <option value="2" selected>中型发电机 2kW (0.6L/h)</option>
            <option value="3">大型发电机 3kW (0.9L/h)</option>
            <option value="5">工业发电机 5kW (1.5L/h)</option>
            <option value="custom">自定义...</option>
          </select>
        </div>
        <div class="calc-row" id="customFuelRow" style="display:none;">
          <label>油耗率：</label>
          <input type="number" id="calcFuelCustom" value="0.5" min="0.1" max="10" step="0.1">
          <span style="font-size:12px;color:var(--text-muted)">L/h</span>
        </div>
        <div class="calc-row">
          <label>每日运行时间：</label>
          <input type="number" id="calcFuelHours" value="4" min="1" max="24">
          <span style="font-size:12px;color:var(--text-muted)">小时</span>
        </div>
        <div class="calc-result" id="fuelResult">
          <h4>📊 燃料需求</h4>
          <div class="cr-row"><span>油耗率：</span><span class="cr-val" id="fuelRate">-</span></div>
          <div class="cr-row"><span>每日油耗：</span><span class="cr-val" id="fuelDaily">-</span></div>
          <div class="cr-row"><span>每周油耗：</span><span class="cr-val" id="fuelWeekly">-</span></div>
          <div class="cr-row"><span>每月油耗（30天）：</span><span class="cr-val" id="fuelMonthly">-</span></div>
          <div class="cr-row"><span>3个月油耗：</span><span class="cr-val" id="fuelQuarterly">-</span></div>
          <div class="cr-row"><span>6个月油耗：</span><span class="cr-val" id="fuelHalfYear">-</span></div>
          <div class="cr-row"><span>推荐燃料储备（含20%余量）：</span><span class="cr-val" id="fuelReserve">-</span></div>
          <div class="cr-note">
            * 建议使用太阳能+发电机混合方案减少燃料依赖<br>
            * 汽油保质期6-12月（加稳定剂可延长至2-3年），柴油2-5年，丙烷无限<br>
            * 发电机应每周运行至少30分钟防止化油器堵塞
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- 计算函数（供 app.js 调用）---

function calcWater() {
  const people = parseInt(document.getElementById('calcPeople')?.value) || 4;
  const days = parseInt(document.getElementById('calcDays')?.value) || 30;
  const activity = document.getElementById('calcActivity')?.value || 'medium';

  const rate = { low: 2, medium: 3, high: 4, extreme: 6 };
  const daily = people * rate[activity];
  const total = daily * days;

  document.getElementById('waterDaily').textContent = daily + ' L';
  document.getElementById('waterTotal').textContent = total + ' L (' + (total / 1000).toFixed(1) + ' m³)';
  document.getElementById('waterContainers').textContent =
    Math.ceil(total / 200) + ' 个200L桶 或 ' + Math.ceil(total / 19) + ' 个19L桶';
}

function calcFood() {
  const people = parseInt(document.getElementById('calcFoodPeople')?.value) || 4;
  const days = parseInt(document.getElementById('calcFoodDays')?.value) || 30;
  const level = document.getElementById('calcFoodLevel')?.value || 'medium';

  const dailyCal = { low: 1800, medium: 2200, high: 3000, extreme: 4500 };
  const daily = people * dailyCal[level];
  const total = daily * days;

  document.getElementById('foodDaily').textContent = daily.toLocaleString() + ' cal';
  document.getElementById('foodTotal').textContent = total.toLocaleString() + ' cal (' + (total / 1000000).toFixed(2) + ' 百万卡)';
  // Rice: ~3500 cal/kg
  document.getElementById('foodRice').textContent = (total / 3500).toFixed(1) + ' kg (仅大米)';
  // Recommended: 60% grain + 20% protein
  document.getElementById('foodGrain').textContent = ((total * 0.6) / 3500).toFixed(1) + ' kg 谷物/大米';
  document.getElementById('foodProtein').textContent = ((total * 0.2) / 4000).toFixed(1) + ' kg 豆类/肉类/奶粉';
}

function calcRadiation() {
  const dose = parseFloat(document.getElementById('calcRadDose')?.value) || 100;
  const hours = parseFloat(document.getElementById('calcRadTime')?.value) || 1;

  // 7/10 rule: R(t) = R0 * (t/t0)^(-1.2)  approximate
  // More precisely: R(t) ≈ R0 * 10^(-log10(t/t0*7)/log10(7))
  // Simple version: R(t) = R0 / (t/t0)^1.2
  const decay = (t) => dose * Math.pow(t / hours, -1.2);

  const times = [
    { id: 'rad7h', t: 7 },
    { id: 'rad24h', t: 24 },
    { id: 'rad48h', t: 48 },
    { id: 'rad7d', t: 168 },
    { id: 'rad14d', t: 336 },
    { id: 'rad30d', t: 720 },
    { id: 'rad90d', t: 2160 }
  ];

  times.forEach(({ id, t }) => {
    const el = document.getElementById(id);
    if (el) {
      const val = decay(t);
      if (val < 0.001) {
        el.textContent = val.toExponential(2);
      } else if (val < 1) {
        el.textContent = val.toFixed(3);
      } else {
        el.textContent = val.toFixed(1);
      }
      el.textContent += ' mSv/h';
    }
  });

  // Time to safe level (0.01 mSv/h)
  // Solve: dose * (t/hours)^(-1.2) = 0.01
  const safeTime = hours * Math.pow(dose / 0.01, 1 / 1.2);
  const safeEl = document.getElementById('radSafe');
  if (safeEl) {
    if (safeTime < 48) {
      safeEl.textContent = safeTime.toFixed(1) + ' 小时';
    } else if (safeTime < 720) {
      safeEl.textContent = (safeTime / 24).toFixed(1) + ' 天';
    } else if (safeTime < 8760) {
      safeEl.textContent = (safeTime / 720).toFixed(1) + ' 月';
    } else {
      safeEl.textContent = (safeTime / 8760).toFixed(1) + ' 年';
    }
  }
}

function calcBob() {
  const bodyWeight = parseFloat(document.getElementById('calcBobBase')?.value) || 70;
  const water = parseFloat(document.getElementById('calcBobWater')?.value) || 3;
  const food = parseFloat(document.getElementById('calcBobFood')?.value) || 2;
  const gear = parseFloat(document.getElementById('calcBobGear')?.value) || 5;
  const weapon = parseFloat(document.getElementById('calcBobWeapon')?.value) || 3;
  const extra = parseFloat(document.getElementById('calcBobExtra')?.value) || 2;

  const total = water + food + gear + weapon + extra;
  const percent = (total / bodyWeight) * 100;
  const maxWeight = bodyWeight * 0.15;

  document.getElementById('bobTotal').textContent = total.toFixed(1) + ' kg';
  document.getElementById('bobPercent').textContent = percent.toFixed(1) + '%';
  document.getElementById('bobMax').textContent = maxWeight.toFixed(1) + ' kg';

  const statusEl = document.getElementById('bobStatus');
  if (percent <= 15) {
    statusEl.textContent = '✅ 合理范围';
    statusEl.style.color = 'var(--success)';
  } else if (percent <= 20) {
    statusEl.textContent = '⚠️ 偏重但可承受（需训练）';
    statusEl.style.color = 'var(--warning)';
  } else if (percent <= 25) {
    statusEl.textContent = '🔴 过重！建议减负';
    statusEl.style.color = 'var(--danger)';
  } else {
    statusEl.textContent = '💀 极度超重！必须减负';
    statusEl.style.color = 'var(--danger)';
  }
}

function calcFuel() {
  const deviceEl = document.getElementById('calcFuelDevice');
  const device = deviceEl?.value || '2';
  const hours = parseInt(document.getElementById('calcFuelHours')?.value) || 4;

  let rateLh;
  if (device === 'custom') {
    rateLh = parseFloat(document.getElementById('calcFuelCustom')?.value) || 0.5;
    document.getElementById('customFuelRow').style.display = 'flex';
  } else {
    document.getElementById('customFuelRow').style.display = 'none';
    const rates = { '1': 0.3, '2': 0.6, '3': 0.9, '5': 1.5 };
    rateLh = rates[device] || 0.6;
  }

  // Show/hide custom row event
  if (deviceEl && !deviceEl._bound) {
    deviceEl._bound = true;
    deviceEl.addEventListener('change', () => {
      const row = document.getElementById('customFuelRow');
      if (deviceEl.value === 'custom') {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
      calcFuel();
    });
  }

  const daily = rateLh * hours;
  document.getElementById('fuelRate').textContent = rateLh.toFixed(1) + ' L/h';
  document.getElementById('fuelDaily').textContent = daily.toFixed(1) + ' L';
  document.getElementById('fuelWeekly').textContent = (daily * 7).toFixed(1) + ' L';
  document.getElementById('fuelMonthly').textContent = (daily * 30).toFixed(0) + ' L';
  document.getElementById('fuelQuarterly').textContent = (daily * 90).toFixed(0) + ' L';
  document.getElementById('fuelHalfYear').textContent = (daily * 180).toFixed(0) + ' L';
  document.getElementById('fuelReserve').textContent = (daily * 30 * 1.2).toFixed(0) + ' L (1个月+余量)';
}

// Expose to global scope for app.js
window.renderCalculator = renderCalculator;
window.calcWater = calcWater;
window.calcFood = calcFood;
window.calcRadiation = calcRadiation;
window.calcBob = calcBob;
window.calcFuel = calcFuel;
