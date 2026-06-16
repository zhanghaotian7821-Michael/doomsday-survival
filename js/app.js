// ============================================
// 末日准备者 - 应用逻辑
// 导航、搜索、收藏、渲染
// ============================================

(function() {
  'use strict';

  // --- 状态管理 ---
  const state = {
    currentView: 'welcome',
    currentArticleId: null,
    favorites: new Set(),
    expandedCategories: new Set(),
    checklistItems: {},
    searchQuery: '',
    isMobileMenuOpen: false,
    // Resources
    resourceFilter: 'all',
    resourceSort: 'rating',
    resourcePage: 1,
    resourcePageSize: 50,
    compareItems: [],       // Up to 4 items for comparison
    resourceFavorites: new Set()
  };

  // --- DOM 缓存 ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    navTree: $('#navTree'),
    mainContent: $('#mainContent'),
    welcomePage: $('#welcomePage'),
    welcomeGrid: $('#welcomeGrid'),
    articlePage: $('#articlePage'),
    breadcrumb: $('#breadcrumb'),
    articleContent: $('#articleContent'),
    articleMeta: $('#articleMeta'),
    articleRelated: $('#articleRelated'),
    favoritesPage: $('#favoritesPage'),
    favoritesList: $('#favoritesList'),
    checklistPage: $('#checklistPage'),
    checklistContent: $('#checklistContent'),
    searchInput: $('#searchInput'),
    searchResults: $('#searchResults'),
    searchBtn: $('#searchBtn'),
    favBtn: $('#favBtn'),
    favCount: $('#favCount'),
    calcBtn: $('#calcBtn'),
    calcModal: $('#calcModal'),
    calcBody: $('#calcBody'),
    calcClose: $('#calcClose'),
    printBtn: $('#printBtn'),
    menuToggle: $('#menuToggle'),
    sidebar: $('#sidebar'),
    sidebarOverlay: $('#sidebarOverlay'),
    collapseAll: $('#collapseAll'),
    showFavorites: $('#showFavorites'),
    showChecklist: $('#showChecklist'),
    backToTop: $('#backToTop'),
    // New
    advisorBtn: $('#advisorBtn'),
    advisorPage: $('#advisorPage'),
    advisorContent: $('#advisorContent'),
    resourcesBtn: $('#resourcesBtn'),
    plannerBtn: $('#plannerBtn'),
    resourcesPage: $('#resourcesPage'),
    resourcesContent: $('#resourcesContent'),
    plannerPage: $('#plannerPage'),
    plannerContent: $('#plannerContent'),
    resourceModal: $('#resourceModal'),
    resourceModalTitle: $('#resourceModalTitle'),
    resourceModalBody: $('#resourceModalBody'),
    resourceModalClose: $('#resourceModalClose'),
    comparePanel: $('#comparePanel'),
    compareItems: $('#compareItems'),
    compareCount: $('#compareCount'),
    compareClear: $('#compareClear'),
    compareToggle: $('#compareToggle')
  };

  // --- 初始化 ---
  function init() {
    loadState();
    renderNavTree();
    renderWelcomeGrid();
    updateFavCount();
    bindEvents();
    handleHashChange();
  }

  // --- 状态持久化 ---
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('prepper_state') || '{}');
      if (saved.favorites) state.favorites = new Set(saved.favorites);
      if (saved.expandedCategories) state.expandedCategories = new Set(saved.expandedCategories);
      if (saved.checklistItems) state.checklistItems = saved.checklistItems;
    } catch(e) { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem('prepper_state', JSON.stringify({
        favorites: [...state.favorites],
        expandedCategories: [...state.expandedCategories],
        checklistItems: state.checklistItems
      }));
    } catch(e) { /* ignore */ }
  }

  // --- 导航树渲染 ---
  function renderNavTree() {
    dom.navTree.innerHTML = '';
    SURVIVAL_DATA.categories.forEach(cat => {
      const catEl = document.createElement('div');
      catEl.className = 'nav-category' + (state.expandedCategories.has(cat.id) ? '' : ' collapsed');
      catEl.dataset.catId = cat.id;

      const header = document.createElement('div');
      header.className = 'nav-cat-header';
      header.innerHTML = `
        <span class="cat-icon">${cat.icon}</span>
        <span>${cat.name}</span>
        <span class="cat-arrow">▼</span>
      `;
      header.addEventListener('click', () => toggleCategory(cat.id));

      const subitems = document.createElement('div');
      subitems.className = 'nav-subitems';

      cat.subcategories.forEach(sub => {
        const articles = getArticlesBySubcategory(cat.id, sub.id);
        if (articles.length === 0) return;

        const item = document.createElement('div');
        item.className = 'nav-item';
        item.textContent = `${sub.name} (${articles.length})`;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          if (articles.length === 1) {
            showArticle(articles[0].id);
          } else {
            // Show first article in subcategory with option to browse
            showArticle(articles[0].id);
          }
        });
        subitems.appendChild(item);
      });

      catEl.appendChild(header);
      catEl.appendChild(subitems);
      dom.navTree.appendChild(catEl);
    });
  }

  function toggleCategory(catId) {
    if (state.expandedCategories.has(catId)) {
      state.expandedCategories.delete(catId);
    } else {
      state.expandedCategories.add(catId);
    }
    saveState();
    const catEl = dom.navTree.querySelector(`[data-cat-id="${catId}"]`);
    if (catEl) catEl.classList.toggle('collapsed');
  }

  // --- 欢迎页分类卡片 ---
  function renderWelcomeGrid() {
    dom.welcomeGrid.innerHTML = '';
    SURVIVAL_DATA.categories.forEach(cat => {
      const articleCount = getArticlesByCategory(cat.id).length;
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <div class="cc-icon">${cat.icon}</div>
        <div class="cc-title">${cat.name}</div>
        <div class="cc-desc">${cat.desc}</div>
        <div class="cc-count">${articleCount} 篇指南</div>
      `;
      card.addEventListener('click', () => {
        // Expand category in sidebar and show first article
        state.expandedCategories.add(cat.id);
        saveState();
        renderNavTree();
        const articles = getArticlesByCategory(cat.id);
        if (articles.length > 0) {
          showArticle(articles[0].id);
        }
        // On mobile, close sidebar
        closeMobileMenu();
      });
      dom.welcomeGrid.appendChild(card);
    });

    // Update stats
    const totalArticles = SURVIVAL_DATA.articles.length;
    $('#statArticles').textContent = totalArticles + '+';
    $('#statCategories').textContent = SURVIVAL_DATA.categories.length;
    $('#statTools').textContent = '4';
  }

  // --- 文章展示 ---
  function showArticle(articleId) {
    const article = SURVIVAL_DATA.articles.find(a => a.id === articleId);
    if (!article) return;

    state.currentView = 'article';
    state.currentArticleId = articleId;

    // Hide other pages
    dom.welcomePage.style.display = 'none';
    dom.favoritesPage.style.display = 'none';
    dom.checklistPage.style.display = 'none';
    dom.articlePage.style.display = 'block';

    // Breadcrumb
    const cat = SURVIVAL_DATA.categories.find(c => c.id === article.category);
    const sub = cat ? cat.subcategories.find(s => s.id === article.subcategory) : null;
    dom.breadcrumb.innerHTML = `
      <a data-view="welcome">🏠 首页</a>
      <span class="sep">›</span>
      <a data-cat="${cat ? cat.id : ''}">${cat ? cat.icon + ' ' + cat.name : ''}</a>
      <span class="sep">›</span>
      <span>${sub ? sub.name : ''}</span>
    `;
    // Bind breadcrumb clicks
    dom.breadcrumb.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        if (link.dataset.view === 'welcome') {
          showWelcome();
        } else if (link.dataset.cat) {
          state.expandedCategories.add(link.dataset.cat);
          saveState();
          renderNavTree();
          const arts = getArticlesByCategory(link.dataset.cat);
          if (arts.length > 0) showArticle(arts[0].id);
        }
      });
    });

    // Content
    dom.articleContent.innerHTML = article.content;

    // Meta
    const importanceStars = Array.from({length: 5}, (_, i) =>
      `<span class="meta-star${i < article.importance ? '' : ' dim'}">★</span>`
    ).join('');

    const difficultyDots = Array.from({length: 5}, (_, i) =>
      `<span class="meta-star${i < article.difficulty ? '' : ' dim'}">⬟</span>`
    ).join('');

    const isFav = state.favorites.has(article.id);

    dom.articleMeta.innerHTML = `
      <span>重要性：${importanceStars}</span>
      <span>难度：${difficultyDots}</span>
      ${article.tags.map(t => `<span class="meta-tag">#${t}</span>`).join(' ')}
      <div class="article-actions">
        <button class="btn-action ${isFav ? 'fav-active' : ''}" id="toggleFav">
          ${isFav ? '⭐ 已收藏' : '☆ 收藏'}
        </button>
        <button class="btn-action" id="printArticle">🖨️ 打印</button>
        <button class="btn-action" id="copyLink">🔗 复制链接</button>
      </div>
    `;

    // Bind action buttons
    $('#toggleFav').addEventListener('click', () => toggleFavorite(article.id));
    $('#printArticle').addEventListener('click', () => window.print());
    $('#copyLink').addEventListener('click', () => {
      const url = window.location.origin + window.location.pathname + '#article=' + article.id;
      navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制！');
      }).catch(() => {
        prompt('复制此链接：', url);
      });
    });

    // Related articles
    if (article.related && article.related.length > 0) {
      const relatedArticles = article.related
        .map(id => SURVIVAL_DATA.articles.find(a => a.id === id))
        .filter(Boolean);
      if (relatedArticles.length > 0) {
        dom.articleRelated.innerHTML = `
          <h3>📖 相关文章</h3>
          <div class="related-links">
            ${relatedArticles.map(r => `
              <span class="related-link" data-id="${r.id}">${r.title}</span>
            `).join('')}
          </div>
        `;
        dom.articleRelated.querySelectorAll('.related-link').forEach(link => {
          link.addEventListener('click', () => showArticle(link.dataset.id));
        });
      }
    } else {
      dom.articleRelated.innerHTML = '';
    }

    // Update URL hash
    window.location.hash = 'article=' + articleId;

    // Scroll to top
    dom.mainContent.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Highlight nav item
    highlightNavItem(articleId);
  }

  function showWelcome() {
    state.currentView = 'welcome';
    state.currentArticleId = null;
    dom.welcomePage.style.display = 'block';
    dom.articlePage.style.display = 'none';
    dom.favoritesPage.style.display = 'none';
    dom.checklistPage.style.display = 'none';
    window.location.hash = '';
    clearNavHighlight();
  }

  function highlightNavItem(articleId) {
    clearNavHighlight();
    const article = SURVIVAL_DATA.articles.find(a => a.id === articleId);
    if (!article) return;
    // Find and highlight the corresponding nav items
    const navItems = dom.navTree.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const cat = SURVIVAL_DATA.categories.find(c => {
        const sub = c.subcategories.find(s => {
          const articles = getArticlesBySubcategory(c.id, s.id);
          return articles.some(a => a.id === articleId);
        });
        return !!sub;
      });
      if (cat && item.textContent.includes(article.title.substring(0, 5))) {
        item.classList.add('active');
      }
    });
  }

  function clearNavHighlight() {
    dom.navTree.querySelectorAll('.nav-item.active').forEach(el => el.classList.remove('active'));
  }

  // --- 收藏功能 ---
  function toggleFavorite(articleId) {
    if (state.favorites.has(articleId)) {
      state.favorites.delete(articleId);
    } else {
      state.favorites.add(articleId);
    }
    saveState();
    updateFavCount();

    // Update button if on article page
    const btn = $('#toggleFav');
    if (btn) {
      const isFav = state.favorites.has(articleId);
      btn.className = 'btn-action' + (isFav ? ' fav-active' : '');
      btn.textContent = isFav ? '⭐ 已收藏' : '☆ 收藏';
    }

    // Refresh favorites page if open
    if (state.currentView === 'favorites') {
      renderFavorites();
    }
  }

  function updateFavCount() {
    dom.favCount.textContent = state.favorites.size;
  }

  function renderFavorites() {
    state.currentView = 'favorites';
    dom.welcomePage.style.display = 'none';
    dom.articlePage.style.display = 'none';
    dom.checklistPage.style.display = 'none';
    dom.favoritesPage.style.display = 'block';

    const favArticles = [...state.favorites]
      .map(id => SURVIVAL_DATA.articles.find(a => a.id === id))
      .filter(Boolean);

    if (favArticles.length === 0) {
      dom.favoritesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>还没有收藏任何文章</p>
          <p style="font-size:12px;color:var(--text-muted);">浏览文章时点击"收藏"按钮即可添加到此处</p>
        </div>
      `;
      return;
    }

    dom.favoritesList.innerHTML = favArticles.map(a => {
      const cat = SURVIVAL_DATA.categories.find(c => c.id === a.category);
      return `
        <div class="fav-item" data-id="${a.id}">
          <div>
            <div class="fi-title">${a.title}</div>
            <div class="fi-cat">${cat ? cat.icon + ' ' + cat.name : ''}</div>
          </div>
          <button class="fi-remove" data-id="${a.id}" title="取消收藏">✕</button>
        </div>
      `;
    }).join('');

    dom.favoritesList.querySelectorAll('.fav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('fi-remove')) {
          showArticle(item.dataset.id);
        }
      });
    });
    dom.favoritesList.querySelectorAll('.fi-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(btn.dataset.id);
        renderFavorites();
      });
    });
  }

  // --- 生存清单数据（单一来源）---
  const CHECKLIST_DATA = [
    { cat: '水源', items: [
      { id: 'cl-water-1', name: '瓶装水（每人每天至少2L）', qty: '4L/人/天×3天' },
      { id: 'cl-water-2', name: '便携滤水器', qty: '1个/人' },
      { id: 'cl-water-3', name: '净水片/漂白水', qty: '1瓶' },
      { id: 'cl-water-4', name: '储水容器（大桶）', qty: '2-4个' },
      { id: 'cl-water-5', name: '折叠水袋', qty: '2个' }
    ]},
    { cat: '食物', items: [
      { id: 'cl-food-1', name: '压缩饼干/能量棒', qty: '3000cal/人' },
      { id: 'cl-food-2', name: '冻干食品/方便面', qty: '3天量' },
      { id: 'cl-food-3', name: '盐和糖', qty: '各500g' },
      { id: 'cl-food-4', name: '复合维生素', qty: '1瓶' },
      { id: 'cl-food-5', name: '炊具+固体酒精炉', qty: '1套' }
    ]},
    { cat: '庇护与保暖', items: [
      { id: 'cl-shelter-1', name: '帐篷/防水布', qty: '1顶/块' },
      { id: 'cl-shelter-2', name: '睡袋/保暖毯', qty: '1个/人' },
      { id: 'cl-shelter-3', name: '急救毯（银色）', qty: '2条/人' },
      { id: 'cl-shelter-4', name: '雨衣/雨披', qty: '1件/人' },
      { id: 'cl-shelter-5', name: '换洗衣物+袜子', qty: '1套/人' }
    ]},
    { cat: '火源与照明', items: [
      { id: 'cl-fire-1', name: '打火机（Bic型）', qty: '3个' },
      { id: 'cl-fire-2', name: '铁铈打火棒', qty: '1根' },
      { id: 'cl-fire-3', name: '防水火柴', qty: '2盒' },
      { id: 'cl-fire-4', name: '头灯+备用电池', qty: '1个/人' },
      { id: 'cl-fire-5', name: '蜡烛/荧光棒', qty: '若干' }
    ]},
    { cat: '急救与卫生', items: [
      { id: 'cl-med-1', name: '急救包（IFAK级）', qty: '1个/人' },
      { id: 'cl-med-2', name: '常用药品（退热/止痛/抗过敏）', qty: '1套' },
      { id: 'cl-med-3', name: '处方药（个人特殊需求）', qty: '30天量' },
      { id: 'cl-med-4', name: '卫生用品（肥皂/卫生纸/湿巾）', qty: '1套' },
      { id: 'cl-med-5', name: 'N95口罩', qty: '5个/人' }
    ]},
    { cat: '工具与装备', items: [
      { id: 'cl-tool-1', name: '生存刀（全龙骨）', qty: '1把/人' },
      { id: 'cl-tool-2', name: '多功能工具钳', qty: '1把' },
      { id: 'cl-tool-3', name: '折叠锯/斧头', qty: '1把' },
      { id: 'cl-tool-4', name: '550伞绳', qty: '20m' },
      { id: 'cl-tool-5', name: '工兵铲', qty: '1把' }
    ]},
    { cat: '导航与通讯', items: [
      { id: 'cl-nav-1', name: '指北针', qty: '1个' },
      { id: 'cl-nav-2', name: '当地地图（纸质）', qty: '1份' },
      { id: 'cl-nav-3', name: '对讲机+备用电池', qty: '2台' },
      { id: 'cl-nav-4', name: '应急收音机（手摇发电）', qty: '1台' },
      { id: 'cl-nav-5', name: '手机+充电宝+太阳能充电器', qty: '1套' }
    ]},
    { cat: '重要文件与资金', items: [
      { id: 'cl-doc-1', name: '身份证件复印件（密封防水）', qty: '1份/人' },
      { id: 'cl-doc-2', name: '现金（小面额）', qty: '若干' },
      { id: 'cl-doc-3', name: '应急计划书+联络方式', qty: '1份' },
      { id: 'cl-doc-4', name: '家人照片', qty: '1张' }
    ]},
    { cat: '特殊物品', items: [
      { id: 'cl-special-1', name: '武器/防身工具', qty: '1件/成人' },
      { id: 'cl-special-2', name: '防毒面具+滤毒罐', qty: '1套/人' },
      { id: 'cl-special-3', name: '碘化钾片（核辐射）', qty: '1瓶' },
      { id: 'cl-special-4', name: '开锁工具/撬棍', qty: '1套' },
      { id: 'cl-special-5', name: '钓鱼工具', qty: '1套' }
    ]}
  ];

  function initChecklist() {
    if (Object.keys(state.checklistItems).length > 0) return;
    CHECKLIST_DATA.forEach(group => {
      group.items.forEach(item => {
        state.checklistItems[item.id] = false;
      });
    });
    saveState();
  }

  function renderChecklist() {
    state.currentView = 'checklist';
    dom.welcomePage.style.display = 'none';
    dom.articlePage.style.display = 'none';
    dom.favoritesPage.style.display = 'none';
    dom.checklistPage.style.display = 'block';

    initChecklist();

    let html = '';
    CHECKLIST_DATA.forEach(group => {
      html += `<div class="checklist-category"><h3>${group.cat}</h3>`;
      group.items.forEach(item => {
        const checked = state.checklistItems[item.id] || false;
        html += `
          <div class="checklist-item ${checked ? 'checked' : ''}" data-id="${item.id}">
            <div class="cli-check"></div>
            <div class="cli-info">
              <div class="cli-name">${item.name}</div>
              <div class="cli-detail">${item.qty}</div>
            </div>
            <div class="cli-qty">${item.qty}</div>
          </div>
        `;
      });
      html += '</div>';
    });

    dom.checklistContent.innerHTML = html;

    // Bind checkbox clicks
    dom.checklistContent.querySelectorAll('.checklist-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        state.checklistItems[id] = !state.checklistItems[id];
        item.classList.toggle('checked');
        saveState();
      });
    });
  }

  // --- 搜索配置 ---
  let searchTimeout;

  function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<span class="search-highlight">$1</span>');
  }

  // --- 计算器模态框 ---
  function showCalculator() {
    dom.calcModal.classList.add('active');
    // Use the renderCalculator function from calc.js
    if (typeof renderCalculator === 'function') {
      dom.calcBody.innerHTML = renderCalculator();
      bindCalculatorEvents();
    }
  }

  function hideCalculator() {
    dom.calcModal.classList.remove('active');
  }

  function bindCalculatorEvents() {
    // Water calculator
    ['calcPeople', 'calcDays', 'calcActivity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calcWater);
    });

    // Food calculator
    ['calcFoodPeople', 'calcFoodDays', 'calcFoodLevel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calcFood);
    });

    // Radiation calculator
    ['calcRadDose', 'calcRadTime'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calcRadiation);
    });

    // BOB weight calculator
    ['calcBobBase', 'calcBobWater', 'calcBobFood', 'calcBobGear', 'calcBobWeapon', 'calcBobExtra'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calcBob);
    });

    // Fuel calculator
    ['calcFuelDevice', 'calcFuelHours'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calcFuel);
    });

    // Initial calculations
    calcWater();
    calcFood();
    calcRadiation();
    calcBob();
    calcFuel();
  }

  // ==================== 物资资料库视图 ====================
  function showResources() {
    state.currentView = 'resources';
    state.resourcePage = 1;
    hideAllViews();
    dom.resourcesPage.style.display = 'block';
    renderResources();
  }

  function hideAllViews() {
    dom.welcomePage.style.display = 'none';
    dom.articlePage.style.display = 'none';
    dom.favoritesPage.style.display = 'none';
    dom.checklistPage.style.display = 'none';
    dom.resourcesPage.style.display = 'none';
    dom.plannerPage.style.display = 'none';
    dom.advisorPage.style.display = 'none';
  }

  function renderResources() {
    if (!window.RESOURCE_DB) { dom.resourcesContent.innerHTML = '<p class="no-results">物资库加载失败</p>'; return; }

    const cats = RESOURCE_DB.categories;
    let items = RESOURCE_DB.items;

    // Filter
    if (state.resourceFilter !== 'all') {
      items = items.filter(i => i.category === state.resourceFilter);
    }

    // Sort — operate on a copy to avoid mutating the original
    const sorted = items.slice();
    if (state.resourceSort === 'rating') sorted.sort((a,b) => b.rating - a.rating);
    else if (state.resourceSort === 'price-low') sorted.sort((a,b) => (a.priceLevel==='低'?-1:a.priceLevel==='中'?0:1) - (b.priceLevel==='低'?-1:b.priceLevel==='中'?0:1));
    else if (state.resourceSort === 'name') sorted.sort((a,b) => a.name.localeCompare(b.name, 'zh'));

    // Pagination
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / state.resourcePageSize);
    // Clamp current page
    if (state.resourcePage > totalPages) state.resourcePage = totalPages;
    if (state.resourcePage < 1) state.resourcePage = 1;
    const startIdx = (state.resourcePage - 1) * state.resourcePageSize;
    const pageItems = sorted.slice(startIdx, startIdx + state.resourcePageSize);

    // Category counts (cached in RESOURCE_DB after first call)
    const catCounts = RESOURCE_DB.getCountByCategory();

    function paginationHTML() {
      if (totalPages <= 1) return '';
      let html = '<div class="resource-pagination"><span class="rp-label">页码:</span>';
      // Prev
      html += `<button class="rp-btn rp-prev" data-page="${state.resourcePage - 1}" ${state.resourcePage <= 1 ? 'disabled' : ''}>◀ 上一页</button>`;
      // Page numbers (show limited range)
      const maxShow = 7;
      let pStart = Math.max(1, state.resourcePage - 3);
      let pEnd = Math.min(totalPages, pStart + maxShow - 1);
      if (pEnd - pStart < maxShow - 1) pStart = Math.max(1, pEnd - maxShow + 1);
      if (pStart > 1) html += `<button class="rp-btn rp-num" data-page="1">1</button><span class="rp-ellipsis">…</span>`;
      for (let i = pStart; i <= pEnd; i++) {
        html += `<button class="rp-btn rp-num ${i === state.resourcePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      if (pEnd < totalPages) html += `<span class="rp-ellipsis">…</span><button class="rp-btn rp-num" data-page="${totalPages}">${totalPages}</button>`;
      // Next
      html += `<button class="rp-btn rp-next" data-page="${state.resourcePage + 1}" ${state.resourcePage >= totalPages ? 'disabled' : ''}>下一页 ▶</button>`;
      html += `<span class="rp-info">共 ${totalItems} 件 / ${totalPages} 页 (每页${state.resourcePageSize}件)</span></div>`;
      return html;
    }

    dom.resourcesContent.innerHTML = `
      <div class="resources-header">
        <h2>📦 生存物资资料库</h2>
        <p>${RESOURCE_DB.items.length}种装备 | 详细规格 | 优缺点 | 替代品 | 对比模式</p>
        <div class="resources-toolbar">
          <div class="resource-filters">
            <button class="rf-chip ${state.resourceFilter==='all'?'active':''}" data-cat="all">全部 (${RESOURCE_DB.items.length})</button>
            ${cats.map(c => `
              <button class="rf-chip ${state.resourceFilter===c.id?'active':''}" data-cat="${c.id}">${c.icon} ${c.name} (${catCounts[c.id]||0})</button>
            `).join('')}
          </div>
          <div class="resource-sort">
            <select id="resourceSort">
              <option value="rating" ${state.resourceSort==='rating'?'selected':''}>按评分</option>
              <option value="price-low" ${state.resourceSort==='price-low'?'selected':''}>按价格(低→高)</option>
              <option value="name" ${state.resourceSort==='name'?'selected':''}>按名称</option>
            </select>
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px;">🔄 点击物品加入对比 (最多4个)</span>
          </div>
        </div>
      </div>
      ${paginationHTML()}
      <div class="resources-grid" id="resourcesGrid">
        ${pageItems.map(item => {
          const cat = cats.find(c => c.id === item.category);
          const stars = '★'.repeat(item.rating) + '☆'.repeat(5-item.rating);
          const inCompare = state.compareItems.includes(item.id);
          return `
            <div class="resource-card ${inCompare ? 'in-compare' : ''}" data-id="${item.id}">
              <div class="rc-header">
                <span class="rc-type">${item.type || ''}</span>
                <span class="rc-compare-add" data-id="${item.id}">${inCompare ? '✓ 已加入对比' : '+ 对比'}</span>
              </div>
              <div class="rc-name">${item.name}</div>
              <div class="rc-cat">${cat ? cat.icon + ' ' + cat.name : ''}</div>
              <div class="rc-rating">${stars}</div>
              <div class="rc-specs">
                ${Object.entries(item.specs).slice(0, 4).map(([k,v]) => `<span class="rc-spec"><strong>${k}:</strong> ${v}</span>`).join('')}
              </div>
              <div class="rc-price">${item.priceRange || item.priceLevel}</div>
              <div class="rc-actions">
                <button class="btn-action rc-detail-btn" data-id="${item.id}">📋 详情</button>
                <button class="btn-action rc-compare-btn" data-id="${item.id}">🔄 ${inCompare ? '移出对比' : '加入对比'}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ${paginationHTML()}
    `;

    // === Event delegation: ONE listener on .resources-content handles ALL card clicks ===
    // (removed only on re-render to avoid duplicate listeners)
    // The delegation listener is bound once in bindEvents() — see below.

    // Bind filter chips (still per-element, but few of them ~20, acceptable)
    dom.resourcesContent.querySelectorAll('.rf-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.resourceFilter = chip.dataset.cat;
        state.resourcePage = 1; // Reset to page 1 on filter change
        renderResources();
      });
    });

    // Bind sort
    const sortEl = dom.resourcesContent.querySelector('#resourceSort');
    if (sortEl) sortEl.addEventListener('change', () => { state.resourceSort = sortEl.value; state.resourcePage = 1; renderResources(); });

    // Bind pagination buttons
    dom.resourcesContent.querySelectorAll('.rp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= totalPages) {
          state.resourcePage = page;
          renderResources();
          // Scroll to top of grid
          const grid = dom.resourcesContent.querySelector('#resourcesGrid');
          if (grid) grid.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });

    updateComparePanel();
  }

  function showResourceDetail(itemId) {
    const item = RESOURCE_DB.items.find(i => i.id === itemId);
    if (!item) return;
    const cat = RESOURCE_DB.categories.find(c => c.id === item.category);
    const stars = '★'.repeat(item.rating) + '☆'.repeat(5-item.rating);

    dom.resourceModalTitle.textContent = (cat ? cat.icon + ' ' : '') + item.name;
    dom.resourceModalBody.innerHTML = `
      <div class="resource-detail">
        <div class="rd-header">
          <span class="rd-type">${item.type || ''}</span>
          <span class="rd-rating">${stars}</span>
          <span class="rd-price">${item.priceRange || item.priceLevel}</span>
        </div>
        <div class="rd-section">
          <h4>📋 规格参数</h4>
          <table class="plan-table">
            ${Object.entries(item.specs).map(([k,v]) => `<tr><td><strong>${k}</strong></td><td>${v}</td></tr>`).join('')}
          </table>
        </div>
        <div class="rd-section">
          <h4>✅ 优点</h4>
          <ul>${item.pros.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        <div class="rd-section">
          <h4>⚠️ 缺点</h4>
          <ul>${item.cons.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="rd-section">
          <h4>🔄 替代品</h4>
          <div class="rd-alts">${item.alternatives.map(a => `<span class="rd-alt">${a}</span>`).join('')}</div>
        </div>
        ${item.review ? `<div class="rd-section"><h4>📝 详细评测</h4><p>${item.review}</p></div>` : ''}
        <div class="rd-actions">
          <button class="btn-action" onclick="document.getElementById('resourceModal').classList.remove('active')">关闭</button>
          <button class="btn-action" id="rdCompareBtn" data-id="${item.id}">🔄 ${state.compareItems.includes(item.id) ? '移出对比' : '加入对比'}</button>
        </div>
      </div>
    `;
    dom.resourceModal.classList.add('active');

    const rdBtn = document.getElementById('rdCompareBtn');
    if (rdBtn) rdBtn.addEventListener('click', () => { toggleCompare(itemId); dom.resourceModal.classList.remove('active'); renderResources(); });
  }

  function toggleCompare(itemId) {
    const idx = state.compareItems.indexOf(itemId);
    if (idx >= 0) {
      state.compareItems.splice(idx, 1);
    } else if (state.compareItems.length < 4) {
      state.compareItems.push(itemId);
    } else {
      alert('最多同时对比4件物品');
    }
    updateComparePanel();
  }

  function updateComparePanel() {
    if (state.compareItems.length === 0) {
      dom.comparePanel.style.display = 'none';
      return;
    }
    dom.comparePanel.style.display = 'block';
    dom.compareCount.textContent = state.compareItems.length;
    dom.compareItems.innerHTML = state.compareItems.map(id => {
      const item = RESOURCE_DB.items.find(i => i.id === id);
      if (!item) return '';
      return `<div class="compare-mini-card">
        <strong>${item.name}</strong>
        <span style="color:var(--text-muted);font-size:11px;">★${item.rating} ${item.priceRange||''}</span>
        <button class="fi-remove" data-id="${id}">✕</button>
      </div>`;
    }).join('') + (state.compareItems.length >= 2 ? `<button class="btn-action" id="doCompare" style="margin-left:8px;">📊 开始对比</button>` : '');

    dom.compareItems.querySelectorAll('.fi-remove').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleCompare(btn.dataset.id); renderResources(); });
    });
    const doCmp = document.getElementById('doCompare');
    if (doCmp) doCmp.addEventListener('click', showCompareView);
  }

  function showCompareView() {
    const items = state.compareItems.map(id => RESOURCE_DB.items.find(i => i.id === id)).filter(Boolean);
    if (items.length < 2) return;

    dom.resourceModalTitle.textContent = '📊 物资对比';
    const allSpecKeys = [...new Set(items.flatMap(i => Object.keys(i.specs)))];
    dom.resourceModalBody.innerHTML = `
      <div class="compare-view">
        <table class="plan-table">
          <tr>
            <th>属性</th>
            ${items.map(i => `<th>${i.name}</th>`).join('')}
          </tr>
          <tr><td><strong>评分</strong></td>${items.map(i => `<td>${'★'.repeat(i.rating)}${'☆'.repeat(5-i.rating)}</td>`).join('')}</tr>
          <tr><td><strong>类型</strong></td>${items.map(i => `<td>${i.type||'-'}</td>`).join('')}</tr>
          <tr><td><strong>价格</strong></td>${items.map(i => `<td>${i.priceRange||i.priceLevel}</td>`).join('')}</tr>
          ${allSpecKeys.map(k => `
            <tr><td><strong>${k}</strong></td>${items.map(i => `<td>${i.specs[k]||'-'}</td>`).join('')}</tr>
          `).join('')}
          <tr><td><strong>优点</strong></td>${items.map(i => `<td>${i.pros.slice(0,3).join('<br>')}</td>`).join('')}</tr>
          <tr><td><strong>缺点</strong></td>${items.map(i => `<td>${i.cons.slice(0,3).join('<br>')}</td>`).join('')}</tr>
        </table>
      </div>
    `;
    dom.resourceModal.classList.add('active');
  }

  // --- 智能推荐引擎视图 ---
  function showAdvisor() {
    state.currentView = 'advisor';
    hideAllViews();
    dom.advisorPage.style.display = 'block';
    renderAdvisor();
  }

  function renderAdvisor() {
    if (!window.SURVIVAL_ADVISOR) { dom.advisorContent.innerHTML = '<p class="no-results">推荐引擎加载失败</p>'; return; }
    dom.advisorContent.innerHTML = `
      <div class="advisor-header">
        <h2>🧠 智能生存方案推荐</h2>
        <p>输入你的预算、人数、威胁类型和地理位置，系统自动生成最优生存方案</p>
      </div>
      <div class="advisor-form" id="advisorForm">
        <div class="af-row">
          <div class="af-field">
            <label>💰 总预算</label>
            <select id="advBudget">
              <option value="5000">¥5,000 (基础应急)</option>
              <option value="20000">¥20,000 (基本准备)</option>
              <option value="50000" selected>¥50,000 (标准准备)</option>
              <option value="100000">¥100,000 (充分准备)</option>
              <option value="200000">¥200,000 (全面准备)</option>
              <option value="999999">不计成本 (最强防护)</option>
            </select>
          </div>
          <div class="af-field">
            <label>👥 团队人数</label>
            <input type="number" id="advPeople" value="4" min="1" max="50">
          </div>
          <div class="af-field">
            <label>⏱️ 准备时间</label>
            <select id="advPrepTime">
              <option value="1week">紧急 (1周)</option>
              <option value="1month">短期 (1个月)</option>
              <option value="6months" selected>中期 (6个月)</option>
              <option value="2years">长期 (2年+)</option>
            </select>
          </div>
        </div>
        <div class="af-row">
          <div class="af-field af-full">
            <label>⚠️ 主要威胁（可多选）</label>
            <div class="threat-chips" id="advThreats">
              <label class="threat-chip active"><input type="checkbox" value="nuclear" hidden checked>☢️ 核战争</label>
              <label class="threat-chip"><input type="checkbox" value="bio" hidden>🦠 生物疫情</label>
              <label class="threat-chip"><input type="checkbox" value="chem" hidden>⚗️ 化学泄漏</label>
              <label class="threat-chip"><input type="checkbox" value="natural" hidden>🌋 自然灾害</label>
              <label class="threat-chip active"><input type="checkbox" value="civil" hidden checked>💥 社会崩溃</label>
            </div>
          </div>
        </div>
        <div class="af-row">
          <div class="af-field">
            <label>📍 地理位置</label>
            <select id="advLocation">
              <option value="suburb" selected>郊区</option>
              <option value="urban">城市</option>
              <option value="rural">乡村</option>
              <option value="mountain">山区</option>
              <option value="coastal">沿海</option>
            </select>
          </div>
          <div class="af-field">
            <label>📐 可用面积</label>
            <select id="advSpace">
              <option value="50">50 m² (小型)</option>
              <option value="100" selected>100 m² (中型)</option>
              <option value="200">200 m² (大型)</option>
              <option value="500">500 m² (超大型)</option>
            </select>
          </div>
        </div>
        <button class="pn-btn primary" id="advGenerate" style="width:100%;padding:14px;font-size:16px;margin-top:12px;">🔮 生成推荐方案</button>
      </div>
      <div id="advisorResult"></div>
    `;

    // Bind events
    document.querySelectorAll('#advThreats .threat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cb = chip.querySelector('input');
        cb.checked = !cb.checked;
        chip.classList.toggle('active', cb.checked);
      });
    });

    document.getElementById('advGenerate').addEventListener('click', () => {
      const params = {
        budget: parseInt(document.getElementById('advBudget').value),
        people: parseInt(document.getElementById('advPeople').value),
        threats: [...document.querySelectorAll('#advThreats input:checked')].map(cb => cb.value),
        location: document.getElementById('advLocation').value,
        space: parseInt(document.getElementById('advSpace').value),
        prepTime: document.getElementById('advPrepTime').value
      };
      if (params.threats.length === 0) { alert('请至少选择一个威胁类型'); return; }
      const plan = SURVIVAL_ADVISOR.generatePlan(params);
      renderAdvisorResult(plan, params);
    });
  }

  function renderAdvisorResult(plan, params) {
    const budgetNames = {5000:'¥5K基础应急',20000:'¥2W基本准备',50000:'¥5W标准',100000:'¥10W充分',200000:'¥20W全面',999999:'不计成本'};
    const locNames = {urban:'城市',suburb:'郊区',rural:'乡村',mountain:'山区',coastal:'沿海'};
    const prepNames = {'1week':'1周紧急','1month':'1个月短期','6months':'6个月中期','2years':'2年+长期'};

    let html = '<div class="advisor-result">';
    html += '<div class="ar-summary">';
    html += `<div class="plan-summary-card"><div class="psc-icon">${plan.shelter.icon}</div><div class="psc-detail"><strong>推荐方案</strong>: ${plan.shelter.name} | ${params.people}人 | ${budgetNames[params.budget]} | ${locNames[params.location]} | ${prepNames[params.prepTime]}<br>预估总花费: <strong style="color:var(--accent);">¥${plan.totalEstimate.toLocaleString()}</strong></div></div>`;
    html += '</div>';

    // Warnings
    if (plan.warnings.length > 0) {
      html += '<div class="ar-warnings">' + plan.warnings.map(w => `<div class="ar-warning">${w}</div>`).join('') + '</div>';
    }

    // Budget allocation
    html += '<div class="ar-allocations"><h3>💰 预算分配建议</h3><div class="alloc-bars">';
    Object.entries(plan.allocations).forEach(([k, v]) => {
      const names = {water:'💧水源',food:'🍖食物',shelter:'🏠庇护所',medical:'🏥医疗',energy:'⚡能源',defense:'🛡️防御',comms:'📡通讯',tools:'🧰工具'};
      html += `<div class="alloc-bar"><span>${names[k]||k}</span><div class="ab-track"><div class="ab-fill" style="width:${v*100}%"></div></div><span>${(v*100).toFixed(0)}%</span></div>`;
    });
    html += '</div></div>';

    // Phases
    plan.phases.forEach(phase => {
      html += `<div class="ar-phase" style="border-left:3px solid ${phase.color}">`;
      html += `<h3 style="color:${phase.color}">${phase.name} — ${phase.focus}</h3>`;
      html += `<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">执行时间: ${phase.days}天 | 预估花费: ¥${phase.estimatedCost.toLocaleString()}</p>`;
      html += '<table class="plan-table"><tr><th>物品</th><th>数量</th><th>类别</th><th>优先级</th><th>操作</th></tr>';
      phase.items.forEach(item => {
        const catNames = {water:'💧',food:'🍖',shelter:'🏠',medical:'🏥',energy:'⚡',defense:'🛡️',comms:'📡',tools:'🧰'};
        html += `<tr>
          <td>${item.name}${item.note ? '<br><small style="color:var(--text-muted)">'+item.note+'</small>' : ''}</td>
          <td>${item.qty}</td>
          <td>${catNames[item.cat]||''} ${item.cat}</td>
          <td>${item.essential ? '🔴 必需' : '🟡 推荐'}</td>
          <td>${item.resourceId ? '<button class="btn-action goto-resource" data-id="'+item.resourceId+'">📋 查看详情</button>' : '-'}</td>
        </tr>`;
      });
      html += '</table></div>';
    });

    html += '<div style="display:flex;gap:8px;margin-top:16px;"><button class="pn-btn secondary" id="advRestart">🔄 重新输入</button><button class="pn-btn primary" onclick="window.print()">🖨️ 打印方案</button></div>';
    html += '</div>';

    document.getElementById('advisorResult').innerHTML = html;

    // Bind resource links
    document.querySelectorAll('.goto-resource').forEach(btn => {
      btn.addEventListener('click', () => {
        showResources();
        setTimeout(() => showResourceDetail(btn.dataset.id), 150);
      });
    });

    document.getElementById('advRestart').addEventListener('click', renderAdvisor);
    document.getElementById('advisorResult').scrollIntoView({behavior:'smooth'});
  }
  function showPlanner() {
    state.currentView = 'planner';
    hideAllViews();
    dom.plannerPage.style.display = 'block';
    if (window.SHELTER_PLANNER) {
      SHELTER_PLANNER.init();
    }
  }

  // --- 扩展搜索（包含物资库）---
  function performSearch(query) {
    query = query.trim().toLowerCase();
    if (!query || query.length < 2) {
      dom.searchResults.classList.remove('active');
      return;
    }
    state.searchQuery = query;

    // Search articles
    const articleResults = SURVIVAL_DATA.articles.map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const contentText = article.content.replace(/<[^>]*>/g, '').toLowerCase();
      if (titleLower.includes(query)) score += 100;
      article.tags.forEach(tag => { if (tag.toLowerCase().includes(query)) score += 50; });
      const matches = (contentText.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      score += Math.min(matches * 5, 50);
      if (score > 0) {
        const idx = contentText.indexOf(query);
        let snippet = '';
        if (idx >= 0) {
          const start = Math.max(0, idx - 25);
          const end = Math.min(contentText.length, idx + query.length + 40);
          snippet = (start > 0 ? '...' : '') + contentText.substring(start, end) + (end < contentText.length ? '...' : '');
        }
        return { type: 'article', article, score, snippet };
      }
      return null;
    }).filter(Boolean);

    // Search resources
    const resourceResults = (window.RESOURCE_DB ? RESOURCE_DB.items : []).map(item => {
      let score = 0;
      if (item.name.toLowerCase().includes(query)) score += 80;
      if (item.type && item.type.toLowerCase().includes(query)) score += 40;
      if (item.review && item.review.toLowerCase().includes(query)) score += 20;
      if (score > 0) {
        const cat = RESOURCE_DB.categories.find(c => c.id === item.category);
        return { type: 'resource', item, score, catName: cat ? cat.name : '' };
      }
      return null;
    }).filter(Boolean);

    const allResults = [...articleResults, ...resourceResults].sort((a,b) => b.score - a.score).slice(0, 20);

    if (allResults.length === 0) {
      dom.searchResults.innerHTML = '<div class="no-results">未找到相关内容，请尝试其他关键词</div>';
    } else {
      dom.searchResults.innerHTML = allResults.map(r => {
        if (r.type === 'article') {
          const cat = SURVIVAL_DATA.categories.find(c => c.id === r.article.category);
          return `
            <div class="search-result-item" data-type="article" data-id="${r.article.id}">
              <div class="sr-title">📄 ${highlightMatch(r.article.title, query)}</div>
              <div class="sr-category">${cat ? cat.icon + ' ' + cat.name : ''}</div>
              <div class="sr-snippet">${highlightMatch(r.snippet, query)}</div>
            </div>`;
        } else {
          return `
            <div class="search-result-item" data-type="resource" data-id="${r.item.id}">
              <div class="sr-title">📦 ${highlightMatch(r.item.name, query)} <span style="font-size:10px;color:var(--accent);">[物资]</span></div>
              <div class="sr-category">${r.catName} | ★${r.item.rating} | ${r.item.priceRange||''}</div>
            </div>`;
        }
      }).join('');

      dom.searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          if (item.dataset.type === 'article') {
            showArticle(item.dataset.id);
          } else {
            showResources();
            setTimeout(() => showResourceDetail(item.dataset.id), 100);
          }
          dom.searchResults.classList.remove('active');
          dom.searchInput.value = '';
          closeMobileMenu();
        });
      });
    }
    dom.searchResults.classList.add('active');
  }

  // --- 事件绑定 ---
  function bindEvents() {
    // Search
    dom.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => performSearch(dom.searchInput.value), 200);
    });
    dom.searchInput.addEventListener('focus', () => {
      if (dom.searchInput.value.length >= 2) {
        performSearch(dom.searchInput.value);
      }
    });
    dom.searchBtn.addEventListener('click', () => performSearch(dom.searchInput.value));

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        dom.searchResults.classList.remove('active');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // '/' to focus search
      if (e.key === '/' && !e.target.closest('input, textarea')) {
        e.preventDefault();
        dom.searchInput.focus();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        hideCalculator();
        dom.searchResults.classList.remove('active');
        closeMobileMenu();
      }
    });

    // Header buttons
    dom.advisorBtn.addEventListener('click', showAdvisor);
    dom.resourcesBtn.addEventListener('click', showResources);
    dom.plannerBtn.addEventListener('click', showPlanner);
    dom.favBtn.addEventListener('click', renderFavorites);
    dom.calcBtn.addEventListener('click', showCalculator);
    dom.printBtn.addEventListener('click', () => window.print());

    // Resource modal close
    dom.resourceModalClose.addEventListener('click', () => dom.resourceModal.classList.remove('active'));
    dom.resourceModal.addEventListener('click', (e) => {
      if (e.target === dom.resourceModal) dom.resourceModal.classList.remove('active');
    });

    // Compare panel
    dom.compareClear.addEventListener('click', () => { state.compareItems = []; updateComparePanel(); renderResources(); });
    dom.compareToggle.addEventListener('click', () => {
      const panel = dom.comparePanel;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // === Event delegation for resource cards (ONE listener for thousands of cards) ===
    dom.resourcesContent.addEventListener('click', (e) => {
      // Detail button
      const detailBtn = e.target.closest('.rc-detail-btn');
      if (detailBtn) {
        e.stopPropagation();
        showResourceDetail(detailBtn.dataset.id);
        return;
      }
      // Compare button / compare add
      const compareBtn = e.target.closest('.rc-compare-btn, .rc-compare-add');
      if (compareBtn) {
        e.stopPropagation();
        toggleCompare(compareBtn.dataset.id);
        renderResources();
        return;
      }
      // Card click → detail (but not if clicking a button)
      const card = e.target.closest('.resource-card');
      if (card && !e.target.closest('button')) {
        showResourceDetail(card.dataset.id);
      }
    });

    // Calculator modal close
    dom.calcClose.addEventListener('click', hideCalculator);
    dom.calcModal.addEventListener('click', (e) => {
      if (e.target === dom.calcModal) hideCalculator();
    });

    // Mobile menu
    dom.menuToggle.addEventListener('click', toggleMobileMenu);
    dom.sidebarOverlay.addEventListener('click', closeMobileMenu);

    // Sidebar
    dom.collapseAll.addEventListener('click', () => {
      state.expandedCategories.clear();
      saveState();
      renderNavTree();
    });

    dom.showFavorites.addEventListener('click', renderFavorites);
    dom.showChecklist.addEventListener('click', renderChecklist);

    // Back to top
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        dom.backToTop.classList.add('visible');
      } else {
        dom.backToTop.classList.remove('visible');
      }
    });
    dom.backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Hash change
    window.addEventListener('hashchange', handleHashChange);
  }

  function toggleMobileMenu() {
    state.isMobileMenuOpen = !state.isMobileMenuOpen;
    if (state.isMobileMenuOpen) {
      dom.sidebar.classList.add('open');
      dom.sidebarOverlay.classList.add('active');
    } else {
      closeMobileMenu();
    }
  }

  function closeMobileMenu() {
    state.isMobileMenuOpen = false;
    dom.sidebar.classList.remove('open');
    dom.sidebarOverlay.classList.remove('active');
  }

  function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith('article=')) {
      const articleId = hash.replace('article=', '');
      showArticle(articleId);
    }
  }

  // --- 辅助函数 ---
  function getArticlesByCategory(catId) {
    return SURVIVAL_DATA.articles.filter(a => a.category === catId);
  }

  function getArticlesBySubcategory(catId, subId) {
    return SURVIVAL_DATA.articles.filter(a => a.category === catId && a.subcategory === subId);
  }

  // --- 启动 ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
