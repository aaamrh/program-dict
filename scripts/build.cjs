// 打包成单个 HTML：脚本、样式、WASM（base64）全部内联，双击即可打开，不需要服务器。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { cardFiles } = require('./load.cjs');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');

const LANGS = ['kotlin', 'java', 'rust'];
const wasm = { core: b64('node_modules/web-tree-sitter/tree-sitter.wasm') };
for (const l of LANGS) wasm[l] = b64(`node_modules/tree-sitter-wasms/out/tree-sitter-${l}.wasm`);

const scripts = [
  read('node_modules/web-tree-sitter/tree-sitter.js'),
  `window.LANGREF_WASM = ${JSON.stringify(wasm)};`,
  read('src/engine.js'),
  ...LANGS.flatMap((l) => cardFiles(l)).map(read),
  read('src/cards/links.js'),
  read('src/app.js'),
];
const inline = (js) => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
const html = read('src/index.html')
  .replace('<!--STYLE-->', () => `<style>\n${read('src/app.css')}\n</style>`)
  .replace('<!--SCRIPTS-->', () => scripts.map(inline).join('\n'));

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist/index.html');
fs.writeFileSync(out, html);
console.log(`已生成 ${out}（${(html.length / 1024 / 1024).toFixed(1)} MB）`);
