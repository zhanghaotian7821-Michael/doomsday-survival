// ============================================
// 主题切换：wasteland（默认） / pipboy
// 独立成文件，不侵入 app.js
// ============================================
(function () {
  'use strict';
  const KEY = 'prepper_theme';
  const DEFAULT = 'wasteland';
  const root = document.documentElement;

  const apply = (t) => root.setAttribute('data-theme', t);

  // 尽早应用，避免首屏闪色
  apply(localStorage.getItem(KEY) || DEFAULT);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    const sync = () => {
      const pip = root.getAttribute('data-theme') === 'pipboy';
      btn.textContent = pip ? '☢' : '⬤';
      btn.setAttribute('aria-label', pip ? '切换到废土配色' : '切换到 Pip-Boy 配色');
      btn.title = pip ? '当前：Pip-Boy 磷光绿' : '当前：废土琥珀';
    };
    sync();
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'pipboy' ? 'wasteland' : 'pipboy';
      apply(next);
      localStorage.setItem(KEY, next);
      sync();
    });
  });
})();
