// 用真实的 Kotlin 编译器核对 Kotlin 卡片：
//   1. example / vs 能否编译（vs 用到 example 里的定义时，自动带上 example 作为上下文）
//   2. `// 输出：` 和实际运行输出是否一致（按顺序做子序列匹配，没写注释的 println 不影响）
//   3. 注释掉并标了"编译错误"的行，取消注释后是否真的在这一行报错；没注释、但标了"编译错误"的行，报错算预期内
// 用法（主机上）：node --max-old-space-size=512 scripts/verify-kotlin.cjs [卡片id前缀...]
// 环境变量：VERBOSE=1 打印每条结果；KEEP=1 保留临时目录 %TEMP%/langref-verify-kotlin
// 依赖 Gradle 缓存里的 kotlin-compiler-embeddable 2.2.10；Android 卡片额外用 Android SDK 的 android.jar，只编译不运行。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { load } = require('./load.cjs');

const GRADLE = path.join(os.homedir(), '.gradle/caches/modules-2/files-2.1');
const jar = (group, name, version) => {
  const dir = path.join(GRADLE, group, name, version);
  for (const h of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const f = path.join(dir, h, `${name}-${version}.jar`);
    if (fs.existsSync(f)) return f;
  }
  throw new Error(`找不到 ${group}:${name}:${version}`);
};
const KV = '2.2.10';
const COMPILER = [
  jar('org.jetbrains.kotlin', 'kotlin-compiler-embeddable', KV),
  jar('org.jetbrains.kotlin', 'kotlin-stdlib', KV),
  jar('org.jetbrains.kotlin', 'kotlin-script-runtime', KV),
  jar('org.jetbrains.kotlin', 'kotlin-reflect', KV),
  jar('org.jetbrains.kotlin', 'kotlin-daemon-embeddable', KV),
  jar('org.jetbrains.intellij.deps', 'trove4j', '1.0.20200330'),
  jar('org.jetbrains', 'annotations', '13.0'),
  jar('org.jetbrains.kotlinx', 'kotlinx-coroutines-core-jvm', '1.10.2'),
];
const RUNTIME = [COMPILER[1], COMPILER[3], COMPILER[7]];
const SDK = path.join(os.homedir(), 'AppData/Local/Android/Sdk/platforms');
const ANDROID_JAR = ['android-36', 'android-35', 'android-34'].map((p) => path.join(SDK, p, 'android.jar')).find((f) => fs.existsSync(f));
const WORK = path.join(os.tmpdir(), 'langref-verify-kotlin');

const ANDROID_RE = /\bnode\.(childCount|text|isClickable|viewIdResourceName|contentDescription)\b|\bintent\.get\w*Extra\b|\b(Log\.[dievw]|Context|Intent|applicationContext|AccessibilityService|AccessibilityNodeInfo|Activity|Bundle|packageManager|SharedPreferences|startActivity|getSystemService|Service|IBinder)\b/;

