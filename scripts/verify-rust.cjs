// 用真实 rustc 核对 Rust 卡片：示例能否编译、"// 输出："是否和实际一致、标了"编译错误/运行时 panic"的行是否真的出错。
// 用法：node --max-old-space-size=512 scripts/verify-rust.cjs [卡片id ...]
// 结果写到 %TEMP%\langref-verify-rust\report.json，控制台打印汇总。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { load } = require('./load.cjs');

const WORK = path.join(os.tmpdir(), 'langref-verify-rust');
const RUSTC = process.env.RUSTC || 'rustc';
const POOL = 4;

// 依赖外部 crate 或真实环境的卡片只能跳过
const EXTERNAL = /\btokio\b|\banyhow\b|\bserde\b|\bthiserror\b|\breqwest\b|\brand::/;
// 已人工核对、无法自动判断的代码段：卡片id.字段 → 原因（2026-11-27 用 rustc 1.97.1 单独写测试程序验证过）
const MANUAL = {
  'rs-primitive.vs': '两个反例在同一段：溢出检查要等类型检查通过才运行，已单独验证 this arithmetic operation will overflow',
  'rs-type-alias.vs': '示意代码，函数体用 /* ... */ 省略',
  'rs-lifetime.vs': '第二个报错针对"标注生命周期之后"的版本，已单独验证 `b` does not live long enough',
  'rs-enum.vs': '片段（用到 example 的变量 d），已单独验证 non-exhaustive patterns 报错',
  'rs-path.vs': '示意写法列表，不是可编译代码',
  'rs-default-method.vs': '已单独验证 not all trait items implemented, missing: `name`',
  'rs-impl-trait-type.vs': '已单独验证 `if` and `else` have incompatible types',
  'rs-dyn.vs': '已单独验证：mismatched types（标注 expected `Circle`, found `Rect`）、dyn Shape 大小未知',
  'rs-match-guard.vs': '片段，用到 example 的变量',
  'rs-wildcard.vs': '片段，用到 example 的变量',
  'rs-at-binding.vs': '片段，用到上下文变量和函数',
  'rs-while.vs': '片段，三种循环写法并列',
  'rs-api-hashmap.vs': '片段，用到 example 的变量；最后一行故意 panic',
  'rs-range.vs': '最后一行故意 panic，已核对 byte index 1 is not a char boundary',
  'rs-derive.vs': '已单独验证 binary operation `==` cannot be applied to type `Config`',
  'rs-doc-comment.vs': '示意写法列表',
  'rs-pub.vs': '示意写法列表（pub(super) 要在子模块里才合法）',
  'rs-use.vs': '已单独验证 cannot find type `HashMap` in this scope',
  'rs-api-box.vs': '两个反例在同一段，第一个报错会挡住第二个，已单独验证 dyn Shape 大小未知',
};

const STD_ROOTS = new Set(['std', 'core', 'alloc', 'crate', 'self', 'super']);
const TOP_ITEM = /^(#!?\[|(pub(\([\w ]+\))?\s+)?((async|unsafe|const|extern)\s+)*(fn|struct|enum|impl|trait|use|mod|type|const|static|union|macro_rules!)\b)/;

function externalUse(code) {
  for (const m of code.matchAll(/^\s*use\s+(\w+)::/gm)) if (!STD_ROOTS.has(m[1])) return m[1];
  if (EXTERNAL.test(code)) return (code.match(EXTERNAL) || [])[0];
  return null;
}

// 没有 fn main 的片段：顶格条目放顶层，其余语句包进 fn main
function wrap(code) {
  if (/^\s*(pub\s+)?(async\s+)?fn\s+main\s*\(/m.test(code)) return code;
  const lines = code.split('\n');
  const top = [];
  const body = [];
  let pending = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(\/\/\/|\/\/!)/.test(l) || /^#!?\[/.test(l)) { pending.push(l); continue; }
    if (TOP_ITEM.test(l) && !/^\s/.test(l)) {
      // 收集整个条目，直到括号配平
      const item = [...pending, l];
      pending = [];
      let depth = count(l);
      while ((depth > 0 || !/[;}]\s*(\/\/.*)?$/.test(item[item.length - 1])) && i + 1 < lines.length) {
        i++;
        item.push(lines[i]);
        depth += count(lines[i]);
        if (depth <= 0 && /[;}]\s*(\/\/.*)?$/.test(lines[i])) break;
      }
      top.push(...item);
      continue;
    }
    body.push(...pending, l);
    pending = [];
  }
  top.push(...pending);
  return `${top.join('\n')}\n\nfn main() {\n${body.join('\n')}\n}\n`;
}

