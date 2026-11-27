// 探查各语言语法树结构，写卡片规则前用。用法：node scripts/probe.cjs <lang> <file>
const fs = require('fs');
const path = require('path');
const Parser = require('web-tree-sitter');
(async () => {
  await Parser.init();
  const [lang, file] = process.argv.slice(2);
  const L = await Parser.Language.load(path.join(__dirname, '..', 'node_modules/tree-sitter-wasms/out', `tree-sitter-${lang}.wasm`));
  const p = new Parser(); p.setLanguage(L);
  if (file === '--types') {
    const names = new Set();
    for (let i = 0; i < L.nodeTypeCount; i++) { const n = L.nodeTypeForId(i); if (n && L.nodeTypeIsNamed(i)) names.add(n); }
    console.log([...names].sort().join(' '));
    return;
  }
  const src = fs.readFileSync(file, 'utf8');
  const t = p.parse(src);
  const walk = (n, d) => {
    if (!n.isNamed && !process.env.ALL) return;
    const txt = n.childCount === 0 || n.type === 'ERROR' ? ' ' + JSON.stringify(n.text.slice(0, 40)) : '';
    console.log('  '.repeat(d) + n.type + (n.isMissing ? ' MISSING' : '') + txt);
    for (const c of n.children) walk(c, d + 1);
  };
  walk(t.rootNode, 0);
})();
