// Node 端加载引擎、卡片和语法，测试与构建共用。
const fs = require('fs');
const path = require('path');
const Parser = require('web-tree-sitter');
const ROOT = path.join(__dirname, '..');

function cardFiles(lang) {
  const dir = path.join(ROOT, 'src/cards', lang);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort().map((f) => `src/cards/${lang}/${f}`);
}

async function load(langs = ['kotlin', 'java', 'rust']) {
  await Parser.init();
  globalThis.LANGREF_CARDS = [];
  require(path.join(ROOT, 'src/engine.js'));
  const languages = {};
  for (const lang of langs) {
    languages[lang] = await Parser.Language.load(path.join(ROOT, 'node_modules/tree-sitter-wasms/out', `tree-sitter-${lang}.wasm`));
    // 每个分类一个文件：src/cards/<语言>/NN.js，按文件名顺序加载；记下每张卡片来自哪个文件
    for (const f of cardFiles(lang)) {
      const before = globalThis.LANGREF_CARDS.length;
      require(path.join(ROOT, f));
      for (const c of globalThis.LANGREF_CARDS.slice(before)) c._file = f.replace(/^src\/cards\//, '');
    }
  }
  require(path.join(ROOT, 'src/cards/links.js'));
  const cards = globalThis.LANGREF_CARDS.filter((c) => langs.includes(c.lang));
  const engine = globalThis.LangRef.createEngine({ Parser, languages, cards });
  return { engine, cards, languages };
}
module.exports = { load, cardFiles, ROOT };
