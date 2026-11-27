// 页面逻辑：粘贴代码 → 识别语法点 → 显示卡片；搜索；按主题浏览。
(async function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const ui = { search: $('search'), lang: $('lang'), status: $('status'), edit: $('edit'), clear: $('clear'), code: $('code'), view: $('view'), gutter: $('gutter'), src: $('src'), results: $('results') };
  const LANG_NAME = { kotlin: 'Kotlin', java: 'Java', rust: 'Rust' };
  const STORE = { code: 'langref.code', lang: 'langref.lang', unknown: 'langref.unknown' };

  let engine = null;
  let result = null;      // 最近一次分析结果
  let selectedId = null;  // 当前展开的卡片

  // ---------- 初始化解析器 ----------
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  try {
    const W = window.LANGREF_WASM;
    await TreeSitter.init({ wasmBinary: bytes(W.core) });
    const languages = {};
    for (const l of LangRef.LANGS) if (W[l]) languages[l] = await TreeSitter.Language.load(bytes(W[l]));
    engine = LangRef.createEngine({ Parser: TreeSitter, languages, cards: window.LANGREF_CARDS || [] });
    if (engine.problems.length) console.warn('卡片规则问题：', engine.problems);
    ui.status.textContent = '就绪';
  } catch (e) {
    ui.status.textContent = '解析器加载失败：' + e.message;
    console.error(e);
    return;
  }

  // ---------- 文本工具 ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // 卡片说明只用到三种格式：`代码`、**粗体**、以 "- " 开头的列表行。
  function md(text) {
    const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    const out = [];
    let list = [];
    const flush = () => { if (list.length) { out.push('<ul>' + list.map((l) => `<li>${inline(l)}</li>`).join('') + '</ul>'); list = []; } };
    for (const line of String(text).split('\n')) {
      if (line.startsWith('- ')) list.push(line.slice(2));
      else { flush(); if (line.trim()) out.push(`<p>${inline(line)}</p>`); }
    }
    flush();
    return out.join('');
  }

  // ---------- 渲染卡片 ----------
  function cardBody(card) {
    const parts = [md(card.desc)];
    parts.push(`<div class="label">示例</div><pre>${esc(card.example)}</pre>`);
    if (card.ts) parts.push(`<div class="label">TypeScript 对照</div><pre>${esc(card.ts)}</pre>`);
    if (card.cmp) parts.push(`<div class="label">${esc(card.cmp[0])} 对照</div><pre>${esc(card.cmp[1])}</pre>`);
    if (card.pit) parts.push(`<div class="label">注意</div><div class="pit">${md(card.pit)}</div>`);
    const see = (card.see || []).map((id) => engine.byId.get(id)).filter(Boolean);
    if (see.length) parts.push(`<div class="label">其他语言</div><p>${see.map((c) => `<a data-goto="${c.id}">${LANG_NAME[c.lang]}：${esc(c.title)}</a>`).join('　')}</p>`);
    if (card.api && card.api.length) parts.push(`<div class="tags">识别的名字：${card.api.map(esc).join(' ')}</div>`);
    return `<div class="card">${parts.join('')}</div>`;
  }

  function itemHtml(card, { line, maybe, showLang, snippet } = {}) {
    const open = card.id === selectedId;
    return `<div class="item${open ? ' open' : ''}" data-id="${card.id}">
      <div class="head">
        ${line ? `<span class="ln">L${line}</span>` : ''}
        ${showLang ? `<span class="badge ${card.lang}">${LANG_NAME[card.lang]}</span>` : ''}
        <span class="title">${esc(card.title)}</span>
        ${maybe ? '<span class="badge maybe">可能是</span>' : ''}
        <span class="syntax"${snippet ? ' title="代码里匹配到的部分"' : ''}>${esc(snippet || card.syntax)}</span>
      </div>
      ${open ? cardBody(card) : ''}
    </div>`;
  }

  // ---------- 三种视图：分析结果 / 搜索结果 / 主题目录 ----------
  function render() {
    const q = ui.search.value.trim();
    if (q) return renderSearch(q);
    if (result && result.items.length + result.unknown.length) return renderAnalysis();
    return renderBrowse();
  }

  function renderAnalysis() {
    const r = result;
    const html = [`<div class="group-title">识别到 ${r.items.length} 个语法点 · ${LANG_NAME[r.lang]}${r.errors ? ` · 有 ${r.errors} 处没解析通` : ''}</div>`];
    const code = ui.code.value;
    for (const it of r.items) {
      const r0 = it.ranges[0];
      const snippet = code.slice(r0.start, r0.end).replace(/\s+/g, ' ').slice(0, 60) + (it.ranges.length > 1 ? `  ×${it.ranges.length}` : '');
      html.push(itemHtml(it.card, { line: it.line, maybe: it.certainty === 'maybe', snippet }));
    }
    if (r.unknown.length) {
      html.push(`<div class="unknown"><div><b>没有卡片的名字</b> <span class="hint">（多半是项目里的类/方法，或者库 API。在 IDE 里 Ctrl+点击跳转，或复制提问给 AI）</span></div>
        <div class="names">${r.unknown.map((u) => `<span class="name" data-at="${u.start}" title="第 ${u.line} 行">${esc(u.name)}</span>`).join('')}</div>
        <button id="ask">复制提问</button> <span id="ask-done" class="hint"></span></div>`);
    }
    ui.results.innerHTML = html.join('');
  }

  function renderSearch(q) {
    const lang = ui.lang.value;
    const cards = engine.search(q, lang);
    const head = `<div class="group-title">搜索 “${esc(q)}”${lang !== 'auto' ? ' · 仅 ' + LANG_NAME[lang] : ''} · ${cards.length} 条</div>`;
    ui.results.innerHTML = head + (cards.length ? cards.slice(0, 60).map((c) => itemHtml(c, { showLang: lang === 'auto' })).join('') : '<div class="empty">没有匹配的卡片。可以换个说法，比如 “空安全”、“继承”、“闭包”。</div>');
  }

  function renderBrowse() {
    const lang = ui.lang.value === 'auto' ? 'kotlin' : ui.lang.value;
    const groups = new Map();
    for (const c of engine.perLang[lang].cards) {
      if (!groups.has(c.cat)) groups.set(c.cat, []);
      groups.get(c.cat).push(c);
    }
    const html = [`<p class="hint">粘贴代码自动识别，或搜索关键字。下面是 ${LANG_NAME[lang]} 的全部卡片（右上角切换语言）。</p>`];
    for (const [cat, cards] of groups) html.push(`<div class="group-title">${esc(cat)}</div>` + cards.map((c) => itemHtml(c)).join(''));
    ui.results.innerHTML = html.join('');
  }

  // ---------- 代码视图与高亮 ----------
  function showView(on) {
    ui.view.hidden = !on;
    ui.code.hidden = on;
    ui.edit.hidden = !on;
  }

  function paintSource() {
    const code = ui.code.value;
    const item = result && result.items.find((i) => i.card.id === selectedId);
    const ranges = item ? item.ranges : [];
    let html = '';
    let pos = 0;
    for (const r of ranges) {
      if (r.start < pos) continue;
      html += esc(code.slice(pos, r.start)) + `<mark class="strong">${esc(code.slice(r.start, r.end))}</mark>`;
      pos = r.end;
    }
    ui.src.innerHTML = html + esc(code.slice(pos)) + '\n';
    const lines = code.split('\n').length;
    ui.gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    const first = ui.src.querySelector('mark');
    if (first) {
      const box = ui.view.getBoundingClientRect();
      const m = first.getBoundingClientRect();
      if (m.top < box.top || m.bottom > box.bottom) ui.view.scrollTop += m.top - box.top - box.height / 3;
    }
  }

  function analyze() {
    const code = ui.code.value;
    localStorage.setItem(STORE.code, code);
    if (!code.trim()) { result = null; ui.status.textContent = '就绪'; showView(false); render(); return; }
    const t0 = performance.now();
    result = engine.analyze(code, ui.lang.value, result && result.lang);
    rememberUnknown(result);
    ui.status.textContent = `${LANG_NAME[result.lang]}${ui.lang.value === 'auto' ? '（自动识别）' : ''} · ${Math.round(performance.now() - t0)} ms`;
    if (selectedId && !result.items.some((i) => i.card.id === selectedId)) selectedId = null;
    showView(true);
    paintSource();
    render();
  }

  // 记下没有卡片的名字，攒多了可以整理给 AI 补词条。
  function rememberUnknown(r) {
    const all = JSON.parse(localStorage.getItem(STORE.unknown) || '{}');
    for (const u of r.unknown) all[`${r.lang}:${u.name}`] = (all[`${r.lang}:${u.name}`] || 0) + 1;
    localStorage.setItem(STORE.unknown, JSON.stringify(all));
  }

  // 点击代码：找到包含这个位置的最小语法点。
  function offsetAt(node, offset) {
    const range = document.createRange();
    range.setStart(ui.src, 0);
    range.setEnd(node, offset);
    return range.toString().length;
  }

  function select(id, { scroll } = {}) {
    selectedId = selectedId === id ? null : id;
    if (result) paintSource();
    render();
    if (scroll && selectedId) ui.results.querySelector(`.item[data-id="${selectedId}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  // ---------- 事件 ----------
  let timer = 0;
  ui.code.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(analyze, 300); });
  ui.code.addEventListener('paste', () => setTimeout(analyze, 0));
  ui.code.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
  });
  ui.lang.addEventListener('change', () => { localStorage.setItem(STORE.lang, ui.lang.value); if (ui.code.value.trim()) analyze(); else render(); });
  ui.search.addEventListener('input', render);
  ui.edit.addEventListener('click', () => { showView(false); ui.code.focus(); });
  ui.clear.addEventListener('click', () => { ui.code.value = ''; selectedId = null; analyze(); ui.code.focus(); });

  ui.src.addEventListener('click', () => {
    const sel = window.getSelection();
    if (!result || !sel.anchorNode || !sel.isCollapsed) return;
    const at = offsetAt(sel.anchorNode, sel.anchorOffset);
    let best = null;
    for (const it of result.items) for (const r of it.ranges) {
      if (at >= r.start && at <= r.end && (!best || r.end - r.start < best.len)) best = { id: it.card.id, len: r.end - r.start };
    }
    if (best) { ui.search.value = ''; selectedId = null; select(best.id, { scroll: true }); }
  });

  ui.results.addEventListener('click', async (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) { ui.search.value = engine.byId.get(go.dataset.goto).title; selectedId = null; select(go.dataset.goto); return; }
    const name = e.target.closest('.name');
    if (name) { ui.search.value = name.textContent; render(); return; }
    if (e.target.id === 'ask') {
      const names = result.unknown.map((u) => u.name).join('、');
      const text = `我在读一段 ${LANG_NAME[result.lang]} 代码，下面这些名字看不懂：${names}。\n请逐个说明它是什么（项目里的类、库 API 还是语言特性）、大概从哪里来、在这段代码里起什么作用。\n\n\`\`\`${result.lang}\n${ui.code.value}\n\`\`\``;
      await navigator.clipboard.writeText(text);
      $('ask-done').textContent = '已复制，粘贴给 Claude Code 或其他 AI 即可';
      return;
    }
    const head = e.target.closest('.item > .head');
    if (head) select(head.parentElement.dataset.id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== ui.search && document.activeElement !== ui.code) { e.preventDefault(); ui.search.focus(); ui.search.select(); }
    if (e.key === 'Escape' && document.activeElement === ui.search) { ui.search.value = ''; render(); }
  });

  const DEMO = `class MyAccessibilityService : AccessibilityApi() {
    override val enableListenPageUpdate: Boolean = true
    private val mutablePageUpdates = MutableSharedFlow<Unit>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val pageUpdates = mutablePageUpdates.asSharedFlow()
    private val chatObserver by lazy {
        ChatObserver(
            PreferenceStore(applicationContext),
        )
    }`;
  $('demo').addEventListener('click', () => { ui.code.value = DEMO; selectedId = null; analyze(); });

  // 恢复上次的代码和语言；地址带 #demo 时直接载入示例（自动化检查用）
  ui.lang.value = localStorage.getItem(STORE.lang) || 'auto';
  const demo = location.hash.match(/^#demo(?:&card=([\w-]+))?/);
  ui.code.value = demo ? DEMO : localStorage.getItem(STORE.code) || '';
  if (ui.code.value.trim()) analyze(); else render();
  if (demo && demo[1]) select(demo[1]);
  // #q=关键字：打开即搜索，可以收藏成书签
  const hq = location.hash.match(/^#q=(.+)/);
  if (hq) { ui.search.value = decodeURIComponent(hq[1]); render(); }
  window.__langref = { engine, analyze: () => result }; // 方便调试和自动化检查
})();