// 需要的 import：按片段里出现的名字补
const IMPORTS = [
  [/\bDelegates\b/, 'kotlin.properties.Delegates'],
  [/\bReadWriteProperty\b/, 'kotlin.properties.ReadWriteProperty'],
  [/\bReadOnlyProperty\b/, 'kotlin.properties.ReadOnlyProperty'],
  [/\bKProperty\b/, 'kotlin.reflect.KProperty'],
  [/\bKClass\b/, 'kotlin.reflect.KClass'],
  [/\b(runBlocking|launch|async|delay|withContext|Dispatchers|coroutineScope|supervisorScope|withTimeout|withTimeoutOrNull|CoroutineScope|Job|Deferred|awaitAll|yield|SupervisorJob|CancellationException|CoroutineExceptionHandler|joinAll|GlobalScope|isActive|ensureActive|TimeoutCancellationException)\b/, 'kotlinx.coroutines.*'],
  [/\b(flow|flowOf|Flow|MutableSharedFlow|SharedFlow|MutableStateFlow|StateFlow|asSharedFlow|asStateFlow|collect|emit|onEach|launchIn|toList|update|asFlow|stateIn|shareIn|SharingStarted|debounce|distinctUntilChanged|collectLatest|flowOn)\b/, 'kotlinx.coroutines.flow.*'],
  [/\bBufferOverflow\b/, 'kotlinx.coroutines.channels.BufferOverflow'],
  [/\bChannel\b/, 'kotlinx.coroutines.channels.Channel'],
  [/\bFile\b/, 'java.io.File'],
  [/\bCloseable\b/, 'java.io.Closeable'],
  [/\bIOException\b/, 'java.io.IOException'],
  [/\bURL\b/, 'java.net.URL'],
  [/\bAtomicInteger\b/, 'java.util.concurrent.atomic.AtomicInteger'],
  [/\bLog\./, 'android.util.Log'],
  [/\bContext\b/, 'android.content.Context'],
  [/\bIntent\b/, 'android.content.Intent'],
  [/\bService\b/, 'android.app.Service'],
  [/\bActivity\b/, 'android.app.Activity'],
  [/\bIBinder\b/, 'android.os.IBinder'],
  [/\bBundle\b/, 'android.os.Bundle'],
  [/\bAccessibilityNodeInfo\b/, 'android.view.accessibility.AccessibilityNodeInfo'],
  [/\bAccessibilityService\b/, 'android.accessibilityservice.AccessibilityService'],
  [/\bAccessibilityEvent\b/, 'android.view.accessibility.AccessibilityEvent'],
  [/\bUri\./, 'android.net.Uri'],
];
// Android 片段里常见的"外部变量"，只用来让编译通过（不运行）
const ANDROID_STUBS = [
  [/\bnode\b/, /\b(val|var)\s+node\b|node\s*:/, 'lateinit var node: android.view.accessibility.AccessibilityNodeInfo'],
  [/\bctx\b/, /\b(val|var)\s+ctx\b|ctx\s*:/, 'lateinit var ctx: android.content.Context'],
  [/\bDetailActivity\b/, /class\s+DetailActivity\b/, 'class DetailActivity : android.app.Activity()'],
  [/\bMainActivity\b/, /class\s+MainActivity\b/, 'class MainActivity : android.app.Activity()'],
  [/\bTAG\b/, /\bTAG\s*=/, 'const val TAG = "Demo"'],
  [/\bintent\./, /\b(val|var)\s+intent\b/, 'lateinit var intent: android.content.Intent'],
];

const DECL_RE = /^(@[\w.]+(\([^)]*\))?\s+)*((public|private|internal|protected|open|abstract|sealed|data|enum|annotation|inline|value|inner|operator|infix|tailrec|suspend|const|external|fun\s+interface)\s+)*(class|interface|object|typealias|fun)\b|^(@[\w.]+(\([^)]*\))?\s+)*((private|internal|public)\s+)?const\s+val\b|^@[\w.]+(\([^)]*\))?\s*$/;
function depthDelta(line) {
  let d = 0;
  let inStr = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; continue; }
    if (c === '/' && line[i + 1] === '/') break;
    if (c === '"' || c === '\'') { inStr = c; continue; }
    if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--;
  }
  return d;
}

// 把片段拆成：顶层声明块、main 里的语句、import
function split(code) {
  const lines = code.split('\n');
  const imports = [];
  const decls = [];
  const body = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^import\s/.test(l)) { imports.push(l.replace(/^import\s+/, '').trim()); continue; }
    if (/^package\s/.test(l)) continue;
    if (DECL_RE.test(l) && !/^\s/.test(l)) {
      const block = [l];
      let depth = depthDelta(l);
      // 括号没闭合，或者下一行是缩进的续行（表达式函数体、注解下面的声明），都算同一个声明
      while (i + 1 < lines.length && (depth > 0 || /^\s+\S/.test(lines[i + 1]) || /^[.)?]/.test(lines[i + 1]) || (/^@[\w.]+(\([^)]*\))?\s*$/.test(lines[i]) && lines[i + 1].trim()))) {
        i++; block.push(lines[i]); depth += depthDelta(lines[i]);
      }
      const name = (block.join(' ').match(/\b(?:class|interface|object|typealias|fun|val)\s+(?:<[^>]*>\s*)?([\w.]+)/) || [])[1] || `#${decls.length}`;
      decls.push({ name, text: block.join('\n') });
      continue;
    }
    body.push(l);
  }
  return { imports, decls, body, hasMain: /\bfun\s+main\s*\(/.test(code) };
}