function count(line) {
  const code = line.replace(/\/\/.*$/, '').replace(/"(\\.|[^"\\])*"/g, '""').replace(/'(\\.|[^'\\])'/g, "''");
  let d = 0;
  for (const c of code) { if (c === '{') d++; else if (c === '}') d--; }
  return d;
}

const MARK_ERR = /\/\/\s*编译错误/;
const MARK_PANIC = /\/\/\s*运行时\s*panic/;

// 取消一行的注释：行首的 "// " 去掉（只针对被注释掉的代码行）
function uncomment(line) { return line.replace(/^(\s*)\/\/\s?/, '$1'); }
function isCommentedCode(line) { return /^\s*\/\/\s?\S/.test(line) && !/^\s*\/\/\s*(编译|运行|输出|结果|注意|错误|提示|编译器|[0-9一二三四五六七八九十]+[.、])/.test(line); }

// 干净版本：把未注释、带错误标记的行注释掉
function clean(code) {
  return code.split('\n').map((l) => ((MARK_ERR.test(l) || MARK_PANIC.test(l)) && !/^\s*\/\//.test(l) ? '// ' + l : l)).join('\n');
}

// 期望输出：执行到的代码行上的 "// 输出：xxx"
function expectedOutputs(code) {
  const out = [];
  for (const l of code.split('\n')) {
    if (/^\s*\/\//.test(l)) continue; // 被注释掉的行不会执行
    const m = l.match(/\/\/[^\n]*?输出[:：]\s*(.+)$/);
    if (!m) continue;
    let s = m[1].trim();
    s = s.replace(/[（(][^（）()]*[)）]\s*$/, '').trim();
    out.push(s);
  }
  return out;
}

function sh(file, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(file, args, { timeout: 20000, maxBuffer: 1 << 20, ...opts }, (err, stdout, stderr) => {
      resolve({ code: err ? (typeof err.code === 'number' ? err.code : -1) : 0, stdout: String(stdout), stderr: String(stderr), timedOut: !!(err && err.killed) });
    });
  });
}

let seq = 0;
// example 的 main 函数体（vs 片段常直接用 example 里的变量）
function mainBody(code) {
  const w = wrap(code);
  const m = w.match(/fn\s+main\s*\(\s*\)[^{]*\{([\s\S]*)\}\s*$/);
  return m ? m[1] : '';
}
// 依次尝试：原样 → 补上 example 的定义 → 再补上 example 的 main 函数体。
// 能编译就用；都编译不过时，取"找不到名字"类错误最少的那个（反例要看真正想演示的错误）
async function compileWithCtx(src, ctx) {
  const r = await compile(wrap(src));
  if (r.ok || !ctx || !missingCount(r.stderr)) return r;
  let best = r;
  const withItems = withContext(src, ctx);
  const cands = [withItems];
  const body = mainBody(ctx);
  if (body.trim()) {
    const w = wrap(withItems);
    cands.push(w.replace(/fn\s+main\s*\(\s*\)\s*\{/, (h) => h + '\n' + body + '\n'));
  }
  for (const c of cands) {
    const r2 = await compile(/fn\s+main\s*\(/.test(c) ? c : wrap(c));
    if (r2.ok) return Object.assign(r2, { usedCtx: true });
    if (missingCount(r2.stderr) < missingCount(best.stderr)) best = r2;
  }
  return best;
}
async function compile(src) {
  const dir = path.join(WORK, String(++seq));
  fs.mkdirSync(dir, { recursive: true });
  const rs = path.join(dir, 'main.rs');
  const exe = path.join(dir, 'main.exe');
  fs.writeFileSync(rs, src);
  const r = await sh(RUSTC, ['--edition', '2024', '-A', 'warnings', '-o', exe, rs], { cwd: dir });
  return { ok: r.code === 0, stderr: r.stderr, exe, dir };
}
async function run(exe, dir) { return sh(exe, [], { cwd: dir, timeout: 10000 }); }

function firstError(stderr) {
  const m = stderr.match(/^error(\[E\d+\])?: (.+)$/m);
  return m ? (m[1] || '') + ' ' + m[2] : stderr.split('\n')[0];
}

// 卡片里写的报错要点里的英文部分，和真实报错比较
function claimedEnglish(line) {
  const m = line.match(/编译错误[:：]\s*(.*)$/);
  if (!m) return '';
  const en = (m[1].match(/[A-Za-z`][\w`'"&*:<>(),.\- ]{8,}/) || [''])[0].trim();
  return en.replace(/[`'"]/g, '').toLowerCase().slice(0, 40);
}
function norm(s) { return s.replace(/[`'"]/g, '').toLowerCase(); }

function checkOutputs(expected, stdout) {
  const actual = stdout.replace(/\r/g, '');
  let pos = 0;
  const missing = [];
  for (const e of expected) {
    // 一行注释可能对应多行输出（如循环），按空白切开后逐段查找
    const parts = e.split(/\s*[，,]\s*|\s{2,}/).filter(Boolean);
    let ok = true;
    let p = pos;
    for (const part of [e]) {
      const i = actual.indexOf(part, p);
      if (i < 0) { ok = false; break; }
      p = i + part.length;
    }
    if (!ok) {
      // "A，然后 B" 表示先后两段输出；"值，解释" 只比较逗号前的值
      const seqParts = e.split(/[，,]\s*(?:然后|接着|再)\s*/);
      const tryParts = seqParts.length > 1 ? seqParts : [e.split(/[，（(：]/)[0].trim()];
      let q = pos;
      const allFound = tryParts.every((part) => { const i = part ? actual.indexOf(part, q) : -1; if (i < 0) return false; q = i + part.length; return true; });
      if (allFound) { pos = q; continue; }
      // 退一步：把实际输出的换行换成空格再找
      const flat = actual.replace(/\n/g, ' ');
      const flatPos = actual.slice(0, pos).replace(/\n/g, ' ').length;
      const j = flat.indexOf(e, flatPos);
      if (j >= 0) { pos = actual.length - (flat.length - (j + e.length)); continue; }
      missing.push(e);
      void parts;
    } else pos = p;
  }
  return missing;
}

// 取出一段代码里的顶层条目（不含 fn main），按条目切分
function topItems(code) {
  const w = wrap(code);
  const items = [];
  const lines = w.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!(TOP_ITEM.test(l) && !/^\s/.test(l)) && !/^#!?\[/.test(l)) continue;
    const item = [l];
    let depth = count(l);
    while ((depth > 0 || !/[;}]\s*(\/\/.*)?$/.test(item[item.length - 1])) && i + 1 < lines.length) { i++; item.push(lines[i]); depth += count(lines[i]); if (depth <= 0 && /[;}]\s*(\/\/.*)?$/.test(lines[i])) break; }
    const text = item.join('\n');
    if (/^\s*(pub\s+)?(async\s+)?fn\s+main\s*\(/m.test(text)) continue;
    items.push(text);
  }
  return items;
}
const itemName = (t) => (t.match(/\b(?:fn|struct|enum|trait|type|mod|union|const|static)\s+(\w+)/) || t.match(/^use\s+(.+);/m) || [])[1];
const MISSING_G = /error\[(E0425|E0412|E0422|E0433|E0405|E0423|E0432)\]/g;
const missingCount = (stderr) => (stderr.match(MISSING_G) || []).length;

// 给 vs 片段补上 example 里的定义（vs 自己重新定义的同名条目不补）
function withContext(code, ctxCode) {
  if (!ctxCode) return code;
  const own = new Set(topItems(code).map(itemName));
  const extra = topItems(ctxCode).filter((t) => !own.has(itemName(t)));
  return extra.length ? extra.join('\n') + '\n\n' + code : code;
}

async function verifyUnit(card, field, code, ctx) {
  const res = { card: card.id, field, status: 'pass', notes: [] };
  const manual = MANUAL[`${card.id}.${field}`];
  if (manual) { res.status = 'manual'; res.notes.push(manual); return res; }
  const ext = externalUse(code);
  if (ext) { res.status = 'skip'; res.notes.push(`依赖外部 crate/库：${ext}`); return res; }
  const lines = code.split('\n');
  const bump = (s) => { if (s === 'fail' || (s === 'warn' && res.status === 'pass')) res.status = s; };
  const commentedCode = (l) => /^\s*\/\//.test(l) && isCommentedCode(l);

  const asis = await compileWithCtx(code, ctx);
  if (asis.ok) {
    // 能编译：运行并核对输出
    const r = await run(asis.exe, asis.dir);
    const exp = expectedOutputs(code);
    const panicky = lines.some((l) => MARK_PANIC.test(l) && !/^\s*\/\//.test(l)) || /panicked/.test(code);
    if (r.timedOut) { bump('fail'); res.notes.push('运行超时'); }
    else if (r.code !== 0 && !panicky) { bump('fail'); res.notes.push(`运行失败（退出码 ${r.code}）：${r.stderr.split('\n').slice(0, 2).join(' ')}`); }
    if (panicky && !/panicked/.test(r.stderr)) { bump('fail'); res.notes.push('标了运行时 panic，实际没有 panic'); }
    const missing = checkOutputs(exp, r.stdout);
    if (missing.length) { bump('fail'); res.notes.push(`输出不一致：期望 ${JSON.stringify(missing)}`); res.stdout = r.stdout.slice(0, 800); }
  } else {
    // 编译不过：应当是故意的反例，每条声明的报错都要能在 rustc 输出里找到
    const claims = lines.filter((l) => MARK_ERR.test(l) && !commentedCode(l)).map(claimedEnglish).filter(Boolean);
    const anyMark = lines.some((l) => MARK_ERR.test(l) && !commentedCode(l));
    if (!anyMark) { bump('fail'); res.notes.push(`编译失败，但没有标注编译错误：${firstError(asis.stderr)}`); res.stderr = asis.stderr.slice(0, 1500); }
    const all = norm(asis.stderr);
    for (const c of claims) if (!all.includes(c.slice(0, 25))) { bump('warn'); res.notes.push(`声明的报错没出现：「${c}」 实际首个报错「${firstError(asis.stderr)}」`); }
    res.notes.push('整段是反例');
  }

  // 被注释掉、标了编译错误/panic 的代码行：单独放开，应当真的出错
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!commentedCode(l)) continue;
    const isErr = MARK_ERR.test(l);
    const isPanic = MARK_PANIC.test(l);
    if (!isErr && !isPanic) continue;
    const variant = lines.map((x, k) => (k === i ? uncomment(x) : x)).join('\n');
    const v = await compileWithCtx(variant, ctx);
    const label = `第 ${i + 1} 行`;
    if (isErr) {
      if (v.ok) { bump('fail'); res.notes.push(`${label} 标了编译错误，实际能编译：${l.trim()}`); continue; }
      const claim = claimedEnglish(l);
      if (claim && !norm(v.stderr).includes(claim.slice(0, 25))) { bump('warn'); res.notes.push(`${label} 报错措辞不符：卡片「${claim}」 实际「${firstError(v.stderr)}」`); }
    } else {
      if (!v.ok) { bump('fail'); res.notes.push(`${label} 标了运行时 panic，实际编译失败：${firstError(v.stderr)}`); continue; }
      const r = await run(v.exe, v.dir);
      if (!/panicked/.test(r.stderr)) { bump('fail'); res.notes.push(`${label} 标了运行时 panic，实际没有 panic：${l.trim()}`); }
    }
  }
  return res;
}

(async () => {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  const { cards } = await load(['rust']);
  const only = new Set(process.argv.slice(2));
  const units = [];
  for (const c of cards) {
    if (only.size && !only.has(c.id)) continue;
    units.push([c, 'example', c.example]);
    if (c.vs) units.push([c, 'vs', c.vs[1], c.example]);
  }
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: POOL }, async () => {
    while (next < units.length) { const u = units[next++]; results.push(await verifyUnit(...u)); }
  }));
  results.sort((a, b) => units.findIndex((u) => u[0].id === a.card) - units.findIndex((u) => u[0].id === b.card));
  fs.writeFileSync(path.join(WORK, 'report.json'), JSON.stringify(results, null, 2));
  const by = (s) => results.filter((r) => r.status === s);
  for (const r of results) if (r.status !== 'pass' && r.status !== 'manual') console.log(`[${r.status}] ${r.card}.${r.field}: ${r.notes.join(' | ')}`);
  for (const r of by('manual')) console.log(`[人工] ${r.card}.${r.field}: ${r.notes[0]}`);
  console.log(`共 ${results.length} 段代码：通过 ${by('pass').length}，人工核对 ${by('manual').length}，措辞存疑 ${by('warn').length}，失败 ${by('fail').length}，跳过 ${by('skip').length}`);
  console.log(`报告：${path.join(WORK, 'report.json')}`);
})();
