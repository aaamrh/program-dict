// 自检：每张卡片的示例必须能被自己的规则识别；验收用例必须识别出期望的卡片。
// 用法：node scripts/test.cjs [kotlin|java|rust ...]
const path = require('path');
const { load, ROOT } = require('./load.cjs');

(async () => {
  const want = process.argv.slice(2);
  const langs = want.length ? want : ['kotlin', 'java', 'rust'];
  const { engine, cards } = await load(langs);
  let fails = [];

  fails.push(...engine.problems);
  const seen = new Set();
  for (const c of cards) {
    if (seen.has(c.id)) fails.push(`${c.id}: 重复 id`);
    seen.add(c.id);
    for (const f of ['id', 'lang', 'cat', 'title', 'syntax', 'why', 'example', 'vs', 'ts']) if (!c[f]) fails.push(`${c.id}: 缺少 ${f}`);
    if (c.vs && !(Array.isArray(c.vs) && c.vs.length === 2)) fails.push(`${c.id}: vs 必须是 [标题, 代码]`);
    if (!c.q && !(c.api && c.api.length) && !c.kw) fails.push(`${c.id}: 没有任何识别规则`);
    if (c.q || (c.api && c.api.length)) {
      const r = engine.analyze(c.example, c.lang);
      const hit = r.items.find((i) => i.card.id === c.id && i.certainty === 'sure');
      if (!hit) fails.push(`${c.id}: 示例没有触发自己的规则（识别到：${r.items.map((i) => i.card.id).join(', ') || '无'}；解析错误 ${r.errors}）`);
    }
  }
  // see 引用的卡片可能在别的语言里，只在全量测试时检查。
  if (langs.length === 3) for (const id of globalThis.LANGREF_CARDS.LINK_IDS || []) if (!engine.byId.has(id)) fails.push(`links.js 引用不存在的 ${id}`);
  if (langs.length === 3) for (const c of cards) for (const s of c.see || []) if (!engine.byId.has(s)) fails.push(`${c.id}: see 引用不存在的 ${s}`);

  const cases = require(path.join(ROOT, 'tests/cases.cjs')).filter((t) => langs.includes(t.lang));
  for (const t of cases) {
    const r = engine.analyze(t.code, t.detect ? 'auto' : t.lang);
    const ids = new Set(r.items.map((i) => i.card.id));
    // 高亮位置必须和代码里的文字对得上（检查补括号、包装、中文等情况下的偏移换算）
    for (const it of r.items) for (const g of it.ranges) if (g.text !== undefined && t.code.slice(g.start, g.end) !== g.text) fails.push(`[${t.name}] ${it.card.id} 高亮位置偏移`);
    if (t.detect && r.lang !== t.lang) fails.push(`[${t.name}] 自动识别成 ${r.lang}，期望 ${t.lang}`);
    for (const id of t.expect || []) if (!ids.has(id)) fails.push(`[${t.name}] 没识别出 ${id}（实际：${[...ids].join(', ')}）`);
    for (const id of t.reject || []) if (ids.has(id)) fails.push(`[${t.name}] 误报 ${id}`);
    if (t.verbose) console.log(`[${t.name}] ${r.lang} errors=${r.errors}\n  ` + r.items.map((i) => `L${i.line} ${i.certainty === 'maybe' ? '?' : ''}${i.card.id}`).join('\n  ') + `\n  未识别: ${r.unknown.map((u) => u.name).join(', ')}`);
  }

  const counts = langs.map((l) => `${l} ${cards.filter((c) => c.lang === l).length}`).join(', ');
  console.log(`卡片：${counts}；验收用例 ${cases.length} 个`);
  // ONLY=kotlin/03.js,kotlin/04.js：只报告这些文件里卡片的问题（多人并行改卡片时用），验收用例的失败照常报告
  if (process.env.ONLY) {
    const files = new Set(process.env.ONLY.split(','));
    const ids = new Set(cards.filter((c) => files.has(c._file)).map((c) => c.id));
    const idOf = (line) => (line.match(/^([\w-]+): /) || [])[1];
    fails = fails.filter((f) => !idOf(f) || ids.has(idOf(f)));
    console.log(`只检查 ${[...files].join(', ')}（${ids.size} 张卡片）`);
  }
  if (fails.length) { console.log(`失败 ${fails.length} 项：\n- ` + fails.join('\n- ')); process.exitCode = 1; }
  else console.log('全部通过');
})();