// 生成可编译的源文件。ctx：vs 依赖 example 时传入 example 的代码
function build(code, pkg, ctxCode) {
  const own = split(code);
  const imports = new Set(own.imports);
  let decls = own.decls;
  let body = own.body;
  if (ctxCode) {
    const c = split(ctxCode);
    c.imports.forEach((x) => imports.add(x));
    const ownNames = new Set(own.decls.map((d) => d.name));
    decls = [...c.decls.filter((d) => !ownNames.has(d.name) && d.name !== 'main'), ...own.decls];
    // example 的语句先执行，vs 的语句放进 run { } 里，允许重名的局部变量
    if (!own.hasMain) body = [...c.body.filter((l) => !/\/\/\s*输出/.test(l) || true), 'run {', ...own.body, '}'];
  }
  const all = (ctxCode || '') + '\n' + code;
  for (const [re, imp] of IMPORTS) if (re.test(all)) imports.add(imp);
  const stubs = ANDROID_RE.test(all) ? ANDROID_STUBS.filter(([use, def]) => use.test(all) && !def.test(all)).map((s) => s[2]) : [];
  const hasBody = body.some((l) => l.trim() && !l.trim().startsWith('//') && !/^(run \{|\})$/.test(l.trim()));
  const out = ['@file:Suppress("UNUSED_VARIABLE", "UNUSED_PARAMETER", "UNUSED_VALUE", "unused", "NAME_SHADOWING", "REDUNDANT_PROJECTION", "UNREACHABLE_CODE", "DEPRECATION")', `package ${pkg}`, ...[...imports].map((x) => `import ${x}`), '', ...stubs, ...decls.map((d) => d.text)];
  if (!own.hasMain && hasBody) out.push('', 'suspend fun main() {', ...body, '}');
  else if (!own.hasMain) out.push('', 'fun main() {}');
  else out.push(...body);
  return out.join('\n');
}

// 期望输出：`// 输出：xxx`。"输出：" 后为空时，接下来连续的注释行都是输出；用 " / " 分隔的算多行
function expectedOutputs(code) {
  const lines = code.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\/\/\s*输出[:：]\s*(.*)$/);
    if (!m) continue;
    if (m[1].trim()) { out.push(...m[1].split(/\s+\/\s+/).map((s) => s.trim())); continue; }
    while (i + 1 < lines.length && /^\s*\/\/\s?/.test(lines[i + 1]) && !/输出[:：]/.test(lines[i + 1])) {
      i++; const t = lines[i].replace(/^\s*\/\/\s?/, '').trim(); if (t) out.push(t);
    }
  }
  return out;
}

// 注释掉、并标了"编译错误"的行：取消注释后应该在这一行编译失败
function errorVariants(code) {
  const lines = code.split('\n');
  const res = [];
  lines.forEach((l, i) => {
    const m = l.match(/^(\s*)\/\/\s?(.*?)\s*\/\/\s*编译错误[:：]?\s*(.*)$/);
    if (m && m[2].trim()) {
      const copy = lines.slice();
      copy[i] = `${m[1]}${m[2]}   // @@VARIANT@@`;
      res.push({ line: i + 1, code: copy.join('\n'), claim: m[3].trim(), text: m[2].trim() });
    }
  });
  return res;
}

function kotlinc(files, outJar) {
  const cp = [...RUNTIME, ...(ANDROID_JAR ? [ANDROID_JAR] : [])].join(path.delimiter);
  const r = spawnSync('java', ['-Xmx1g', '-cp', COMPILER.join(path.delimiter), 'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler',
    '-no-stdlib', '-no-reflect', '-nowarn', '-jvm-target', '17', '-classpath', cp, '-d', outJar, ...files], { encoding: 'utf8', maxBuffer: 64 << 20 });
  return (r.stdout || '') + (r.stderr || '');
}

// 编译一批；出错的文件剔除后重编，直到剩下的都能编译。返回每个文件的错误（带出错行的源码）
function compileBatch(entries, outJar) {
  const errors = new Map();
  let pending = entries.slice();
  for (let round = 0; round < 8 && pending.length; round++) {
    const out = kotlinc(pending.map((e) => e.file), outJar);
    const bad = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^(.*?\.kt):(\d+):(\d+): error: (.*)$/);
      if (!m) continue;
      const e = pending.find((x) => path.resolve(x.file) === path.resolve(m[1]));
      if (!e) continue;
      bad.add(e);
      const src = fs.readFileSync(e.file, 'utf8').split('\n')[Number(m[2]) - 1] || '';
      if (!errors.has(e.key)) errors.set(e.key, []);
      errors.get(e.key).push({ line: Number(m[2]), msg: m[4], src });
    }
    if (!bad.size) {
      if (/error:/.test(out)) for (const e of pending) errors.set(e.key, [{ line: 0, msg: out.split('\n').find((l) => /error:/.test(l)), src: '' }]);
      return { errors, ok: /error:/.test(out) ? [] : pending, jar: outJar };
    }
    pending = pending.filter((e) => !bad.has(e));
  }
  return { errors, ok: [], jar: null };
}

