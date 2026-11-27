// 用真实的 javac/java 核对 Java 卡片里的代码：能否编译、"// 输出："是否和实际一致、
// 标了"编译错误"的行是否真的编译不过、标了"运行时抛"的行是否真的抛出该异常。
// 用法：node --max-old-space-size=512 scripts/verify-java.cjs [卡片id 或 java/NN.js ...]
// 环境变量：JDK=javac 所在目录（默认 D:/environment/jdk-17.0.11/bin），VERBOSE=1 打印生成的 Main.java
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const JDK = process.env.JDK || 'D:/environment/jdk-17.0.11/bin';
const TMP = path.join(os.tmpdir(), 'langref-verify-java');
const POOL = 3;

// ---------- 读取卡片 ----------
globalThis.LANGREF_CARDS = [];
const cardDir = path.join(ROOT, 'src/cards/java');
for (const f of fs.readdirSync(cardDir).filter((f) => f.endsWith('.js')).sort()) {
  const before = globalThis.LANGREF_CARDS.length;
  require(path.join(cardDir, f));
  for (const c of globalThis.LANGREF_CARDS.slice(before)) c._file = `java/${f}`;
}
const args = process.argv.slice(2);
const cards = globalThis.LANGREF_CARDS.filter((c) => !args.length || args.includes(c.id) || args.includes(c._file));

// ---------- Android SDK ----------
function findAndroidJar() {
  try {
    const props = fs.readFileSync('D:/work/vwa/apps/android/local.properties', 'utf8');
    const m = props.match(/^sdk\.dir=(.*)$/m);
    if (!m) return null;
    const sdk = m[1].trim().replace(/\\:/g, ':').replace(/\\\\/g, '/');
    const plat = path.join(sdk, 'platforms');
    const vers = fs.readdirSync(plat).filter((d) => /^android-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1]);
    for (const v of vers) { const jar = path.join(plat, v, 'android.jar'); if (fs.existsSync(jar)) return jar; }
  } catch {}
  return null;
}
const ANDROID_JAR = findAndroidJar();
const isAndroid = (s) => /\b(Context|Intent|Log\.[ivdwe]\(|Activity|AccessibilityService|AccessibilityNodeInfo|AccessibilityEvent|Bundle|PackageManager|Toast|AlertDialog|getApplicationContext|startActivity|SharedPreferences)\b/.test(s);

// ---------- 行分析 ----------
// 把一行拆成"代码"和"行尾注释"，跳过字符串和字符字面量里的 //
function splitComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === '\'') { q = c; continue; }
    if (c === '/' && line[i + 1] === '/') return [line.slice(0, i), line.slice(i + 2)];
  }
  return [line, ''];
}
const CE = /编译错误/;
const RT = /运行时(?:会)?抛(?:出)?\s*([A-Za-z.]*(?:Exception|Error))?/;

function analyzeLines(src) {
  const lines = analyzeRaw(src);
  for (let k = 0; k < lines.length; k++) {
    const l = lines[k];
    // 只有大括号的行：上面的"运行时抛"只是说明整段的效果，不能把括号注释掉
    if (l.kind === 'code' && /^[}\])\s;]*$/.test(l.code.trim())) { l.ce = false; l.rt = false; l.note = l.comment; }
    // "编译错误"写在下一行的纯注释里：归到上一条代码行
    if (l.kind === 'comment' && /编译错误/.test(l.comment)) {
      let p = k - 1;
      while (p >= 0 && !lines[p].raw.trim()) p--;
      if (p >= 0 && lines[p].kind === 'code' && !lines[p].ce && !/^[}\])\s;]*$/.test(lines[p].code.trim())) { lines[p].ce = true; lines[p].comment += ' ' + l.comment; }
    }
  }
  return lines;
}

function analyzeRaw(src) {
  return src.split('\n').map((raw, i) => {
    const t = raw.trim();
    let disabled = false;
    let code;
    let comment;
    if (t.startsWith('//')) {
      // 被注释掉的代码行，例如 "// name = "Jerry";   // 编译错误：..."
      const inner = raw.slice(raw.indexOf('//') + 2);
      [code, comment] = splitComment(inner);
      if (!comment || !code.trim() || !/[;{}()=]/.test(code)) return { i, raw, kind: 'comment', code: '', comment: t.slice(2) };
      disabled = true;
    } else {
      [code, comment] = splitComment(raw);
    }
    const rt = comment.match(RT);
    return {
      i, raw, code, comment, disabled,
      ce: CE.test(comment),
      rt: !!rt, rtType: rt && rt[1] ? rt[1].split('.').pop() : null,
      kind: 'code',
    };
  });
}

