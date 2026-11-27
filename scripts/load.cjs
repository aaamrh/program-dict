// Node 端加载引擎、卡片和语法，测试与构建共用。
const fs = require('fs');
const path = require('path');
const Parser = require('web-tree-sitter');
const ROOT = path.join(__dirname, '..');

async function load(langs = ['kotlin', 'java', 'rust']) {
  await Parser.init();
  globalThis.LANGREF_CARDS = [];
  require(path.join(ROOT, 'src/engine.js'));
  const languages = {};
  for (const lang of langs) {
    languages[lang] = await Parser.Language.load(path.join(ROOT, 'node_modules/tree-sitter-wasms/out', `tree-sitter-${lang}.wasm`));
    const f = path.join(ROOT, 'src/cards', `${lang}.js`);
    if (fs.existsSync(f)) require(f);
  }
  require(path.join(ROOT, 'src/cards/links.js'));
  const cards = globalThis.LANGREF_CARDS.filter((c) => langs.includes(c.lang));
  const engine = globalThis.LangRef.createEngine({ Parser, languages, cards });
  return { engine, cards, languages };
}
module.exports = { load, ROOT };
