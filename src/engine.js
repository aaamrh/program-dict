// 语法识别引擎：浏览器和 Node 测试共用，不依赖 DOM。
// 用法：const engine = LangRef.createEngine({ Parser, languages, cards }); engine.analyze(code, 'auto')
(function (root) {
  'use strict';

  const LANGS = ['kotlin', 'java', 'rust'];

  // 残缺代码的包装方案：解析出错时依次尝试，取错误最少的结果。
  const WRAPPERS = {
    kotlin: [['class __W {\n', '\n}'], ['fun __f() {\n', '\n}'], ['val __v = __f(\n', '\n)']],
    java: [['class __W {\n', '\n}'], ['class __W { void __f() {\n', '\n}}'], ['class __W { Object __v = __f(\n', '\n); }']],
    // match 分支片段常带着 match 块的右括号，所以两种收尾都试。
    rust: [['fn __f() {\n', '\n}'], ['impl __W {\n', '\n}'], ['fn __f() { __g(\n', '\n); }'], ['fn __f() { match __x {\n', '\n}}'], ['fn __f() { match __x {\n', '\n}']],
  };

  // 粗略判断语言的特征写法，只在自动识别时给解析结果加权。
  const HINTS = {
    kotlin: [/\bfun\s+\w/, /\bval\s+\w/, /\bvar\s+\w+\s*[:=]/, /\?\./, /\bwhen\s*[({]/, /\bdata\s+class\b/, /\bsuspend\b/, /\bby\s+lazy\b/, /\bcompanion\s+object\b/, /!!/, /\?:/,
      /\)\s*:\s*[A-Z]\w*/, /\b[a-z]\w*:\s*[A-Z][\w.<>]*\?/, /\bis\s+[A-Z]\w*/, /\bit\./, /\w@\s|@\w+\b(?=\s*$)|return@|this@/, /\$\{|"[^"\n]*\$[a-z]/, /\bobject\s*[:A-Z{]/, /^import\s+[\w.]+\s*$/m],
    java: [/\bpublic\s/, /\bvoid\s+\w+\s*\(/, /\bnew\s+[A-Z]\w*/, /;\s*$/m, /@Override\b/, /\bSystem\.out\b/, /\bextends\s/, /\bimplements\s/, /\bfinal\s/, /\b(int|String|boolean)\s+\w+\s*[=;]/],
    rust: [/\bfn\s+\w/, /\blet\s+(mut\s+)?\w/, /\bimpl\b/, /&mut\b/, /\bpub\s/, /\bmatch\s+\w/, /\w+!\s*[([]/, /\buse\s+\w+::/, /\bOption</, /\bSome\(/, /'\w+\b(?!')/, /\bmut\b/, /::new\(/],
  };

  // 从语法树里取"被引用的名字"，用于 API 词典查询和"未识别"列表。
  const NAME_QUERIES = {
    kotlin: `
      (call_expression (simple_identifier) @call)
      (call_expression (navigation_expression (navigation_suffix (simple_identifier) @call)))
      (infix_expression . (_) . (simple_identifier) @call)
      (navigation_expression (simple_identifier) @ref)
      (navigation_suffix (simple_identifier) @ref)
      (user_type (type_identifier) @type)
      (value_argument (simple_identifier) @ref)
    `,
    java: `
      (method_invocation name: (identifier) @call)
      (method_invocation object: (identifier) @ref)
      (field_access object: (identifier) @ref)
      (field_access field: (identifier) @ref)
      (method_reference . (identifier) @ref)
      (type_identifier) @type
    `,
    rust: `
      (call_expression function: (identifier) @call)
      (call_expression function: (scoped_identifier name: (identifier) @call))
      (call_expression function: (field_expression field: (field_identifier) @call))
      (generic_function function: (identifier) @call)
      (generic_function function: (scoped_identifier name: (identifier) @call))
      (generic_function function: (field_expression field: (field_identifier) @call))
      (scoped_identifier path: (identifier) @ref)
      (scoped_type_identifier path: (identifier) @ref)
      (macro_invocation macro: (identifier) @macro)
      (type_identifier) @type
    `,
  };

  // 片段内自己声明的名字，不算"未识别"。
  const DECL_QUERIES = {
    kotlin: `
      (class_declaration (type_identifier) @d)
      (object_declaration (type_identifier) @d)
      (function_declaration (simple_identifier) @d)
      (variable_declaration (simple_identifier) @d)
      (parameter (simple_identifier) @d)
      (class_parameter (simple_identifier) @d)
      (lambda_parameters (variable_declaration (simple_identifier) @d))
      (type_parameter (type_identifier) @d)
    `,
    java: `
      (class_declaration name: (identifier) @d)
      (interface_declaration name: (identifier) @d)
      (enum_declaration name: (identifier) @d)
      (record_declaration name: (identifier) @d)
      (method_declaration name: (identifier) @d)
      (variable_declarator name: (identifier) @d)
      (formal_parameter name: (identifier) @d)
      (type_parameter (type_identifier) @d)
      (constructor_declaration name: (identifier) @d)
      (enum_constant name: (identifier) @d)
      (enhanced_for_statement name: (identifier) @d)
      (lambda_expression parameters: (identifier) @d)
      (inferred_parameters (identifier) @d)
      (catch_formal_parameter name: (identifier) @d)
      (resource name: (identifier) @d)
      (instanceof_expression name: (identifier) @d)
    `,
    rust: `
      (struct_item name: (type_identifier) @d)
      (enum_item name: (type_identifier) @d)
      (trait_item name: (type_identifier) @d)
      (function_item name: (identifier) @d)
      (let_declaration pattern: (identifier) @d)
      (parameter pattern: (identifier) @d)
      (type_parameters (type_identifier) @d)
      (closure_parameters (identifier) @d)
    `,
  };

  // 修饰符被解析成普通标识符，说明片段放错了上下文（比如类成员被当成顶层表达式），需要换包装再试。
  const MISPARSE_NAMES = {
    kotlin: new Set(['companion', 'override', 'private', 'protected', 'internal', 'public', 'init', 'constructor', 'lateinit', 'abstract', 'open', 'data', 'sealed', 'inner', 'const']),
  };

  // 太常见、没必要列为"未识别"的名字。
  const IGNORE_NAMES = new Set(['this', 'self', 'Self', 'super', 'it', 'String', 'Int', 'Long', 'Boolean', 'Unit', 'Any', 'Object', 'Integer', 'std', 'core', 'alloc', 'crate']);

  // 补齐括号：缺右括号就在末尾补，多出右括号就在开头补左括号。
  function balance(code) {
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const closers = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    let lead = '';
    for (let i = 0; i < code.length; i++) {
      const c = code[i];
      if (c === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
      if (c === '"' || c === '\'' || c === '`') {
        const q = c;
        for (i++; i < code.length && code[i] !== q && code[i] !== '\n'; i++) if (code[i] === '\\') i++;
        continue;
      }
      if (pairs[c]) stack.push(c);
      else if (closers[c]) {
        if (stack.length && stack[stack.length - 1] === closers[c]) stack.pop();
        else if (!stack.length) lead = closers[c] + lead;
      }
    }
    const tail = stack.reverse().map((c) => pairs[c]).join('');
    if (!lead && !tail) return null;
    return { prefix: lead ? lead + '\n' : '', suffix: tail ? '\n' + tail : '' };
  }

  function countErrors(node) {
    let n = 0;
    const cursor = node.walk();
    let more = true;
    while (more) {
      const t = cursor.nodeType;
      if (t === 'ERROR' || cursor.nodeIsMissing) n++;
      if (cursor.gotoFirstChild()) continue;
      while (!cursor.gotoNextSibling()) { if (!cursor.gotoParent()) { more = false; break; } }
    }
    return n;
  }

  function countMisparse(node, lang) {
    const names = MISPARSE_NAMES[lang];
    if (!names) return 0;
    let n = 0;
    for (const id of node.descendantsOfType('simple_identifier')) if (names.has(id.text)) n++;
    return n;
  }

  function lineOf(code, index) {
    let line = 1;
    for (let i = 0; i < index && i < code.length; i++) if (code[i] === '\n') line++;
    return line;
  }

  function createEngine({ Parser, languages, cards }) {
    const parser = new Parser();
    const byId = new Map();
    const perLang = {};
    const problems = [];

    for (const lang of LANGS) {
      const L = languages[lang];
      perLang[lang] = { cards: [], apiByName: new Map(), nameQuery: null, declQuery: null };
      if (!L) continue;
      const P = perLang[lang];
      try { P.nameQuery = L.query(NAME_QUERIES[lang]); } catch (e) { problems.push(`${lang} NAME_QUERIES: ${e.message}`); }
      try { P.declQuery = L.query(DECL_QUERIES[lang]); } catch (e) { problems.push(`${lang} DECL_QUERIES: ${e.message}`); }
    }

    for (const card of cards) {
      byId.set(card.id, card);
      const P = perLang[card.lang];
      if (!P) { problems.push(`${card.id}: unknown lang ${card.lang}`); continue; }
      P.cards.push(card);
      if (card.q && languages[card.lang]) {
        try { card._query = languages[card.lang].query(card.q); } catch (e) { problems.push(`${card.id}: ${e.message}`); }
      }
      if (card.kw) card._kw = new RegExp(card.kw, 'g');
      for (const name of card.api || []) P.apiByName.set(name, card);
    }

    // 解析单个语言：原样、补括号、各种包装依次尝试，取错误最少的。
    function bestParse(code, lang) {
      parser.setLanguage(languages[lang]);
      const fix = balance(code);
      const bases = [{ prefix: '', suffix: '' }];
      if (fix) bases.push(fix);
      let best = null;
      const tryOne = (prefix, suffix) => {
        const tree = parser.parse(prefix + code + suffix);
        const errors = countErrors(tree.rootNode);
        const bad = errors * 10 + countMisparse(tree.rootNode, lang);
        if (!best || bad < best.bad) { if (best) best.tree.delete(); best = { tree, errors, bad, offset: prefix.length, lang }; }
        else tree.delete();
      };
      for (const b of bases) {
        tryOne(b.prefix, b.suffix);
        if (best.bad === 0) return best;
      }
      for (const b of bases) {
        for (const [wp, ws] of WRAPPERS[lang]) {
          tryOne(b.prefix + wp, ws + b.suffix);
          if (best.bad === 0) return best;
        }
      }
      return best;
    }

    // prefer：上一次识别出的语言。分数接近时优先选它，连续读同一个项目时更稳定。
    function detect(code, prefer) {
      const results = [];
      for (const lang of LANGS) {
        if (!languages[lang]) continue;
        const r = bestParse(code, lang);
        const hints = HINTS[lang].filter((re) => re.test(code)).length;
        r.score = r.errors * 2 - hints * 3 - (lang === prefer ? 2 : 0);
        results.push(r);
      }
      results.sort((a, b) => a.score - b.score);
      for (const r of results.slice(1)) r.tree.delete();
      return results[0];
    }

    function analyze(code, lang, prefer) {
      if (!code.trim()) return { lang: lang === 'auto' ? null : lang, items: [], unknown: [], errors: 0 };
      const parsed = lang === 'auto' ? detect(code, prefer) : bestParse(code, lang);
      const { tree, offset } = parsed;
      const P = perLang[parsed.lang];
      const end = offset + code.length;
      const inUser = (n) => n.startIndex >= offset && n.endIndex <= end;
      const toRange = (n) => ({ start: n.startIndex - offset, end: n.endIndex - offset, text: n.text });
      const found = new Map();
      const add = (card, range, certainty) => {
        let item = found.get(card.id);
        if (!item) { item = { card, ranges: [], certainty }; found.set(card.id, item); }
        if (certainty === 'sure') item.certainty = 'sure';
        if (!item.ranges.some((r) => r.start === range.start && r.end === range.end)) item.ranges.push(range);
      };

      // 1. 语法层：卡片自带的 tree-sitter 查询。
      for (const card of P.cards) {
        if (!card._query) continue;
        for (const m of card._query.matches(tree.rootNode)) {
          const cap = m.captures.find((c) => c.name === 'hit') || m.captures[0];
          if (cap && inUser(cap.node)) add(card, toRange(cap.node), 'sure');
        }
      }

      // 2. API 词典层：语法树里被调用、被引用的名字。
      const declared = new Set();
      if (P.declQuery) for (const c of P.declQuery.captures(tree.rootNode)) declared.add(c.node.text);
      const unknown = new Map();
      if (P.nameQuery) {
        for (const c of P.nameQuery.captures(tree.rootNode)) {
          if (!inUser(c.node)) continue;
          const name = c.name === 'macro' ? c.node.text + '!' : c.node.text;
          const card = P.apiByName.get(name);
          if (card) { add(card, toRange(c.node), 'sure'); continue; }
          if (name.startsWith('__') || declared.has(name) || IGNORE_NAMES.has(name)) continue;
          // 命名参数的参数名（name = value）和全大写常量对读代码帮助不大，不列入"未识别"。
          if (c.node.nextSibling?.type === '=' || /^[A-Z][A-Z0-9_]+$/.test(name)) continue;
          if (!unknown.has(name)) unknown.set(name, toRange(c.node));
        }
      }

      // 3. 关键字兜底：只看仍然解析出错的区域，结果标为"可能是"。
      if (parsed.errors > 0) {
        const errorRanges = tree.rootNode.descendantsOfType('ERROR').filter(inUser).map(toRange);
        const inError = (i) => errorRanges.some((r) => i >= r.start && i < r.end);
        for (const card of P.cards) {
          if (!card._kw) continue;
          card._kw.lastIndex = 0;
          let m;
          while ((m = card._kw.exec(code))) {
            if (m[0] === '') { card._kw.lastIndex++; continue; }
            const covered = found.get(card.id)?.ranges.some((r) => m.index >= r.start && m.index < r.end);
            if (!covered && inError(m.index)) add(card, { start: m.index, end: m.index + m[0].length }, 'maybe');
          }
        }
      }

      const items = [...found.values()];
      for (const it of items) {
        it.ranges.sort((a, b) => a.start - b.start);
        it.line = lineOf(code, it.ranges[0].start);
      }
      items.sort((a, b) => a.ranges[0].start - b.ranges[0].start || b.ranges[0].end - a.ranges[0].end);
      const result = {
        lang: parsed.lang,
        errors: parsed.errors,
        items,
        unknown: [...unknown.entries()].map(([name, r]) => ({ name, line: lineOf(code, r.start), ...r })),
      };
      tree.delete();
      return result;
    }

    // 搜索：标题、写法、关键词、API 名都参与匹配。
    function search(text, lang) {
      const q = text.trim().toLowerCase();
      if (!q) return [];
      const scored = [];
      for (const card of cards) {
        if (lang && lang !== 'auto' && card.lang !== lang) continue;
        const fields = [card.title, card.syntax, (card.tags || []).join(' '), (card.api || []).join(' '), card.desc];
        let score = 0;
        fields.forEach((f, i) => {
          if (!f) return;
          const s = f.toLowerCase();
          if (s === q) score += 100;
          else if (s.includes(q)) score += 10 - i;
        });
        if (score) scored.push({ card, score });
      }
      return scored.sort((a, b) => b.score - a.score).map((s) => s.card);
    }

    return { analyze, search, byId, perLang, problems, LANGS };
  }

  root.LangRef = { createEngine, LANGS, balance };
})(typeof window !== 'undefined' ? window : globalThis);
