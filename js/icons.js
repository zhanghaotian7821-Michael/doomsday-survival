// ============================================
// 图标系统：把彩色 emoji 换成线条 SVG（军工/技术图纸风格）
// 只替换已知 emoji，未知字符原样保留；不修改任何业务数据
// ============================================
(function () {
  'use strict';

  // ---- 1. 图标符号表（24×24 描边，currentColor 继承主题色）----
  const S = {
    home: '<path d="M3 11.2 12 3l9 8.2"/><path d="M5.6 9.6V20h12.8V9.6"/><path d="M10 20v-5.5h4V20"/>',
    droplet: '<path d="M12 3.2s-6 6.9-6 10.6a6 6 0 0 0 12 0C18 10.1 12 3.2 12 3.2z"/>',
    can: '<path d="M7 8h10v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M7 8a5 1.7 0 0 1 10 0"/><path d="M7 12.5h10M7 16h10"/>',
    flame: '<path d="M12 3c-3 4-6 6.2-6 10a6 6 0 0 0 12 0c0-2-1.4-3.6-2.4-5-1 2-2 2.6-3 2.6 1-3 .9-5.6-.6-7.6z"/>',
    cross: '<path d="M9.2 3.6h5.6v5.2h5.2v5.6h-5.2v5.6H9.2v-5.6H4V8.8h5.2z"/>',
    shield: '<path d="M12 3.2 20 6v6c0 4.7-3.6 7.6-8 8.8-4.4-1.2-8-4.1-8-8.8V6z"/><path d="M8.6 11.8l2.6 2.6 4.4-4.6"/>',
    antenna: '<path d="M12 21V9"/><path d="M5.8 6.2a8.8 8.8 0 0 1 12.4 0"/><path d="M8.6 9.2a5 5 0 0 1 6.8 0"/><circle cx="12" cy="12.6" r="1.4"/>',
    compass: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2l2.4 4.8-2.4 4.8-2.4-4.8z"/>',
    toolbox: '<path d="M3.6 9h16.8v10.4H3.6z"/><path d="M9 9V6.2h6V9"/><path d="M3.6 13h16.8"/><path d="M10.4 13v2.2h3.2V13"/>',
    leaf: '<path d="M4.4 19.6C4.4 11.8 10.4 5 20 4c-.8 8.6-7 15.6-15.6 15.6z"/><path d="M4.4 19.6 14 10"/>',
    radiation: '<circle cx="12" cy="12" r="2.1"/><path d="M9.3 8.4a6.6 6.6 0 0 1 5.4 0"/><path d="M16 13.6a6.6 6.6 0 0 1-3.1 4.1"/><path d="M8 13.6a6.6 6.6 0 0 0 3.1 4.1"/>',
    volcano: '<path d="M2.6 19.8h18.8L16.2 9.6l-2.4 2.2L11.2 6 8.8 11.6 6.4 9.6z"/><path d="M12 3v1.6M9.6 3.6l.4 1.4M14.4 3.6l-.4 1.4"/>',
    brain: '<path d="M9.4 4.6a3.2 3.2 0 0 0-3.2 3.2 3 3 0 0 0-.6 5.6 3 3 0 0 0 3 4.4h2.8V4.6z"/><path d="M14.6 4.6a3.2 3.2 0 0 1 3.2 3.2 3 3 0 0 1 .6 5.6 3 3 0 0 1-3 4.4h-2.8"/><path d="M12 4.6v13.2"/>',
    map: '<path d="M9 4.2 15 6.2 20.4 4.2V20L15 18 9 20 3.6 18V4.2z"/><path d="M9 4.2V20M15 6.2V18"/>',
    coins: '<rect x="3.2" y="7" width="17.6" height="10" rx="1.2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.8M17.2 12H18"/>',
    sprout: '<path d="M12 21V10.6"/><path d="M12 10.6C12 6.8 9 4.6 4.8 4.6c0 4 3 6.2 7.2 6.2"/><path d="M12 10.6c0-3.2 2.4-5.2 6.4-5.2 0 3.6-2.6 5.6-6.4 5.6"/>',
    book: '<path d="M4 5h6.2A2.8 2.8 0 0 1 13 7.8V20a2.8 2.8 0 0 0-2.8-2.8H4z"/><path d="M20 5h-6.2A2.8 2.8 0 0 0 11 7.8V20a2.8 2.8 0 0 1 2.8-2.8H20z"/>',
    gun: '<path d="M3.4 9.6h13.2l3.2 3.2h-3.6l-2.2 3.2h-3.2l1.2-3.2H3.4z"/><path d="M16.6 9.6V7.2"/>',
    wrench: '<path d="M14.8 3.6a4.2 4.2 0 0 0 5.4 5.4L9.4 19.8a2.3 2.3 0 1 1-3.2-3.2z"/>',
    pill: '<g transform="rotate(45 12 12)"><rect x="5.6" y="9" width="12.8" height="6" rx="3"/><path d="M12 9v6"/></g>',
    box: '<path d="M3.4 7.8 12 3.6l8.6 4.2v8.4L12 20.4 3.4 16.2z"/><path d="M3.4 7.8 12 12l8.6-4.2"/><path d="M12 12v8.4"/>',
    tap: '<path d="M4.6 20.4v-8.8h8.2a4.6 4.6 0 0 0 4.6-4.6V4.2"/><path d="M14.6 6.6 17.4 3.8l2.8 2.8"/><path d="M11.6 20.4v-4.2"/>',
    bolt: '<path d="M13.4 2.4 4.4 14h6l-1.2 7.6 9-11.6h-6z"/>',
    brick: '<path d="M3 7.2h18v9.6H3z"/><path d="M3 12h18M9 7.2V12M15 12v4.8"/>',
    shirt: '<path d="M8.2 4 4 7.2l2 4 2-1V20h8V10.2l2 1 2-4L15.8 4l-2 2h-3.6z"/>',
    radio: '<rect x="2.8" y="8" width="18.4" height="11.2" rx="1.2"/><circle cx="8.6" cy="13.6" r="2.2"/><path d="M14.6 11.4h4.2M14.6 14.4h4.2"/><path d="M7 8V4.6M12 8V6.2"/>',
    car: '<path d="M3.6 16.4v-4l3-4.2h10.8l3 4.2v4z"/><circle cx="7.4" cy="16.4" r="1.6"/><circle cx="16.6" cy="16.4" r="1.6"/>',
    broom: '<path d="M14.8 3.4 9.6 11.6"/><path d="M9.6 11.6 4 19.8h8l3.2-5.4z"/><path d="M13.2 14.4 6.4 17.6"/>',
    bulb: '<path d="M12 3.4a6.2 6.2 0 0 1 3.2 11.5v2.3H8.8v-2.3A6.2 6.2 0 0 1 12 3.4z"/><path d="M9.8 20h4.4"/>',
    tent: '<path d="M2.8 20 12 4.4 21.2 20z"/><path d="M12 4.4V20"/><path d="M8.2 20 12 12.8 15.8 20"/>',
    target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".9"/>',
    paw: '<circle cx="7" cy="8.4" r="2"/><circle cx="11" cy="6.4" r="2"/><circle cx="15.8" cy="7.4" r="2"/><circle cx="19" cy="10.6" r="1.8"/><path d="M7.4 14.6c1.4-2.6 7.8-2.6 9.2 0 1 1.9-.4 4-2.6 4-1.4 0-2-.6-3-.6s-1.6.6-3 .6c-2.2 0-3.6-2.1-2.6-4z"/>',
    bottle: '<path d="M10 3.4h4v3l2 3v9.2a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 18.6V9.4l2-3z"/><path d="M8 12.4h8"/>',
    thumb: '<path d="M7.4 10.4v10.2H4.2V10.4z"/><path d="M7.4 10.4 10 4.4a1.9 1.9 0 0 1 2.2 1.8v3.4h5.6a2 2 0 0 1 2 2.4l-1.4 6.8a2 2 0 0 1-2 1.6H7.4"/>',
    star: '<path d="M12 3.4l2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6-4.5-4.2 6.1-.8z"/>',
    crown: '<path d="M3.6 18.4h16.8l-1.6-9.2-4 3-2.8-6.2-2.8 6.2-4-3z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.6"/><path d="M15.6 15.6 21 21"/>',
    blueprint: '<path d="M5 3.4h9l5 5v12.2H5z"/><path d="M14 3.4v5h5"/><path d="M8 12h8M8 15.4h8M8 18.8h4.6"/>',
    calculator: '<rect x="4.6" y="3.2" width="14.8" height="17.6" rx="1.2"/><rect x="7.6" y="6" width="8.8" height="3"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
    printer: '<path d="M7 8.2V3.4h10v4.8"/><path d="M4.2 8.2h15.6v7.4h-3.2"/><path d="M7 15.6h10v5H7z"/>',
    link: '<path d="M9.4 14.6 14.6 9.4"/><path d="M8.6 11.4a4 4 0 0 1 0-5.6l1.8-1.8a4 4 0 0 1 5.6 5.6"/><path d="M15.4 12.6a4 4 0 0 1 0 5.6l-1.8 1.8a4 4 0 0 1-5.6-5.6"/>',
    close: '<path d="M5.4 5.4 18.6 18.6M18.6 5.4 5.4 18.6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrowUp: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
    clipboard: '<rect x="6" y="4.4" width="12" height="16.2" rx="1.2"/><rect x="9" y="2.6" width="6" height="3.6" rx="1"/><path d="M9 10.4h6M9 14h6M9 17.6h3.6"/>',
    swap: '<path d="M3.6 8.4h12.8l-3-3"/><path d="M20.4 15.6H7.6l3 3"/>',
    warning: '<path d="M12 3.8 21 20H3z"/><path d="M12 9.6v4.4"/><path d="M12 17h.01"/>',
    check: '<path d="M4.4 12.4 9.4 17.4 19.6 6.6"/>',
    chart: '<path d="M4 3.6V20h16"/><path d="M8 20v-6.4M12.6 20v-9.8M17.2 20v-4.2"/>',
    vs: '<path d="M4.4 6.2 10.2 12l-5.8 5.8"/><path d="M19.6 6.2 13.8 12l5.8 5.8"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.4v2.8M12 18.8v2.8M2.4 12h2.8M18.8 12h2.8M5.2 5.2l2 2M16.8 16.8l2 2M18.8 5.2l-2 2M7.2 16.8l-2 2"/>',
    clipboardList: '<path d="M8 4.6h8M8 9h8M8 13.4h5"/><rect x="4.6" y="2.8" width="14.8" height="18.4" rx="1.2"/>',
    filter: '<path d="M3.8 5.4h16.4l-6.4 7v6.6l-3.6 1.8v-8.4z"/>'
  };

  // ---- 2. emoji → 图标 映射 ----
  const MAP = {
    '🏠': 'home', '💧': 'droplet', '🍖': 'can', '🔥': 'flame', '🏥': 'cross',
    '🛡': 'shield', '📡': 'antenna', '🧭': 'compass', '🧰': 'toolbox', '🌿': 'leaf',
    '☢': 'radiation', '🌋': 'volcano', '🧠': 'brain', '🗺': 'map', '💰': 'coins',
    '🌱': 'sprout', '📚': 'book', '🔫': 'gun', '🔧': 'wrench', '💊': 'pill',
    '📦': 'box', '🚰': 'tap', '⚡': 'bolt', '🧱': 'brick', '👕': 'shirt',
    '📻': 'radio', '🚗': 'car', '🧹': 'broom', '💡': 'bulb', '⛺': 'tent',
    '🎯': 'target', '🐕': 'paw', '🍼': 'bottle', '👍': 'thumb', '⭐': 'star',
    '★': 'star', '☆': 'star', '👑': 'crown', '🔍': 'search', '🏗': 'blueprint',
    '🧮': 'calculator', '🖨': 'printer', '🔗': 'link', '✕': 'close', '☰': 'menu',
    '⬆': 'arrowUp', '📋': 'clipboard', '🔄': 'swap', '⚠': 'warning', '✅': 'check',
    '📊': 'chart', '🆚': 'vs', '🛠': 'toolbox', '🗒': 'clipboardList', '🔎': 'search',
    '🚨': 'warning', '🅾': 'target'
  };

  // 补充图标：规划器房间 / 威胁类型 / 计算器分区
  Object.assign(S, {
    bed: '<path d="M3.4 18.4v-4.6h17.2v4.6"/><path d="M3.4 13.8V8h5.2v5.8"/><path d="M8.6 10.6h5.8a4.2 4.2 0 0 1 4.2 3.2"/><path d="M3.4 18.4h17.2"/>',
    pan: '<path d="M3.6 10.4h11.2v3.2a5.6 5.6 0 0 1-5.6 5.6 5.6 5.6 0 0 1-5.6-5.6z"/><path d="M14.8 12h3.4a2.2 2.2 0 0 1 0 4.4h-3.4"/><path d="M6.4 6.6c0-1.2 1-1.6 1-2.6M10.4 6.6c0-1.2 1-1.6 1-2.6"/>',
    toilet: '<path d="M6 4.4h6.4v6.2H6z"/><path d="M4.4 10.6h14.2a7.1 7.1 0 0 1-7.1 7.1 7.1 7.1 0 0 1-7.1-7.1z"/><path d="M12 17.7v2.9"/>',
    door: '<path d="M5 20.4V3.6h11.4v16.8H5z"/><path d="M16.4 20.4H21"/><circle cx="13.4" cy="12" r="0.9"/>',
    virus: '<circle cx="12" cy="12" r="5.2"/><path d="M12 2.6v4.2M12 17.2v4.2M2.6 12h4.2M17.2 12h4.2M5.4 5.4l3 3M15.6 15.6l3 3M18.6 5.4l-3 3M8.4 15.6l-3 3"/><circle cx="12" cy="12" r="1.1"/>',
    flask: '<path d="M9.4 3.4h5.2v5.2l4 8.2a2 2 0 0 1-1.8 2.9H7.2a2 2 0 0 1-1.8-2.9l4-8.2z"/><path d="M7.6 13.6h8.8"/>',
    blast: '<path d="M12 3.4 14 9l5.6-2-2 5.6 5 3.2-5 3.2 2 5.6-5.6-2-2 5.6-2-5.6-5.6 2 2-5.6-5-3.2 5-3.2-2-5.6L9 9z" opacity="0.95"/>',
    backpack: '<path d="M7.4 8.4a4.6 4.6 0 0 1 9.2 0v11.6H7.4z"/><path d="M9.6 8.4V6a2.4 2.4 0 0 1 4.8 0v2.4"/><path d="M7.4 13.6h9.2"/><path d="M10.4 16.4h3.2"/>',
    fuel: '<path d="M4.4 20.4V5.6A1.6 1.6 0 0 1 6 4h4.4a1.6 1.6 0 0 1 1.6 1.6v14.8z"/><path d="M4.4 11.2h7.6"/><path d="M12 9.6l3.6 1.8v6.4a2 2 0 0 0 4 0V9.4l-3-3"/>',
    clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.2V12l3.4 2.2"/>',
    gear2: '<circle cx="12" cy="12" r="7.4"/><path d="M12 4.6v2.2M12 17.2v2.2M4.6 12h2.2M17.2 12h2.2"/>',
    note: '<path d="M5.4 3.6h9.2l4 4v12.8H5.4z"/><path d="M14.6 3.6v4h4"/><path d="M8.4 11.4h7M8.4 15h5"/>'
  });

  Object.assign(MAP, {
    '🛏': 'bed', '🍳': 'pan', '🚽': 'toilet', '🚪': 'door', '⚙': 'gear',
    '🦠': 'virus', '⚗': 'flask', '💥': 'blast', '🎒': 'backpack', '⛽': 'fuel',
    '⏱': 'clock', '📝': 'note', '🗒': 'note', '🔧': 'wrench', '🪫': 'bolt',
    '🏰': 'castle', '👥': 'users', '📍': 'pin', '📐': 'ruler', '🔮': 'orb'
  });

  Object.assign(S, {
    castle: '<path d="M3.4 20.4V9.6h3.2v-2h3.2v2h3.6v-2h3.2v2h3v10.8z"/><path d="M9.8 20.4v-4.4h4.4v4.4"/><path d="M3.4 13.6h17.2"/>',
    users: '<circle cx="9" cy="8.6" r="3.1"/><path d="M3.4 19.4c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2"/><path d="M16 6.2a3 3 0 0 1 0 5.6"/><path d="M17.4 14.6c2 .6 3.2 2.3 3.2 4.4"/>',
    pin: '<path d="M12 21s6.4-6.4 6.4-10.6A6.4 6.4 0 0 0 5.6 10.4C5.6 14.6 12 21 12 21z"/><circle cx="12" cy="10.2" r="2.4"/>',
    ruler: '<path d="M3.6 14.4 14.4 3.6l6 6L9.6 20.4z"/><path d="M7.4 12.4l1.6 1.6M10.4 9.4l1.6 1.6M13.4 6.4l1.6 1.6"/>',
    orb: '<circle cx="12" cy="11.4" r="6.6"/><path d="M6.6 14c3.6 1.4 7.2-1 10.8-4.2"/><path d="M9.4 20.4h5.2"/><path d="M12 18v2.4"/>'
  });

  // ---- 3. 注入 sprite ----
  const symbols = Object.keys(S)
    .map((k) => `<symbol id="ico-${k}" viewBox="0 0 24 24">${S[k]}</symbol>`)
    .join('');
  const sprite = document.createElement('div');
  sprite.setAttribute('aria-hidden', 'true');
  sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  sprite.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="width:0;height:0;overflow:hidden">${symbols}</svg>`;
  document.body.insertBefore(sprite, document.body.firstChild);

  // ---- 4. 文本节点替换 ----
  const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
  const pattern = new RegExp('(' + keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

  function makeIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'wt-ico');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#ico-' + name);
    svg.appendChild(use);
    return svg;
  }

  function processNode(node) {
    if (!node || node.nodeType !== 3) return;
    const parent = node.parentNode;
    if (!parent || SKIP.has(parent.nodeName)) return;
    if (!node.nodeValue) return;

    // 去掉变体选择符（🛡️ / ☢️ / 🗺️ 等），简化匹配
    let text = node.nodeValue;
    if (text.indexOf('\uFE0F') >= 0) text = text.replace(/\uFE0F/g, '');
    if (!pattern.test(text)) {
      if (text !== node.nodeValue) node.nodeValue = text;
      return;
    }
    pattern.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const icon = makeIcon(MAP[m[0]]);
      if (!icon) frag.appendChild(document.createTextNode(m[0]));
      else frag.appendChild(icon);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, node);
  }

  function processRoot(root) {
    if (!root) return;
    if (root.nodeType === 3) return processNode(root);
    if (root.nodeType !== 1) return;
    if (SKIP.has(root.nodeName)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const batch = [];
    let n;
    while ((n = walker.nextNode())) batch.push(n);
    for (const t of batch) processNode(t);
    if (root.nodeName === 'TEXTAREA') return;
  }

  // ---- 5. 观察 DOM 变化，覆盖所有动态渲染 ----
  const observe = () => {
    processRoot(document.body);
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') processNode(m.target);
        else for (const added of m.addedNodes) processRoot(added);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }
})();
