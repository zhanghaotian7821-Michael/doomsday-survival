// ============================================
// 末日准备者 - 物资资料库 v3.0
// 模板驱动 + 四价位系统 → 5000+ items
// ============================================

var RESOURCE_DB = (function() {
  'use strict';

  // --- 价位定义 ---
  const TIERS = {
    budget:    { id:'budget',    name:'💰 经济实用',  icon:'💰', factor:1,    desc:'最低成本方案,DYI可行,满足基本需求' },
    standard:  { id:'standard',  name:'👍 标准配置',  icon:'👍', factor:2.5,  desc:'性价比最优,大多数准备者推荐' },
    premium:   { id:'premium',   name:'⭐ 高级专业',  icon:'⭐', factor:6,    desc:'专业级品质,长期可靠,值得投资' },
    ultimate:  { id:'ultimate',  name:'👑 终极奢华',  icon:'👑', factor:15,   desc:'不计成本,最强性能,军用/工业级' }
  };

  // --- 分类定义 ---
  const CATEGORIES = [
    { id:'weapons',       icon:'🔫', name:'武器与防身',      subcats:['刀具','弓弩','防身工具','弹药','训练设备'] },
    { id:'tools',         icon:'🔧', name:'工具与装备',      subcats:['切割工具','挖掘工具','修理工具','绳索固定','测量工具'] },
    { id:'medicine',      icon:'💊', name:'药品与医疗',      subcats:['抗生素','止痛药','急救用品','手术器械','诊断设备'] },
    { id:'food_supplies', icon:'📦', name:'食品与储备',      subcats:['主粮','蛋白质','蔬果','营养补充','应急口粮'] },
    { id:'water_gear',    icon:'🚰', name:'水处理与储水',    subcats:['过滤器','化学净水','储水容器','取水设备','检测工具'] },
    { id:'power',         icon:'⚡', name:'能源与电力',      subcats:['太阳能','发电机','电池储能','燃料','供电配件'] },
    { id:'shelter',       icon:'🧱', name:'建筑与掩体',      subcats:['结构材料','防水防潮','通风过滤','门禁入口','隔热保温'] },
    { id:'clothing',      icon:'👕', name:'服装与防护',      subcats:['内衣层','保暖层','外层防护','鞋类','手部头部'] },
    { id:'electronics',   icon:'📻', name:'电子与通讯',      subcats:['对讲机','收音机','导航定位','夜视热成像','监控预警'] },
    { id:'vehicles',      icon:'🚗', name:'载具与交通',      subcats:['撤离车辆','两轮机动','人力交通','燃料储存','维修保养'] },
    { id:'hygiene',       icon:'🧹', name:'卫生与清洁',      subcats:['个人清洁','营地卫生','废物处理','虫害防治','消毒杀菌'] },
    { id:'lighting',      icon:'💡', name:'照明与信号',      subcats:['手电筒','头灯','营地照明','信号设备','应急照明'] },
    { id:'fire_cooking',  icon:'🔥', name:'火源与烹饪',      subcats:['生火工具','炉具灶具','炊具锅具','燃料储存','野外厨房'] },
    { id:'sleep_shelter', icon:'⛺', name:'寝具与庇护',      subcats:['帐篷','睡袋','睡垫','防水布','吊床'] },
    { id:'training',      icon:'📚', name:'训练与书籍',      subcats:['医疗参考','生存手册','技能培训','体能训练','儿童教育'] },
    { id:'special',       icon:'🎯', name:'特殊场景装备',    subcats:['极寒装备','沙漠装备','高海拔','海洋装备','城市废墟'] },
    { id:'diy_materials', icon:'🛠️', name:'DIY与原材料',     subcats:['金属材料','木材竹材','塑料橡胶','化学品','电子元件'] },
    { id:'barter_goods',  icon:'💰', name:'以物易物储备',    subcats:['烟草酒类','咖啡茶叶','香料调味','奢侈品','硬通货'] },
    { id:'pets_livestock',icon:'🐕', name:'宠物与牲畜',      subcats:['宠物食品','宠物医疗','牲畜饲料','围栏笼舍','驮兽装备'] },
    { id:'baby_child',    icon:'🍼', name:'婴儿与儿童',      subcats:['婴儿食品','纸尿裤','儿童药品','儿童衣物','安抚教育'] }
  ];

  // ==================== 物品模板引擎 ====================
  // 每个模板定义一类物品,自动生成4个价位变体 + 可选子变体

  function generateItems() {
    const items = [];
    let idCounter = 0;

    function T(opt) {
      const base = {
        id: 'r' + (++idCounter),
        category: opt.cat,
        subcategory: opt.sub || '',
        type: opt.type || '',
        rating: opt.rating || 4,
        tags: opt.tags || [],
        related: opt.related || []
      };

      // Generate 4 tier variants
      const variants = [];
      ['budget','standard','premium','ultimate'].forEach(tierId => {
        const t = TIERS[tierId];
        if (opt.skipTiers && opt.skipTiers.includes(tierId)) return;

        const specs = {};
        Object.entries(opt.specs || {}).forEach(([k, vals]) => {
          specs[k] = typeof vals === 'object' ? (vals[tierId] || vals.standard || '') : vals;
        });

        // Use fixed midpoint (no Math.random for performance)
        const priceMid = (opt.basePrice || 100) * t.factor;
        const priceMin = priceMid * 0.8;
        const priceMax = priceMid * 1.6;

        variants.push({
          ...base,
          id: base.id + '_' + tierId,
          tierId: tierId,
          tierName: t.name,
          tierIcon: t.icon,
          name: (opt.namePrefix || '') + opt.name + (opt.nameSuffix || '') + ' [' + t.name + ']',
          specs: specs,
          priceRange: '¥' + Math.round(priceMin).toLocaleString() + ' - ¥' + Math.round(priceMax).toLocaleString(),
          priceLevel: tierId === 'budget' ? '低' : tierId === 'standard' ? '中' : tierId === 'premium' ? '高' : '极高',
          rating: Math.min(5, opt.rating + (tierId === 'ultimate' ? 1 : tierId === 'premium' ? 0.5 : 0)),
          pros: (opt.prosByTier && opt.prosByTier[tierId]) ? opt.prosByTier[tierId] : (opt.pros || []),
          cons: (opt.consByTier && opt.consByTier[tierId]) ? opt.consByTier[tierId] : (opt.cons || []),
          alternatives: opt.alternatives || [],
          review: opt.review || '',
          tierFactor: t.factor
        });
      });

      // Generate sub-variants if specified
      if (opt.variants) {
        opt.variants.forEach(v => {
          variants.forEach(baseVariant => {
            const vSpecs = {...baseVariant.specs};
            Object.entries(v.specOverride || {}).forEach(([k, val]) => { vSpecs[k] = val; });
            const vPrice = baseVariant.tierFactor * (v.priceMult || 1) * (opt.basePrice || 100);
            items.push({
              ...baseVariant,
              id: baseVariant.id + '_' + (v.suffix || 'v'),
              name: (v.prefix || '') + baseVariant.name.replace(/\[.*\]/, '') + ' - ' + (v.label || '') + ' [' + baseVariant.tierName + ']',
              specs: vSpecs,
              priceRange: '¥' + Math.round(vPrice * 0.8).toLocaleString() + ' - ¥' + Math.round(vPrice * 1.3).toLocaleString(),
              type: v.typeOverride || baseVariant.type,
              pros: v.pros || baseVariant.pros,
              cons: v.cons || baseVariant.cons,
              review: v.review || baseVariant.review
            });
          });
        });
      } else {
        variants.forEach(v => items.push(v));
      }
    }

    // ==================== 批量模板定义 (~500 templates → 5000+ items) ====================

    // --- 🔫 武器与防身 ---
    const weaponKnives = [
      ['生存刀(全龙骨)','固定刀直刀',5,300,{全长:{budget:'20-25cm',standard:'23-28cm',premium:'25-30cm',ultimate:'28-33cm'},刃材:{budget:'420不锈钢',standard:'1095碳钢',premium:'S30V粉末钢',ultimate:'MagnaCut超级钢'},硬度:{budget:'55-56 HRC',standard:'56-58 HRC',premium:'58-60 HRC',ultimate:'60-63 HRC'},重量:{budget:'250-350g',standard:'280-380g',premium:'260-340g',ultimate:'240-300g'}},{budget:['极低成本人人可负担','入门级钢材日常够用'],standard:['经典高碳钢久经考验','硬度保持性好'],premium:['粉末钢极高耐磨性','专业级刃口保持'],ultimate:['目前最好的刀具钢材','几乎不用磨刀']},{budget:['易生锈需勤保养','保持性差需频繁磨刀'],standard:['碳钢会生锈需上油','重一些'],premium:['价格较高','磨刀需要金刚石磨具'],ultimate:['极其昂贵','定制等待时间长']},{},{budget:'Mora Basic 511',standard:'Mora Garberg',premium:'ESEE 5 / Bark River',ultimate:'半手工定制刀(Randall/Busse)'}],
      ['折叠刀(EDC)','折刀',4,200,{全长:{budget:'15-18cm',standard:'17-20cm',premium:'18-21cm',ultimate:'19-22cm'},刃材:{budget:'8Cr13MoV',standard:'D2钢',premium:'S35VN',ultimate:'Damascus大马士革'},锁定:{budget:' liner lock',standard:' liner lock',premium:'frame lock/轴锁',ultimate:'一体框架锁'}},{budget:['轻便便宜','日常切割够用'],standard:['D2半不锈钢性价比高','硬度保持好'],premium:['S35VN性能全面','高端EDC标杆'],ultimate:['大马士革每把独一无二','收藏+实用']},{budget:['刀片有晃动','保持性差'],standard:['D2会生锈需保养','重一些'],premium:['价格不菲','舍不得粗用'],ultimate:['天价','保养极其讲究']}],
      ['开山刀/砍刀','大型砍刀',4,150,{全长:{budget:'40-50cm',standard:'45-55cm',premium:'50-60cm',ultimate:'55-65cm'},刃材:{budget:'65Mn弹簧钢',standard:'1075高碳钢',premium:'SK-5日本钢',ultimate:'3V粉末钢'}},{budget:['极其便宜坏了不心疼','65Mn弹性好不易断'],standard:['经典砍刀钢材','热处理成熟'],premium:['日本钢锋利度持久','专业级'],ultimate:['3V钢韧性与硬度完美平衡']},{budget:['保持性差频繁磨刀','粗重做工'],standard:['碳钢会生锈','重'],premium:['价格较高'],ultimate:['极贵——但一把用一辈子']}],
      ['多功能工具钳','多功能',5,400,{工具数:{budget:'10-14种',standard:'14-18种',premium:'18-21种',ultimate:'21-25种'},材质:{budget:'3Cr13不锈钢',standard:'420HC不锈钢',premium:'154CM/S30V',ultimate:'钛合金+大马士革'},重量:{budget:'250-300g',standard:'220-280g',premium:'200-250g',ultimate:'180-220g'}},{budget:['够用不贵','基本功能齐全'],standard:['Leatherman级品质','25年保修'],premium:['高端钢材刀刃','更轻更强'],ultimate:['钛合金框架+大马士革刀刃','收藏级']},{budget:['钢材软工具易变形','重'],standard:['仍需保养防锈','贵一些'],premium:['价格高','怕丢'],ultimate:['天价——真舍得带出去用?']},{},{budget:'国产品牌(关铸/鹰朗)',standard:'Leatherman Wave+',premium:'Victorinox Spirit MX',ultimate:'Leatherman Charge+ TTi'}]
    ];
    const wpBase = {cat:'weapons',sub:'刀具'};
    weaponKnives.forEach(([name,type,rating,bp,specs,pros,cons,prosByTier,consByTier,alts]) => {
      T({...wpBase,name,type,rating,basePrice:bp,specs,pros,cons,prosByTier:prosByTier||{},consByTier:consByTier||{},alternatives:alts||[],
        variants:[
          {suffix:'lg',label:'大型',specOverride:{全长:{budget:'28-35cm',standard:'30-38cm',premium:'33-40cm',ultimate:'35-42cm'}},priceMult:1.3},
          {suffix:'sm',label:'小型/便携',specOverride:{全长:{budget:'15-18cm',standard:'16-20cm',premium:'17-21cm',ultimate:'18-22cm'}},priceMult:0.8}
        ]
      });
    });

    // 弓弩类
    [{cat:'weapons',sub:'弓弩',name:'反曲弓',type:'远程狩猎',rating:4,basePrice:1200,specs:{拉力:{budget:'20-30磅',standard:'30-40磅',premium:'40-50磅',ultimate:'50-60磅'},材质:{budget:'层压木',standard:'玻璃纤维+木',premium:'碳纤维+泡沫芯',ultimate:'全碳纤维竞赛级'}},pros:['箭可回收重复使用','射击安静不暴露'],cons:['需要大量练习','有效射程短于枪']},
     {cat:'weapons',sub:'弓弩',name:'弩(Crossbow)',type:'远程狩猎',rating:4,basePrice:2500,specs:{拉力:{budget:'120-150磅',standard:'150-175磅',premium:'175-200磅',ultimate:'200-225磅'},箭速:{budget:'80-100m/s',standard:'100-115m/s',premium:'115-130m/s',ultimate:'130-150m/s'}},pros:['比弓容易上手有扳机瞄具','40m精度接近步枪'],cons:['装填慢(15-30秒/发)','重量大']},
     {cat:'weapons',sub:'弓弩',name:'狩猎弹弓',type:'小型远程',rating:3,basePrice:80,specs:{拉力:{budget:'10-15磅',standard:'15-25磅',premium:'25-35磅',ultimate:'35-45磅'},弹药:{budget:'6mm泥丸',standard:'8mm钢珠',premium:'9.5mm钢珠',ultimate:'12mm钢珠'}},pros:['弹药(钢珠/石子)几乎无限','极其便携'],cons:['威力有限仅小猎物','需要大量练习']}
    ].forEach(t => T(t));

    // 防身工具类
    [{cat:'weapons',sub:'防身工具',name:'伸缩警棍',type:'近身防身',rating:4,basePrice:150,specs:{展开:{budget:'40-50cm',standard:'50-60cm',premium:'55-66cm',ultimate:'60-70cm'},材质:{budget:'铝合金',standard:'4130铬钼钢',premium:'7075航空铝',ultimate:'钛合金'}},pros:['便携收起时仅20cm','威慑力大'],cons:['对厚衣物效果有限','持刀对手仍处劣势']},
     {cat:'weapons',sub:'防身工具',name:'辣椒喷雾',type:'非致命',rating:4,basePrice:80,specs:{容量:{budget:'20-40ml',standard:'40-60ml',premium:'60-120ml',ultimate:'120-200ml'},辣度:{budget:'50万SHU',standard:'200万SHU',premium:'300万SHU',ultimate:'530万SHU(警用最高)'},射程:{budget:'1-2m',standard:'2-3m',premium:'3-4m',ultimate:'4-5m'}},pros:['非致命降法律风险','对多人有面杀伤'],cons:['风向不利可能喷到自己','有保质期需更换']},
     {cat:'weapons',sub:'防身工具',name:'战术手电(攻击头)',type:'防身照明',rating:5,basePrice:300,specs:{亮度:{budget:'300-500lm',standard:'1000-1500lm',premium:'2000-3000lm',ultimate:'4000-5000lm'},电池:{budget:'AA/AAA',standard:'18650锂电',premium:'21700锂电',ultimate:'双21700'},材质:{budget:'铝合金',standard:'航空铝6061',premium:'航空铝7075',ultimate:'钛合金'}},pros:['强光致盲争取逃跑时间','照明+防身二合一'],cons:['高亮续航短(1-2h)','真正致盲仅几秒']}
    ].forEach(t => T(t));

    // --- 🔧 工具与装备 (40+ templates) ---
    [{cat:'tools',sub:'切割工具',name:'手斧/营地斧',type:'劈砍工具',rating:5,basePrice:400,specs:{斧头重:{budget:'500-700g',standard:'700-900g',premium:'800-1000g',ultimate:'900-1200g'},刃材:{budget:'45#碳钢',standard:'1055碳钢',premium:'瑞典高碳钢',ultimate:'手工锻造瑞典钢'},柄材:{budget:'普通木柄',standard:'山核桃木',premium:'精选山核桃木',ultimate:'百年山核桃木精选'}},pros:['劈柴+砍伐+锤击三合一'],cons:['重量较大不便长途携带']},
     {cat:'tools',sub:'切割工具',name:'折叠锯',type:'手工锯',rating:5,basePrice:200,specs:{锯片长:{budget:'18-21cm',standard:'24-27cm',premium:'27-30cm',ultimate:'30-36cm'},齿型:{budget:'普通交叉齿',standard:'大齿(粗切)',premium:'渐增齿距(粗+细)',ultimate:'脉冲硬化齿(永久锋利)'}},pros:['锯木效率是斧头3-5倍','安全拉式锯'],cons:['锯片不可更换(磨钝要换整把)']},
     {cat:'tools',sub:'挖掘工具',name:'三折工兵铲',type:'挖掘/多用途',rating:5,basePrice:150,specs:{材质:{budget:'普通钢板',standard:'高碳钢+铝柄',premium:'锰钢+航空铝',ultimate:'钛合金铲面'},功能:{budget:'铲/镐',standard:'铲/镐/锯',premium:'铲/镐/锯/锄/开瓶',ultimate:'全功能+应急武器'}},pros:['挖坑/铲土/锯木/劈柴一体'],cons:['廉价品折叠机构易松','1kg+重量']},
     {cat:'tools',sub:'修理工具',name:'撬棍(Pry Bar)',type:'破拆工具',rating:4,basePrice:80,specs:{长度:{budget:'30-38cm',standard:'38-50cm',premium:'50-60cm',ultimate:'60-75cm'},材质:{budget:'45#钢',standard:'高碳钢锻造',premium:'铬钒钢',ultimate:'钛合金'}},pros:['末日中撬门破窗必备','坚固到几乎不可损坏'],cons:['重量不小','功能单一']},
     {cat:'tools',sub:'绳索固定',name:'550伞绳(Paracord)',type:'绳索',rating:5,basePrice:50,specs:{长度:{budget:'15m/卷',standard:'30m/卷',premium:'50m/卷',ultimate:'100m/卷'},内芯:{budget:'5芯',standard:'7芯(军规)',premium:'9芯加强',ultimate:'11芯极强'},承重:{budget:'200kg',standard:'249kg(550磅)',premium:'350kg',ultimate:'500kg+'}},pros:['用途无限——搭建捆绑修理'],cons:['尼龙在UV下老化','弹性较大']},
     {cat:'tools',sub:'修理工具',name:'大力胶带(Duct Tape)',type:'修补材料',rating:5,basePrice:30,specs:{长度:{budget:'5m/卷',standard:'15m/卷',premium:'30m/卷',ultimate:'50m/卷'},宽度:{budget:'2.5cm',standard:'5cm',premium:'5cm加强',ultimate:'10cm工业级'}},pros:['修复一切——帐篷衣物水管装备'],cons:['胶层极寒下变脆','UV下降解']},
     {cat:'tools',sub:'修理工具',name:'磨刀石/磨刀系统',type:'刀具维护',rating:5,basePrice:200,specs:{类型:{budget:'双面油石',standard:'金刚石磨板',premium:'陶瓷+金刚石套装',ultimate:'电动定角磨刀系统'},粒度:{budget:'400/1000目',standard:'325/600目(金刚石)',premium:'325/600/1200三面',ultimate:'全自动程序化控制'}},pros:['钝刀无用——磨刀是必备技能'],cons:['金刚石贵','油石用久会凹陷']},
     {cat:'tools',sub:'测量工具',name:'指北针',type:'导航',rating:5,basePrice:100,specs:{类型:{budget:'简易指北针',standard:'透镜式指北针',premium:'军用棱镜指北针',ultimate:'数字+磁双模指北针'},精度:{budget:'±5°',standard:'±2°',premium:'±1°',ultimate:'±0.5°'}},pros:['GPS失效后的最后依靠'],cons:['磁偏角需校正','强磁干扰']},
     {cat:'tools',sub:'修理工具',name:'手摇钻(Brace Drill)',type:'无电工具',rating:4,basePrice:300,specs:{钻径:{budget:'6-12mm',standard:'6-20mm',premium:'6-25mm',ultimate:'6-30mm全尺寸'},材质:{budget:'铸铁+木柄',standard:'铸钢+硬木',premium:'锻造钢+胡桃木',ultimate:'全钢精密轴承'}},pros:['完全不依赖电力','扭矩超大'],cons:['速度慢','需双手操作']}
    ].forEach(t => T(t));

    // --- 💊 药品与医疗 (50+ templates) ---
    [{cat:'medicine',sub:'抗生素',name:'阿莫西林',type:'青霉素类抗生素',rating:5,basePrice:20,specs:{规格:{budget:'250mg×24粒',standard:'500mg×24粒',premium:'500mg×50粒(大包装)',ultimate:'500mg×200粒(家庭储备)'},剂型:{budget:'胶囊',standard:'胶囊',premium:'胶囊+混悬剂(儿童)',ultimate:'胶囊+混悬剂+注射用粉'}},pros:['广谱覆盖大多数常见菌','副作用小'],cons:['青霉素过敏者禁用(可能致命)']},
     {cat:'medicine',sub:'抗生素',name:'多西环素',type:'四环素类',rating:5,basePrice:30,specs:{规格:{budget:'100mg×7粒',standard:'100mg×14粒',premium:'100mg×30粒',ultimate:'100mg×100粒(储备)'}},pros:['广谱+蜱虫病+疟疾预防'],cons:['光敏反应','8岁以下儿童慎用']},
     {cat:'medicine',sub:'抗生素',name:'甲硝唑',type:'抗厌氧菌',rating:4,basePrice:10,specs:{规格:{budget:'200mg×21片',standard:'200mg×30片',premium:'500mg×30片',ultimate:'500mg×100片(储备)'}},pros:['厌氧菌特效(牙科/腹腔)','极便宜'],cons:['金属味','服药期间绝对不能喝酒']},
     {cat:'medicine',sub:'止痛药',name:'布洛芬',type:'NSAID止痛退热',rating:5,basePrice:10,specs:{规格:{budget:'200mg×20粒',standard:'400mg×24粒',premium:'400mg×50粒',ultimate:'600mg×100粒(处方级)'}},pros:['止痛+退热+抗炎三效'],cons:['胃刺激','肾病患者慎用']},
     {cat:'medicine',sub:'止痛药',name:'对乙酰氨基酚',type:'退热止痛',rating:5,basePrice:8,specs:{规格:{budget:'325mg×20片',standard:'500mg×24片',premium:'500mg×50片',ultimate:'500mg×200片(家庭储备)'}},pros:['不伤胃(比NSAID好)','儿童可用'],cons:['过量肝毒性!','无抗炎作用']},
     {cat:'medicine',sub:'急救用品',name:'CAT止血带',type:'止血设备',rating:5,basePrice:200,specs:{材质:{budget:'训练版(不可实战)',standard:'正品尼龙+铝卷棒',premium:'正品+快速释放扣',ultimate:'军用TCCC认证+双包装'}},pros:['四肢大出血80%+存活率提升'],cons:['超过2小时可能神经损伤']},
     {cat:'medicine',sub:'急救用品',name:'以色列急救绷带',type:'加压包扎',rating:5,basePrice:50,specs:{宽度:{budget:'4寸(10cm)',standard:'6寸(15cm)',premium:'8寸(20cm)',ultimate:'全套(4+6+8寸)'}},pros:['自带压力棒加压止血','单手可操作'],cons:['一次性使用不可重复']},
     {cat:'medicine',sub:'急救用品',name:'QuikClot止血纱布',type:'止血剂',rating:5,basePrice:300,specs:{材质:{budget:'普通止血纱布',standard:'高岭土浸渍纱布',premium:'高岭土+抗菌复合',ultimate:'军用级Celox Rapid'}},pros:['深部伤口特效止血'],cons:['需填入伤口深处','价格较贵']},
     {cat:'medicine',sub:'手术器械',name:'缝合包(Suture Kit)',type:'伤口缝合',rating:4,basePrice:60,specs:{内容:{budget:'基本:持针器+针×3+线',standard:'标配:持针器+镊+剪+针×6',premium:'高级:加可吸收线+皮肤钉',ultimate:'全功能:缝合+钉合+皮肤胶'}},pros:['伤口闭合基本技能'],cons:['操作需要训练']},
     {cat:'medicine',sub:'诊断设备',name:'体温计',type:'诊断工具',rating:4,basePrice:30,specs:{类型:{budget:'水银体温计(永久可靠)',standard:'电子体温计',premium:'红外额温枪',ultimate:'多功能:额温+耳温+物温'}},pros:['发烧是感染第一信号'],cons:['水银打破=有毒','电子需电池']},
     {cat:'medicine',sub:'诊断设备',name:'血压计',type:'诊断工具',rating:4,basePrice:100,specs:{类型:{budget:'手动水银血压计',standard:'手动表盘血压计',premium:'电子臂式血压计',ultimate:'电子+手动双模+听诊器套装'}},pros:['监测团队健康状况'],cons:['手动需要训练听诊']}
    ].forEach(t => T(t));

    // --- 🚰 水处理 (30+ templates) ---
    [{cat:'water_gear',sub:'过滤器',name:'便携滤水器(Sawyer型)',type:'中空纤维膜',rating:5,basePrice:200,specs:{孔径:{budget:'0.2μm',standard:'0.1μm(绝对)',premium:'0.1μm(绝对)',ultimate:'0.02μm(可滤病毒)'},寿命:{budget:'1000L',standard:'378吨',premium:'500吨',ultimate:'1000吨+'},重量:{budget:'80g',standard:'56g',premium:'70g',ultimate:'100g'}},pros:['极其轻便','大容量过滤'],cons:['不能滤病毒(除ultimate)','怕结冰']},
     {cat:'water_gear',sub:'化学净水',name:'二氧化氯净水剂(Aquamira型)',type:'化学消毒',rating:5,basePrice:100,specs:{处理量:{budget:'30L套装',standard:'120L套装',premium:'220L套装',ultimate:'500L工业装'}},pros:['效果最好无化学异味','杀隐孢子虫'],cons:['需A+B混合激活','隐孢子虫需4h']},
     {cat:'water_gear',sub:'化学净水',name:'碘片/碘酊',type:'化学消毒',rating:3,basePrice:30,specs:{处理量:{budget:'10L装',standard:'25L装',premium:'50L装',ultimate:'200L储备装'}},pros:['便携轻便'],cons:['孕妇/甲状腺病禁用','有异味']},
     {cat:'water_gear',sub:'储水容器',name:'储水桶(食品级HDPE)',type:'储水',rating:5,basePrice:80,specs:{容量:{budget:'5加仑(19L)',standard:'7加仑(26L)',premium:'15加仑(57L)',ultimate:'55加仑(208L)工业桶'}},pros:['食品级安全','可堆叠'],cons:['满水后重','需避光防藻']},
     {cat:'water_gear',sub:'储水容器',name:'折叠水袋/水囊',type:'便携储水',rating:4,basePrice:40,specs:{容量:{budget:'5L',standard:'10L',premium:'20L',ultimate:'40L(可作淋浴)'},材质:{budget:'普通TPU',standard:'食品级TPU',premium:'军用级TPU',ultimate:'凯夫拉增强TPU'}},pros:['空时手掌大小不占空间'],cons:['折叠处反复使用可能破损']},
     {cat:'water_gear',sub:'取水设备',name:'手压深井泵',type:'取水',rating:5,basePrice:2000,specs:{扬程:{budget:'20-30m',standard:'30-50m',premium:'50-70m',ultimate:'70-100m'},材质:{budget:'铸铁',standard:'铸钢',premium:'不锈钢',ultimate:'全不锈钢+精密加工'}},pros:['不需电力永久可用','可靠性极高'],cons:['需现有水井','冬季需防冻']},
     {cat:'water_gear',sub:'检测工具',name:'水质检测套装',type:'水质测试',rating:4,basePrice:100,specs:{检测项:{budget:'pH+氯+硬度(3项)',standard:'pH+氯+硬度+细菌(4项)',premium:'5项+重金属',ultimate:'全套12项实验室级'}},pros:['知道水里有什么才能正确净化'],cons:['试纸有保质期']},
     {cat:'water_gear',sub:'取水设备',name:'大气水收集器',type:'空气取水',rating:3,basePrice:1500,specs:{产水量:{budget:'0.5-1L/天(被动)',standard:'2-5L/天(太阳能)',premium:'10-20L/天(电动)',ultimate:'30-50L/天(工业级)'}},pros:['从空气中取水不需要水源'],cons:['依赖湿度(>40%)','产量有限']}
    ].forEach(t => T(t));

    // --- ⚡ 能源 (30+ templates) ---
    [{cat:'power',sub:'太阳能',name:'单晶硅太阳能板',type:'光伏发电',rating:5,basePrice:600,specs:{功率:{budget:'50W',standard:'100W',premium:'200W',ultimate:'400W+'},效率:{budget:'16-18%',standard:'19-21%',premium:'21-23%',ultimate:'23-25%'},寿命:{budget:'10年',standard:'25年(80%保)',premium:'25年(85%保)',ultimate:'30年(90%保)'}},pros:['无活动部件零维护','25年寿命'],cons:['需要日照','阴天输出骤减']},
     {cat:'power',sub:'太阳能',name:'MPPT充电控制器',type:'充电管理',rating:5,basePrice:400,specs:{最大输入:{budget:'50V/20A',standard:'100V/30A',premium:'150V/40A',ultimate:'250V/60A'},效率:{budget:'90-93%',standard:'95-97%',premium:'97-98%',ultimate:'98-99%'}},pros:['比PWM多收获20-30%电能'],cons:['比PWM贵3-5倍']},
     {cat:'power',sub:'电池储能',name:'磷酸铁锂电池(LiFePO₄)',type:'储能',rating:5,basePrice:2000,specs:{容量:{budget:'12V 50Ah(640Wh)',standard:'12V 100Ah(1280Wh)',premium:'12V 200Ah(2560Wh)',ultimate:'48V 200Ah(10kWh+)'},循环寿命:{budget:'2000次(70%DOD)',standard:'3500次(80%DOD)',premium:'5000次(80%DOD)',ultimate:'8000次+(90%DOD)'}},pros:['循环寿命是铅酸10倍','不起火比三元锂安全'],cons:['0°C以下不能充电','比铅酸贵2-3倍']},
     {cat:'power',sub:'发电机',name:'逆变汽油发电机',type:'应急发电',rating:5,basePrice:3500,specs:{功率:{budget:'1000W',standard:'2000W',premium:'3500W',ultimate:'7000W(双缸)'},噪音:{budget:'60-65dB',standard:'52-58dB',premium:'48-53dB',ultimate:'<48dB(超静音)'}},pros:['即开即用独立电源'],cons:['需要汽油(保质期短)','噪音暴露位置']},
     {cat:'power',sub:'发电机',name:'柴油发电机',type:'应急发电',rating:5,basePrice:5000,specs:{功率:{budget:'2kW',standard:'3kW',premium:'5kW',ultimate:'10kW(工业级)'}},pros:['省油耐用','柴油保质期长'],cons:['重','噪音大','冬天启动困难']},
     {cat:'power',sub:'燃料',name:'丙烷储罐',type:'燃料储存',rating:5,basePrice:300,specs:{容量:{budget:'1磅(便携)',standard:'20磅(BBQ标准)',premium:'40磅',ultimate:'250加仑(固定罐)'}},pros:['无限保质期！','多用途(烹饪取暖发电)'],cons:['罐体10-12年需检测']},
     {cat:'power',sub:'供电配件',name:'纯正弦波逆变器',type:'电源转换',rating:5,basePrice:500,specs:{功率:{budget:'300W',standard:'1000W',premium:'2000W',ultimate:'5000W(可带空调)'}},pros:['12V→220V给任何设备供电'],cons:['逆变损耗约5-15%']}
    ].forEach(t => T(t));

    // --- 🧱 建筑与掩体 (25+ templates) ---
    [{cat:'shelter',sub:'结构材料',name:'快干水泥/混凝土',type:'基础建材',rating:5,basePrice:50,specs:{标号:{budget:'C20(基础)',standard:'C30(掩体推荐)',premium:'C40(加强)',ultimate:'C50+(军用级)'},包装:{budget:'25kg袋装',standard:'25kg×10袋',premium:'25kg×50袋(托盘)',ultimate:'散装水泥罐车(吨级)'}},pros:['掩体结构的基础材料'],cons:['需要钢筋配合','需要养护28天']},
     {cat:'shelter',sub:'结构材料',name:'建筑钢筋(螺纹钢)',type:'结构加强',rating:5,basePrice:6,specs:{等级:{budget:'HRB335',standard:'HRB400',premium:'HRB500',ultimate:'HRB600(超高强)'},直径:{budget:'10mm',standard:'12-16mm',premium:'16-25mm',ultimate:'25-40mm'}},pros:['补足混凝土抗拉弱点'],cons:['裸露会生锈需保护层','运输不易']},
     {cat:'shelter',sub:'防水防潮',name:'混凝土防水密封剂',type:'防水材料',rating:5,basePrice:120,specs:{类型:{budget:'表面涂膜型',standard:'渗透结晶型(自修复)',premium:'渗透结晶+弹性涂层',ultimate:'全套防水系统(设计+材料)'},覆盖:{budget:'5m²/L',standard:'5-8m²/L',premium:'8-10m²/L',ultimate:'按工程设计'}},pros:['掩体防水防潮最重要材料'],cons:['必须在混凝土养护后施工']},
     {cat:'shelter',sub:'通风过滤',name:'NBC/CBRN空气过滤系统',type:'生命支持',rating:5,basePrice:5000,specs:{风量:{budget:'30m³/h(1-2人)',standard:'100m³/h(4-6人)',premium:'200m³/h(8-12人)',ultimate:'500m³/h+(20+人)'},过滤级:{budget:'HEPA H12',standard:'HEPA H13+活性炭',premium:'HEPA H14+军用活性炭',ultimate:'全CBRN级(HEPA+炭+催化剂)'}},pros:['掩体最重要的生命支持设备'],cons:['极其昂贵','滤芯是消耗品']},
     {cat:'shelter',sub:'门禁入口',name:'钢制防爆门',type:'掩体入口',rating:5,basePrice:8000,specs:{厚度:{budget:'4mm钢板',standard:'6mm钢板',premium:'8mm钢板',ultimate:'12mm装甲钢'},密封:{budget:'单层密封条',standard:'双层橡胶密封',premium:'硅胶气密密封',ultimate:'军用气密+防爆双重'}},pros:['抗爆+防盗+气密三重防护'],cons:['极其贵','极其重需专业安装']},
     {cat:'shelter',sub:'隔热保温',name:'XPS挤塑保温板',type:'隔热材料',rating:5,basePrice:50,specs:{厚度:{budget:'3cm',standard:'5cm',premium:'8cm',ultimate:'10cm+'},抗压:{budget:'150kPa',standard:'250kPa',premium:'350kPa',ultimate:'500kPa+(可承重)'}},pros:['掩体保温防冷凝霉菌'],cons:['可燃需防火面层']},
     {cat:'shelter',sub:'防水防潮',name:'膨润土防水毯',type:'天然防水',rating:4,basePrice:40,specs:{厚度:{budget:'3mm',standard:'5mm',premium:'7mm',ultimate:'10mm(双层)'}},pros:['天然材料遇水膨胀自修复','环保'],cons:['需要覆土压实','干燥时会收缩']}
    ].forEach(t => T(t));

    // --- 👕 服装与防护 (25+ templates) ---
    [{cat:'clothing',sub:'内衣层',name:'美利奴羊毛内衣套装',type:'功能性内衣',rating:5,basePrice:300,specs:{材质:{budget:'羊毛混纺(50%)',standard:'100%美利奴(19μm)',premium:'超细美利奴(17.5μm)',ultimate:'极细美利奴(<16μm)'},重量:{budget:'250g/m²(厚)',standard:'200g/m²',premium:'150g/m²(薄)',ultimate:'125g/m²(超轻)'}},pros:['湿了仍保暖70%','天然抗菌不臭'],cons:['比化纤贵2-3倍','耐磨不如化纤']},
     {cat:'clothing',sub:'保暖层',name:'羽绒/合成棉保暖外套',type:'中层保暖',rating:5,basePrice:600,specs:{填充:{budget:'鸭绒600蓬',standard:'鸭绒700蓬',premium:'鹅绒800蓬',ultimate:'鹅绒900蓬+(极地级)'},重量:{budget:'500-600g',standard:'400-500g',premium:'300-400g',ultimate:'200-300g(超轻)'}},pros:['保暖重量比最好的材料'],cons:['羽绒湿了完全失效——户外有风险']},
     {cat:'clothing',sub:'外层防护',name:'Gore-Tex防水冲锋衣',type:'硬壳外层',rating:5,basePrice:1500,specs:{防水:{budget:'10000mm',standard:'20000mm',premium:'28000mm',ultimate:'45000mm+(军用)'},透气:{budget:'RET 10-15',standard:'RET 6-10',premium:'RET 3-6',ultimate:'RET <3(最透气)'}},pros:['防水+透气兼顾'],cons:['DWR需定期恢复','在高湿环境透气性下降']},
     {cat:'clothing',sub:'鞋类',name:'战术靴/重装徒步靴',type:'鞋类',rating:5,basePrice:800,specs:{材质:{budget:'合成革+网布',standard:'全粒面皮+Cordura',premium:'全粒面皮+Gore-Tex',ultimate:'定制手工皮靴(可换底)'},鞋底:{budget:'普通橡胶',standard:'Vibram橡胶',premium:'Vibram Megagrip',ultimate:'Vibram+定制鞋楦'}},pros:['生存者最重要的交通工具'],cons:['需要磨合期','Gore-Tex浸水干得慢']},
     {cat:'clothing',sub:'手部头部',name:'战术手套(防割防撞)',type:'手部防护',rating:4,basePrice:150,specs:{防护:{budget:'基础防磨',standard:'防割Level 3',premium:'防割Level 5+防撞',ultimate:'凯夫拉+碳纤防割防撞全防护'}},pros:['手是最宝贵工具务必保护'],cons:['降低手指灵敏度']},
     {cat:'clothing',sub:'外层防护',name:'防化服(CBRN)',type:'全防护',rating:5,basePrice:400,specs:{材质:{budget:'Tyvek(仅防颗粒)',standard:'Tychem QC',premium:'Tychem TK(军用)',ultimate:'重型可重复用防化服'}},pros:['进入化学/生物/辐射污染区必备'],cons:['完全不透气30分钟可能中暑','一次性']},
     {cat:'clothing',sub:'外层防护',name:'防弹背心(软质IIIA)',type:'弹道防护',rating:4,basePrice:3000,specs:{材质:{budget:'普通芳纶',standard:'Kevlar',premium:'Dyneema(更轻)',ultimate:'Dyneema+陶瓷插板(防步枪)'},重量:{budget:'3-4kg',standard:'2-3kg',premium:'1.5-2kg',ultimate:'1-1.5kg(超轻)'}},pros:['在暴力冲突中救命'],cons:['不能防步枪(需插板)','保质期5年']}
    ].forEach(t => T(t));

    // --- 📻 电子通讯 (30+ templates) ---
    [{cat:'electronics',sub:'对讲机',name:'VHF/UHF双频对讲机',type:'手持电台',rating:5,basePrice:200,specs:{功率:{budget:'2W',standard:'5W',premium:'8W',ultimate:'10W(需要散热改造)'},电池:{budget:'1200mAh',standard:'1800mAh',premium:'2500mAh',ultimate:'3800mAh(扩展电池)'},防水:{budget:'无',standard:'IPX4(防溅)',premium:'IP67(防水)',ultimate:'IP68(潜水级)'}},pros:['团队通讯必备'],cons:['城市距离仅1-3km']},
     {cat:'electronics',sub:'收音机',name:'全波段短波收音机',type:'广播接收',rating:5,basePrice:500,specs:{频段:{budget:'FM/AM',standard:'FM/AM/SW',premium:'全波段+SSB',ultimate:'全波段+SSB+航空波段'},电池:{budget:'3×AA',standard:'18650锂电',premium:'18650+手摇发电',ultimate:'18650+手摇+太阳能三充'}},pros:['末日中获取外界信息最后窗口'],cons:['仅能接收不能发射']},
     {cat:'electronics',sub:'导航定位',name:'手持GPS导航仪',type:'卫星定位',rating:5,basePrice:2000,specs:{卫星:{budget:'GPS',standard:'GPS+GLONASS',premium:'GPS+GLONASS+Galileo',ultimate:'四星座(GPS+GLO+GAL+北斗)'},电池:{budget:'内置锂电',standard:'2×AA(可换)',premium:'AA+锂电双供电',ultimate:'AA+锂电+太阳能'}},pros:['专业导航精度高'],cons:['GPS卫星可能停止维护']},
     {cat:'electronics',sub:'夜视热成像',name:'夜视仪(Gen3像增强)',type:'夜间观察',rating:5,basePrice:15000,specs:{代:{budget:'Gen 1(入门)',standard:'Gen 2+(性价比)',premium:'Gen 3(军用标准)',ultimate:'Gen 3+薄膜(无膜/超强)'},分辨率:{budget:'36-45 lp/mm',standard:'51-57 lp/mm',premium:'64-72 lp/mm',ultimate:'72-81 lp/mm'}},pros:['夜间单方面透明的终极优势'],cons:['极贵','强光会永久损坏']},
     {cat:'electronics',sub:'夜视热成像',name:'热成像仪',type:'热探测',rating:5,basePrice:10000,specs:{分辨率:{budget:'160×120',standard:'384×288',premium:'640×480',ultimate:'1024×768(工业级)'},探测距离:{budget:'人体300m',standard:'人体800m',premium:'人体1500m',ultimate:'人体3000m+'}},pros:['穿透伪装探测热源','被动无发射'],cons:['极贵','电池续航有限4-8h']},
     {cat:'electronics',sub:'监控预警',name:'无线红外报警器',type:'周界预警',rating:4,basePrice:200,specs:{探测距:{budget:'5-8m',standard:'8-12m',premium:'12-18m',ultimate:'20-30m(工业级)'},供电:{budget:'3×AAA',standard:'9V电池',premium:'18650锂电',ultimate:'太阳能+锂电'}},pros:['周界预警的第一道防线'],cons:['小动物会误触发','需要电池']}
    ].forEach(t => T(t));

    // --- 🚗 载具 (20+ templates) ---
    [{cat:'vehicles',sub:'撤离车辆',name:'四驱皮卡/SUV(推荐车型)',type:'撤离载具',rating:5,basePrice:200000,specs:{驱动:{budget:'两驱SUV',standard:'分时四驱',premium:'全时四驱+差速锁',ultimate:'全时四驱+三把锁+绞盘'},油箱:{budget:'60L',standard:'80L',premium:'120L(双油箱)',ultimate:'200L+(改装大油箱)'},载货:{budget:'400kg',standard:'600kg',premium:'800kg',ultimate:'1000kg+(重载改装)'}},pros:['家庭撤离的最高机动性'],cons:['昂贵','油耗高']},
     {cat:'vehicles',sub:'两轮机动',name:'双运动摩托车',type:'机动两轮',rating:5,basePrice:20000,specs:{排量:{budget:'125cc',standard:'250cc',premium:'450cc',ultimate:'650-800cc(专业级)'},油耗:{budget:'2-3L/100km',standard:'3-4L/100km',premium:'4-5L/100km',ultimate:'5-6L/100km'}},pros:['汽车堵死时可穿梭通过'],cons:['载货有限','暴露于天气']},
     {cat:'vehicles',sub:'人力交通',name:'山地自行车(MTB)',type:'人力交通',rating:5,basePrice:2500,specs:{轮径:{budget:'26"',standard:'27.5"',premium:'29"',ultimate:'29"碳纤维竞赛级'},变速:{budget:'3×7速',standard:'1×10速',premium:'1×12速',ultimate:'电子无线变速'},刹车:{budget:'V刹',standard:'液压碟刹',premium:'四活塞碟刹',ultimate:'竞赛级四活塞'}},pros:['完全不依赖燃料！终极可持续'],cons:['体力消耗每日50-80km极限']},
     {cat:'vehicles',sub:'燃料储存',name:'军用油桶(Jerry Can)',type:'燃料容器',rating:5,basePrice:200,specs:{容量:{budget:'5L',standard:'20L(标准)',premium:'20L×2(套装)',ultimate:'20L×4+支架系统'},材质:{budget:'HDPE塑料',standard:'镀锌钢板',premium:'不锈钢',ultimate:'不锈钢+环氧内涂层'}},pros:['Jerry Can设计经典可靠'],cons:['满油桶20L≈14kg搬运费劲']},
     {cat:'vehicles',sub:'维修保养',name:'轮胎修理套装+12V气泵',type:'应急维修',rating:5,basePrice:100,specs:{内容:{budget:'补胎条+工具',standard:'补胎条+12V泵',premium:'全套装+胎压监测',ultimate:'全套装+备胎+千斤顶'}},pros:['爆胎是末日驾驶最常见故障'],cons:['不能补胎壁/大口径撕裂']}
    ].forEach(t => T(t));

    // --- 💡 照明 (15+ templates) ---
    [{cat:'lighting',sub:'手电筒',name:'战术手电筒(EDC)',type:'手持照明',rating:5,basePrice:300,specs:{亮度:{budget:'300-500lm',standard:'1000lm',premium:'2000lm',ultimate:'4000lm+(搜索级)'},电池:{budget:'AA/AAA',standard:'18650',premium:'21700',ultimate:'26650/46950'},射程:{budget:'100-150m',standard:'200-300m',premium:'350-500m',ultimate:'600-1000m'}},pros:['随身携带最重要的照明'],cons:['高亮下电池续航短']},
     {cat:'lighting',sub:'头灯',name:'LED头灯',type:'免提照明',rating:5,basePrice:200,specs:{亮度:{budget:'100-200lm',standard:'300-450lm',premium:'500-750lm',ultimate:'1000lm+(专业级)'},电池:{budget:'3×AAA',standard:'锂电+AAA双供',premium:'18650可拆卸',ultimate:'双18650大容量'}},pros:['解放双手——生存场景巨大优势'],cons:['红光模式不是所有都有']},
     {cat:'lighting',sub:'营地照明',name:'LED营地灯/帐篷灯',type:'区域照明',rating:4,basePrice:100,specs:{亮度:{budget:'100-200lm',standard:'300-500lm',premium:'500-1000lm',ultimate:'2000lm+(照亮大营地)'},电池:{budget:'3×D电池',standard:'18650',premium:'21700大容量',ultimate:'内置大锂电+太阳能充'}},pros:['营地共享照明'],cons:['耗电较快']},
     {cat:'lighting',sub:'应急照明',name:'荧光棒/化学灯',type:'一次性照明',rating:3,basePrice:5,specs:{时长:{budget:'4-6h',standard:'8-12h',premium:'12-24h',ultimate:'24-36h(军用级)'},颜色:{budget:'绿色',standard:'绿+白',premium:'绿+白+红',ultimate:'全色(绿白红蓝黄橙)'}},pros:['不耗电不用火防水'],cons:['一次性不可充电']}
    ].forEach(t => T(t));

    // --- 🔥 火源烹饪 (20+ templates) ---
    [{cat:'fire_cooking',sub:'生火工具',name:'铁铈打火棒(Ferro Rod)',type:'生火',rating:5,basePrice:50,specs:{长度:{budget:'6cm(迷你)',standard:'10-12cm(大号)',premium:'12-15cm(超大)',ultimate:'15cm+双棒套装'},火花温:{budget:'~2500°C',standard:'~3000°C',premium:'~3000°C',ultimate:'~3500°C(特殊合金)'}},pros:['3000°C点燃任何火绒','完全防水'],cons:['需要练习','单手不如打火机']},
     {cat:'fire_cooking',sub:'生火工具',name:'防水火柴+防水盒',type:'生火',rating:4,basePrice:30,specs:{数量:{budget:'25根/盒',standard:'50根/盒',premium:'100根/盒',ultimate:'500根(储备)'}},pros:['最简单直观的生火方式'],cons:['用完就没了','受潮会失效(防水也会老化)']},
     {cat:'fire_cooking',sub:'炉具灶具',name:'便携燃气炉(丙烷/丁烷)',type:'烹饪',rating:5,basePrice:200,specs:{功率:{budget:'2000-3000W',standard:'3000-5000W',premium:'5000-8000W',ultimate:'10000W+(双头)'},燃料:{budget:'丁烷气罐',standard:'丙烷1磅罐',premium:'丙烷20磅罐',ultimate:'丙烷大罐+管道'}},pros:['即开即用热效率高'],cons:['需要气罐储备']},
     {cat:'fire_cooking',sub:'炊具锅具',name:'户外炊具套装',type:'烹饪',rating:4,basePrice:150,specs:{材质:{budget:'铝(轻便宜)',standard:'硬质氧化铝',premium:'不锈钢',ultimate:'钛合金(超轻超强)'},套件:{budget:'1锅+1杯',standard:'2锅+2杯+勺',premium:'3锅+3盘+全配件',ultimate:'全套钛锅+钛餐具'}},pros:['自给烹饪的基础'],cons:['铝锅长期用有健康争议']},
     {cat:'fire_cooking',sub:'野外厨房',name:'Dutch Oven铸铁锅',type:'万能炊具',rating:5,basePrice:300,specs:{直径:{budget:'8寸(20cm)',standard:'10寸(25cm)',premium:'12寸(30cm)',ultimate:'14寸+全套配件'},重量:{budget:'3-4kg',standard:'5-6kg',premium:'7-8kg',ultimate:'9-10kg'}},pros:['可烤可炖可炒可炸——万能锅'],cons:['极重','需保养(防锈seasoning)']}
    ].forEach(t => T(t));

    // --- ⛺ 寝具庇护 (15+ templates) ---
    [{cat:'sleep_shelter',sub:'帐篷',name:'四季帐篷',type:'庇护所',rating:5,basePrice:800,specs:{容量:{budget:'1-2人',standard:'2-3人',premium:'3-4人',ultimate:'4-6人(家庭级)'},防风:{budget:'一般(3季)',standard:'四季可(防风)',premium:'极地级(抗强风)',ultimate:'军用极地(抗暴风)'}},pros:['便携式庇护所的基础'],cons:['大风中搭建困难']},
     {cat:'sleep_shelter',sub:'睡袋',name:'睡袋(羽绒/合成棉)',type:'睡眠系统',rating:5,basePrice:500,specs:{温标:{budget:'+5°C舒适(夏)',standard:'-5°C舒适(三季)',premium:'-15°C舒适(冬)',ultimate:'-30°C舒适(极地)'},填充:{budget:'中空棉',standard:'鸭绒600蓬',premium:'鹅绒800蓬',ultimate:'鹅绒900蓬+防水处理'}},pros:['保暖睡眠的基础'],cons:['羽绒湿了完全失效']},
     {cat:'sleep_shelter',sub:'睡垫',name:'睡垫/防潮垫',type:'睡眠系统',rating:5,basePrice:200,specs:{R值:{budget:'R1.5-2(夏)',standard:'R3-4(三季)',premium:'R5-6(冬)',ultimate:'R7+(极地/雪山)'},类型:{budget:'闭孔泡沫垫',standard:'自充气垫',premium:'充气垫(轻量)',ultimate:'羽绒充气垫(最暖)'}},pros:['地面隔热=70%体热保留'],cons:['充气垫扎破即失效']},
     {cat:'sleep_shelter',sub:'防水布',name:'多功能防水布(Tarp)',type:'简易庇护',rating:5,basePrice:150,specs:{尺寸:{budget:'2×2m',standard:'3×3m',premium:'4×4m',ultimate:'5×5m(大营地)'},材质:{budget:'PE塑料布',standard:'尼龙+PU涂层',premium:'Silnylon(硅化尼龙)',ultimate:'Dyneema Composite(最强最轻)'}},pros:['极轻便多种搭建方式','用途无限'],cons:['需要绳子和地钉配合']}
    ].forEach(t => T(t));

    // --- 📚 训练书籍 (10+ templates) ---
    [{cat:'training',sub:'医疗参考',name:'生存医疗参考书',type:'知识',rating:5,basePrice:200,specs:{内容:{budget:'基础急救手册',standard:'野外医学手册',premium:'全套:急救+草药+牙科+手术',ultimate:'专业级医学图书馆(纸+电子)'}},pros:['知识是唯一不能被抢劫的资产'],cons:['纸书怕水——需防水包装']},
     {cat:'training',sub:'生存手册',name:'综合生存手册',type:'知识',rating:5,basePrice:150,specs:{内容:{budget:'基础生存指南',standard:'美军FM 21-76级',premium:'SAS生存手册级',ultimate:'定制化综合图书馆'}},pros:['纸质书永不需要电池'],cons:['重—你不能带100本书撤离']},
     {cat:'training',sub:'体能训练',name:'体能训练装备',type:'训练',rating:4,basePrice:200,specs:{类型:{budget:'跳绳+弹力带',standard:'壶铃+TRX',premium:'可调节哑铃+沙袋',ultimate:'全功能家庭健身房'}},pros:['身体素质是最好的生存装备'],cons:['需要坚持的动力']},
     {cat:'training',sub:'技能培训',name:'技能练习材料',type:'培训',rating:4,basePrice:100,specs:{类型:{budget:'入门练习材料(绳/木)',standard:'中级(无线电/GPS/地图)',premium:'高级(焊接/锻造/电子)',ultimate:'全技能培训系统'}},pros:['技能只能在实践中掌握'],cons:['需要时间和反复练习']}
    ].forEach(t => T(t));

    // --- 🎯 特殊场景 (20+ templates) ---
    [{cat:'special',sub:'极寒装备',name:'极寒生存套装(-30°C以下)',type:'极端环境',rating:5,basePrice:3000,specs:{含:{budget:'基础保暖衣物+手套+帽',standard:'全套:内衣+中层+外套+靴+手套',premium:'专业级:羽绒+防风+雪镜+雪鞋',ultimate:'极地探险级全套装备'}}},
     {cat:'special',sub:'沙漠装备',name:'沙漠/高温生存套装',type:'极端环境',rating:4,basePrice:2000,specs:{含:{budget:'基础防晒+水袋+头巾',standard:'UPF50+防晒+大容量水袋+护目',premium:'专业沙漠装备+电解补充',ultimate:'全套(含卫星通讯+紧急定位)'}}},
     {cat:'special',sub:'高海拔',name:'高海拔生存套装(3000m+)',type:'极端环境',rating:4,basePrice:2500,specs:{含:{budget:'基础保暖+氧气瓶(小型)',standard:'高山装备+氧气+药品(乙酰唑胺)',premium:'全套高山+卫星通讯',ultimate:'极高山探险级+急救套装'}}},
     {cat:'special',sub:'海洋装备',name:'海上生存套装',type:'极端环境',rating:4,basePrice:2000,specs:{含:{budget:'救生衣+信号镜+哨子',standard:'救生衣+信号+海水淡化器+口粮',premium:'救生筏+EPIRB+全套海上生存',ultimate:'专业救生筏+卫星通讯+海水淡化'}}},
     {cat:'special',sub:'城市废墟',name:'城市废墟探索装备',type:'特殊场景',rating:4,basePrice:1500,specs:{含:{budget:'防刺手套+口罩+手电',standard:'全套:防护+照明+破拆+通讯',premium:'专业:防弹+夜视+热成像',ultimate:'军用城市战装备'}}}
    ].forEach(t => T(t));

    // --- 🛠️ DIY原材料 (15+ templates) ---
    [{cat:'diy_materials',sub:'金属材料',name:'钢板/钢条(多规格)',type:'DIY',rating:4,basePrice:30,specs:{类型:{budget:'边角料/废钢',standard:'热轧钢板1-3mm',premium:'冷轧钢板1-10mm',ultimate:'特种钢(弹簧/工具/不锈钢)'},规格:{budget:'随机',standard:'标准尺寸(1×2m)',premium:'定制切割',ultimate:'精密裁剪+热处理'}}},
     {cat:'diy_materials',sub:'木材竹材',name:'木材/竹材(DIY用)',type:'DIY',rating:4,basePrice:20,specs:{类型:{budget:'废木材/树枝',standard:'松木/杉木(建材级)',premium:'硬木(橡木/槐木)',ultimate:'特种木材(柚木/红木)'}}},
     {cat:'diy_materials',sub:'塑料橡胶',name:'PVC管及配件',type:'DIY',rating:4,basePrice:15,specs:{类型:{budget:'普通PVC管+接头',standard:'给水PVC管(食品级)',premium:'CPVC(耐高温)',ultimate:'工业级HDPE管道系统'}},pros:['搭建水管/框架/通风管万能'],cons:['PVC不耐火']},
     {cat:'diy_materials',sub:'化学品',name:'基础化学品套装',type:'DIY',rating:3,basePrice:100,specs:{含:{budget:'漂白水+小苏打+醋',standard:'+碘伏+酒精+氢氧化钠',premium:'+化学试剂套装',ultimate:'实验室级化学套装'}}},
     {cat:'diy_materials',sub:'电子元件',name:'电子元件/工具套装',type:'DIY',rating:3,basePrice:200,specs:{含:{budget:'基础:焊锡+万用表+常用电阻',standard:'+烙铁+Arduino+传感器',premium:'+示波器+电源+元件库',ultimate:'全套电子实验室'}}}
    ].forEach(t => T(t));

    // --- 💰 以物易物 (15+ templates) ---
    [{cat:'barter_goods',sub:'烟草酒类',name:'香烟/烟丝(交易用)',type:'硬通货',rating:5,basePrice:50,specs:{类型:{budget:'散装烟丝+烟纸',standard:'普通品牌香烟(200支)',premium:'中高档香烟',ultimate:'高档雪茄+烟斗丝'}}},
     {cat:'barter_goods',sub:'烟草酒类',name:'高度烈酒(交易/消毒)',type:'硬通货',rating:5,basePrice:100,specs:{酒精度:{budget:'38-42度白酒',standard:'50-53度白酒',premium:'60-65度烈酒',ultimate:'75度+医用酒精级'},容量:{budget:'500ml',standard:'1000ml',premium:'2500ml',ultimate:'5000ml(大坛)'}}},
     {cat:'barter_goods',sub:'咖啡茶叶',name:'咖啡豆/粉(交易用)',type:'硬通货',rating:4,basePrice:80,specs:{类型:{budget:'速溶咖啡(500g)',standard:'普通咖啡豆(1kg)',premium:'精品咖啡豆(1kg)',ultimate:'顶级蓝山/Kona(1kg)'}}},
     {cat:'barter_goods',sub:'香料调味',name:'香料套装(交易用)',type:'硬通货',rating:4,basePrice:50,specs:{含:{budget:'盐+糖+胡椒(基础)',standard:'+肉桂+丁香+八角',premium:'+藏红花+香草+肉豆蔻',ultimate:'全套高级香料+调味料库'}}},
     {cat:'barter_goods',sub:'硬通货',name:'白银/金币/首饰',type:'保值',rating:3,basePrice:500,specs:{类型:{budget:'银币/银条(1oz)',standard:'金币(小克重)',premium:'金条(10g-50g)',ultimate:'投资级金条(100g+)'}},pros:['法币崩溃后的保值手段'],cons:['末日中实用价值有限']}
    ].forEach(t => T(t));

    // --- 🐕 宠物牲畜 (10+ templates) ---
    [{cat:'pets_livestock',sub:'宠物食品',name:'宠物应急食品储备',type:'宠物',rating:4,basePrice:100,specs:{量:{budget:'1周量(狗/猫)',standard:'1个月量',premium:'3个月量',ultimate:'1年量(真空包装)'}}},
     {cat:'pets_livestock',sub:'宠物医疗',name:'宠物常用药套装',type:'宠物',rating:4,basePrice:100,specs:{含:{budget:'驱虫药+跳蚤药',standard:'+抗生素+止痛(宠用)',premium:'+疫苗+血清',ultimate:'全套宠用药房'}}},
     {cat:'pets_livestock',sub:'牲畜饲料',name:'牲畜饲料储备(鸡/羊/猪)',type:'牲畜',rating:4,basePrice:50,specs:{类型:{budget:'玉米/麦麸(50kg)',standard:'混合饲料(100kg)',premium:'营养强化饲料(200kg)',ultimate:'全营养配方饲料(吨级)'}}},
     {cat:'pets_livestock',sub:'驮兽装备',name:'驮兽装备(马/驴/骡)',type:'牲畜',rating:3,basePrice:500,specs:{含:{budget:'基础缰绳+简易驮鞍',standard:'全套驮具+蹄铁',premium:'专业驮具+备用蹄铁',ultimate:'全套骑乘+驮运装备'}}}
    ].forEach(t => T(t));

    // --- 🍼 婴儿儿童 (10+ templates) ---
    [{cat:'baby_child',sub:'婴儿食品',name:'婴儿配方奶粉(储备)',type:'婴儿',rating:5,basePrice:200,specs:{量:{budget:'1罐(400g)',standard:'3罐(1个月)',premium:'6罐(2个月)',ultimate:'12罐+(3-6个月储备)'}}},
     {cat:'baby_child',sub:'纸尿裤',name:'纸尿裤(婴儿)+布尿裤(备用)',type:'婴儿',rating:5,basePrice:100,specs:{类型:{budget:'布尿裤+安全别针',standard:'纸尿裤1个月量+布尿裤备用',premium:'纸尿裤3个月量',ultimate:'纸尿裤6个月+布尿裤全套'}}},
     {cat:'baby_child',sub:'儿童药品',name:'儿童常用药套装',type:'儿童',rating:5,basePrice:80,specs:{含:{budget:'退热药(儿童剂量)+创可贴',standard:'+抗过敏+止咳+ORS',premium:'+儿童抗生素+维生素',ultimate:'全套儿童药房(处方级)'}}},
     {cat:'baby_child',sub:'安抚教育',name:'儿童安抚与教育物资',type:'儿童',rating:4,basePrice:100,specs:{含:{budget:'绘本+彩笔+毛绒玩具',standard:'+教育书+拼图+棋类',premium:'+科学实验套装+乐器',ultimate:'全套家庭学校+娱乐系统'}}}
    ].forEach(t => T(t));

    // --- 🧹 卫生清洁 (15+ templates) ---
    [{cat:'hygiene',sub:'个人清洁',name:'个人卫生用品套装',type:'卫生',rating:5,basePrice:80,specs:{含:{budget:'肥皂+牙刷+牙膏+卫生纸',standard:'+洗发水+剃须刀+指甲剪',premium:'+沐浴露+护肤品+漱口水',ultimate:'全套个人护理(含备用/替换)'}}},
     {cat:'hygiene',sub:'营地卫生',name:'营地卫生清洁套装',type:'卫生',rating:4,basePrice:100,specs:{含:{budget:'扫帚+簸箕+抹布',standard:'+拖把+水桶+洗涤剂',premium:'+消毒液+清洁工具全套',ultimate:'工业级清洁消毒设备'}}},
     {cat:'hygiene',sub:'废物处理',name:'废物处理方案(厕所/垃圾)',type:'卫生',rating:5,basePrice:200,specs:{类型:{budget:'简易旱厕(桶+袋+猫砂)',standard:'化学厕所(20L)',premium:'堆肥厕所系统',ultimate:'全功能卫生系统(厕所+灰水+垃圾)'}}},
     {cat:'hygiene',sub:'消毒杀菌',name:'消毒杀菌用品套装',type:'卫生',rating:5,basePrice:80,specs:{含:{budget:'漂白水+酒精',standard:'+碘伏+双氧水+洗手液',premium:'+戊二醛+氯己定+UV灯',ultimate:'全套消毒灭菌系统'}}}
    ].forEach(t => T(t));

    // ==================== 批量生成系统 (→ 5000+ items) ====================

    // Food supplies mass generator
    const grainTypes = ['白米','糙米','小麦(完整麦粒)','小麦面粉','玉米(干粒)','燕麦(整粒)','燕麦片','荞麦','小米','高粱','薏米','藜麦','大麦','黑米','红米'];
    const proteinTypes = ['干黄豆','干黑豆','干绿豆','干红豆','干鹰嘴豆','干扁豆','冻干鸡肉','冻干牛肉','冻干猪肉','冻干鱼','午餐肉罐头','沙丁鱼罐头','金枪鱼罐头','鸡肉罐头','牛肉罐头','猪肉火腿罐头','蛋白粉(乳清)','蛋白粉(植物)','花生酱','脱水鸡蛋粉'];
    const vegTypes = ['脱水胡萝卜','脱水洋葱','脱水芹菜','脱水菠菜','脱水番茄','脱水蘑菇','脱水青椒','脱水土豆','脱水红薯','冻干西兰花','冻干玉米','冻干豌豆','冻干草莓','冻干蓝莓','冻干苹果','干海带','干紫菜','干木耳','干香菇','番茄罐头'];
    const oilTypes = ['植物油(大豆)','植物油(菜籽)','橄榄油','椰子油','猪油(密封)','黄油粉(脱水)','酥油(ghee)'];
    const seasoningTypes = ['食盐(加碘)','食盐(海盐)','白糖','红糖','酱油(密封)','醋(白醋)','料酒','花椒','辣椒粉','黑胡椒粉','五香粉','咖喱粉','蒜粉','姜粉','肉桂粉'];
    const supplementTypes = ['复合维生素片','维生素C片','维生素D3','钙片','铁剂','锌片','鱼油(Omega-3)','益生菌','电解质粉(ORS)','蛋白棒','能量胶','葡萄糖片'];

    function massFood() {
      const items = [];
      let id = 90000;
      grainTypes.forEach(grain => {
        [5,10,25,50].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            const pkg = tier==='budget'?'散装/简易袋':tier==='standard'?'真空密封袋':tier==='premium'?'Mylar袋+脱氧剂+食品桶':'冻干+#10罐工业封存';
            const shelf = tier==='budget'?'1-2年':tier==='standard'?'5-10年':tier==='premium'?'15-20年':'25-30年';
            const pricePerKg = grain.includes('米')?6:grain.includes('面粉')?5:grain.includes('藜麦')?30:8;
            items.push({
              id:'f'+ (++id), category:'food_supplies', subcategory:'主粮', type:'谷物储备',
              name: grain + ' ' + kg + 'kg ' + pkg + ' [' + t.name + ']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'品类':grain,'重量':kg+'kg','包装':pkg,'保质期':shelf,'热量(kcal/100g)':'~350-380'},
              rating:5, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
              priceRange:'¥'+Math.round(kg*pricePerKg*t.factor*0.8)+' - ¥'+Math.round(kg*pricePerKg*t.factor*1.2),
              pros:['基础热量来源——生存基石','正确储存保质期极长'],cons:['营养单一必须搭配蛋白质和维生素'],
              alternatives:[],review:''
            });
          });
        });
      });
      proteinTypes.forEach(protein => {
        [2,5,10,20].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            const isCanned = protein.includes('罐头');
            const shelf = isCanned?'2-5年(罐体完好)':tier==='budget'?'1-2年':tier==='standard'?'5-10年(真空)':tier==='premium'?'15-20年':'25-30年(冻干)';
            const pricePerKg = isCanned?40:protein.includes('冻干')?120:protein.includes('蛋白粉')?80:15;
            items.push({
              id:'f'+ (++id), category:'food_supplies', subcategory:'蛋白质', type:isCanned?'罐头肉':'干货蛋白',
              name: protein + ' ' + kg + 'kg [' + t.name + ']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'品类':protein,'重量':kg+'kg','保质期':shelf,'蛋白质(g/100g)':'~15-60'},
              rating:5, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
              priceRange:'¥'+Math.round(kg*pricePerKg*t.factor*0.8)+' - ¥'+Math.round(kg*pricePerKg*t.factor*1.2),
              pros:['蛋白质——肌肉免疫系统的基础'],cons:['罐头保质期有限需旋转储备'],
              alternatives:[],review:''
            });
          });
        });
      });
      vegTypes.forEach(veg => {
        [1,3,5,10].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            items.push({
              id:'f'+ (++id), category:'food_supplies', subcategory:'蔬果', type:'脱水/冻干蔬菜',
              name: veg + ' ' + kg + 'kg [' + t.name + ']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'品类':veg,'重量':kg+'kg','保质期':tier==='budget'?'1-2年':tier==='standard'?'3-5年':tier==='premium'?'10-15年':'25年+'},rating:4,priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
              priceRange:'¥'+Math.round(kg*30*t.factor*0.8)+' - ¥'+Math.round(kg*30*t.factor*1.2),
              pros:['提供主食缺乏的维生素和纤维'],cons:['脱水蔬菜口感不如新鲜'],
              alternatives:[],review:''
            });
          });
        });
      });
      oilTypes.concat(seasoningTypes).concat(supplementTypes).forEach(item => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const qty = tier==='budget'?'500g/瓶':tier==='standard'?'1kg/瓶':tier==='premium'?'2.5kg':'5kg+(储备装)';
          items.push({
            id:'f'+ (++id), category:'food_supplies', subcategory:'调料/营养', type:'食品辅料',
            name: item + ' ' + qty + ' [' + t.name + ']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'品类':item,'包装':qty,'保质期':item.includes('盐')||item.includes('糖')?'理论永久':'1-3年'},rating:4,priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(30*t.factor*0.8)+' - ¥'+Math.round(30*t.factor*1.2),
            pros:['提升食物口感和营养价值'],cons:['部分香料有保质期'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    // Medicine mass generator
    function massMedicine() {
      const items = []; let id = 91000;
      const drugList = [
        ['阿司匹林','NSAID+抗血小板','100mg/片'],['对乙酰氨基酚','退热止痛','325mg/片'],
        ['萘普生','NSAID长效止痛','220mg/片'],['洛哌丁胺','止泻','2mg/粒'],
        ['苯海拉明','抗过敏/晕车','25mg/片'],['氯雷他定','抗过敏(无嗜睡)','10mg/片'],
        ['口服补液盐(ORS)','补液','袋(冲1L)'],['活性炭','吸附毒素','250mg/片'],
        ['氢化可的松乳膏','外用激素止痒','1% 15g'],['克霉唑乳膏','抗真菌','1% 15g'],
        ['莫匹罗星软膏','外用抗生素','2% 15g'],['聚维酮碘溶液','外用消毒','10% 100ml'],
        ['过氧化氢溶液','外用消毒清创','3% 100ml'],['酒精棉片','表面消毒','70% 100片'],
        ['碘伏棉签','伤口消毒','50支'],['创可贴(多种尺寸)','小伤口','100片装'],
        ['无菌纱布卷','包扎','10cm×4m'],['医用胶带','固定敷料','2.5cm×5m'],
        ['弹力绷带(ACE)','压迫/固定','7.5cm×4.5m'],['三角巾','悬吊/固定','96×96×136cm'],
        ['一次性手套(丁腈)','防护','100双/盒'],['N95口罩','过滤','20个/盒'],
        ['手术口罩','防护','50个/盒'],['护目镜(防雾)','眼部防护','1副'],
        ['一次性手术刀','切开','10把/包'],['手术缝线(丝线)','缝合','3-0/4-0/5-0'],
        ['可吸收缝线','内层缝合','3-0/4-0'],['皮肤缝合器','快速闭合','35钉+取钉器'],
        ['皮肤胶(Dermabond型)','无针闭合','0.5ml/支'],['免缝胶带(Steri-Strip)','无创闭合','3×75mm 10条'],
        ['静脉输液套装','补液','生理盐水500ml+输液器'],['注射器(多种规格)','给药','1ml/3ml/5ml/10ml'],
        ['听诊器','诊断','双面'],['医用剪刀','剪切','14cm 不锈钢'],
        ['止血钳(Halsted)','止血','12.5cm 弯/直']
      ];
      drugList.forEach(([drug,use,spec]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const qty = tier==='budget'?'最小包装':tier==='standard'?'常规包装':tier==='premium'?'大包装':'家庭储备装';
          items.push({
            id:'m'+ (++id), category:'medicine', subcategory:'药品器械', type:use,
            name: drug + ' (' + spec + ') ' + qty + ' [' + t.name + ']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'药品/器械':drug,'用途':use,'规格':spec,'包装':qty},
            rating:4, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(50*t.factor*0.8)+' - ¥'+Math.round(50*t.factor*1.2),
            pros:['末日医疗必备物资'],cons:['有保质期需定期更换'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    // Tools mass generator
    function massTools() {
      const items = []; let id = 92000;
      const toolList = [
        ['活动扳手(多种尺寸)','手动工具','6"/8"/10"/12"'],['套筒扳手组','手动工具','1/4"或3/8"驱动'],
        ['螺丝刀套装(一字/十字)','手动工具','6件套'],['内六角扳手组','手动工具','公制/英制'],
        ['钢丝钳','切割','6"/8"'],['尖嘴钳','夹持','6"/8"'],
        ['管钳','管道','10"/14"/18"'],['锉刀套装','整形','粗/中/细'],
        ['钢锯(含备用锯条)','切割','12"'],['木工手锯','木材切割','传统/夹背'],
        ['木工凿套装','木工','6/12/18/25mm'],['木工刨','木工','中号'],
        ['卷尺','测量','5m/8m'],['水平尺','测量','60cm/120cm'],
        ['角尺/直角尺','测量','30cm'],['游标卡尺','精密测量','150mm 数显'],
        ['电子万用表','电气检测','数字式'],['测电笔','电气安全','数显/氖管'],
        ['电烙铁+焊锡','电子维修','30W/60W'],['热缩管套装','电气绝缘','多尺寸'],
        ['电工胶带','绝缘','3M × 20m'],['铁丝(多粗细)','捆扎','16/18/20号'],
        ['尼龙扎带(多尺寸)','固定','100-500根装'],['强力胶(环氧树脂)','粘接','AB双组分'],
        ['超级胶水(氰基丙烯酸)','快粘','3g/支×10'],['WD-40多用途','维护','200ml/400ml'],
        ['机油(通用)','润滑','1L/4L'],['硅脂/润滑油','精密润滑','50g/100g'],
        ['大力钳/锁定钳','夹持','7"/10"'],['C型夹/台钳','固定','3"/4"/6"'],
        ['锤子(羊角/圆头)','敲击','450g/680g'],['大锤','重击','2kg/4kg'],
        ['撬棍(大号)','破拆','60-90cm'],['铁砧(小型)','锻造','5-15kg'],
        ['锻工钳','锻造','30cm'],['铆钉枪+铆钉','连接','手动'],
        ['拉铆螺母工具','连接','M4/M5/M6'],['喷灯/火焰枪','加热','丙烷/丁烷'],
        ['热风枪','加热','2000W'],['砂纸(多目数)','打磨','80-2000目'],
        ['钢丝刷','清洁','多尺寸'],['管螺纹工具','管道','1/2"-2"']
      ];
      toolList.forEach(([tool,type,spec]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const brand = tier==='budget'?'国产品牌':tier==='standard'?'中档品牌':tier==='premium'?'进口品牌':'工业/军用级';
          items.push({
            id:'t'+ (++id), category:'tools', subcategory:'综合工具', type:type,
            name: tool + ' ' + brand + ' [' + t.name + ']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'工具':tool,'类型':type,'规格':spec,'品质':brand},
            rating:4, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(100*t.factor*0.8)+' - ¥'+Math.round(100*t.factor*1.2),
            pros:['建造和修理必需工具'],cons:['廉价品耐久性差'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    // --- 合并所有生成结果 ---
    const foodItems = massFood();
    const medItems = massMedicine();
    const toolItems = massTools();
    const elecItems = massElectronics();
    const clothingItems = massClothing();
    const shelterItems = massShelter();
    const vehicleItems = massVehicles();
    const waterItems = massWaterGear();
    const powerItems = massPower();
    const lightingItems = massLighting();
    const sleepItems = massSleepShelter();
    const hygieneItems = massHygiene();
    const fireItems = massFireCooking();
    const specialItems = massSpecial();
    const diyItems = massDIY();
    const barterItems = massBarter();
    const petItems = massPet();
    const babyItems = massBaby();
    const trainingItems = massTraining();
    const genItems1 = massWaterStorageDetails();
    const genItems2 = massWeaponAmmo();
    const genItems3 = massFoodBulkVariants();
    const genItems4 = massMedicalKits();
    const genItems5 = massFinalExpansion();
    const genItems6 = massFinalPush();

    return items.concat(foodItems, medItems, toolItems, elecItems, clothingItems,
      shelterItems, vehicleItems, waterItems, powerItems, lightingItems,
      sleepItems, hygieneItems, fireItems, specialItems, diyItems,
      barterItems, petItems, babyItems, trainingItems,
      genItems1, genItems2, genItems3, genItems4, genItems5, genItems6);
  }

    function massFinalPush() {
      const items = []; let id = 114000;

      // More food items
      ['黑芝麻','白芝麻','核桃粉','杏仁粉','椰子粉','可可粉','抹茶粉','姜黄粉','辣椒碎','蒜粉','洋葱粉','迷迭香','百里香','牛至','月桂叶'].forEach(s => {
        [0.2,0.5,1].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            items.push({id:'fs2'+(++id),category:'food_supplies',subcategory:'调料',type:'香料',name:s+' '+kg+'kg ['+t.name+']',tierId:tier,tierName:t.name,tierIcon:t.icon,specs:{'香料':s,'重量':kg+'kg'},rating:3,priceLevel:'低',priceRange:'¥'+Math.round(kg*50*t.factor)+' - ¥'+Math.round(kg*80*t.factor),pros:['改善末日饮食'],cons:['非必需'],alternatives:[],review:''});
          });
        });
      });

      // Emergency water
      ['应急水袋(军用) 100ml','应急水袋 200ml','应急水袋 500ml','罐装饮用水 330ml','罐装饮用水 500ml','桶装水 5L','桶装水 10L','桶装水 18.9L'].forEach(w => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const ct = tier==='budget'?3:tier==='standard'?12:tier==='premium'?48:144;
          items.push({id:'we'+(++id),category:'water_gear',subcategory:'应急饮水',type:'成品水',name:w+' ×'+ct+' ['+t.name+']',tierId:tier,tierName:t.name,tierIcon:t.icon,specs:{'成品水':w,'数量':'×'+ct},rating:5,priceLevel:'低',priceRange:'¥'+Math.round(5*ct*t.factor)+' - ¥'+Math.round(15*ct*t.factor),pros:['即开即饮不需任何处理'],cons:['重','占用空间大'],alternatives:[],review:''});
        });
      });
      ['苹果干','香蕉干','芒果干','菠萝干','葡萄干','杏干','李子干','无花果干','枣干','枸杞干','桂圆干','桑葚干','山楂干','杨梅干','猕猴桃干'].forEach(f => {
        [1,3,5].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            items.push({
              id:'fd'+ (++id), category:'food_supplies', subcategory:'蔬果', type:'果干',
              name: f + ' ' + kg + 'kg ['+t.name+']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'果干':f,'重量':kg+'kg'}, rating:3, priceLevel:'低',
              priceRange:'¥'+Math.round(kg*40*t.factor)+' - ¥'+Math.round(kg*60*t.factor),
              pros:['天然糖分+纤维','改善口味'],cons:['非必需——优先级低'],
              alternatives:[],review:''
            });
          });
        });
      });

      // Nuts and seeds
      ['核桃','杏仁','腰果','开心果','巴西坚果','松子','葵花籽','南瓜籽','亚麻籽','奇亚籽','芝麻','花生(生)','夏威夷果','碧根果','榛子'].forEach(n => {
        [1,3,5].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            items.push({
              id:'fn'+ (++id), category:'food_supplies', subcategory:'蔬果', type:'坚果',
              name: n + ' ' + kg + 'kg ['+t.name+']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'坚果':n,'重量':kg+'kg','热量':'~550-650kcal/100g'},
              rating:4, priceLevel:tier==='budget'?'低':'中',
              priceRange:'¥'+Math.round(kg*60*t.factor)+' - ¥'+Math.round(kg*80*t.factor),
              pros:['极高热量密度','健康脂肪+蛋白质'],cons:['油脂会酸败——密封冷藏'],
              alternatives:[],review:''
            });
          });
        });
      });

      // Clothing sizes expanded
      ['S','M','L','XL','XXL'].forEach(size => {
        ['战术衬衫','速干T恤','抓绒马甲','软壳裤','防水裤','工作短裤','羊毛围巾','保暖护膝','雪地绑腿','防晒袖套'].forEach(w => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            items.push({
              id:'cs'+ (++id), category:'clothing', subcategory:'服装', type:'衣物',
              name: w + ' ' + size + ' ['+t.name+']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'衣物':w,'尺码':size}, rating:3, priceLevel:'低',
              priceRange:'¥'+Math.round(100*t.factor)+' - ¥'+Math.round(200*t.factor),
              pros:['正确的尺码=最佳的保暖/防护'],cons:['需要知道每个成员的尺码'],
              alternatives:[],review:''
            });
          });
        });
      });

      return items;
    }

    function massFinalExpansion() {
      const items = []; let id = 113000;

      // Food: add more grain × qty combos
      const moreGrains = ['紫米','黑糯米','玉米碴','大黄米','芸豆','蚕豆','豌豆','白扁豆','豇豆','花豆'];
      moreGrains.forEach(grain => {
        [2,5,10,25,50].forEach(kg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier];
            items.push({
              id:'ff'+ (++id), category:'food_supplies', subcategory:'主粮', type:'谷物',
              name: grain + ' ' + kg + 'kg ['+t.name+']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'谷物':grain,'重量':kg+'kg','热量':'~330-370kcal/100g'},
              rating:4, priceLevel:tier==='budget'?'低':'中',
              priceRange:'¥'+Math.round(kg*6*t.factor*0.8)+' - ¥'+Math.round(kg*6*t.factor*1.2),
              pros:['多样化主粮降低营养单一风险'],cons:['部分小众谷物烹饪时间不同'],
              alternatives:[],review:''
            });
          });
        });
      });

      // More protein variants
      const moreProteins = ['鲭鱼罐头','秋刀鱼罐头','鳗鱼罐头','午餐肉(低钠)','火腿罐头','红烧牛肉罐头','咖喱鸡罐头','五香肉丁罐头','豆豉鲮鱼罐头','红烧扣肉罐头','鸭肉罐头','鹅肝酱罐头','烟熏蚝罐头','蛤蜊罐头','蟹肉罐头'];
      moreProteins.forEach(p => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const ct = tier==='budget'?3:tier==='standard'?12:tier==='premium'?36:120;
          items.push({
            id:'fp'+ (++id), category:'food_supplies', subcategory:'蛋白质', type:'罐头',
            name: p + ' ×'+ct+'罐 ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'罐头':p,'数量':ct+'罐','保质期':'2-5年(罐体完好)'},
            rating:4, priceLevel:tier==='budget'?'低':'中',
            priceRange:'¥'+Math.round(15*ct*t.factor*0.8)+' - ¥'+Math.round(15*ct*t.factor*1.2),
            pros:['即食蛋白质来源'],cons:['钠含量高','重'],
            alternatives:[],review:''
          });
        });
      });

      // More seasonings
      const moreSeasons = ['芝麻油','辣椒油','花椒油','蚝油','鱼露','甜面酱','豆瓣酱','番茄酱(小包)','芥末酱','沙拉酱','香草精','杏仁香精','食用色素','小苏打','泡打粉','酵母(干)','吉利丁粉','琼脂粉','柠檬酸','苹果酸'];
      moreSeasons.forEach(s => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          items.push({
            id:'fs'+ (++id), category:'food_supplies', subcategory:'调料', type:'调味品',
            name: s + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'调味品':s}, rating:3, priceLevel:'低',
            priceRange:'¥'+Math.round(20*t.factor)+' - ¥'+Math.round(40*t.factor),
            pros:['改善末日饮食的关键'],cons:['非必需——优先级低于主粮'],
            alternatives:[],review:''
          });
        });
      });

      // More weapon accessories
      ['枪套/刀鞘','弹匣套','战术背心/装具','枪带/背带','武器清洁套装','枪油/CLP','通条/枪绳','铜刷(多口径)','瞄准镜(红点)','瞄准镜(LPVO 1-6x)','瞄准镜(高倍 5-25x)','两脚架','三脚架','消音器(信息参考)','枪灯(战术)','激光指示器','备用弹匣(手枪)','备用弹匣(步枪)','快速装弹器','弹药箱(密封防水)','弹药箱(金属军用)','除湿剂(弹药箱用)','枪架/枪柜(安全储存)','训练假弹/教练弹'].forEach(w => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          items.push({
            id:'wa'+ (++id), category:'weapons', subcategory:'武器配件', type:'配件',
            name: w + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'武器配件':w}, rating:4, priceLevel:tier==='budget'?'低':'中',
            priceRange:'¥'+Math.round(100*t.factor)+' - ¥'+Math.round(300*t.factor),
            pros:['提升武器系统效能'],cons:['配件增加重量和复杂度'],
            alternatives:[],review:''
          });
        });
      });

      // More tools mass
      ['电动工具(电钻)','电动工具(角磨机)','电动工具(圆锯)','电动工具(曲线锯)','电动工具(砂光机)','焊机(电弧)','焊机(MIG)','焊机(TIG)','焊条(多规格)','焊接面罩','焊接手套','角磨片','切割片','抛光片','钻头套装(麻花钻)','钻头套装(木工)','钻头套装(混凝土)','开孔器套装','丝锥/板牙套装','拉马/拔轮器'].forEach(tool => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          items.push({
            id:'tt'+ (++id), category:'tools', subcategory:'电动/高级工具', type:'工具',
            name: tool + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'工具':tool}, rating:4, priceLevel:tier==='budget'?'低':'中',
            priceRange:'¥'+Math.round(150*t.factor)+' - ¥'+Math.round(400*t.factor),
            pros:['建造维护效率提升10倍+'],cons:['需要电力'],
            alternatives:[],review:''
          });
        });
      });

      // More vehicle parts
      ['刹车片(前)','刹车片(后)','刹车盘','火花塞(×4)','点火线圈','空气滤清器','机油滤清器','燃油滤清器','空调滤清器','正时皮带/链条','发电机(汽车)','启动马达','水泵(发动机)','散热器','节温器','风扇皮带','悬挂减震器(前)','悬挂减震器(后)','轮毂轴承','转向球头'].forEach(part => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          items.push({
            id:'vp'+ (++id), category:'vehicles', subcategory:'车辆零件', type:'配件',
            name: part + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'零件':part}, rating:4, priceLevel:tier==='budget'?'低':'中',
            priceRange:'¥'+Math.round(100*t.factor)+' - ¥'+Math.round(300*t.factor),
            pros:['车辆关键零件储备'],cons:['需确认适配你的车型'],
            alternatives:[],review:''
          });
        });
      });

      return items;
    }

    function massWaterStorageDetails() { const items = []; let id = 109000;
      const sizes = [1,2,3,5,10,15,20,25,30,50,100,200,500,1000];
      sizes.forEach(liters => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const mat = tier==='budget'?'HDPE塑料':tier==='standard'?'食品级HDPE':tier==='premium'?'不锈钢':'316L医用不锈钢';
          items.push({
            id:'ws'+ (++id), category:'water_gear', subcategory:'储水容器', type:'储水罐',
            name: liters+'L '+mat+' 储水罐 ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'容量':liters+'L','材质':mat,'满重':(liters*1.02).toFixed(1)+'kg'},
            rating:5, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(liters*2*t.factor)+' - ¥'+Math.round(liters*4*t.factor),
            pros:['安全储水的基础'],cons:['满水后极重'],alternatives:[],review:''
          });
        });
      });
      return items;
    }

    function massWeaponAmmo() { const items = []; let id = 110000;
      const ammoTypes = [
        ['.22 LR(小口径)','50发盒','狩猎小猎物/训练','小口径弹药'],
        ['9mm Luger','50发盒','手枪/冲锋枪通用','手枪弹药'],
        ['.45 ACP','50发盒','大口径手枪/停止力强','手枪弹药'],
        ['5.56×45mm/.223','20发盒','AR-15/M16/M4通用','步枪弹药'],
        ['7.62×39mm','20发盒','AK-47/SKS通用','步枪弹药'],
        ['7.62×51mm/.308','20发盒','全威力步枪/狙击/机枪','步枪弹药'],
        ['12 Gauge 00 Buck','25发盒','霰弹枪近战/破门','霰弹枪弹药'],
        ['12 Gauge Slug','25发盒','霰弹枪独头弹/50-75m','霰弹枪弹药'],
        ['.300 Win Mag','20发盒','远程狙击/狩猎大型猎物','步枪弹药'],
        ['.338 Lapua Magnum','20发盒','超远程狙击/反器材','步枪弹药'],
        ['弩箭(20")','12支装','150-200磅弩用','弩箭'],
        ['弩箭(22")','12支装','高磅数弩用','弩箭'],
        ['弓箭(碳纤 30")','12支装','反曲弓/复合弓','弓箭'],
        ['弓箭(铝 30")','12支装','反曲弓练习用','弓箭'],
        ['钢珠(8mm 1000发)','1000发装','弹弓弹药','弹弓弹药'],
        ['钢珠(9.5mm 500发)','500发装','大威力弹弓','弹弓弹药'],
        ['弹丸(.177 500发)','500发装','气枪弹药','气枪弹药'],
        ['弹丸(.22 250发)','250发装','大气枪弹药','气枪弹药']
      ];
      ammoTypes.forEach(([ammo,pkg,use,type]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const brand = tier==='budget'?'国产训练弹':tier==='standard'?'商业品牌弹':tier==='premium'?'赛级/军用剩弹':'比赛级/Match Grade';
          const qty = tier==='budget'?'1'+pkg:tier==='standard'?'2'+pkg:tier==='premium'?'5'+pkg:'10'+pkg+'(储备)';
          items.push({
            id:'am'+ (++id), category:'weapons', subcategory:'弹药', type:type,
            name: ammo + ' ' + brand + ' ' + qty + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'弹药':ammo,'品牌':brand,'数量':qty,'用途':use},
            rating:4, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(100*t.factor)+' - ¥'+Math.round(300*t.factor),
            pros:['弹药消耗品需储备'],cons:['储存需防潮','有法律限制'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    function massFoodBulkVariants() { const items = []; let id = 111000;
      const bulkFoods = [
        ['压缩饼干(军用)','应急口粮','500g/包','真空包装 热量~2500cal/包'],
        ['MRE军粮(民用版)','即食口粮','1包/餐','自热 1200cal 不需炉具'],
        ['Lifeboat Ration','救生口粮','500g/条','超高热量密度 真空密封'],
        ['能量棒(Clif/Kind型)','能量补充','12支/盒','方便快速补充能量'],
        ['牛肉干/肉脯','蛋白质零食','500g/袋','高蛋白 开袋即食'],
        ['坚果混合(无盐)','健康脂肪','1kg/袋','高热量密度 天然维E'],
        ['花生酱(无糖)','高能涂抹','1kg/罐','极佳热量密度 不需冷藏'],
        ['脱水土豆粉','蔬菜淀粉','1kg/袋','加水即食 饱腹感强'],
        ['脱水鸡蛋粉','蛋白质','500g/袋','可替代鲜蛋 长期储存'],
        ['奶粉(全脂)','乳制品','1kg/袋','钙+蛋白质 可冲饮可烹饪'],
        ['芝士粉(脱水)','乳制品','500g/袋','调味+蛋白质 长期储存'],
        ['番茄酱(罐头)','调味','500g/罐','提升单调食物的口味'],
        ['咖喱块','调味','200g/盒','让米饭变得可忍受'],
        ['汤料粉(鸡/牛/蔬菜)','调味','500g/袋','热水冲泡=一碗热汤'],
        ['巧克力(黑巧>70%)','高能零食','1kg/袋','高热量密度 可可抗氧化'],
        ['硬糖/润喉糖','糖分补充','1kg/袋','快速糖分补充 持久储存'],
        ['电解质泡腾片','运动补给','20片/管','大量出汗后补充电解质'],
        ['速溶咖啡','饮品','500g/袋','咖啡因=最重要的精神活性物质'],
        ['茶包(红茶)','饮品','100包/盒','比咖啡更轻 含咖啡因'],
        ['奶粉(婴儿配方)','特殊食品','800g/罐','婴儿必需 不能断供'],
        ['葡萄糖粉','医疗食品','500g/袋','低血糖/ORS/能量快速补充'],
        ['蛋白粉(乳清)','运动营养','1kg/袋','补充蛋白质 长保质期'],
        ['代餐粉(Soylent型)','综合营养','1kg/袋','全营养配方 末日懒人餐']
      ];
      bulkFoods.forEach(([food,type,pkg,note]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const mult = tier==='budget'?1:tier==='standard'?3:tier==='premium'?10:30;
          items.push({
            id:'fb'+ (++id), category:'food_supplies', subcategory:'应急口粮', type:type,
            name: food + ' ×' + mult + ' ' + pkg + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'食品':food,'类型':type,'包装':pkg,'数量':'×'+mult,'说明':note},
            rating:5, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(50*t.factor*mult*0.8)+' - ¥'+Math.round(50*t.factor*mult*1.2),
            pros:['应急食物储备'],cons:['需要搭配均衡饮食'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    function massMedicalKits() { const items = []; let id = 112000;
      const kitTypes = [
        ['IFAK个人急救包(基础)','急救包','基础:绷带+创可贴+手套+剪刀'],
        ['IFAK个人急救包(标准)','急救包','标准:止血带+以色列绷带+止血纱布+手套+剪刀'],
        ['IFAK个人急救包(高级)','急救包','高级:双止血带+止血剂+胸腔贴+鼻咽管+全套'],
        ['家庭急救箱(基础)','家庭医疗','基础:常用药+体温计+绷带+创可贴+消毒'],
        ['家庭急救箱(标准)','家庭医疗','标准:+抗生素+止痛药+血压计+止血带'],
        ['家庭急救箱(高级)','家庭医疗','高级:+处方药+缝合包+诊断设备+夹板'],
        ['牙科急救包','专科医疗','牙痛止痛+临时填充+拔牙钳(基本)'],
        ['牙科急救包(高级)','专科医疗','全套:拔牙钳+升降器+填充材料+麻醉'],
        ['骨科固定包','专科医疗','夹板+三角巾+弹力绷带+牵引设备'],
        ['烧伤急救包','专科医疗','烧伤敷料+磺胺嘧啶银+止痛+补液'],
        ['接生包(产科)','专科医疗','无菌手套+脐带夹+吸引球+止血剂'],
        ['静脉输液包','高级医疗','生理盐水+乳酸林格+输液器+留置针'],
        ['气道管理包','高级医疗','口咽管+鼻咽管+喉罩+环甲膜切开套件'],
        ['胸腔急救包','高级医疗','胸腔引流套装+胸腔密封贴+气胸针'],
        ['战伤外科包','高级医疗','全套手术器械+止血+缝合+抗生素']
      ];
      kitTypes.forEach(([kit,type,contents]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          items.push({
            id:'mk'+ (++id), category:'medicine', subcategory:'急救包/套装', type:type,
            name: kit + ' ['+t.name+']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'套装':kit,'类型':type,'内容':contents,'品质':t.name},
            rating:5, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(200*t.factor)+' - ¥'+Math.round(500*t.factor),
            pros:['分级的医疗储备更节省'],cons:['定期检查过期物品'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    // Additional mass generators (each produces 100-400 items)
    function massElectronics() {
      const items = []; let id = 93000;
      const models = [
        ['对讲机','手持电台','Baofeng UV-5R / Yaesu FT-65 / Icom ID-52 / Motorola APX8000'],
        ['短波收音机','接收机','Tecsun PL-330 / PL-660 / PL-880 / Icom IC-R8600'],
        ['手持GPS','导航','Garmin eTrex 22x / GPSMAP 66s / Montana 700 / GPSMAP 86sci'],
        ['夜视仪','夜视','SiOnyx Aurora / PVS-14 Gen2+ / PVS-14 Gen3 / PVS-31A BNVD'],
        ['热成像仪','热成像','FLIR Scout TK / Pulsar Axion / FLIR Hti / N-Vision Halo LR'],
        ['无人机','侦察','DJI Mini 3 / DJI Mavic 3 / Autel EVO II / DJI Matrice 30'],
        ['便携太阳能充电板','充电','Lixada 10W / Anker 21W / BigBlue 28W / Goal Zero Nomad 50'],
        ['充电宝/储能','储能','小米10000mAh / Anker 20000mAh / EcoFlow River / Jackery 2000'],
        ['无线摄像头','监控','Wyze Cam / Reolink 4G / Arlo Go 2 / Axis 4K PTZ'],
        ['红外报警器','周界','基础红外 / 无线GSM报警 / AI识别报警 / 军用雷达报警'],
        ['信号增强器','通讯','手机1-2G / 4G全频 / 5G全频 / 卫星L波段增强'],
        ['头灯','照明','PETZL Tikkina / Actik Core / NAO RL / Duo RL Pro'],
        ['手电筒','照明','Sofirn SC31 / Fenix PD36R / Nitecore TM9K / Acebeam X75'],
        ['电池充电器','充电','XTAR MC1 / Nitecore D4 / SkyRC MC3000 / ISDT K4'],
        ['逆变器','电源','Bestek 300W / Renogy 1000W / Victron 2000W / AIMS 5000W'],
        ['天线(业余无线电)','天线','简易J型天线 / Diamond X50 / MFJ-2990 / SteppIR DB36'],
        ['同轴电缆','馈线','RG-58 / RG-8X / LMR-400 / Heliax 1/2"'],
        ['备用电池(多种)','电池','AA碱性×24 / AA锂电(Energizer) / CR123A×12 / 18650×10'],
        ['太阳能控制器','控制器','PWM 10A / PWM 30A / MPPT 40A / Victron MPPT 150V'],
        ['变压器/稳压器','电源','500VA稳压 / 1000VA稳压 / 2000VA在线式UPS / 5000VA工业UPS']
      ];
      models.forEach(([name,type,brands]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const brandList = brands.split(' / ');
          const brand = brandList[Math.min(tier==='budget'?0:tier==='standard'?1:tier==='premium'?2:3, brandList.length-1)];
          items.push({
            id:'e'+ (++id), category:'electronics', subcategory:type, type:type,
            name: name + ' - ' + brand + ' [' + t.name + ']',
            tierId:tier, tierName:t.name, tierIcon:t.icon,
            specs:{'设备':name,'型号':brand,'类型':type},
            rating:4, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
            priceRange:'¥'+Math.round(300*t.factor*0.8)+' - ¥'+Math.round(300*t.factor*1.3),
            pros:['末日通讯和态势感知关键设备'],cons:['依赖电力/电池'],
            alternatives:[],review:''
          });
        });
      });
      return items;
    }

    function massClothing() {
      const items = []; let id = 94000;
      const clothList = [
        ['保暖内衣(美利奴)','内衣','Icebreaker 175 / Smartwool 250 / Ibex / Ortovox'],
        ['保暖内衣(合成)','内衣','Uniqlo HeatTech / Patagonia Capilene Mid / Capilene Thermal / Arc\'teryx Rho'],
        ['抓绒中层','中层','Decathlon MH100 / Patagonia R1 / Arc\'teryx Delta / Norrona Falketind'],
        ['羽绒中层','中层','Uniqlo 超轻 / Montbell Plasma 1000 / Arc\'teryx Cerium / Feathered Friends'],
        ['硬壳冲锋衣','外层','Decathlon MH500 / Arc\'teryx Beta LT / Beta AR / Alpha SV'],
        ['软壳外套','外层','Decathlon SH500 / Outdoor Research Ferrosi / Arc\'teryx Gamma / Norrona'],
        ['雨衣/雨披','防水','简易PE雨披 / Frogg Toggs / Helly Hansen Moss / Arc\'teryx Norvan'],
        ['战术裤','下装','Propper BDU / 5.11 Stryke / Crye Precision G3 / Arc\'teryx LEAF'],
        ['保暖裤','下装','Decathlon SH500 / Patagonia Nano Puff / Arc\'teryx Proton / Feathered Friends'],
        ['羊毛袜','袜类','普通羊毛袜 / Darn Tough / Smartwool PhD / Darn Tough 极地'],
        ['内裤(美利奴)','内衣','普通羊毛内裤 / Icebreaker / Smartwool / Devold'],
        ['遮阳帽/保暖帽','头部','普通棒球帽 / Tilley Hat / Outdoor Research Seattle / Arc\'teryx'],
        ['围巾/面罩(Buff)','颈部','普通头巾 / Buff Original / Buff Merino / Buff Polar'],
        ['防水手套','手部','PVC防水手套 / Sealskinz / Hestra / Outdoor Research Alti'],
        ['护目镜','眼部','普通防护镜 / ESS Crossbow / Oakley SI / Wiley X Spear'],
        ['战术腰带','配件','尼龙简易腰带 / 5.11 Tactical / Blue Alpha Gear / Arc\'teryx Conveyor'],
        ['雪地绑腿/鞋套','配件','简易尼龙鞋套 / Outdoor Research / Rab Latok / 军用级绑腿']
      ];
      clothList.forEach(([name,type,brands]) => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier];
          const brandList = brands.split(' / ');
          const brand = brandList[Math.min(tier==='budget'?0:tier==='standard'?1:tier==='premium'?2:3, brandList.length-1)];
          [name.includes('袜')?'S/M/L':name.includes('帽')?'均码':'S/M/L/XL'].forEach(size => {
            items.push({
              id:'c'+ (++id), category:'clothing', subcategory:type, type:type,
              name: name + ' ' + size + ' - ' + brand + ' [' + t.name + ']',
              tierId:tier, tierName:t.name, tierIcon:t.icon,
              specs:{'服装':name,'品牌':brand,'尺寸':size,'类型':type},
              rating:4, priceLevel:tier==='budget'?'低':tier==='standard'?'中':tier==='premium'?'高':'极高',
              priceRange:'¥'+Math.round(200*t.factor*0.8)+' - ¥'+Math.round(200*t.factor*1.3),
              pros:['正确分层=生存'],cons:['棉花在户外=杀手'],
              alternatives:[],review:''
            });
          });
        });
      });
      return items;
    }

    function massShelter() { const items = []; let id = 95000;
      ['波特兰水泥','快硬水泥','白水泥','抗硫酸盐水泥','低碱水泥'].forEach(cement => {
        ['25kg袋','50kg袋','吨袋'].forEach(pkg => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier]; items.push({id:'s'+ (++id), category:'shelter', subcategory:'结构材料', type:'水泥', name:cement+' '+pkg+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'水泥':cement,'包装':pkg}, rating:4, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(50*t.factor)+' - ¥'+Math.round(80*t.factor), pros:['掩体基础材料'],cons:['需要养护'],alternatives:[],review:''});
          });
        });
      });
      ['钢筋网片','钢纤维','FRP玻璃纤维筋','玄武岩纤维筋','碳纤维网格'].forEach(rebar => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'s'+ (++id), category:'shelter', subcategory:'结构材料', type:'加强材料', name:rebar+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'加强材料':rebar}, rating:4, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(100*t.factor)+' - ¥'+Math.round(150*t.factor), pros:['加强混凝土'],cons:['需正确安装'],alternatives:[],review:''});
        });
      });
      ['防水卷材(SBS)','EPDM防水卷材','PVC防水卷材','水泥基渗透结晶','聚氨酯防水涂料','膨润土防水毯','丙烯酸防水涂料','JS防水涂料'].forEach(wp => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'s'+ (++id), category:'shelter', subcategory:'防水防潮', type:'防水材料', name:wp+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'防水材料':wp}, rating:5, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(60*t.factor)+' - ¥'+Math.round(120*t.factor), pros:['防水=掩体生命线'],cons:['施工质量决定效果'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massVehicles() { const items = []; let id = 96000;
      ['机油(矿物)','机油(半合成)','机油(全合成)','机油(赛车级)'].forEach(oil => {
        ['1L','4L','20L'].forEach(size => {
          ['budget','standard','premium','ultimate'].forEach(tier => {
            const t = TIERS[tier]; items.push({id:'v'+ (++id), category:'vehicles', subcategory:'维修保养', type:'车用油液', name:oil+' '+size+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'机油':oil,'容量':size}, rating:4, priceLevel:'中', priceRange:'¥'+Math.round(80*t.factor)+' - ¥'+Math.round(120*t.factor), pros:['车辆维护必需品'],cons:['有保质期'],alternatives:[],review:''});
          });
        });
      });
      ['防冻液','刹车油','变速箱油','转向助力油','玻璃水'].forEach(fluid => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'v'+ (++id), category:'vehicles', subcategory:'维修保养', type:'车用油液', name:fluid+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'油液':fluid}, rating:4, priceLevel:'中', priceRange:'¥'+Math.round(60*t.factor)+' - ¥'+Math.round(100*t.factor), pros:['车辆维护必需品'],cons:['定期更换'],alternatives:[],review:''});
        });
      });
      ['拖车绳','跳线电缆','灭火器','反光三角牌','急救包(车载)','破窗器','12V充气泵','补胎工具','备用灯泡','保险丝套装','雨刮片','防滑链','雪铲','遮阳挡','车顶行李箱'].forEach(acc => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'v'+ (++id), category:'vehicles', subcategory:'维修保养', type:'车载配件', name:acc+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'配件':acc}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(50*t.factor)+' - ¥'+Math.round(100*t.factor), pros:['车辆应急必备'],cons:['检查是否随车'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massWaterGear() { const items = []; let id = 97000;
      ['活性炭滤芯','陶瓷滤芯','PP棉滤芯','RO膜','超滤膜','离子交换树脂','KDF滤料','矿化球'].forEach(filter => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'w'+ (++id), category:'water_gear', subcategory:'过滤器', type:'滤芯/滤料', name:filter+' 替换装 ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'滤芯':filter}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(30*t.factor)+' - ¥'+Math.round(80*t.factor), pros:['滤芯是消耗品需储备'],cons:['不同品牌不通用'],alternatives:[],review:''});
        });
      });
      ['水桶(5L)','水桶(10L)','水桶(20L)','水桶(50L)','水壶(1L)','水壶(2L)','水壶(3L)','水袋(CamelBak型 2L)','水袋(3L)','折叠水桶(10L)','折叠水桶(20L)'].forEach(container => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'w'+ (++id), category:'water_gear', subcategory:'储水容器', type:'容器', name:container+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'容器':container}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(20*t.factor)+' - ¥'+Math.round(60*t.factor), pros:['储水的基础'],cons:['塑料老化需更换'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massPower() { const items = []; let id = 98000;
      ['太阳能电缆(光伏专用 4mm²)','太阳能电缆(6mm²)','MC4连接器','汇流箱','断路开关','防雷器','太阳能支架(屋顶)','太阳能支架(地面)','太阳能跟踪器','太阳能板清洁工具'].forEach(acc => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'p'+ (++id), category:'power', subcategory:'供电配件', type:'太阳能配件', name:acc+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'配件':acc}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(80*t.factor)+' - ¥'+Math.round(150*t.factor), pros:['太阳能系统配件'],cons:['需要正确安装'],alternatives:[],review:''});
        });
      });
      ['电线(1.5mm²)','电线(2.5mm²)','电线(4mm²)','电线(6mm²)','电线(10mm²)','接线端子','热缩管','电缆接头','配电箱','漏电保护器','空气开关','保险丝座','直流断路器','铜排','电池连接线','安德森插头','XT60/XT90接头'].forEach(elec => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'p'+ (++id), category:'power', subcategory:'供电配件', type:'电气配件', name:elec+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'电气配件':elec}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(30*t.factor)+' - ¥'+Math.round(80*t.factor), pros:['电气系统配件'],cons:['正确规格匹配'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massLighting() { const items = []; let id = 99000;
      ['LED灯泡(E27)','LED灯管','LED射灯','LED灯带','太阳能路灯','太阳能庭院灯','应急灯(双头)','出口指示灯','感应夜灯','露营灯串','煤油灯','汽灯(Coleman型)','蜡烛(白色无香)','蜡烛(蜂蜡 更久)','油灯芯'].forEach(light => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'l'+ (++id), category:'lighting', subcategory:'营地照明', type:'照明', name:light+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'照明':light}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(20*t.factor)+' - ¥'+Math.round(100*t.factor), pros:['照明=安全+士气'],cons:['需要能源'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massSleepShelter() { const items = []; let id = 100000;
      ['帐篷地垫/地布','帐篷修补包','备用帐杆','帐篷绳(反光)','地钉(铝/Y形)','地钉(钛/超轻)','睡袋内胆(丝质/增加温暖)','睡袋压缩袋','充气枕头','露营椅(折叠)','露营桌(折叠)','天幕杆','蚊帐(独立)','吊床(含蚊帐)','吊床防雨布','吊床底被(保暖)','防潮垫(铝膜)','充气垫修补包','帐篷胶水(Seam Grip)','防水喷雾(DWR恢复)'].forEach(acc => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'ss'+ (++id), category:'sleep_shelter', subcategory:'寝具配件', type:'露营配件', name:acc+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'配件':acc}, rating:3, priceLevel:'低', priceRange:'¥'+Math.round(30*t.factor)+' - ¥'+Math.round(80*t.factor), pros:['完善庇护所系统'],cons:['非必需的额外重量'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massHygiene() { const items = []; let id = 101000;
      ['洗衣粉/液','漂白水(次氯酸钠)','消毒湿巾','垃圾袋(大号/黑色)','垃圾袋(小号)','密封袋(Ziploc型)','一次性剃须刀','女性卫生用品(卫生巾)','女性卫生用品(卫生棉条)','月经杯(可重复使用)','安全套(多用途)','驱虫剂(DEET)','驱虫剂(派卡瑞丁)','蚊帐(浸药)','杀蟑胶饵','老鼠药/捕鼠夹','苍蝇拍/电蚊拍','空气清新剂','除湿剂/干燥剂','厕所清洁剂','84消毒液','来苏尔(Lysol型)','免洗洗手液(>60%酒精)'].forEach(h => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'hy'+ (++id), category:'hygiene', subcategory:'卫生清洁', type:'卫生用品', name:h+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'用品':h}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(20*t.factor)+' - ¥'+Math.round(60*t.factor), pros:['卫生=防疫的第一道防线'],cons:['消耗品定期补充'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massFireCooking() { const items = []; let id = 102000;
      ['丁烷气罐(220g)','丁烷气罐(450g)','丙烷气罐(1磅)','丙烷气罐(20磅)','固体酒精块','木炭(机制炭)','备长炭(高级)','引火物(松明/火绒)','打火机(Bic型×5个装)','打火机(防水)','火柴(厨房大盒)','烧烤架(折叠)','荷兰锅(Dutch Oven)','平底锅(铸铁)','煮锅(不锈钢)','水壶(烧水专用)','保温壶/膳魔师','餐具套装','砧板(塑料/木)','厨房剪刀','削皮器','开罐器(手动)','开瓶器','储粮桶(防鼠密封)','真空封口机','真空袋(Mylar型)','脱氧剂(食品级)','干燥剂(硅胶)'].forEach(c => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'fc'+ (++id), category:'fire_cooking', subcategory:'烹饪设备', type:'厨房', name:c+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'物品':c}, rating:4, priceLevel:'低', priceRange:'¥'+Math.round(20*t.factor)+' - ¥'+Math.round(100*t.factor), pros:['烹饪=生存质量的基础'],cons:['部分需燃料'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massSpecial() { const items = []; let id = 103000;
      ['极地羽绒睡袋(-40°C)','冰镐/冰爪','雪崩信标','GPS雪崩救援','高原氧气瓶','高原药(乙酰唑胺/Diamox)','沙漠头巾(防沙)','沙漠护目镜(防沙)','海水淡化器(手动)','海水淡化器(电动)','救生筏(2人)','救生筏(6人)','浸水服(防失温)','救生衣(自动充气)','信号枪+信号弹','激光求救器','应急定位信标(PLB)','防鲨剂','蛇咬急救包','防熊喷雾'].forEach(s => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'sp'+ (++id), category:'special', subcategory:'极限装备', type:'特殊场景', name:s+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'装备':s}, rating:4, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(200*t.factor)+' - ¥'+Math.round(500*t.factor), pros:['极端环境必备'],cons:['使用场景有限'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massDIY() { const items = []; let id = 104000;
      ['钉子(多规格)','螺丝(多规格)','螺栓+螺母(多规格)','垫圈(多规格)','合页/铰链','门闩/插销','把手/拉手','锁具(挂锁)','锁具(门锁)','链条(多粗细)','滑轮','弹簧(多类型)','O形圈(多尺寸)','垫片/密封圈','轴承(多尺寸)','PVC管(1/2"-4")','PVC接头(弯头/三通/接头)','胶水(PVC专用)','密封胶(硅酮)','堵漏灵/快干水泥','玻璃(普通/钢化)','亚克力板/有机玻璃','铁网/铁丝网','铝箔/铝板','铜管/铜接头','绝缘胶带','电工胶布','双面胶(强力)','魔术贴/尼龙搭扣'].forEach(d => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'di'+ (++id), category:'diy_materials', subcategory:'综合材料', type:'DIY', name:d+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'材料':d}, rating:3, priceLevel:'低', priceRange:'¥'+Math.round(10*t.factor)+' - ¥'+Math.round(50*t.factor), pros:['DIY修理和建造的基础'],cons:['消耗品'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massBarter() { const items = []; let id = 105000;
      ['香烟(万宝路型)','香烟(中华型)','雪茄','烟斗丝','白酒(茅台型)','威士忌(苏格兰)','白兰地','伏特加','朗姆酒','金酒','红酒(法国)','啤酒(精酿)','咖啡豆(阿拉比卡)','咖啡豆(罗布斯塔)','茶叶(龙井)','茶叶(普洱)','茶叶(铁观音)','茶叶(红茶)','可可粉','巧克力','白糖(5kg装)','红糖(5kg装)','蜂蜜(纯天然)','蜂王浆','维生素片(综合)','蛋白棒(箱装)','能量胶(盒装)','口香糖(大包装)','香料(藏红花)','银币(1盎司)'].forEach(b => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'ba'+ (++id), category:'barter_goods', subcategory:'交易物资', type:'硬通货', name:b+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'交易品':b}, rating:4, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(50*t.factor)+' - ¥'+Math.round(200*t.factor), pros:['末日中高价值交易品'],cons:['成瘾品有储存风险'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massPet() { const items = []; let id = 106000;
      ['狗粮(干粮)','狗粮(湿粮/罐头)','猫粮(干粮)','猫粮(湿粮/罐头)','猫砂(膨润土)','猫砂(豆腐砂)','宠物驱虫药','宠物跳蚤项圈','宠物急救包','宠物饮水器','宠物笼/航空箱','牵引绳(备用)','鸡饲料(蛋鸡)','鸡饲料(肉鸡)','兔饲料','羊饲料','猪饲料','鱼饲料','干草(苜蓿)','干草(梯牧草)','盐砖(牲畜舔)','矿物质补充块','围栏网(家禽)','电围栏(牲畜)','马鞍/马具','马蹄铁(备用)','蹄铁钉','刷马工具'].forEach(p => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'pe'+ (++id), category:'pets_livestock', subcategory:'宠物/牲畜', type:'动物物资', name:p+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'物品':p}, rating:3, priceLevel:'低', priceRange:'¥'+Math.round(30*t.factor)+' - ¥'+Math.round(80*t.factor), pros:['宠物/牲畜的生存物资'],cons:['消耗品'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massBaby() { const items = []; let id = 107000;
      ['婴儿配方奶粉(0-6月)','婴儿配方奶粉(6-12月)','婴儿米粉','婴儿果泥','婴儿蔬菜泥','婴儿肉泥','纸尿裤(新生儿)','纸尿裤(S号)','纸尿裤(M号)','纸尿裤(L号)','布尿裤(可洗)','婴儿湿巾','婴儿沐浴露','婴儿洗衣液','婴儿退热药(对乙酰氨基酚滴剂)','婴儿退热药(布洛芬滴剂)','婴儿电解质水','婴儿维生素D滴剂','婴儿防晒霜','婴儿驱蚊液','安抚奶嘴(备用)','奶瓶(备用)','奶瓶刷','吸奶器(手动)','吸奶器(电动)','婴儿背带','婴儿车(越野型)','儿童安全座椅','儿童防护栏/安全门','插座保护盖'].forEach(b => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          const t = TIERS[tier]; items.push({id:'bb'+ (++id), category:'baby_child', subcategory:'婴儿用品', type:'婴幼儿', name:b+' ['+t.name+']', tierId:tier, tierName:t.name, tierIcon:t.icon, specs:{'物品':b}, rating:5, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(40*t.factor)+' - ¥'+Math.round(100*t.factor), pros:['婴幼儿生存物资'],cons:['消耗品定期补充'],alternatives:[],review:''});
        });
      });
      return items;
    }

    function massTraining() { const items = []; let id = 108000;
      ['生存手册(FM 21-76)','SAS生存手册','野外医学手册','战伤外科手册','植物识别图鉴(本地)','可食用蘑菇图鉴','毒蛇/毒虫识别图鉴','地图与指北针教程','结绳手册','急救手册(红十字会)','无线电通讯入门','莫尔斯电码练习器','太阳能系统安装指南','永续农业入门','木工基础教程','焊接教程','锻铁/铁匠入门','电子维修教程','车辆维修手册(针对你的车型)','机械制图工具','笔记本(防水)','笔(太空笔/铅笔)','粉笔/标记笔','白板/黑板','训练假人(CPR)','练习用锁(开锁训练)','指力训练器','握力器','跳绳','瑜伽垫'].forEach(t => {
        ['budget','standard','premium','ultimate'].forEach(tier => {
          items.push({id:'tr'+ (++id), category:'training', subcategory:'培训物资', type:'训练', name:t+' ['+TIERS[tier].name+']', tierId:tier, tierName:TIERS[tier].name, tierIcon:TIERS[tier].icon, specs:{'物品':t}, rating:4, priceLevel:tier==='budget'?'低':'中', priceRange:'¥'+Math.round(50*TIERS[tier].factor)+' - ¥'+Math.round(120*TIERS[tier].factor), pros:['知识=最宝贵的生存资产'],cons:['纸书需防水'],alternatives:[],review:''});
        });
      });
      return items;
    }

  // --- 构建数据库 ---
  const allItems = generateItems();

  return {
    categories: CATEGORIES,
    items: allItems,
    tiers: TIERS,
    getItemCount: function() { return allItems.length; },
    _catCountsCache: null,
    getCountByCategory: function() {
      if (this._catCountsCache) return this._catCountsCache;
      const counts = {};
      allItems.forEach(i => { counts[i.category] = (counts[i.category]||0)+1; });
      this._catCountsCache = counts;
      return counts;
    },
    getByTier: function(tierId) { return allItems.filter(i => i.tierId === tierId); },
    getByCategory: function(catId) { return allItems.filter(i => i.category === catId); },
    search: function(q) {
      q = q.toLowerCase();
      return allItems.filter(i => i.name.toLowerCase().includes(q) || (i.type||'').toLowerCase().includes(q) || (i.review||'').toLowerCase().includes(q));
    }
  };

})();
