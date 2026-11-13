#!/usr/bin/env node
/**
 * 数据完整性门禁：id 唯一 / 分类与子类必须存在 / related 必须指向真实文章 / 计分字段范围 / 必填文本
 * 用法: node scripts/validate-data.mjs    （有错时退出码 1，可直接进 CI）
 */
import { loadSurvivalData } from './load-data.mjs';

export function validateData(data) {
  const errors = [];
  const articles = data.articles || [];
  const cats = data.categories || [];

  const catIds = new Set(cats.map(c => c.id));
  const subIds = new Set();
  for (const c of cats) for (const s of c.subcategories || []) subIds.add(`${c.id}/${s.id}`);

  const seen = new Map();
  for (const a of articles) {
    if (seen.has(a.id)) errors.push(`duplicate-id: ${a.id}`);
    seen.set(a.id, true);
  }
  const idSet = new Set(articles.map(a => a.id));

  for (const a of articles) {
    const where = `article:${a.id}`;
    if (!catIds.has(a.category)) errors.push(`bad-category: ${where} -> ${a.category}`);
    if (!subIds.has(`${a.category}/${a.subcategory}`)) {
      errors.push(`bad-subcategory: ${where} -> ${a.category}/${a.subcategory}`);
    }
    if (!a.title || !String(a.title).trim()) errors.push(`empty-title: ${where}`);
    if (!Array.isArray(a.tags) || a.tags.length === 0) errors.push(`empty-tags: ${where}`);
    if (!a.content || String(a.content).replace(/<[^>]*>/g, '').trim().length < 100) {
      errors.push(`short-content: ${where}`);
    }
    for (const field of ['importance', 'difficulty']) {
      const v = a[field];
      if (!Number.isInteger(v) || v < 1 || v > 5) errors.push(`bad-${field}: ${where} -> ${v}`);
    }
    for (const r of a.related || []) {
      if (r === a.id) errors.push(`self-related: ${where}`);
      else if (!idSet.has(r)) errors.push(`bad-related: ${where} -> ${r}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// CLI
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/validate-data.mjs');
if (isMain) {
  const data = loadSurvivalData();
  const { ok, errors } = validateData(data);
  const subCount = data.categories.reduce((s, c) => s + (c.subcategories || []).length, 0);
  if (ok) {
    console.log(`✔ 数据校验通过：${data.categories.length} 分类 / ${subCount} 子类 / ${data.articles.length} 篇文章`);
  } else {
    console.error(`✘ 数据校验失败，共 ${errors.length} 处问题：`);
    for (const e of errors) console.error('  - ' + e);
    process.exitCode = 1;
  }
}