// 生成某个变体的源码行：enable 指定要启用的那一行（编译错误/运行时异常行），其余带标记的行一律注释掉
function variantLines(lines, enable) {
  return lines.map((l) => {
    if (l.kind !== 'code') return l.raw;
    const indent = l.raw.match(/^\s*/)[0];
    const on = l.i === enable;
    if ((l.ce || l.rt) && !on) return l.disabled ? l.raw : indent + '// ' + l.raw.trimStart();
    if (l.disabled && on) return indent + l.code.trimStart() + (l.comment ? ' //' + l.comment : '');
    if (l.disabled) return l.raw;
    return l.raw;
  });
}

// ---------- 包装成 Main.java ----------
const TYPE_START = /^(?:@\w+(?:\([^)]*\))?\s+)*(?:(?:public|protected|private|abstract|final|static|sealed|non-sealed|strictfp)\s+)*(?:class|interface|enum|record|@interface)\s+\w+/;
const MEMBER_MOD = /^(?:(?:public|protected|private|static|final|abstract|synchronized|native|default|transient|volatile)\s+)+/;
const METHOD = /^(?:(?:public|protected|private|static|final|abstract|synchronized|native)\s+)*(?:<[^>]+>\s+)?[\w.<>\[\], ?]+?\s+\w+\s*\([^;]*\)\s*(?:throws\s+[\w., ]+)?\s*\{/;
const STMT_KW = /^(if|for|while|switch|try|catch|finally|return|new|else|do|synchronized\s*\(|throw|break|continue|yield|case|default\s*->|assert|var\s)/;

function braceDelta(line) {
  const [code] = splitComment(line);
  let d = 0;
  let q = null;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === '\'') { q = c; continue; }
    if (c === '{') d++;
    else if (c === '}') d--;
  }
  return d;
}

