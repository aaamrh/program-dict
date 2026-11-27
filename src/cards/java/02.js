// java · 运算符（5 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('运算符', [
    {
      id: 'java-ternary', title: 'a ? b : c 三元运算符', syntax: 'cond ? x : y',
      why: '根据条件在两个值里选一个，一行写完。用来代替"只为了给一个变量赋不同值"的 if-else。',
      example: 'int score = 75;\nString level = score >= 60 ? "及格" : "不及格";\nSystem.out.println(level);   // 输出：及格\n\nint a = 3, b = 8;\nint max = a > b ? a : b;\nSystem.out.println(max);     // 输出：8',
      vs: ['不用三元运算符的写法', 'String level;\nif (score >= 60) {\n    level = "及格";\n} else {\n    level = "不及格";\n}\n// 效果相同，但要写 6 行，而且 level 不能声明成 final'],
      ts: 'const score = 75;\nconst level = score >= 60 ? "及格" : "不及格";  // 写法完全相同\nconsole.log(level);  // 及格',
      desc: '- 是表达式，有返回值，可以直接赋值、传参、return\n- 嵌套多层会很难读，超过两层就改用 if-else 或 switch',
      cmp: ['Kotlin', 'val level = if (score >= 60) "及格" else "不及格"  // Kotlin 没有 ?:，if 本身就有返回值'],
      q: '(ternary_expression) @hit', tags: ['?:', '三元', '条件'],
    },

    {
      id: 'java-equality', title: '== 与 equals', syntax: 'a == b    a.equals(b)',
      why: '判断两个值"相等"有两种意思：是不是同一个对象，还是内容是不是一样。Java 用 `==` 表示前者，用 `equals` 表示后者。从 TS 过来最容易在字符串比较上踩坑。',
      example: 'String a = "Tom";\nString b = new String("Tom");   // 内容相同的另一个对象\nSystem.out.println(a.equals(b)); // 输出：true（内容相同）\nSystem.out.println(a == b);      // 输出：false（不是同一个对象）\n\nint x = 5, y = 5;\nSystem.out.println(x == y);      // 输出：true（基本类型用 == 比较值）',
      vs: ['== 和 equals 的区别', '// 基本类型（int、double、boolean）：用 ==\n// 对象（String、Integer、自定义类）：用 equals\n\nString input = readInput();        // 比如用户输入了 "Tom"\nif (input == "Tom") {}             // 几乎总是 false，这是常见 bug\nif (input.equals("Tom")) {}        // 正确，但 input 为 null 时抛 NullPointerException\nif ("Tom".equals(input)) {}        // 更安全：input 为 null 时返回 false\nif (Objects.equals(input, "Tom")) {} // 两边都可能为 null 时用这个'],
      ts: 'const a = "Tom";\nconst b = String("Tom");\nconsole.log(a === b);   // true：TS 的 === 比较字符串内容\nconst o1 = { n: 1 }, o2 = { n: 1 };\nconsole.log(o1 === o2); // false：对象之间 === 比较引用，这一点和 Java 的 == 一样',
      desc: '- 自定义类默认的 `equals` 和 `==` 一样，比较的是引用；要按内容比较，必须重写 `equals` 和 `hashCode`\n- `record` 会自动按字段生成 `equals`',
      cmp: ['Kotlin', 'a == b    // Kotlin 的 == 就是调用 equals，并且能安全处理 null\na === b   // 比较引用'],
      pit: '字符串字面量会被复用，所以 `"Tom" == "Tom"` 碰巧是 true。这会让 `==` 比较字符串在测试时看起来没问题，上线后才出错。',
      q: '(binary_expression ["==" "!="] @hit)', tags: ['==', 'equals', '比较'],
    },

    {
      id: 'java-bitwise', title: '& | ^ ~ << >> >>> 位运算', syntax: 'flags & MASK    x << 2',
      why: '用一个 int 的不同二进制位表示多个开关（flag），一个整数就能存好几个 true/false。Android API 大量这样用，比如 `Intent` 的 flags、`View` 的可见性，读代码时会经常看到 `|` 组合、`&` 检查。',
      example: 'final int FLAG_READ  = 1;       // 二进制 001\nfinal int FLAG_WRITE = 1 << 1;  // 二进制 010\nfinal int FLAG_EXEC  = 1 << 2;  // 二进制 100\n\nint perm = FLAG_READ | FLAG_WRITE;            // 组合：011\nboolean canWrite = (perm & FLAG_WRITE) != 0;  // 检查某一位\nboolean canExec = (perm & FLAG_EXEC) != 0;\nSystem.out.println(perm);       // 输出：3\nSystem.out.println(canWrite + " " + canExec);  // 输出：true false\nperm = perm & ~FLAG_WRITE;      // 去掉某一位\nSystem.out.println(perm);       // 输出：1',
      vs: ['位运算 & | 和逻辑运算 && ||', 'boolean ok = user != null && user.isActive();  // && 短路：左边 false 就不算右边\nboolean bad = user != null & user.isActive();  // & 不短路：user 为 null 时右边照样执行，抛 NullPointerException\n\nSystem.out.println(-8 >> 1);    // 输出：-4（带符号右移，保留负号）\nSystem.out.println(-8 >>> 1);   // 输出：2147483644（无符号右移，高位补 0）'],
      ts: 'const FLAG_READ = 1, FLAG_WRITE = 1 << 1, FLAG_EXEC = 1 << 2;\nlet perm = FLAG_READ | FLAG_WRITE;\nconsole.log((perm & FLAG_WRITE) !== 0);  // true\nperm &= ~FLAG_WRITE;\nconsole.log(perm);                       // 1\n// TS 的位运算同样按 32 位整数计算，>>> 含义也相同',
      desc: '- `&` 与、`|` 或、`^` 异或、`~` 取反、`<<` 左移、`>>` 带符号右移、`>>>` 无符号右移\n- 组合 flag 用 `|`，检查用 `(x & FLAG) != 0`，去掉用 `x & ~FLAG`',
      cmp: ['Kotlin', 'val perm = FLAG_READ or FLAG_WRITE\nval canWrite = (perm and FLAG_WRITE) != 0  // Kotlin 用 and/or/shl 这些中缀函数'],
      pit: '`&`、`|` 用在 boolean 上不会短路，两边都会执行。写条件判断要用 `&&`、`||`。',
      q: '[(binary_expression ["&" "|" "^" "<<" ">>" ">>>"] @hit) (unary_expression "~" @hit)]', tags: ['位运算', '&', '|', '<<', 'flag'],
    },

    {
      id: 'java-increment', title: 'i++ / ++i 自增自减', syntax: 'i++    ++i    i--',
      why: '给变量加 1 或减 1 的简写，最常见于 for 循环和计数。`i++` 和 `++i` 只有在"同时取它的值"时才有区别。',
      example: 'int count = 0;\ncount++;                        // 单独一句：等于 count = count + 1\nSystem.out.println(count);      // 输出：1\n\nfor (int i = 0; i < 3; i++) {\n    System.out.print(i + " ");  // 输出：0 1 2\n}',
      vs: ['i++ 和 ++i 的区别', 'int i = 5;\nint a = i++;    // 先取值再加 1：a = 5，i = 6\nint j = 5;\nint b = ++j;    // 先加 1 再取值：b = 6，j = 6\n\n// 单独成句时（i++; 或 ++i;）两者完全一样\n// 不要写 i = i++; 这样 i 的值不会变'],
      ts: 'let count = 0;\ncount++;\nlet i = 5;\nconst a = i++;  // a = 5，i = 6：规则和 Java 完全相同\nlet j = 5;\nconst b = ++j;  // b = 6',
      desc: '- `--` 同理\n- 在一个表达式里对同一个变量多次自增（如 `i++ + i++`）能编译，但很难读，不要这样写',
      cmp: ['Kotlin', 'count++  // 规则相同'],
      q: '(update_expression) @hit', tags: ['++', '--', '自增'],
    },

    {
      id: 'java-string-concat', title: '+ 字符串拼接', syntax: '"a=" + a',
      why: '把文字和变量拼成一个字符串，常用于日志和提示信息。`+` 的任意一边是字符串时，另一边会被自动转成字符串。',
      example: 'String name = "Tom";\nint age = 18;\nString msg = "name=" + name + ", age=" + age;\nSystem.out.println(msg);   // 输出：name=Tom, age=18\n\nString s = "结果：" + (age + 2);\nSystem.out.println(s);     // 输出：结果：20',
      vs: ['拼接顺序和括号', 'System.out.println(1 + 2 + "a");   // 输出：3a（从左往右算，先做数字加法）\nSystem.out.println("a" + 1 + 2);   // 输出：a12（遇到字符串之后都变成拼接）\nSystem.out.println("a" + (1 + 2)); // 输出：a3\n\n// 循环里大量拼接，改用 StringBuilder，避免每次都创建新字符串\nStringBuilder sb = new StringBuilder();\nfor (int i = 0; i < 3; i++) sb.append(i);\nSystem.out.println(sb.toString()); // 输出：012'],
      ts: 'const name = "Tom", age = 18;\nconst msg = `name=${name}, age=${age}`;  // TS 常用模板字符串；Java 没有模板字符串\nconsole.log(1 + 2 + "a");                 // "3a"：拼接规则和 Java 相同',
      desc: '- 对象会调用 `toString()` 转成字符串，null 会变成 `"null"`\n- 格式化可以用 `String.format("name=%s, age=%d", name, age)`',
      cmp: ['Kotlin', 'val msg = "name=$name, age=$age"  // Kotlin 有字符串模板'],
      q: '(binary_expression (string_literal) "+" @hit)', tags: ['+', '拼接', '字符串'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