function run(jarFile, mainClass) {
  const r = spawnSync('java', ['-Xmx256m', '-Dfile.encoding=UTF-8', '-Dstdout.encoding=UTF-8', '-Dstderr.encoding=UTF-8', '-cp', [jarFile, ...RUNTIME].join(path.delimiter), mainClass], { encoding: 'utf8', timeout: 20000, cwd: WORK });
  return { stdout: (r.stdout || '').replace(/\r/g, ''), stderr: (r.stderr || '').replace(/\r/g, ''), code: r.status };
}

const norm = (s) => s.replace(/\s+/g, ' ').trim();
// 写的输出后面常带说明，如「null（u2 是 null）」：实际输出是它的前缀、后面紧跟说明，也算一致
function same(exp, got) {
  const e = norm(exp);
  const g = norm(got);
  if (e === g) return true;
  return g.length > 0 && e.startsWith(g) && /^\s*[（(，,；;—]/.test(e.slice(g.length));
}
const isExpectedErrorLine = (src) => /编译错误|报错|@@VARIANT@@/.test(src);

let counter = 0;
function writeEntry(entry, code, ctxCode) {
  const pkg = `c${++counter}`;
  const dir = path.join(WORK, pkg);
  fs.mkdirSync(dir);
  entry.pkg = pkg;
  entry.file = path.join(dir, 'S.kt');
  entry.withCtx = !!ctxCode;
  fs.writeFileSync(entry.file, build(code, pkg, ctxCode));
}

(async () => {
  const only = process.argv.slice(2);
  const { cards } = await load(['kotlin']);
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });

  // 第一轮：每个片段单独编译
  const entries = [];
  for (const c of cards) {
    if (only.length && !only.some((p) => c.id.startsWith(p))) continue;
    for (const [part, code] of [['example', c.example], ['vs', c.vs && c.vs[1]]]) {
      if (!code) continue;
      const e = { key: `${c.id}/${part}`, card: c, part, code, android: ANDROID_RE.test(code) || ANDROID_RE.test(c.example) };
      writeEntry(e, code, null);
      entries.push(e);
    }
  }
  console.log(`片段 ${entries.length} 个；android.jar: ${ANDROID_JAR || '无'}`);
  let res = compileBatch(entries, path.join(WORK, 'a.jar'));

  // 第二轮：vs 因为找不到 example 里的名字而失败的，带上 example 重新编译
  const unexpectedCount = (errs) => (errs || []).filter((x) => !isExpectedErrorLine(x.src)).length;
  const unresolvedCount = (errs) => (errs || []).filter((x) => /unresolved reference|cannot infer type|not enough information/.test(x.msg)).length;
  // 有报错的 vs 都带上 example 再试：缺上下文时报的是"名字找不到"，带上后才能看到真正的报错原因
  const retry = entries.filter((e) => e.part === 'vs' && res.errors.has(e.key));
  const saved = new Map(retry.map((e) => [e.key, { file: e.file, pkg: e.pkg, errs: res.errors.get(e.key) }]));
  for (const e of retry) writeEntry(e, e.code, e.card.example);
  if (retry.length) {
    const res2 = compileBatch(retry, path.join(WORK, 'b.jar'));
    res.jar2 = res2.jar;
    for (const e of retry) {
      const before = saved.get(e.key);
      const after = res2.errors.get(e.key);
      const better = unexpectedCount(after) < unexpectedCount(before.errs) || (unexpectedCount(after) === unexpectedCount(before.errs) && unresolvedCount(after) < unresolvedCount(before.errs));
      if (better) { res.errors.delete(e.key); if (after) res.errors.set(e.key, after); }
      else { e.file = before.file; e.pkg = before.pkg; e.withCtx = false; }   // 带上下文更糟，保留第一轮结果
    }
  }

  // 示意代码：依赖不存在的外部包，单独编译不了，跳过
  const SKIP = { 'kt-package/example': '示意：import 了不存在的包 com.a，用来演示 import ... as 起别名' };
  const report = [];
  const runnable = [];
  for (const e of entries) {
    const errs = res.errors.get(e.key);
    if (SKIP[e.key]) { report.push({ key: e.key, status: '跳过', detail: SKIP[e.key] }); continue; }
    if (errs) {
      const unexpected = errs.filter((x) => !isExpectedErrorLine(x.src));
      if (unexpected.length) report.push({ key: e.key, status: '编译失败', detail: unexpected.slice(0, 3).map((x) => `${x.msg}  ⟵ ${x.src.trim()}`).join(' | ') });
      else report.push({ key: e.key, status: '通过', detail: `只有标注过的编译错误：${errs.map((x) => `${x.msg}  ⟵ ${x.src.trim()}`).join(' | ')}` });
      continue;
    }
    if (e.android) { report.push({ key: e.key, status: '通过', detail: 'Android：只编译' }); continue; }
    runnable.push(e);
  }
  for (const e of runnable) {
    const exp = expectedOutputs(e.code);
    const r = run(e.withCtx ? res.jar2 : res.jar, `${e.pkg}.SKt`);
    let got = r.stdout.split('\n').filter((l) => l.length);
    // 带上下文时，前面是 example 的输出，只看 vs 自己的那部分：从末尾对齐
    const mism = [];
    let j = 0;
    for (const x of exp) {
      if (/左右|大约|约 ?\d|每次/.test(x)) continue;   // 时间之类的近似值不逐字比较
      let k = j;
      while (k < got.length && !same(x, got[k])) k++;
      if (k < got.length) j = k + 1;
      else mism.push(`写的「${x}」在实际输出里没找到`);
    }
    const thrown = (r.stderr.match(/Exception in thread "main" ([\w.$]+)/) || [])[1] || '';
    const simple = thrown.split('.').pop();
    const expectedCrash = thrown && (e.code.includes(simple) || /运行时(抛|崩溃|异常)|会抛|抛出/.test(e.code));
    if (r.code !== 0 && !expectedCrash) mism.push(`退出码 ${r.code}：${(r.stderr.split('\n').find((l) => l.trim()) || '').trim()}`);
    report.push({ key: e.key, status: mism.length ? '输出不符' : '通过', detail: mism.join(' ; ') + (expectedCrash ? `（预期内异常 ${simple}）` : ''), got: got.join(' ⏎ ') });
  }

  // 第三轮："编译错误"断言：取消注释的那一行必须报错
  const variants = [];
  for (const e of entries) {
    for (const v of errorVariants(e.code)) {
      const ve = { key: `${e.key}#L${v.line}`, card: e.card, claim: v.claim, text: v.text };
      writeEntry(ve, v.code, e.withCtx ? e.card.example : null);
      variants.push(ve);
    }
  }
  if (variants.length) {
    const vr = compileBatch(variants, path.join(WORK, 'v.jar'));
    for (const v of variants) {
      const hit = (vr.errors.get(v.key) || []).filter((x) => /@@VARIANT@@/.test(x.src));
      if (hit.length) report.push({ key: v.key, status: '断言成立', detail: `写的「${v.claim}」实际「${hit[0].msg}」` });
      else report.push({ key: v.key, status: '断言不成立', detail: `取消注释后这一行没报错：${v.text}${vr.errors.has(v.key) ? `（别处报错：${vr.errors.get(v.key)[0].msg}）` : ''}` });
    }
  }

  const count = {};
  for (const r of report) count[r.status] = (count[r.status] || 0) + 1;
  const verbose = !!process.env.VERBOSE;
  for (const r of report) if (verbose || !/^(通过)$/.test(r.status)) console.log(`[${r.status}] ${r.key}  ${r.detail}${r.got && r.status === '输出不符' ? `\n      实际输出：${r.got}` : ''}`);
  console.log('统计：', JSON.stringify(count));
  // KEEP=1：保留临时目录和 report.json，方便排查
  if (process.env.KEEP) fs.writeFileSync(path.join(WORK, 'report.json'), JSON.stringify(report, null, 1));
  else fs.rmSync(WORK, { recursive: true, force: true });
  if (report.some((r) => /失败|不符|不成立/.test(r.status))) process.exitCode = 1;
})();
