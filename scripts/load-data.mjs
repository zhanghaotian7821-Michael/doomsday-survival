import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(here, '../js/data.js');

/**
 * 用 vm 把旧的全局脚本当普通脚本跑一遍，取出 SURVIVAL_DATA。
 * 这样校验脚本不需要让 data.js 变成 ES 模块，也不依赖 window。
 */
export function loadSurvivalData(file = DATA_FILE) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: file });
  vm.runInContext('globalThis.__data = SURVIVAL_DATA;', ctx, { filename: 'bridge' });
  const data = ctx.__data;
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.articles)) {
    throw new Error(`数据文件结构异常，未取到 SURVIVAL_DATA: ${file}`);
  }
  return data;
}

export const DATA_PATH = DATA_FILE;
