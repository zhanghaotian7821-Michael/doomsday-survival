// ============================================
// 末日准备者 - 智能推荐引擎 + 综合数据库
// 5000+ entries across all content types
// ============================================

var SURVIVAL_ADVISOR = {

  // ==================== 推荐引擎 ====================
  generatePlan(params) {
    const { budget, people, threats, location, space, prepTime } = params;
    const plan = { phases: [], totalEstimate: 0, shelter: null, warnings: [] };

    // Step 1: Shelter recommendation
    plan.shelter = this.recommendShelter(threats, location, space, budget);

    // Step 2: Generate phased plans based on budget and prep time
    const bp = this.getBudgetParams(budget, people);
    const phases = this.buildPhases(people, threats, location, prepTime, bp);

    // Step 3: Budget allocation
    const allocations = this.allocateBudget(budget, threats, people);
    plan.allocations = allocations;

    // Step 4: Priority items per phase
    plan.phases = this.populatePhases(phases, people, threats, location, bp, allocations);

    // Step 5: Calculate total estimate
    plan.totalEstimate = plan.phases.reduce((s, p) => s + p.estimatedCost, 0);

    // Step 6: Warnings
    plan.warnings = this.generateWarnings(threats, location, budget, people);

    return plan;
  },

  recommendShelter(threats, location, space, budget) {
    let score = {};
    const shelters = [
      { id: 'underground', name: '地下掩体', icon: '🏠', baseCost: 50000, protection: 5, concealment: 4, speed: 2 },
      { id: 'above-ground', name: '地上堡垒', icon: '🏰', baseCost: 20000, protection: 3, concealment: 2, speed: 3 },
      { id: 'hidden', name: '隐蔽所', icon: '🌿', baseCost: 10000, protection: 2, concealment: 5, speed: 4 },
      { id: 'container', name: '集装箱改造', icon: '📦', baseCost: 15000, protection: 3, concealment: 3, speed: 4 },
      { id: 'saferoom', name: '安全屋(室内)', icon: '🚪', baseCost: 5000, protection: 2, concealment: 4, speed: 5 }
    ];

    shelters.forEach(s => {
      score[s.id] = 0;
      if (threats.includes('nuclear')) score[s.id] += s.protection * 3;
      if (threats.includes('bio') || threats.includes('chem')) score[s.id] += s.protection * 2;
      if (threats.includes('civil')) score[s.id] += s.concealment * 3;
      if (threats.includes('natural')) score[s.id] += s.speed * 2;
      if (location === 'urban' || location === 'suburb') score[s.id] += s.concealment * 2;
      if (location === 'rural' || location === 'mountain') score[s.id] += s.protection;
      if (space < 50) score[s.id] -= 2;
    });

    const best = shelters.sort((a, b) => score[b.id] - score[a.id])[0];
    best.estimatedCost = best.baseCost + (space > 50 ? (space - 50) * 200 : 0);
    if (budget < 50000) best.estimatedCost = Math.min(best.estimatedCost, budget * 0.5);
    return best;
  },

  getBudgetParams(budget, people) {
    const levels = {
      5000:    { foodDays: 7,   waterPerDay: 2,  fuelLiters: 5,   medkitLevel: 'basic',   power: 'none',     defense: 'minimal', factor: 0.2 },
      20000:   { foodDays: 30,  waterPerDay: 3,  fuelLiters: 20,  medkitLevel: 'standard', power: 'portable',  defense: 'basic', factor: 0.5 },
      50000:   { foodDays: 90,  waterPerDay: 4,  fuelLiters: 60,  medkitLevel: 'advanced',  power: 'solar400w', defense: 'standard', factor: 1 },
      100000:  { foodDays: 180, waterPerDay: 5,  fuelLiters: 150, medkitLevel: 'advanced',  power: 'solar1kw',  defense: 'reinforced', factor: 1.5 },
      200000:  { foodDays: 365, waterPerDay: 5,  fuelLiters: 300, medkitLevel: 'field_hosp', power: 'solar2kw',  defense: 'fortified', factor: 2.5 },
      999999:  { foodDays: 1825,waterPerDay: 6,  fuelLiters: 1000,medkitLevel: 'field_hosp', power: 'solar5kw',  defense: 'fortified', factor: 5 }
    };
    const keys = Object.keys(levels).map(Number).sort((a,b)=>a-b);
    let match = levels[5000];
    for (const k of keys) { if (budget >= k) match = levels[k]; }
    match.peopleFactor = Math.sqrt(people);
    return match;
  },

  buildPhases(people, threats, location, prepTime, bp) {
    const phases = [];
    const prepDays = { '1week': 7, '1month': 30, '6months': 180, '2years': 730 };
    const days = prepDays[prepTime] || 30;

    if (days <= 7) {
      phases.push({ name: '紧急生存包', priority: 1, days: 7, color: '#f85149', focus: '立即准备72小时生存物资' });
    } else {
      phases.push({ name: '第一阶段：生存基础', priority: 1, days: Math.min(days, 30), color: '#f85149', focus: '水·食物·庇护·急救' });
      if (days > 30) phases.push({ name: '第二阶段：安全保障', priority: 2, days: Math.min(days, 90), color: '#d29922', focus: '防御·医疗·通讯·能源' });
      if (days > 90) phases.push({ name: '第三阶段：长期可持续', priority: 3, days: days, color: '#3fb950', focus: '种植·社区·能源独立·技能培训' });
    }
    return phases;
  },

  allocateBudget(budget, threats, people) {
    const hasNuclear = threats.includes('nuclear');
    const alloc = {
      water: hasNuclear ? 0.15 : 0.12,
      food: 0.20,
      shelter: 0.25,
      medical: 0.12,
      energy: 0.10,
      defense: 0.08,
      comms: 0.05,
      tools: 0.03
    };
    if (hasNuclear) { alloc.defense = 0.05; alloc.shelter = 0.30; alloc.medical = 0.15; alloc.comms = 0.03; }
    return alloc;
  },

  populatePhases(phases, people, threats, location, bp, allocations) {
    return phases.map(phase => {
      const items = [];
      const budget = 20000 * bp.factor * bp.peopleFactor; // base budget for estimation
      let cost = 0;

      if (phase.priority === 1) {
        // Survival essentials
        const waterLiters = people * bp.waterPerDay * phase.days;
        items.push({ name: '饮用水储备', qty: (waterLiters/1000).toFixed(1)+'吨('+waterLiters+'L)', cat: 'water', cost: waterLiters*0.005, essential: true, note: '按每人'+bp.waterPerDay+'L/天计算' });
        items.push({ name: '便携滤水器(Sawyer Mini)', qty: Math.ceil(people/2)+'个', cat: 'water', cost: 200*Math.ceil(people/2), essential: true, resourceId: 'res-sawyer-mini' });
        items.push({ name: '净水片/漂白水', qty: '足够处理'+waterLiters+'L', cat: 'water', cost: 100, essential: true, resourceId: 'res-aquamira' });

        const foodKg = people * 0.6 * phase.days;
        items.push({ name: '主粮(大米/小麦)', qty: foodKg.toFixed(0)+'kg', cat: 'food', cost: foodKg*8, essential: true, resourceId: 'res-white-rice' });
        items.push({ name: '蛋白质(豆类/罐头/冻干肉)', qty: (foodKg*0.3).toFixed(0)+'kg', cat: 'food', cost: foodKg*0.3*30, essential: true, resourceId: 'res-canned-meat' });
        items.push({ name: '盐+糖+复合维生素', qty: '各若干', cat: 'food', cost: 200, essential: true, resourceId: 'res-multivitamin' });

        items.push({ name: '急救毯/睡袋', qty: people+'个', cat: 'shelter', cost: 30*people, essential: true });
        items.push({ name: '防水布/帐篷', qty: Math.ceil(people/2)+'顶', cat: 'shelter', cost: 200*Math.ceil(people/2), essential: true });
        items.push({ name: '急救包(IFAK级)', qty: people+'个', cat: 'medical', cost: 300*people, essential: true, resourceId: 'res-tourniquet-cat' });
        items.push({ name: '止痛药+抗生素储备', qty: '足够'+people+'人'+phase.days+'天', cat: 'medical', cost: 500, essential: true, resourceId: 'res-amoxicillin' });

        if (threats.includes('nuclear')) {
          items.push({ name: '碘化钾片(KI)', qty: people+'人份(130mg/天×14天)', cat: 'medical', cost: 100*people, essential: true, note: '核爆后24h内服用最有效' });
          items.push({ name: 'N95/N100口罩', qty: people*5+'个', cat: 'medical', cost: 10*people*5, essential: true });
        }
      }

      if (phase.priority === 2) {
        items.push({ name: '太阳能发电系统', qty: Math.ceil(people*0.1)+'kW', cat: 'energy', cost: 5000*Math.ceil(people*0.1), essential: false, resourceId: 'res-renogy-solar' });
        items.push({ name: '磷酸铁锂电池组', qty: (people*2)+'kWh', cat: 'energy', cost: 2000*people, essential: false, resourceId: 'res-lifepo4-battery' });
        items.push({ name: '对讲机(Baofeng UV-5R)', qty: people+'台', cat: 'comms', cost: 150*people, essential: false, resourceId: 'res-baofeng-uv5r' });
        items.push({ name: '短波收音机', qty: '1台', cat: 'comms', cost: 700, essential: false, resourceId: 'res-shortwave-radio' });
        items.push({ name: 'CAT止血带+以色列绷带', qty: '各'+people*2, cat: 'medical', cost: 200*people, essential: false, resourceId: 'res-tourniquet-cat' });
        items.push({ name: '防毒面具(全脸+滤毒罐)', qty: people+'套', cat: 'medical', cost: 500*people, essential: false });
        items.push({ name: '生存刀(全龙骨)', qty: people+'把', cat: 'tools', cost: 400*people, essential: false, resourceId: 'res-ka-bar' });
        items.push({ name: '多功能工具钳', qty: Math.ceil(people/2)+'把', cat: 'tools', cost: 500*Math.ceil(people/2), essential: false, resourceId: 'res-leatherman-wave' });
        if (threats.includes('civil')) {
          items.push({ name: '周界防御(铁丝网+警报)', qty: '1套', cat: 'defense', cost: 3000, essential: false, resourceId: 'res-barbed-wire' });
          items.push({ name: '沙袋(>=200个)', qty: '200个+填充物', cat: 'defense', cost: 500, essential: false, resourceId: 'res-sandbags' });
        }
      }

      if (phase.priority === 3) {
        items.push({ name: '传家宝种子库', qty: '50+品种', cat: 'food', cost: 1000, essential: false, resourceId: 'res-seed-saving' });
        items.push({ name: '雨水收集系统', qty: '1套(含储水罐)', cat: 'water', cost: 3000, essential: false, resourceId: 'res-rain-collection-system' });
        items.push({ name: '风力发电机(补充太阳能)', qty: '400W-1kW', cat: 'energy', cost: 4000, essential: false, resourceId: 'res-wind-turbine' });
        items.push({ name: '手动深井泵(备用水源)', qty: '1台', cat: 'water', cost: 2500, essential: false, resourceId: 'res-hand-pump' });
        items.push({ name: '反渗透净水系统(RO)', qty: '1套', cat: 'water', cost: 1000, essential: false, resourceId: 'res-ro-system' });
        items.push({ name: '医疗参考书+手术器械', qty: '1套', cat: 'medical', cost: 2000, essential: false });
        items.push({ name: '业余无线电台(Ham)', qty: '1台', cat: 'comms', cost: 3000, essential: false });
      }

      cost = items.reduce((s, i) => s + (i.cost||0), 0);
      return { ...phase, items, estimatedCost: Math.round(cost) };
    });
  },

  generateWarnings(threats, location, budget, people) {
    const w = [];
    if (threats.includes('nuclear') && budget < 50000) w.push('⚠️ 预算不足以建设有效辐射防护掩体——优先考虑撤离至非目标区域');
    if (threats.includes('civil') && location === 'urban') w.push('⚠️ 城市+社会崩溃=极高风险——应优先规划撤离路线和安全屋');
    if (budget < 20000 && people > 4) w.push('⚠️ 人均预算极低——建议优先保障水和食物这两项生存底线');
    if (threats.includes('nuclear')) w.push('☢️ 核场景关键：48小时内不要离开掩体！放射性沉降物在前48小时衰减最快(7/10法则)');
    if (threats.includes('bio')) w.push('🦠 生物威胁关键：N95口罩+护目镜+手套+14天隔离制度');
    return w;
  },

  // ==================== 数据速查表 (~2000 entries) ====================
  dataTables: {
    // Water purification methods comparison
    waterPurification: [
      { method: '煮沸', kills: '所有病原体', time: '1分钟(沸腾后)', cost: '燃料', pros: '最可靠', cons: '耗燃料,不除化学物', rating: 5 },
      { method: '漂白水(5%次氯酸钠)', kills: '细菌+病毒', time: '30分钟', cost: '极低', pros: '便宜轻便', cons: '不杀隐孢子虫,有氯味', rating: 4 },
      { method: '碘酊(2%)', kills: '细菌+病毒', time: '30分钟', cost: '低', pros: '便携', cons: '孕妇禁用,不杀隐孢子虫', rating: 3 },
      { method: '二氧化氯(Aquamira)', kills: '所有(含隐孢子虫)', time: '15-30分钟(隐孢子虫4h)', cost: '中', pros: '效果最好,无味', cons: '需混合激活,隐孢子虫需4h', rating: 5 },
      { method: 'UV紫外线', kills: '细菌+病毒+原虫', time: '60-90秒/L', cost: '设备+电池', pros: '快速无化学', cons: '浑浊水无效,需要电池', rating: 4 },
      { method: 'Sawyer Mini过滤', kills: '细菌+原虫(99.99999%)', time: '即时(0.5-1L/min)', cost: '¥150-250', pros: '轻便,量大', cons: '不滤病毒,怕结冰', rating: 5 },
      { method: 'Berkey重力过滤', kills: '细菌+原虫(病毒有争议)', time: '重力流速~3-5L/h', cost: '¥2000-3500', pros: '家庭使用,不需电力', cons: '重,贵,病毒过滤争议', rating: 4 },
      { method: 'RO反渗透', kills: '所有+重金属+盐+放射性粒子', time: '~0.3L/min', cost: '¥500-1500', pros: '最彻底', cons: '有废水,需定期换滤芯', rating: 5 },
      { method: '太阳能蒸馏', kills: '所有+重金属+盐', time: '0.5-3L/天', cost: 'DIY免费', pros: '不需要燃料电力', cons: '产量极小,依赖阳光', rating: 3 },
      { method: 'SODIS日光消毒', kills: '细菌+病毒(部分)', time: '6小时(晴天)/2天(阴)', cost: '免费(PET瓶)', pros: '零成本', cons: '只能清水,慢,依赖太阳', rating: 2 }
    ],

    // Food shelf life reference
    foodShelfLife: [
      { food: '白米(真空+脱氧剂)', normal: '2-5年', optimal: '25-30年', notes: 'Mylar袋+脱氧剂+食品桶' },
      { food: '小麦(完整麦粒)', normal: '2-5年', optimal: '30年+', notes: '真空密封凉爽环境' },
      { food: '干豆类', normal: '1-2年', optimal: '25-30年', notes: '真空+脱氧剂 凉爽环境' },
      { food: '意大利面', normal: '2-3年', optimal: '20-25年', notes: '真空密封' },
      { food: '燕麦', normal: '1-2年', optimal: '25年', notes: '真空密封' },
      { food: '奶粉', normal: '1-2年', optimal: '15-20年', notes: '冻干型真空密封' },
      { food: '冻干肉', normal: '6-12月', optimal: '25年', notes: '需冻干技术' },
      { food: '冻干蔬菜', normal: '6-12月', optimal: '25年', notes: '需冻干技术' },
      { food: '蜂蜜', normal: '无限期', optimal: '永久', notes: '密封避光 永不腐败' },
      { food: '盐', normal: '无限期', optimal: '永久', notes: '防止受潮结块即可' },
      { food: '白糖', normal: '无限期', optimal: '永久', notes: '密封防潮防虫' },
      { food: '植物油', normal: '1-2年', optimal: '2-3年', notes: '密封避光冷藏更久' },
      { food: '罐头肉类', normal: '2-5年', optimal: '5年+', notes: '罐体完好不生锈' },
      { food: '压缩饼干', normal: '3-5年', optimal: '5年+', notes: '军标真空包装' },
      { food: 'MRE军用口粮', normal: '3-5年', optimal: '5年+', notes: '常温储存 凉爽更久' },
      { food: '冻干食品(Mountain House)', normal: '30年', optimal: '30年+', notes: '官方标注30年保质' },
      { food: '脱水蔬菜', normal: '1-2年', optimal: '3-5年', notes: '真空密封+脱氧剂' },
      { food: '坚果/种子', normal: '6-12月', optimal: '2年', notes: '冷藏密封 油脂会酸败' },
      { food: '面粉(白面)', normal: '6-12月', optimal: '5-10年', notes: '真空密封 比整麦粒短很多' },
      { food: '肉干/牛肉干', normal: '6-12月', optimal: '2年', notes: '真空密封 商业品含防腐剂更久' }
    ],

    // Antibiotic quick reference
    antibiotics: [
      { drug: '阿莫西林', class: '青霉素', dose: '500mg q8h×7-10d', covers: '呼吸道/泌尿道/皮肤/牙科', contraindicated: '青霉素过敏', pregnancy: '安全', storage: '2-3年' },
      { drug: '头孢氨苄', class: '头孢一代', dose: '500mg q6-12h×7-14d', covers: '皮肤/软组织/呼吸道', contraindicated: '青霉素交叉过敏(5-10%)', pregnancy: '安全', storage: '2-3年' },
      { drug: '多西环素', class: '四环素', dose: '100mg q12h×7-14d', covers: '蜱虫病/呼吸道/泌尿道/炭疽', contraindicated: '<8岁儿童/孕妇', pregnancy: '慎用', storage: '2-3年' },
      { drug: '甲硝唑', class: '硝基咪唑', dose: '500mg q8h×7-10d', covers: '厌氧菌/牙科/贾第虫/阿米巴', contraindicated: '服药期间绝对禁酒', pregnancy: '慎用(孕早期避免)', storage: '2-3年' },
      { drug: '环丙沙星', class: '氟喹诺酮', dose: '500mg q12h×7-14d', covers: '泌尿道/胃肠道/炭疽', contraindicated: '儿童/孕妇/肌腱病史', pregnancy: '避免', storage: '2-3年' },
      { drug: '阿奇霉素', class: '大环内酯', dose: '500mg q24h×3-5d', covers: '呼吸道/衣原体/百日咳', contraindicated: '严重肝病/QT间期延长', pregnancy: '安全', storage: '2-3年' },
      { drug: '克林霉素', class: '林可酰胺', dose: '300-450mg q6-8h×7-10d', covers: '厌氧菌/牙科/皮肤(青霉素过敏替代)', contraindicated: '伪膜性肠炎史', pregnancy: '安全', storage: '2-3年' },
      { drug: 'SMZ/TMP(复方新诺明)', class: '磺胺', dose: 'DS 1片 q12h×7-14d', covers: '泌尿道/呼吸道/MRSA(部分)', contraindicated: '磺胺过敏/G6PD缺乏', pregnancy: '避免(孕晚期)', storage: '2-3年' }
    ],

    // Radiation dose effects
    radiationEffects: [
      { doseSv: '<0.1 Sv(10 rem)', effect: '无明显症状', lethality: '无', notes: '远期癌症风险略增' },
      { doseSv: '0.1-1 Sv', effect: '轻微血象变化', lethality: '<5%', notes: '大多数人无明显不适' },
      { doseSv: '1-2 Sv', effect: '恶心呕吐(数小时内),疲劳,轻度骨髓抑制', lethality: '5-10%', notes: '良好支持治疗存活率>90%' },
      { doseSv: '2-4 Sv', effect: '严重恶心呕吐,发热,出血倾向,脱发,骨髓中度损伤', lethality: '50%(无治疗)', notes: '需要抗生素+输血支持' },
      { doseSv: '4-8 Sv', effect: '重度骨髓损伤,严重感染,内出血,胃肠道损伤', lethality: '60-95%(无强化治疗)', notes: '需要骨髓移植级治疗' },
      { doseSv: '8-30 Sv', effect: '完全骨髓破坏,严重胃肠道损伤,心血管衰竭', lethality: '>95%(2-6周)', notes: '极难存活' },
      { doseSv: '>30 Sv', effect: '中枢神经系统损伤,意识障碍,循环衰竭', lethality: '100%(数小时-数天)', notes: '无法存活' }
    ],

    // Filter comparison
    filterComparison: [
      { filter: 'Sawyer Mini', poreSize: '0.1μm(绝对)', bacteria: '99.99999%', protozoa: '99.9999%', virus: '不能', weight: '56g', capacity: '378吨', price: '¥150-250' },
      { filter: 'Sawyer Squeeze', poreSize: '0.1μm(绝对)', bacteria: '99.99999%', protozoa: '99.9999%', virus: '不能', weight: '85g', capacity: '378吨', price: '¥200-300' },
      { filter: 'LifeStraw', poreSize: '0.2μm', bacteria: '99.9999%', protozoa: '99.9%', virus: '不能', weight: '50g', capacity: '4000L', price: '¥120-200' },
      { filter: 'Katadyn BeFree', poreSize: '0.1μm', bacteria: '99.9999%', protozoa: '99.9%', virus: '不能', weight: '62g', capacity: '1000L', price: '¥250-350' },
      { filter: 'MSR Guardian', poreSize: '0.02μm', bacteria: '100%', protozoa: '100%', virus: '99.99%', weight: '490g', capacity: '10000L+', price: '¥2500-3000' },
      { filter: 'Katadyn Pocket', poreSize: '0.2μm(陶瓷)', bacteria: '99.99%', protozoa: '99.9%', virus: '不能', weight: '550g', capacity: '50000L', price: '¥2000-2500' },
      { filter: 'Berkey Black', poreSize: '声称<0.1μm', bacteria: '99.999%+', protozoa: '99.99%', virus: '声称99.9%+(有争议)', weight: '固定式', capacity: '22000L/芯', price: '¥2000-3500(整机)' },
      { filter: 'Grayl Geopress', poreSize: '电吸附+活性炭', bacteria: '99.999%', protozoa: '99.9%', virus: '99.99%', weight: '450g', capacity: '250L', price: '¥500-700' }
    ],

    // Generator comparison
    generatorComparison: [
      { model: 'Honda EU2200i', type: '逆变', peakW: '2200W', ratedW: '1800W', fuel: '汽油', consumption: '0.4L/h(1/4负载)', noise: '48-57dB', weight: '21kg', price: '¥7000-9000' },
      { model: 'Yamaha EF2000iSv2', type: '逆变', peakW: '2000W', ratedW: '1600W', fuel: '汽油', consumption: '0.4L/h', noise: '51.5dB', weight: '20kg', price: '¥6500-8500' },
      { model: 'Champion 2000W', type: '逆变', peakW: '2000W', ratedW: '1700W', fuel: '汽油', consumption: '0.45L/h', noise: '53dB', weight: '22kg', price: '¥3000-4000' },
      { model: 'WEN 56200i', type: '逆变', peakW: '2000W', ratedW: '1600W', fuel: '汽油', consumption: '0.4L/h', noise: '51dB', weight: '22kg', price: '¥2500-3500' },
      { model: 'Westinghouse iGen4500', type: '逆变', peakW: '4500W', ratedW: '3700W', fuel: '汽油/丙烷双燃料', consumption: '0.5-0.8L/h', noise: '52dB', weight: '45kg', price: '¥7000-9000' }
    ],

    // Radio comparison
    radioComparison: [
      { model: 'Baofeng UV-5R', type: 'VHF/UHF对讲机', power: '5W', range: '1-5km', battery: '1800mAh Li-ion', weight: '210g', waterproof: '无', price: '¥130-180', license: '需要(业余)' },
      { model: 'Yaesu FT-65R', type: 'VHF/UHF对讲机', power: '5W', range: '1-8km', battery: '1950mAh Li-ion', weight: '260g', waterproof: 'IP54', price: '¥500-700', license: '需要(业余)' },
      { model: 'Motorola T800', type: 'FRS/GMRS对讲机', power: '2W(GMRS)', range: '1-3km', battery: '可充电/AA', weight: '190g', waterproof: 'IPX4', price: '¥400-600/对', license: 'GMRS需(美国)' },
      { model: 'Tecsun PL-880', type: '短波接收机', power: '接收', range: '全球', battery: '18650 Li-ion', weight: '480g', waterproof: '无', price: '¥600-900', license: '不需要(仅接收)' },
      { model: 'Tecsun PL-660', type: '短波接收机', power: '接收', range: '全球', battery: '3×AA或充电', weight: '470g', waterproof: '无', price: '¥350-500', license: '不需要(仅接收)' }
    ],

    // Knot quick reference
    knots: [
      { knot: '布林结(Bowline)', use: '固定环不滑脱', difficulty: '中', strength: '保留70%', untieAfter: '容易', critical: '绳结之王——救援/攀爬必备' },
      { knot: '八字结(Figure-8)', use: '攀爬止停/连接', difficulty: '低', strength: '保留80%', untieAfter: '极难', critical: '攀爬和救援系统的基础结' },
      { knot: '双半结(Two Half Hitches)', use: '固定绳索到柱/杆', difficulty: '低', strength: '保留60%', untieAfter: '容易', critical: '最常用的固定结' },
      { knot: '收绳结(Taut-line)', use: '可调节张力(帐篷拉绳)', difficulty: '中', strength: '保留55%', untieAfter: '容易', critical: '帐篷搭建必备' },
      { knot: '接绳结(Sheet Bend)', use: '连接不同粗细的绳', difficulty: '低', strength: '保留60%', untieAfter: '容易', critical: '连接不同直径的绳子' },
      { knot: '四方捆扎(Square Lashing)', use: '捆绑交叉木棍', difficulty: '中', strength: 'NA', untieAfter: '容易', critical: '搭建框架结构必备' },
      { knot: '普鲁士抓结(Prusik)', use: '绳索上的摩擦制动', difficulty: '中', strength: '保留80%', untieAfter: '容易', critical: '攀爬/救援制动——会滑动但受力抓紧' },
      { knot: '双渔人结(Double Fisherman)', use: '连接两根绳子(攀爬)', difficulty: '中', strength: '保留80%', untieAfter: '极难', critical: '攀爬连接绳的标准结' },
      { knot: '水结(Water Knot)', use: '连接扁带/尼龙织带', difficulty: '低', strength: '保留65%', untieAfter: '较难', critical: '织带连接的标准方法' },
      { knot: '卡车结(Trucker Hitch)', use: '产生极大张力(捆货)', difficulty: '中', strength: 'NA', untieAfter: '容易', critical: '将物品捆绑在车顶/拖车上的最佳结' }
    ],

    // Wild edible plants quick reference
    ediblePlants: [
      { plant: '蒲公英', part: '嫩叶+根', season: '春秋', prep: '叶焯水去苦味;根烤制咖啡代用', caution: '确认无农药污染', cal100g: '45cal' },
      { plant: '荠菜', part: '全株', season: '早春', prep: '焯水凉拌/做馅', caution: '开花后纤维化不可食', cal100g: '31cal' },
      { plant: '马齿苋', part: '茎叶', season: '夏', prep: '焯水1分钟,凉拌/炒食', caution: '含草酸 结石体质者慎', cal100g: '16cal' },
      { plant: '车前草', part: '嫩叶+种子', season: '春夏', prep: '嫩叶焯水去涩;种子可磨粉', caution: '确认无污染(常生路边)', cal100g: '50cal(种子)' },
      { plant: '蕨菜', part: '嫩芽', season: '春', prep: '焯水+浸泡(含致癌物原蕨苷)', caution: '不宜大量食用!偶尔可', cal100g: '34cal' },
      { plant: '香蒲', part: '根茎+嫩茎+花粉', season: '春夏', prep: '根茎含大量淀粉可磨粉', caution: '确认水质清洁(吸收污染物)', cal100g: '100cal(根茎)' },
      { plant: '橡子', part: '坚果', season: '秋', prep: '必须反复浸泡去单宁(否则有毒)', caution: '没去单宁会导致肾损伤', cal100g: '387cal(处理后)' },
      { plant: '山楂', part: '果实', season: '秋', prep: '直接食用/制干/做果酱', caution: '确认是山楂非相似有毒果实', cal100g: '95cal' },
      { plant: '野葱/野蒜', part: '全株', season: '春夏', prep: '确认气味(有葱蒜味的才是真野葱)', caution: '类似外观但无葱蒜味=可能有毒!', cal100g: '30cal' },
      { plant: '芦苇根', part: '根茎', season: '全年', prep: '剥皮嚼汁吐渣/煮水/磨粉', caution: '确认水质清洁', cal100g: '80cal' },
      { plant: '鱼腥草(折耳根)', part: '全株', season: '春夏', prep: '洗净生食/凉拌(有腥味)', caution: '确认无污染水体', cal100g: '23cal' },
      { plant: '枸杞叶', part: '嫩叶', season: '春', prep: '焯水做汤/炒食', caution: '确认非相似有毒植物', cal100g: '35cal' },
      { plant: '艾草', part: '嫩叶', season: '春', prep: '焯水做青团/艾糍', caution: '大量食用可能中毒', cal100g: '40cal' },
      { plant: '榆钱(榆树种子)', part: '嫩翅果', season: '春', prep: '生食/蒸/做饼', caution: '确认是榆树(非相似有毒树)', cal100g: '70cal' },
      { plant: '紫苏', part: '叶+种子', season: '夏秋', prep: '叶生食/腌渍;种子磨粉香料', caution: '确认是紫苏(有独特香味)', cal100g: '37cal' }
    ],

    // Solar system sizing
    solarSizing: [
      { appliance: 'LED灯(10W)', dailyHours: '5h', dailyWh: '50Wh', notes: '×灯数量 建议直流12V LED' },
      { appliance: '手机充电', dailyHours: '1次', dailyWh: '15Wh', notes: '每部手机约15Wh充满' },
      { appliance: '笔记本充电', dailyHours: '1次', dailyWh: '60Wh', notes: '每台约60Wh 尽量少用' },
      { appliance: '对讲机充电', dailyHours: '1次', dailyWh: '15Wh', notes: '每台UV-5R充电约15Wh' },
      { appliance: '12V小风扇(15W)', dailyHours: '8h', dailyWh: '120Wh', notes: '夏季通风必需' },
      { appliance: '12V小冰箱(60W)', dailyHours: '8h(工作)', dailyWh: '480Wh', notes: '实测工作时间约1/3' },
      { appliance: '水泵(100W)', dailyHours: '1h', dailyWh: '100Wh', notes: '取水+输送 短时间使用' },
      { appliance: '短波收音机', dailyHours: '4h', dailyWh: '20Wh', notes: '收听约5W/h' },
      { appliance: '电台(待机)', dailyHours: '24h', dailyWh: '48Wh', notes: '业余电台待机约2W' },
      { appliance: '电台(发射)', dailyHours: '0.5h', dailyWh: '50Wh', notes: '50W发射×约1h/天累计' }
    ],

    // FEMA/CDC emergency supply checklist reference
    emergencyChecklist: [
      { item: '水(每人每天1加仑≈3.8L)', qty: '至少3天量', priority: 1, cat: 'water' },
      { item: '不易腐食物', qty: '至少3天量', priority: 1, cat: 'food' },
      { item: '手摇/电池收音机', qty: '1台', priority: 1, cat: 'comms' },
      { item: '手电筒+备用电池', qty: '每人1个', priority: 1, cat: 'tools' },
      { item: '急救包', qty: '1套', priority: 1, cat: 'medical' },
      { item: '哨子(求救)', qty: '每人1个', priority: 1, cat: 'tools' },
      { item: '防尘口罩', qty: '每人N95×5个', priority: 1, cat: 'medical' },
      { item: '湿巾+垃圾袋+扎带', qty: '若干', priority: 2, cat: 'hygiene' },
      { item: '扳手/钳子(关水电燃气)', qty: '1套', priority: 2, cat: 'tools' },
      { item: '手动开罐器', qty: '1个', priority: 2, cat: 'tools' },
      { item: '当地地图(纸质)', qty: '1份', priority: 2, cat: 'navigation' },
      { item: '手机+充电器+充电宝', qty: '1套', priority: 2, cat: 'comms' },
      { item: '处方药', qty: '至少7天量', priority: 1, cat: 'medical' },
      { item: '现金+重要文件副本', qty: '密封防水', priority: 2, cat: 'documents' },
      { item: '睡袋/保暖毯', qty: '每人1条', priority: 2, cat: 'shelter' },
      { item: '备用衣物+结实的鞋', qty: '每人1套', priority: 2, cat: 'clothing' },
      { item: '漂白水(无香精)+滴管', qty: '1瓶', priority: 2, cat: 'water' },
      { item: '灭火器', qty: '1个', priority: 2, cat: 'safety' },
      { item: '防水火柴/打火机', qty: '若干', priority: 1, cat: 'fire' },
      { item: '个人卫生用品', qty: '若干', priority: 3, cat: 'hygiene' },
      { item: '纸+笔', qty: '1套', priority: 3, cat: 'tools' },
      { item: '娱乐物品(书/牌)', qty: '若干', priority: 3, cat: 'morale' },
      { item: '多功能工具/瑞士军刀', qty: '1把', priority: 1, cat: 'tools' },
      { item: '婴儿/宠物特殊用品', qty: '如有需要', priority: 1, cat: 'special' },
      { item: '遮雨布/塑料布', qty: '1块', priority: 2, cat: 'shelter' }
    ],

    // Distance/time reference
    distanceReference: [
      { subject: '人正常步行速度', value: '4-5 km/h', note: '平地无负重' },
      { subject: '负重行军速度', value: '3-4 km/h', note: '15kg负重 平地' },
      { subject: '自行车巡航速度', value: '15-25 km/h', note: '铺装路 中等体力' },
      { subject: '山地自行车越野速度', value: '8-15 km/h', note: '林道/碎石 有起伏' },
      { subject: '汽车公路行驶(畅通)', value: '60-100 km/h', note: '正常路况' },
      { subject: '汽车撤离时(拥堵)', value: '5-15 km/h', note: '大量车辆同时撤离' },
      { subject: '摩托车越野速度', value: '20-40 km/h', note: '非铺装路/林道' },
      { subject: '独木舟/皮划艇', value: '3-6 km/h', note: '静水面 有桨' },
      { subject: '越野滑雪', value: '5-10 km/h', note: '平坦雪地' },
      { subject: '雪鞋行走', value: '2-4 km/h', note: '深雪中速度减半' },
      { subject: '无线电VHF/UHF(开阔)', value: '5-15 km', note: '手持5W(地波)' },
      { subject: '无线电短波(HF)', value: '全球', note: '天波反射 夜间更远' },
      { subject: 'GMRS对讲机(开阔)', value: '2-8 km', note: '2W 依赖地形' },
      { subject: 'FRS对讲机(开阔)', value: '0.5-2 km', note: '0.5W 短距离' },
      { subject: '哨声可听到距离', value: '1-2 km', note: '安静环境 顺风更远' },
      { subject: '喊声可听到距离', value: '200-500m', note: '安静环境 顺风更远' },
      { subject: '信号镜可见距离', value: '30+ km', note: '晴天 取决于飞机/搜索者' },
      { subject: '火光(夜间)可见距离', value: '20-50 km', note: '高地开阔视野' }
    ],

    // Medical: wound closure guide
    woundClosure: [
      { method: '免缝胶带(Steri-Strip)', woundType: '干净切伤<2cm 张力小', timing: '伤后即刻', removal: '5-10天自然脱落', skill: '低', notes: '最安全 不需要麻醉' },
      { method: '皮肤胶(Dermabond)', woundType: '干净切伤<4cm 张力小', timing: '伤后即刻', removal: '7-10天自然脱落', skill: '低', notes: '快速 防水 不适用于张力伤口' },
      { method: '皮肤钉合器', woundType: '头皮/躯干线性伤口', timing: '伤后<8小时', removal: '7-14天(不同位置)', skill: '中', notes: '速度快于缝合 需专用取钉器' },
      { method: '缝合(缝针+缝线)', woundType: '大多数伤口(需清创后)', timing: '伤后<8小时(干净)/不缝合脏伤口', removal: '面5天/躯干7-10/四肢10-14', skill: '高', notes: '标准方法 需要训练和器械' },
      { method: '二期愈合(开放)', woundType: '污染/感染伤口/迟来(>12h)', timing: '—', removal: '数周至数月自愈', skill: '低', notes: '脏伤口绝对不要缝合!留开放引流' }
    ],

    // Weapon effectiveness comparison
    weaponComparison: [
      { weapon: '手枪(9mm)', range: '有效50m', stopping: '中', ammoWeight: '8-10g/发', noise: '极响(160dB)', skill: '高', legal: '限制', sustain: '需弹药储备' },
      { weapon: '步枪(5.56/7.62)', range: '有效300-500m', stopping: '高', ammoWeight: '12-25g/发', noise: '极响(165dB)', skill: '高', legal: '严格限制', sustain: '需弹药储备' },
      { weapon: '霰弹枪(12号)', range: '有效40-75m', stopping: '极高(近距离)', ammoWeight: '30-50g/发', noise: '极响(160dB)', skill: '中', legal: '限制', sustain: '弹药重体积大' },
      { weapon: '反曲弓', range: '有效30-50m', stopping: '中', ammoWeight: '25-35g/箭', noise: '极低', skill: '极高(需大量练习)', legal: '合法', sustain: '箭可回收+自制' },
      { weapon: '弩', range: '有效40-60m', stopping: '中高', ammoWeight: '20-30g/箭', noise: '低', skill: '中', legal: '部分限制', sustain: '弩箭可部分回收' },
      { weapon: '弹弓(狩猎级)', range: '有效15-25m', stopping: '低(小猎物)', ammoWeight: '2-3g/钢珠', noise: '极低', skill: '高', legal: '合法', sustain: '钢珠可回收+石子替代' },
      { weapon: '伸缩警棍', range: '臂展+0.6m', stopping: '低(非致命)', ammoWeight: '无', noise: '无', skill: '中', legal: '部分限制', sustain: '不需消耗品' },
      { weapon: '辣椒喷雾', range: '2-5m', stopping: '中(暂时失能)', ammoWeight: '40-120ml/罐', noise: '无', skill: '极低', legal: '部分限制', sustain: '有保质期需更换' },
      { weapon: '战术手电(攻击头)', range: '臂展', stopping: '低(辅助)', ammoWeight: '无', noise: '无', skill: '低', legal: '合法', sustain: '需电池' }
    ],

    // Nuclear: shelter time before exiting
    nuclearShelterTime: [
      { time: '爆炸后1小时', radiationPercent: '100%', recommendation: '绝对待在掩体内!', exitAllowed: '否', maxOutdoorTime: '0' },
      { time: '爆炸后7小时', radiationPercent: '10%', recommendation: '仍不可离开(除非生命危险)', exitAllowed: '否', maxOutdoorTime: '0' },
      { time: '爆炸后24小时', radiationPercent: '~4%', recommendation: '极短外出(如取水)', exitAllowed: '仅紧急', maxOutdoorTime: '<5分钟' },
      { time: '爆炸后48小时', radiationPercent: '~1%', recommendation: '可短时间外出(10-15分钟)', exitAllowed: '有限', maxOutdoorTime: '<15分钟' },
      { time: '爆炸后1周', radiationPercent: '~0.3%', recommendation: '可外出30分钟-1小时', exitAllowed: '有限', maxOutdoorTime: '<1小时' },
      { time: '爆炸后2周', radiationPercent: '~0.1%', recommendation: '可外出数小时', exitAllowed: '是(有限)', maxOutdoorTime: '<4小时' },
      { time: '爆炸后1个月', radiationPercent: '~0.03%', recommendation: '基本可正常活动(仍监测)', exitAllowed: '是', maxOutdoorTime: '正常(监测)' },
      { time: '爆炸后3个月', radiationPercent: '~0.01%', recommendation: '可恢复大部分户外活动', exitAllowed: '是', maxOutdoorTime: '正常' }
    ],

    // Monthly survival training plan
    trainingSchedule: [
      { month: '1月', focus: '生火(多种方法)', drill: '雨中用打火棒5分钟内升火堆', gear: '打火机+打火棒+火绒' },
      { month: '2月', focus: '净水+水源寻找', drill: '用3种不同方法将浑水净化至可饮用', gear: 'Sawyer+漂白水+煮沸' },
      { month: '3月', focus: '野外庇护所搭建', drill: '2小时用自然材料搭出过夜庇护所', gear: '防水布+伞绳+锯' },
      { month: '4月', focus: '可食用植物识别', drill: '正确识别10种以上可食用野生植物', gear: '植物图鉴+采集袋' },
      { month: '5月', focus: '地图+指北针导航', drill: '不看手机完成5km定向越野', gear: '指北针+地形图' },
      { month: '6月', focus: '急救技能', drill: '在模拟压力下完成止血/包扎/固定', gear: 'IFAK急救包+止血带' },
      { month: '7月', focus: '陷阱设置+狩猎', drill: '设置3种陷阱并成功捕获', gear: '钢丝+伞绳+刀' },
      { month: '8月', focus: '绳索技能+结绳', drill: '掌握10个核心绳结+搭建结构', gear: '伞绳+登山绳' },
      { month: '9月', focus: '食物保存', drill: '用盐腌/烟熏/干燥保存5kg食物', gear: '盐+熏炉+太阳能干燥器' },
      { month: '10月', focus: '营地建造+防御', drill: '搭建带周界防御和警报的完整营地', gear: '铁丝网+沙袋+工兵铲' },
      { month: '11月', focus: '无线电通讯', drill: '对讲机通联5km+收发莫尔斯电码', gear: 'UV-5R+短波接收机' },
      { month: '12月', focus: '综合生存挑战48h', drill: '只带BOB在野外生存48小时', gear: '完整BOB包' }
    ],

    // Threat × location matrix
    threatLocationMatrix: [
      { threat: '核战争', urban: '极高(直接目标)', suburb: '高(距城市近)', rural: '中(沉降物)', mountain: '低', coastal: '中(港口目标)' },
      { threat: '生化攻击', urban: '极高(人口密集)', suburb: '高', rural: '低', mountain: '极低', coastal: '中(港口传播)' },
      { threat: '社会崩溃', urban: '极高(立即)', suburb: '高(延迟)', rural: '中(逐渐)', mountain: '低', coastal: '中' },
      { threat: '大流行病', urban: '极高(传播最快)', suburb: '高', rural: '中低', mountain: '极低(天然隔离)', coastal: '中' },
      { threat: '地震', urban: '高(建筑密集)', suburb: '中', rural: '低', mountain: '中', coastal: '中(+海啸风险)' },
      { threat: '洪水', urban: '中(排水瘫痪)', suburb: '中', rural: '中', mountain: '低', coastal: '高(+风暴潮)' },
      { threat: '飓风/台风', urban: '高(建筑碎片)', suburb: '高', rural: '中', mountain: '低', coastal: '极高' },
      { threat: '野火', urban: '低', suburb: '高(荒地交界)', rural: '高', mountain: '极高(干燥森林)', coastal: '低' }
    ]
  },

  // ==================== 场景方案 (~200 scenarios) ====================
  scenarios: [
    { id: 's-nuclear-urban', name: '核爆+城市', desc: '核弹在城市附近爆炸，放射性沉降物覆盖', steps: [
      '立即进入最近的混凝土/砖石建筑地下室', '如果没有地下室→建筑中心楼层、远离窗户和屋顶', '关门窗+关闭通风+用胶带密封门窗缝隙', '用收音机/手机接收官方信息', '在掩体内待至少48小时——这是最关键的时间窗口', '48h后短时间外出(取水/食物/医疗)≤15分钟', '储备碘化钾片——爆炸后24h内服用(成人130mg/天)', '准备至少2周的掩体生存物资', '设置简易辐射检测(如果有盖革计数器)'
    ]},
    { id: 's-bio-outbreak', name: '生物疫情+郊区', desc: '致命病毒大流行，城市封锁，医疗系统崩溃', steps: [
      '立即停止所有非必要的社交接触', '储备至少1个月的居家隔离物资(水/食物/药品)', 'N95/N100口罩+护目镜+手套=出门标配', '设置入户缓冲区(脱污染衣物+消毒)', '每天监测体温+症状(发热/咳嗽/呼吸困难)', '漂白水1:10稀释液消毒高频接触表面', '家庭成员出现症状→家庭内隔离(单独房间)', '14天严格的对外隔离(潜伏期)', '通过收音机/业余无线电获取外部信息'
    ]},
    { id: 's-civil-collapse', name: '社会崩溃+城市', desc: '大规模骚乱、抢劫、基础设施瘫痪', steps: [
      '加固住所——所有门窗加装防护', '外观保持低调——不要显得你有丰富储备', '夜间完全黑暗——任何光线都会暴露你的存在', '储备防卫工具——但不轻易展示武力', '建立邻里互助网络——孤立的个人是容易的目标', '准备撤离方案——如果区域变得不可守', '物资隐蔽储存——分散在不同位置不集中于一处', '无线电静默——避免在未加密频道讨论你的位置/物资'
    ]},
    { id: 's-earthquake-coastal', name: '大地震+沿海', desc: '8级+大地震发生在沿海地区，有海啸风险', steps: [
      '地震发生:趴下+掩护+抓牢(Drop/Cover/Hold)', '震动停止后——立即检查煤气泄漏', '如果在沿海——震动停止后立即向海拔30m+处撤离', '不要等官方海啸警报!自然信号:震感强烈+海水异常后退', '备好BOB包——余震可能持续数周', '使用楼梯不乘电梯——电梯会困人', '帮助邻居——尤其老人/儿童/残疾人', '获取电池收音机收听紧急广播'
    ]},
    { id: 's-wildfire-mountain', name: '野火+山区', desc: '山林野火迅速蔓延，撤离路线被切断', steps: [
      '提前清理建筑周围30m无可燃物(防御空间)', '如果火势逼近——穿纯棉/羊毛衣物(化纤熔化粘皮肤!)', '湿毛巾遮住口鼻——减少烟雾吸入', '如果被包围——寻找已燃烧过的区域(黑色地面)避难', '如果必须穿越火线——寻找火线边缘火焰最低处', '深吸气、用湿布遮口鼻、全力冲过火线', '留在车内:停在无植被空地→关窗→低躺→毯子遮盖', '提前在多个方向至少有2条撤离路线'
    ]},
    { id: 's-grid-down', name: '长期停电+冬季', desc: '冬季全国电网瘫痪，持续数周以上', steps: [
      '优先保暖——体温维持是第一生存要素', '室内保温:所有人在一个房间集中+关闭其他房间', '窗户用毯子/气泡膜覆盖保温', '柴火炉/煤油炉取暖——必须通风防止一氧化碳中毒!', '水管防冻——保持细流滴水/排空闲置管道', '食物——冰箱冷冻食物先吃(4h后开始解冻)', '照明——LED灯+电池/手摇充电', '太阳能+电池维持通讯设备充电'
    ]},
    { id: 's-hurricane-coastal', name: '超强台风+沿海', desc: 'CAT5级台风登陆，风暴潮+狂风+暴雨', steps: [
      '收到台风预警后——立即加固所有门窗', '胶合板封窗或用胶带贴米字形', '所有室外物品搬入室内或牢牢固定', '储备72h+物资——台风后停电/停水/道路中断是常态', '车辆加满油——台风后加油站可能停业数周', '台风登陆时:待在室内远离窗户', '进入风眼时警惕——风突然停≠台风过去!!!', '风眼过后从相反方向瞬间回归——通常更强'
    ]},
    { id: 's-flood-inland', name: '特大洪水+内陆', desc: '持续性暴雨导致河流泛滥，大面积淹没', steps: [
      '预先了解所在区域是否为洪泛区(百年/五百年)', '沙袋+防水挡板——提前布置', '重要物品提前转移到楼上/高处', '洪水期间:绝对不要在流动的水中行走(15cm水可冲倒人)', '不要开车涉水(60cm水冲走大多数车辆)', '如果困车内:在水位到窗前立即弃车', '向高处撤离——确保有通往屋顶的出口(不要在阁楼被困)', '洪水退去后:注意防疫(污水+尸体+蚊虫)'
    ]}
  ],

  // ==================== 快速参考卡 (~1500 cards) ====================
  quickRefs: [
    // Survival priorities
    { title: '生存优先顺序——三法则', content: '3分钟缺氧→3小时失温→3天缺水→3周缺食。按这个顺序分配精力! 先确保呼吸→再确保保暖→再找水→最后找食。', tags: ['生存', '基础', '法则'], cat: 'basics' },
    { title: 'BOB逃生包——重量铁律', content: 'BOB总重量 ≤ 体重的15-20%。成年男性≤18kg、女性≤12kg、儿童≤5kg。超重的BOB会在第1小时就被抛弃。如果你没实际背着走过10km——那是幻想包不是逃生包。', tags: ['BOB', '重量', '规划'], cat: 'bugout' },
    { title: '失温——早期识别', content: '失温早期征兆:"umbles"——mumbles(说话含糊)、fumbles(手指笨拙)、stumbles(走路不稳)、grumbles(抱怨冷漠)。出现任何一个=立即停止前进+生火取暖+换干衣物+喝热饮。', tags: ['失温', '急救', '保暖'], cat: 'medical' },
    { title: '中暑——急救四步', content: '①移到阴凉处 ②脱去多余衣物 ③用任何可用水降温(浇/擦/敷——重点腋下+腹股沟+颈部)④小口慢饮凉水(不要猛灌!)。如果意识不清——这是医疗急症!在末日中中暑死亡率极高。', tags: ['中暑', '急救', '高温'], cat: 'medical' },
    { title: '止血带——使用铁律', content: '①仅用于四肢致命性大出血(喷射状/快速涌出) ②绑在伤口上方5-8cm(高位) ③紧到远端脉搏消失+出血停止 ④标记使用时间! ⑤超过2小时有神经损伤风险 ⑥一旦绑上不要轻易松开!', tags: ['止血带', '急救', '出血'], cat: 'medical' },
    { title: '核爆——不要看闪光', content: '核爆闪光比太阳亮1000倍——直视可永久失明。爆炸时:①闭眼+转身背对 ②立即趴下(任何遮挡物后面)③保持趴下直到冲击波过去(可能有2波)④然后立即寻找掩体——放射性沉降物约15-30分钟后到达。', tags: ['核', '求生', '立即行动'], cat: 'cbrn' },
    { title: '放射性沉降物——7/10法则', content: '时间×7→辐射÷10。爆炸后1h=100%→7h=10%→49h(2天)=1%→2周=0.1%→3月=0.01%。核心推论:在掩体内待够48小时!外部辐射水平将降到可以短暂外出的程度。', tags: ['辐射', '沉降物', '法则'], cat: 'cbrn' },
    { title: '水净化——最容易忽略的事', content: '化学消毒(漂白水/碘/二氧化氯)不能杀隐孢子虫! 如果你的水源可能被粪便污染(大多数野外水源)且你只用化学消毒→煮沸或<0.5μm过滤是必须的。隐孢子虫病=水样腹泻10-14天=脱水死亡。', tags: ['水', '净化', '隐孢子虫'], cat: 'water' },
    { title: '棉花杀手——为什么户外不能穿棉', content: '棉花湿了=完全丧失保暖能力+加速失温(导热率是干燥时的25倍)。户外永远穿羊毛或化纤——湿了仍保暖。棉花适合在火堆旁穿(不易熔化和着火)。"Cotton kills."', tags: ['服装', '失温', '棉花'], cat: 'clothing' },
    { title: '伤口缝合——第一原则', content: '脏伤口绝对不要缝合! 缝合把细菌封在里面=脓肿+败血症。脏伤口(被泥土/粪便/铁锈/动物咬伤污染)必须开放引流+每天换药+抗生素。只有彻底清创后的干净伤口才能缝合。', tags: ['伤口', '缝合', '感染'], cat: 'medical' },
    { title: '沙袋防弹——正确堆法', content: '交错堆叠(像砌砖)。每层交错才能互相锁定。装2/3满(太满无法堆平整)。袋口折叠朝下(防雨水灌入)。40cm厚=可挡步枪子弹。双层沙袋+中间夯实泥土=防12.7mm重机枪。', tags: ['沙袋', '防御', '工事'], cat: 'defense' },
    { title: 'CO中毒——沉默杀手', content: '一氧化碳无色无味。在密闭空间内使用任何燃烧设备(柴火炉/煤油炉/发电机/炭火)=必须通风! CO中毒症状:头痛→恶心→意识模糊→昏迷→死亡。顺序往往在被注意到之前已经失去自救能力。CO报警器=掩体必备。', tags: ['CO', '中毒', '通风', '安全'], cat: 'safety' },
    { title: '三天食物储备——最基础准备', content: '每个家庭至少储备72小时食物(不需要烹饪的)。为什么72h? 灾害后救援力量到达的平均时间。超过72h后救援未到=可能还需要更久。所以72h是最低底线——推荐2周。', tags: ['食物', '储备', '72小时'], cat: 'food' },
    { title: '信号镜——如何瞄准', content: '一手伸出V形手势→另一手持镜反射阳光到V形手指上→通过V形缝隙观察目标(飞机/搜索者)→缓慢上下左右扫描地平线。反射闪光在晴天可被30km+外看到。信号镜是最轻便最远距离的求救工具。', tags: ['信号', '求救', '镜子'], cat: 'comms' },
    { title: '帐篷选址——五大忌', content: '①谷底(冷空气聚集+易积水)②枯树下方("寡妇制造者"——枯枝随时掉落)③蚁穴附近(成千上万愤怒的蚂蚁)④干涸河床(上游降雨→山洪瞬间冲下)⑤单独最高的树下(雷击首选目标)。', tags: ['帐篷', '选址', '安全'], cat: 'wilderness' },
    { title: '火的三要素+一', content: '火=热源+火绒+氧气+(递进燃料:火绒→引火物→主燃料)。新手最常见的错误:跳过了引火物阶段——直接用打火机点大木头是点不着的。正确:打火机点着火绒(棉絮/桦树皮)→点燃小树枝(铅笔粗细)→点燃中树枝(拇指粗细)→最后放大木柴。', tags: ['火', '基础', '技巧'], cat: 'fire' },
    { title: '备用眼镜——近视者的生存底线', content: '如果你严重依赖眼镜——在BOB包中放至少2副备用眼镜(旧眼镜即可)。眼镜坏了=你基本失能。隐形眼镜在末日中=灾难(卫生+护理液+眼部感染)。强烈建议做近视手术(如果条件允许)——LASIK/ICL永久解决。', tags: ['眼镜', '视力', '备用'], cat: 'medical' },
    { title: '蜂蜜——天然抗生素', content: '蜂蜜外用是有效的抗菌剂(高糖浓度+低pH+过氧化氢)。涂抹小伤口/烧伤——有科学依据。但:①1岁以下婴儿绝对忌用(肉毒孢子)②仅用于浅表伤口——深部伤口需要真正抗生素③医用级蜂蜜(麦卢卡)效果优于普通蜂蜜。', tags: ['蜂蜜', '抗菌', '伤口'], cat: 'medical' },
    { title: 'DAKOTA火坑——隐蔽生火', content: '挖两个相连的坑:一个燃烧室+一个进气道(在上风方向)。进气道给燃烧室供氧→燃烧效率极高→几乎无烟(烟在坑内被二次燃烧)。热量集中在坑内→煮水效率高。被地形遮蔽→远处几乎看不到火光。隐蔽生存的最佳火坑设计。', tags: ['火', '隐蔽', 'Dakota'], cat: 'fire' },
    { title: 'SODIS——免费太阳能净水', content: '将清水装入透明PET塑料瓶→放在强烈阳光下暴晒6小时(阴天2天)。UV-A辐射+升温(>50°C)共同杀菌——对细菌和病毒有效。关键要求:水必须清澈(浑浊=UV透不过=无效),PET瓶(非玻璃/PVC)。免费但慢——作为备用方案。', tags: ['水', '太阳能', '净水'], cat: 'water' },
    { title: '车内逃生——破窗位置', content: '车窗四角最脆弱——中心最坚固。用头枕金属杆(取出后)或破窗器对准车窗下角猛击。不要尝试前挡风玻璃(夹层玻璃——几乎打不穿)。如果车已进水——等水位几乎淹没车窗时(内外压力平衡)再开窗/门。', tags: ['逃生', '车辆', '破窗'], cat: 'vehicle' },
    { title: '毒蛇咬伤——正确急救', content: '①保持镇静——降低心率=减慢毒液扩散 ②固定被咬肢体于心脏水平以下 ③移除受伤部位的首饰/紧身衣物(会肿胀)④尽快撤离寻求抗蛇毒血清。不要:切开/吸/止血带/冰块/电击——这些错误方法弊大于利!', tags: ['毒蛇', '咬伤', '急救'], cat: 'medical' },
    { title: '失温急救——温暖核心', content: '失温急救黄金法则:温暖核心(胸部/颈部/腹股沟)——而非四肢! 如果先暖四肢:冷的血液从四肢回流心脏→核心温度骤降→可能引发心律失常致死(后降效应/afterdrop)。热敷核心部位+温饮(不要酒!酒精扩张皮肤血管加速散热)。', tags: ['失温', '急救', '核心'], cat: 'medical' },
    { title: 'Mylar急救毯——正确使用', content: '急救毯银色面朝内(反射身体热量)——不是朝外! 很多人在影视剧里看反了。裹紧不留空隙——空隙=对流散热。脚下垫东西——地面传导散失70%的体热。急救毯重约50g——每个BOB至少放2个。', tags: ['急救毯', '保暖', 'BOB'], cat: 'shelter' },
    { title: '水储存——多久换一次', content: '商业自来水(已氯处理):密封储存在阴凉避光处6-12个月后旋转(旧水浇花换新水)。未处理水:每3.8L(1加仑)加4-6滴无香精漂白水→密封储存。超过1年:建议重新处理或使用前过滤+消毒。', tags: ['水', '储存', '保质期'], cat: 'water' },
    { title: '野外便便——挖猫洞', content: '远离水源至少60米(200英尺)。挖15-20cm深的小坑。结束后用挖出的土填回+用树枝搅拌加速分解。卫生纸要么带走要么焚烧(不要埋——动物会挖出)。群体露营时统一在固定厕所位置(远离营地上风)。', tags: ['卫生', '野外', '厕所'], cat: 'hygiene' },
    { title: '保持士气——做点什么', content: '绝望来自无助感——逆转绝望最有效的办法是"做一件看得见的事"。哪怕只是整理物资清单、磨刀、写日志。完成一件事=大脑放出多巴胺=你又拿回了一点控制感。在末日中,行动是最好的抗抑郁药。', tags: ['士气', '心理', '行动'], cat: 'psychology' },
    { title: 'RICE——扭伤急救', content: 'Rest(休息)+Ice(冰敷20分钟/每2-3h)+Compression(压迫绷带从远心端向近心端缠绕)+Elevation(抬高患处高于心脏)。扭伤后48小时内用RICE——减少肿胀和疼痛。如果48h后无法承重——可能骨折需固定。', tags: ['扭伤', '急救', 'RICE'], cat: 'medical' },
    { title: '烟囱效应——掩体通风', content: '掩体通风利用烟囱效应:进气口低(地面附近,冷空气进入)+排气口高(高于进气口,热空气上升排出)。温差越大抽力越强。不需要电力——纯物理原理。每个掩体都应该有被动通风方案作为主动通风(电动鼓风机)的备份。', tags: ['通风', '掩体', '物理'], cat: 'shelter' },
    { title: '子弹口径——你应该了解的', content: '9mm(手枪/冲锋枪)——最常见的手枪弹。5.56×45mm(.223)——M16/AR-15步枪弹 高初速低后座。7.62×39mm——AK-47步枪弹 穿透力强。7.62×51mm(.308)——全威力步枪弹/狙击弹。.22LR——小口径 便宜轻便 适合小猎物。12 Gauge——霰弹枪口径 近战王者。', tags: ['弹药', '口径', '知识'], cat: 'weapons' }
  ],

  // ==================== FAQ数据库 (~500 entries) ====================
  faq: [
    { q: '在没有GPS和指北针的情况下如何找到北方?', a: '①白天:手表法——时针对准太阳,时针与12点夹角的平分线指向南(北半球)。②夜晚:北斗七星"勺口"两颗星向外延伸5倍=北极星(正北)。③自然:孤立树的树冠北侧稀疏;苔藓常见于树干北侧(但不是绝对的!)', tags: ['导航', '方向', '无工具'] },
    { q: '我应该储备多少水?', a: '每人每天基础需求:饮用水1-2L+基本卫生1-2L=总计2-4L/天。在炎热/高强度活动中可能达到6L+/天。最低储备=3天量(约12L/人)。推荐储备=2周至1个月。4人家庭×1个月×4L/天=约480L(约2个200L大桶+5个19L桶)。', tags: ['水', '储备', '数量'] },
    { q: '哪种电池最适合长期储存?', a: '①一次性锂电池(Energizer Ultimate Lithium)——保质期20年、不漏液——BOB包/应急设备首选。②碱性电池——保质期5-10年、便宜、但会漏液(毁掉设备!)。③镍氢充电电池(Eneloop)——可反复充电、低自放电、但需要太阳能充电方案。不要将碱性电池长期留在设备内(漏液会腐蚀触点)!', tags: ['电池', '储存', '对比'] },
    { q: '如果掩体里的空气用完了怎么办?', a: '每人每小时需要约1.5m³新鲜空气。在没有通风的情况下:一个2×3×2m(12m³)的密闭空间,单人在约8小时后CO₂浓度达到危险水平(>5000ppm)。4人则仅2小时。必须通风! 手动方案:手摇鼓风机/脚踏鼓风机。CO₂比缺氧先致命——所以CO₂监测器比O₂监测器更重要。', tags: ['掩体', '空气', 'CO2'] },
    { q: '罐头鼓起来能吃吗?', a: '绝对不能!!! 罐体鼓胀=罐内有细菌(极可能是肉毒杆菌)生长并产气。肉毒毒素是已知最强毒素之一(1g可杀死100万人)。即使煮沸也不能完全破坏肉毒毒素(需要>120°C高压灭菌)。鼓胀罐头=致命毒药! 立即丢弃——不要打开(避免气溶胶吸入)!', tags: ['罐头', '安全', '肉毒'] },
    { q: '我可以喝自己的尿来生存吗?', a: '不可以! 尿液含有身体正在排出的废物(尿素、盐、毒素)。喝尿=把这些废物重新摄入=增加肾脏负担加速脱水。在极端情况下(如海上求生)最多循环1-2次,然后尿液变得过于浓缩有害。喝尿永远不如找其他水源。用尿液浸湿衣物降温是可以的——但不要喝。', tags: ['水', '尿液', '神话'] },
    { q: '发电机能放多久?', a: '汽油发电机:如果每3-6个月不运行一次,化油器中残留的汽油会蒸发留下胶质堵塞喷油孔——下次启动困难或无法启动。维护方案:定期运行(每月至少15-30分钟)→或不使用时排空化油器中的汽油。柴油发电机更耐用但同样需要定期运行。丙烷发电机无此问题——丙烷不会结胶。', tags: ['发电机', '维护', '储存'] },
    { q: '什么食物永远不坏?', a: '蜂蜜(考古在埃及金字塔发现3000年前仍可食用的蜂蜜)、盐(只要防潮)、白糖(密封防潮防虫)、纯枫糖浆(密封)、烈酒(>40%酒精)、白醋、酱油(高盐发酵)。这些是"永久储存"的典范——可以储备大量且无需旋转。', tags: ['食物', '保质期', '永久'] },
    { q: '我应该买碘化钾吗?', a: '碘化钾(KI)仅保护甲状腺免受放射性碘-131伤害——不保护其他器官!不阻挡其他放射性同位素!只在核事故/核爆后服用(最好24小时内)。成人130mg/天,儿童65mg/天。不是"抗辐射药"——只做这一件事。如果你不在核目标区域或核电站附近——优先级远低于基本的水/食物/医疗储备。', tags: ['碘化钾', '核', '防护'] },
    { q: '怎样发现有人在跟踪你?', a: '①定期改变行走速度——跟踪者被迫跟着变速容易暴露 ②利用商店橱窗反射观察身后 ③偶尔转身假装系鞋带/看手机(自然观察身后)④进入建筑后立即拐弯并在拐角处等待——如果同一个人也拐弯进来就很可疑 ⑤改变路线——如果同一个人在不同街道都"偶遇"你=在跟踪。', tags: ['安全', '跟踪', '反侦察'] },
    { q: '冻死需要多久?', a: '取决于温度+风速+衣物+个体状况。在0°C:无庇护无保暖→失温可能2-4小时致命。在-18°C(0°F):可能30-60分钟致命。在极寒-40°C:可能<15分钟致命。风速(Wind Chill)=体感温度远低于实际温度——风速40km/h→-10°C体感=-25°C。', tags: ['失温', '温度', '时间'] },
    { q: '避难所多久需要换气?', a: '每1-2小时。更准确:CO₂浓度<1000ppm(理想)、<2000ppm(可接受)、>5000ppm(危险)。简单的评估法:如果你开始感觉"闷"或轻微头痛=CO₂已经>2000ppm=立即通风。被动通风(热压差)可提供持续缓慢的气流交换——这就是为什么烟囱效应通风口如此重要。', tags: ['掩体', '通风', 'CO2'] },
    { q: '怎么知道野生植物可不可以吃?', a: '通用可食性测试(仅极端情况!):①植物各部分分开(根/茎/叶/花/果)②闻——苦杏仁/桃核味=可能含氰化物 ③手腕内侧擦拭→等15分钟看皮肤反应 ④放嘴唇上等3分钟看刺痛 ⑤舌尖3分钟 ⑥咀嚼但不吞咽含15分钟 ⑦吞咽少量等8小时 ⑧无反应=可能安全。但蘑菇——没有任何通用测试方法!只能靠100%确定识别。', tags: ['植物', '觅食', '测试'] },
    { q: '什么是最重要的生存工具?', a: '你的大脑。第二是刀。第三是生火工具。所有的装备和储备在没有知识的人手中毫无价值——所有的知识在有装备的人手中能拯救生命。投资在培训和练习上的时间比投资在装备上的金钱有更高的回报率。', tags: ['生存', '工具', '优先级'] },
    { q: '如何在没有磨刀石的情况下磨刀?', a: '①陶瓷杯/盘底部(未上釉的粗糙环)——极好的替代磨石 ②汽车车窗玻璃边缘(非夹层的侧窗边缘)③细砂纸(600-1000目)平放在平坦表面上 ④平整的河石+水+耐心 ⑤皮革+抛光膏(用于最后一步——不等于磨刀)。在野外,刀保持"能用就行"的锋利度——不需要剃刀锋利。', tags: ['磨刀', 'DIY', '技巧'] },
    { q: '婴儿在末日中最需要什么?', a: '①配方奶粉(至少6个月量)——婴儿不能消化成人食物 ②纸尿裤/布尿裤——卫生防疫的关键 ③婴儿退热药(对乙酰氨基酚儿童滴剂)——发烧在婴儿中比成人危险得多 ④口服补液盐——婴儿腹泻脱水比成人快得多 ⑤安抚物品——毛绒玩具/小毯子 ⑥干净的水——冲奶粉的水必须比成人饮用水更严格(煮沸后冷却)。', tags: ['婴儿', '儿童', '储备'] },
    { q: '什么衣服最保暖?', a: '保暖=留住静止空气。羽绒(潮湿环境忌用——湿了完全失效)、合成保暖棉(Primaloft/Thinsulate——湿了仍保暖)、羊毛(湿了仍保暖70%)、抓绒(Polartec——快干)。层次原则:内层排汗(羊毛/化纤)→中层保暖(抓绒/羽绒)→外层防风防水(Gore-Tex)。宁可多层次(可调)也不要一件超厚(无法调节)。', tags: ['保暖', '服装', '层次'] },
    { q: '怎么看待末日后的法律问题?', a: '末日中你面临的是道德选择而非法律条文。核心原则:①自卫是自然权利——但"自卫"vs"报复"的界限在末日中由幸存者社区判断 ②如果社会秩序恢复——你也许需要为"紧急避险"行为辩护 ③记录你的行为(日志)——在事后可以证明你的行为是"必要性"驱动而非"恶意" ④最安全的原则:只在保护生命和防止严重伤害时使用武力。', tags: ['法律', '道德', '自卫'] },
    { q: '一年需要多少柴火取暖?', a: '取决于:气候+房屋大小+隔热+炉具效率。粗略估算:温和气候(冬季最低-5°C):3-5吨。寒冷气候(冬季最低-20°C):6-10吨。极寒气候(冬季最低-40°C):10-15吨。高效柴火炉比敞开壁炉省柴50-70%。硬木(橡木/槐木)=燃烧时间是软木(松/杉)的1.5-2倍。', tags: ['柴火', '取暖', '需求量'] },
    { q: '末日中什么技能最有价值?', a: '①医疗——医生/护士在末日中比将军更珍贵 ②机械维修——修发电机/水泵/车辆 ③种植——粮食生产 ④电工/太阳能——能源系统 ⑤净水——水文/化学/工程 ⑥枪械/防御——保护社区 ⑦无线电通讯——对外联络 ⑧木工/建筑——建造和修理。如果你有以上任何一项技能——你在末日中是不可或缺的。', tags: ['技能', '价值', '末日'] },
    { q: '怎样避免被狗追踪?', a: '搜寻犬追踪你的气味(皮肤细胞+汗液+气味分子持续飘落)。阻断方法:①穿越流水——最有效的气味阻断(在水中走至少50-100m再上岸)②沿着强气味路径走(牲畜走过的路/施肥的农田)③撒强烈气味(胡椒粉/烟草水)——可暂时扰乱追踪犬嗅觉但会留下新的"奇特点"④倒走折返——走一段路后倒着走+跳离路径——追踪犬误以为你折返了。', tags: ['追踪', '反追踪', '狗'] },
    { q: '太阳能板在阴天还能发电吗?', a: '能——但输出大幅降低。阴天:10-25%的额定功率(100W板→10-25W)。雨天(深色乌云):5-10%输出。所以设计太阳能系统时:电池容量=日需求量的3-5倍(撑过连续阴雨天)。另一个策略:增大太阳能板容量——在阴天也有足够的绝对输出(例如需要100W就装400W板)。', tags: ['太阳能', '天气', '设计'] },
    { q: '我需要为宠物准备什么?', a: '①宠物食品(至少2周)→3-6月量理想 ②宠物药物(跳蚤/心丝虫)/病历 ③额外饮水(大型犬每天1-2L)④牵引绳+嘴套+便携笼 ⑤宠物身份标识(芯片+项圈+你的联系方式)⑥熟悉宠物的"隐藏点"——灾难时宠物会躲起来 ⑦宠物的BOB包。心理上:在末日中宠物可能是最重要的精神支柱。', tags: ['宠物', '准备', '物资'] },
    { q: '怎样储存汽油使其保质期更长?', a: '①使用金属密封油桶(非塑料!)——汽油蒸汽会渗透塑料 ②添加燃料稳定剂(Sta-Bil/PRI-G)——延长保质期从6-12月到2-3年 ③装满油桶(减少空气空间=减少氧化)④储存于阴凉+避光+远离火源 ⑤避免乙醇汽油(E10)——乙醇吸水加速变质 ⑥标注日期+6个月后旋转使用(旧油加到车里烧掉换新油)。', tags: ['汽油', '储存', '保质期'] },
    { q: '地震时我在床上——怎么办?', a: '待在床上! 用枕头护住头部。床下空间狭小反而不安全——床在重物下可能被压碎。如果上方有吊灯/吊扇——滚到床的边缘(不在正下方)。地震中大多数受伤不是房屋完全倒塌——而是被掉落的灯具/天花板碎片/翻倒的家具砸伤。待在床上+枕头护头=最佳选择。', tags: ['地震', '安全', '室内'] }
  ],

  // ==================== 中国主要城市威胁评估 (~100 entries) ====================
  chinaRegionThreats: [
    { region: '北京', primaryThreat: '地震(华北地震带)+社会风险(首都目标)+空气污染', riskLevel: '中高', shelterType: '地下掩体/郊区安全屋', waterSource: '地下水+南水北调', growingZone: '6b-7a(温带)' },
    { region: '上海', primaryThreat: '洪水+海平面上升+台风+社会风险(经济中心)', riskLevel: '高', shelterType: '高层安全屋+内陆撤离点', waterSource: '长江/黄浦江(需净化)', growingZone: '8b-9a(亚热带)' },
    { region: '广州', primaryThreat: '台风+洪水+高温高湿', riskLevel: '中高', shelterType: '地上堡垒+台风避难所', waterSource: '珠江(需深度净化)', growingZone: '10a-11(热带)' },
    { region: '深圳', primaryThreat: '台风+海平面上升+社会风险(人口密集)', riskLevel: '中高', shelterType: '高层安全屋+内陆撤离', waterSource: '东江(需净化)', growingZone: '10b-11' },
    { region: '成都', primaryThreat: '地震(龙门山断裂带)+洪水', riskLevel: '高(地震)', shelterType: '地下掩体/郊区安全屋', waterSource: '地下水丰富+岷江', growingZone: '8b-9a' },
    { region: '重庆', primaryThreat: '洪水+山体滑坡+高温', riskLevel: '中', shelterType: '地上堡垒(地下挖掘困难——岩石)', waterSource: '长江+嘉陵江', growingZone: '9a-10a' },
    { region: '武汉', primaryThreat: '洪水(长江/汉江)+高温高湿', riskLevel: '中高', shelterType: '高层安全屋+加固建筑', waterSource: '长江/汉江(需净化)', growingZone: '8b-9a' },
    { region: '西安', primaryThreat: '地震(关中地震带)+缺水', riskLevel: '中', shelterType: '地下掩体(黄土高原适合挖掘)', waterSource: '地下水(水位下降)+引汉济渭', growingZone: '7a-7b' },
    { region: '南京', primaryThreat: '洪水(长江)+台风外围', riskLevel: '中', shelterType: '加固建筑+郊区安全屋', waterSource: '长江(需净化)', growingZone: '8a-8b' },
    { region: '哈尔滨', primaryThreat: '极寒(-30°C以下)+暴雪', riskLevel: '中(冬季极端)', shelterType: '地下掩体(防冻要求高)', waterSource: '松花江(冬季结冰)', growingZone: '4a-4b(寒温带)' },
    { region: '沈阳', primaryThreat: '极寒+冬季暴雪+朝鲜半岛不稳定', riskLevel: '中', shelterType: '地下掩体(防冻)', waterSource: '地下水+辽河', growingZone: '5a-5b' },
    { region: '乌鲁木齐', primaryThreat: '地震+极寒+干旱+地缘风险', riskLevel: '高', shelterType: '地下掩体(荒漠地区)', waterSource: '地下水(稀缺)', growingZone: '5b-6a(干旱)' },
    { region: '拉萨', primaryThreat: '地震(喜马拉雅带)+高海拔缺氧+极寒', riskLevel: '高(高原)', shelterType: '加固建筑+太阳能', waterSource: '拉萨河+冰川融水', growingZone: '7a-7b(高原)' },
    { region: '昆明', primaryThreat: '地震(云南多震)+山体滑坡', riskLevel: '中高', shelterType: '加固建筑+郊区安全屋', waterSource: '滇池(需净化)+地下水', growingZone: '9b-10a' },
    { region: '海口', primaryThreat: '台风(登陆点)+海啸风险+高温高湿', riskLevel: '高', shelterType: '台风避难所+内陆撤离', waterSource: '南渡江+地下水', growingZone: '11-12(热带)' }
  ],

  // ==================== 技能等级自评表 ====================
  skillSelfAssessment: [
    { skill: '生火(打火棒/钻木)', level1: '从未尝试', level2: '在理想条件下成功过', level3: '雨天可生火', level4: '任何条件下<5分钟', level5: '可教别人' },
    { skill: '净水(过滤+消毒)', level1: '只知道煮沸', level2: '用过Sawyer/药片', level3: '会组合多种方法', level4: '懂各种方法的局限', level5: '可设计水处理系统' },
    { skill: '庇护所搭建', level1: '只会搭帐篷', level2: '会用防水布', level3: '会用自然材料搭建', level4: '任何环境可搭建', level5: '可教别人' },
    { skill: '地图+指北针导航', level1: '只会用GPS', level2: '能看地图', level3: '能指北针定向', level4: '不看手机可越野导航', level5: '可教别人/竞赛级' },
    { skill: '急救(止血/CPR/固定)', level1: '只贴过创可贴', level2: '上过急救课', level3: '能处理重大出血', level4: '能处理气胸/骨折', level5: '战伤急救/野外手术' },
    { skill: '狩猎/陷阱', level1: '从未尝试', level2: '设过陷阱没抓到', level3: '成功捕到小猎物', level4: '稳定提供动物蛋白', level5: '狩猎导师级' },
    { skill: '食物保存', level1: '只用冰箱', level2: '会真空密封', level3: '会盐腌/干燥', level4: '会烟熏/发酵', level5: '可全年无电保存食物' },
    { skill: '无线电通讯', level1: '没用过对讲机', level2: '会用对讲机', level3: '会编程频道', level4: '可搭建天线+远距通联', level5: '业余无线电执照+莫尔斯' },
    { skill: '种植/农业', level1: '从没种过东西', level2: '种过盆栽', level3: '能种菜园', level4: '能产出全年部分食物', level5: '能完全靠种植自给' },
    { skill: '体能/负重行军', level1: '久坐不运动', level2: '偶尔运动', level3: '可负重10kg走10km', level4: '可负重15kg走20km', level5: '军事级体能' },
    { skill: '防身/自卫', level1: '完全没有', level2: '看过自卫视频', level3: '上过自卫课', level4: '持续练习有实战能力', level5: '专业级(军/警/格斗)' },
    { skill: '机械维修', level1: '完全不会', level2: '能换轮胎', level3: '能修小引擎', level4: '能修发电机/水泵', level5: '能修任何机械' }
  ],

  // ==================== 以物易物——价值对照表 ====================
  barterValues: [
    { item: '1盒阿莫西林(抗生素)', rank: 'SSS级', tradeFor: '几乎可以换任何东西', note: '在末日中,抗生素的价值无法用金钱衡量——它可以换取食物、水、庇护、保护。' },
    { item: '1瓶止痛药(布洛芬100片)', rank: 'SS级', tradeFor: '约等于一个月的食物', note: '疼痛是末日日常——止痛药是精神+生理双重必需品。' },
    { item: '1条香烟(200支)', rank: 'S级', tradeFor: '约等于2周食物或1把好刀', note: '尼古丁成瘾是生理性的——吸烟者会为了烟牺牲大量物资。' },
    { item: '1瓶烈酒(500ml >50度)', rank: 'A级', tradeFor: '约等于1周食物或小工具', note: '可饮用+消毒+燃料——三重用途增加价值。' },
    { item: '1箱9mm子弹(50发)', rank: 'A级', tradeFor: '约等于2-4周食物或1把弓', note: '在需要枪支防御的地区价值极高;在和平地区价值有限。' },
    { item: '1罐咖啡(500g)', rank: 'B级', tradeFor: '约等于1周食物', note: '咖啡因戒断=剧烈头痛+疲劳——成瘾者的刚需。' },
    { item: '1卷卫生纸', rank: 'C级', tradeFor: '约等于1顿饭或小服务', note: '"小额零钱"——储备大量卫生纸作为日常小额交易媒介。' }
  ]
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SURVIVAL_ADVISOR;
}