function chunkName(chunk) {
  for (const c of chunk) {
    const t = c.text.trim();
    let m = t.match(/(?:class|interface|enum|record)\s+(\w+)/);
    if (m && TYPE_START.test(t)) return m[1];
    m = t.match(/(\w+)\s*\(/);
    if (m && !t.startsWith('@')) return m[1];
    m = t.match(/(\w+)\s*(?:=|;)/);
    if (m && !t.startsWith('@')) return m[1];
  }
  return null;
}

// ctx：另一段代码（通常是 example）里的类型和成员声明。vs 片段常常引用 example 里定义的类，
// 这里把 vs 自己没有声明的补进去，补进来的行不对应片段行号（idx = -1）。
function wrap(srcLines, android, ctx, preStmts) {
  const imports = new Set([
    'java.util.*', 'java.util.function.*', 'java.util.stream.*', 'java.io.*', 'java.nio.file.*',
    'java.util.concurrent.*', 'java.util.concurrent.atomic.*', 'java.lang.annotation.*', 'java.lang.reflect.*', 'java.time.*',
  ]);
  if (android) for (const p of ['android.content.*', 'android.content.pm.*', 'android.util.Log', 'android.app.*', 'android.os.*', 'android.accessibilityservice.*', 'android.view.accessibility.*', 'android.widget.*', 'android.view.*']) imports.add(p);
  const types = [];     // { lines, srcIdx[] }
  const members = [];
  const stmts = [];
  let pendingAnn = [];
  for (let k = 0; k < srcLines.length;) {
    const line = srcLines[k];
    const t = line.trim();
    const col0 = line.length > 0 && !/^\s/.test(line);
    if (col0 && /^import\s/.test(t)) { imports.add(t.replace(/^import\s+(static\s+)?/, (m, s) => (s ? 'static ' : '')).replace(/;.*$/, '')); k++; continue; }
    if (col0 && /^package\s/.test(t)) { k++; continue; }
    if (col0 && /^@\w+/.test(t) && !/^@interface/.test(t) && !/[;{]/.test(splitComment(t)[0].replace(/\([^)]*\)/g, ''))) { pendingAnn.push({ text: line, idx: k }); k++; continue; }
    const isType = col0 && TYPE_START.test(t);
    const isMember = col0 && !isType && !STMT_KW.test(t) && (MEMBER_MOD.test(t) || METHOD.test(t));
    if (isType || isMember) {
      const chunk = [...pendingAnn.map((a) => ({ text: a.text, idx: a.idx }))];
      pendingAnn = [];
      let depth = 0;
      let j = k;
      do {
        chunk.push({ text: srcLines[j], idx: j });
        depth += braceDelta(srcLines[j]);
        j++;
      } while (j < srcLines.length && (depth > 0 || (depth === 0 && !/[;}]\s*(\/\/.*)?$/.test(srcLines[j - 1].trim()) && !/\{\s*\}\s*(\/\/.*)?$/.test(srcLines[j - 1].trim()))));
      if (isType) {
        chunk.find((c) => c.idx === k).text = srcLines[k].replace(/^public\s+/, '');
        types.push(chunk);
      } else {
        const first = chunk.find((c) => c.idx === k);
        if (!/\bstatic\b/.test(first.text) && !/\babstract\b/.test(first.text)) first.text = 'static ' + first.text;
        members.push(chunk);
      }
      k = j;
      continue;
    }
    for (const a of pendingAnn) stmts.push({ text: a.text, idx: a.idx });
    pendingAnn = [];
    stmts.push({ text: line, idx: k });
    k++;
  }
  if (ctx) {
    const have = new Set([...types, ...members].map(chunkName));
    for (const ch of ctx.types) if (!have.has(chunkName(ch))) types.unshift(ch.map((c) => ({ text: c.text, idx: -1 })));
    for (const ch of ctx.members) if (!have.has(chunkName(ch))) members.unshift(ch.map((c) => ({ text: c.text, idx: -1 })));
  }
  // 组装，记录 Main.java 行号 -> 片段行号
  const out = [];
  const map = [];
  const push = (text, idx = -1) => { out.push(text); map.push(idx); };
  for (const imp of imports) push(`import ${imp};`);
  push('');
  for (const ch of types) { for (const c of ch) push(c.text, c.idx); push(''); }
  const hasMain = types.some((ch) => ch.some((c) => /static\s+void\s+main\s*\(/.test(c.text)));
  const mainOwner = hasMain ? types.find((ch) => ch.some((c) => /static\s+void\s+main\s*\(/.test(c.text))) : null;
  const entry = mainOwner ? mainOwner.find((c) => TYPE_START.test(c.text.trim())).text.match(/(?:class|interface|enum|record)\s+(\w+)/)[1] : 'Main';
  push('class Main {');
  for (const ch of members) { for (const c of ch) push('    ' + c.text, c.idx); }
  if (!hasMain || stmts.some((s) => s.text.trim() && !s.text.trim().startsWith('//'))) {
    push('    public static void main(String[] args) throws Exception {');
    for (const s of preStmts || []) push('        ' + s.text, -1);
    for (const s of stmts) push('        ' + s.text, s.idx);
    push('    }');
  }
  push('}');
  return { source: out.join('\n'), map, entry, types, members, stmts };
}

// ---------- 运行外部命令 ----------
function run(cmd, argv, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, argv, { cwd: opts.cwd, windowsHide: true });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => { p.kill(); err += '\n[超时]'; }, opts.timeout || 20000);
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
    p.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out, err: String(e) }); });
  });
}

let seq = 0;
async function compileRun(wrapped, android, doRun) {
  const dir = path.join(TMP, `v${++seq}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'Main.java'), wrapped.source);
  const cp = android && ANDROID_JAR ? ['-classpath', ANDROID_JAR] : [];
  const c = await run(path.join(JDK, 'javac'), ['-J-Xmx256m', '-J-Duser.language=en', '-J-Duser.country=US', '-encoding', 'UTF-8', '-nowarn', '-Xlint:none', '--release', '17', ...cp, '-d', dir, path.join(dir, 'Main.java')], { cwd: dir, timeout: 60000 });
  const all = c.out + c.err;
  const errors = [...all.matchAll(/Main\.java:(\d+): error: (.*)/g)].map((m) => ({ line: +m[1], snippetLine: wrapped.map[+m[1] - 1], msg: m[2] }));
  const missing = [...new Set([...all.matchAll(/symbol:\s+(?:variable|method|class)\s+(\w+)/g)].map((m) => m[1]))];
  const res = { compiled: c.code === 0, errors, missing, raw: all.trim(), dir };
  if (res.compiled && doRun) {
    const r = await run(path.join(JDK, 'java'), ['-Xmx256m', '-Duser.language=en', '-Dfile.encoding=UTF-8', '-Dsun.stdout.encoding=UTF-8', '-Dsun.stderr.encoding=UTF-8', '-cp', dir, wrapped.entry], { cwd: dir, timeout: 20000 });
    res.stdout = r.out.toString().replace(/\r/g, '');
    res.stderr = r.err.toString().replace(/\r/g, '');
    res.exit = r.code;
  }
  if (!process.env.VERBOSE) fs.rmSync(dir, { recursive: true, force: true });
  else console.log(`----- ${dir}\n${wrapped.source}\n-----`);
  return res;
}

// ---------- 输出比对 ----------
const norm = (s) => s.replace(/\s+/g, ' ').trim();
function expectedOutputs(lines) {
  const exp = [];
  for (const l of lines) {
    if (l.kind !== 'code' || l.disabled || l.ce || l.rt) continue;
    const m = l.comment.match(/输出：\s*(.*)$/);
    if (!m) continue;
    let e = m[1].replace(/（[^（）]*）\s*$/, '').replace(/\s+[—-]{1,2}\s.*$/, '').trim();
    exp.push({ text: e, line: l.i, fuzzy: /类似|约|左右|不确定|可能|之一|随机|顺序不定/.test(m[1]) });
  }
  return exp;
}
function compareOutputs(exp, stdout) {
  const actual = stdout.split('\n').map(norm).filter((s) => s !== '');
  const problems = [];
  let pos = 0;
  for (const e of exp) {
    if (e.fuzzy) continue;
    const want = norm(e.text);
    // 一条注释可能对应多行输出（循环里），也可能写成 "a b c" 对应几行；先找完全相等，再找以它开头的
    let found = -1;
    for (let k = pos; k < actual.length; k++) if (actual[k] === want) { found = k; break; }
    if (found < 0) {
      // 多行合并比较：注释把几行输出写在一行里
      for (let k = pos; k < actual.length && found < 0; k++) {
        let acc = '';
        for (let m = k; m < actual.length && acc.length <= want.length; m++) {
          acc = acc ? acc + ' ' + actual[m] : actual[m];
          if (acc === want) { found = m; break; }
        }
      }
    }
    if (found < 0 && /[、，]/.test(want)) {
      // "Tom、Jerry" 这种把几行输出写在一条注释里的情况
      const parts = want.split(/\s*[、，]\s*/);
      for (let k = pos; k + parts.length <= actual.length; k++) if (parts.every((p, n) => actual[k + n] === p)) { found = k + parts.length - 1; break; }
    }
    if (found < 0) problems.push(`第 ${e.line + 1} 行 期望「${e.text}」，实际输出（从第 ${pos + 1} 行起）：${JSON.stringify(actual.slice(pos, pos + 4))}`);
    else pos = found + 1;
  }
  return problems;
}

// ---------- 检查一段代码 ----------
async function checkSnippet(card, label, src, ctx) {
  const lines = analyzeLines(src);
  const android = isAndroid(src);
  const report = { card: card.id, label, status: 'pass', notes: [] };
  if (android && !ANDROID_JAR) { report.status = 'skip'; report.notes.push('需要 Android SDK（未找到 android.jar）'); return report; }
  const tasks = [];
  // 基础变体：注释掉所有标了编译错误/运行时异常的行
  tasks.push(async () => {
    let w = wrap(variantLines(lines, -1), android, ctx);
    let r = await compileRun(w, android, !android);
    // vs 常常接着用 example 里的变量：把 example 的语句放在前面再试一次
    if (!r.compiled && ctx && ctx.stmts && r.errors.every((e) => /cannot find symbol/.test(e.msg))) {
      const w2 = wrap(variantLines(lines, -1), android, ctx, ctx.stmts);
      const r2 = await compileRun(w2, android, !android);
      if (r2.compiled || r2.missing.length < r.missing.length) { w = w2; r = r2; if (r2.compiled) report.notes.push('（借用了 example 里的变量）'); }
    }
    if (!r.compiled && r.errors.every((e) => /cannot find symbol/.test(e.msg))) {
      report.status = 'warn';
      report.notes.push(`示意代码，引用了没有定义的名字：${r.missing.join(', ')}（无法运行，输出没有核对）`);
      return;
    }
    if (!r.compiled) {
      report.status = 'fail';
      report.notes.push('基础代码编译失败：' + r.errors.slice(0, 3).map((e) => `[片段第 ${e.snippetLine >= 0 ? e.snippetLine + 1 : '?'} 行] ${e.msg}`).join(' | ') || r.raw.slice(0, 300));
      return;
    }
    if (android) { report.notes.push('Android：只做了编译检查'); return; }
    if (r.exit !== 0) { report.status = 'fail'; report.notes.push(`运行异常退出：${(r.stderr || '').split('\n').slice(0, 2).join(' ')}`); }
    const probs = compareOutputs(expectedOutputs(lines), r.stdout || '');
    if (probs.length) { report.status = 'fail'; report.notes.push(...probs.map((p) => '输出不符：' + p)); }
  });
  // 每个标了编译错误的行单独启用，应当编译失败
  for (const l of lines.filter((x) => x.kind === 'code' && x.ce)) {
    tasks.push(async () => {
      const w = wrap(variantLines(lines, l.i), android, ctx);
      const r = await compileRun(w, android, false);
      const claimed = l.comment.replace(/^.*?编译错误[：:]?\s*/, '').trim();
      if (r.compiled) { report.status = 'fail'; report.notes.push(`第 ${l.i + 1} 行标了编译错误，但实际能编译：${l.code.trim()}`); return; }
      const atLine = r.errors.filter((e) => e.snippetLine === l.i || (l.i > 0 && e.snippetLine === l.i));
      if (!atLine.length && r.errors.every((e) => /cannot find symbol/.test(e.msg))) { report.notes.push(`CE 第 ${l.i + 1} 行：片段引用了未定义的 ${r.missing.join(', ')}，无法单独验证 ｜ 卡片写：${claimed}`); if (report.status === 'pass') report.status = 'warn'; return; }
      const errs = (atLine.length ? atLine : r.errors).map((e) => e.msg);
      report.notes.push(`CE 第 ${l.i + 1} 行 ✓ 实际：${errs[0]}${atLine.length ? '' : '（报错不在这一行）'} ｜ 卡片写：${claimed}`);
      if (!atLine.length) report.status = report.status === 'fail' ? 'fail' : 'warn';
    });
  }
  // 每个标了运行时异常的行单独启用，应当抛出该异常
  for (const l of lines.filter((x) => x.kind === 'code' && x.rt && !x.ce)) {
    tasks.push(async () => {
      if (android) return;
      const w = wrap(variantLines(lines, l.i), android, ctx);
      const r = await compileRun(w, android, true);
      if (!r.compiled) { report.status = 'fail'; report.notes.push(`第 ${l.i + 1} 行（运行时异常）启用后编译失败：${r.errors[0] && r.errors[0].msg}`); return; }
      const thrown = (r.stderr || '').match(/Exception in thread "[^"]*" ([\w.$]+)(?::\s*(.*))?/);
      const name = thrown ? thrown[1].split('.').pop() : null;
      if (!thrown) { report.status = 'fail'; report.notes.push(`第 ${l.i + 1} 行标了运行时抛 ${l.rtType || '异常'}，但实际没有抛出（退出码 ${r.exit}）`); return; }
      if (l.rtType && name !== l.rtType) { report.status = 'fail'; report.notes.push(`第 ${l.i + 1} 行标了 ${l.rtType}，实际抛出 ${name}: ${thrown[2] || ''}`); return; }
      report.notes.push(`RT 第 ${l.i + 1} 行 ✓ 实际：${name}${thrown[2] ? ': ' + thrown[2] : ''}`);
    });
  }
  // 最多 POOL 个并发
  const queue = [...tasks];
  await Promise.all(Array.from({ length: POOL }, async () => { while (queue.length) await queue.shift()(); }));
  return report;
}

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  console.log(`JDK: ${JDK}  Android: ${ANDROID_JAR || '未找到'}  卡片 ${cards.length} 张`);
  const sum = { pass: 0, warn: 0, fail: 0, skip: 0 };
  for (const card of cards) {
    const parts = [['example', card.example]];
    if (card.vs && card.vs[1]) parts.push(['vs', card.vs[1]]);
    // vs 可能引用 example 里声明的类和方法：把 example 的声明作为上下文提供给 vs
    const exLines = analyzeLines(card.example);
    const exWrap = wrap(variantLines(exLines, -1), isAndroid(card.example));
    const ctx = { types: exWrap.types, members: exWrap.members, stmts: exWrap.stmts.filter((x) => !/^\s*\/\//.test(x.text)) };
    for (const [label, src] of parts) {
      const r = await checkSnippet(card, label, src, label === 'vs' ? ctx : null);
      sum[r.status]++;
      const mark = { pass: '通过', warn: '注意', fail: '失败', skip: '跳过' }[r.status];
      console.log(`${mark}  ${card.id} ${label}${r.notes.length ? '\n    ' + r.notes.join('\n    ') : ''}`);
    }
  }
  console.log(`\n合计：通过 ${sum.pass}，注意 ${sum.warn}，失败 ${sum.fail}，跳过 ${sum.skip}`);
  if (!process.env.VERBOSE) fs.rmSync(TMP, { recursive: true, force: true });
})();
