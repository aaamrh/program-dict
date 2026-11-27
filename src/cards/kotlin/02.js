// kotlin · 空安全（5 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'kotlin', cat, ...c }));

  add('空安全', [
    {
      id: 'kt-safe-call', title: '?. 安全调用', syntax: 'a?.b()',
      why: '对可能为 null 的值调用方法或读属性，又不想先写一大串 `if (x != null)`。值不为 null 就正常调用；为 null 就什么都不做，整个表达式得到 null，不会抛空指针。',
      example: 'data class Address(val city: String)\ndata class User(val address: Address?)\n\nval u1: User? = User(Address("上海"))\nval u2: User? = null\n\nprintln(u1?.address?.city)   // 输出：上海\nprintln(u2?.address?.city)   // 输出：null（u2 是 null，后面都不执行）\n\nval ok: Boolean? = u2?.address?.city?.isEmpty()\nprintln(ok == true)          // 输出：false（把 Boolean? 转成普通 Boolean 的常见写法）',
      vs: ['?. 和普通 . 和 !! 的区别', 'val s: String? = null\n// s.length          // 编译错误：可空类型不能直接用 .\nprintln(s?.length)   // 输出：null，安全\nprintln(s!!.length)  // 运行时抛 NullPointerException\n\n// 不用 ?. 的写法：\nval len = if (s != null) s.length else null'],
      ts: 'const u2: User | null = null;\nconsole.log(u2?.address?.city);   // undefined —— Kotlin 得到的是 null\nconst ok = u2?.address?.city === "";\n// 写法和 TS 的可选链一样，区别只在结果是 null 还是 undefined',
      desc: '- 可以连写：`a?.b?.c`，任何一环是 null，结果就是 null\n- 结果类型一定可空：`s?.length` 的类型是 `Int?`\n- 经常和 `?:` 一起用：`s?.length ?: 0`',
      cmp: ['Java', 'Integer len = name != null ? name.length() : null;'],
      pit: '结果类型一定是可空的。比如 `x?.isOk()` 的类型是 `Boolean?`，不能直接放进 `if`，常写成 `if (x?.isOk() == true)`。',
      q: '(navigation_suffix "?." @hit)', kw: '\\?\\.', tags: ['?.', 'null', '空安全', '可选链'],
    },
    {
      id: 'kt-elvis', title: '?: Elvis 默认值', syntax: 'a ?: b',
      why: '值是 null 时换成一个默认值，或者直接 `return`/`throw` 提前退出。一行代替 "if 为 null 就……否则……"。',
      example: 'fun greet(name: String?) {\n    val n = name ?: "游客"          // null 时用默认值\n    println("你好，$n")\n}\n\nfun lengthOf(s: String?): Int {\n    val text = s ?: return -1       // null 时直接从函数返回\n    return text.length              // 这里 text 已经是非空 String\n}\n\ngreet("Tom")              // 输出：你好，Tom\ngreet(null)               // 输出：你好，游客\nprintln(lengthOf(null))   // 输出：-1',
      vs: ['不用 ?: 的写法', 'fun greet(name: String?) {\n    val n = if (name != null) name else "游客"   // 不用 ?: 要多写一遍 name\n    println("你好，$n")\n}\n\nfun lengthOf(s: String?): Int {\n    if (s == null) {\n        return -1\n    }\n    return s.length                             // 判空之后 s 自动当成 String\n}\n\ngreet(null)               // 输出：你好，游客\nprintln(lengthOf(null))   // 输出：-1'],
      ts: 'function greet(name: string | null) {\n  const n = name ?? "游客";   // ?: ≈ TS 的 ??\n  console.log(`你好，${n}`);\n}\n// 注意：TS 的 || 遇到 "" 和 0 也会用默认值，?: 和 ?? 只看 null',
      desc: '- 只有左边是 `null` 时才用右边，空字符串、0 都不算\n- 右边可以是 `return`、`throw`、`continue`：`val id = x ?: throw IllegalArgumentException()`',
      cmp: ['Java', 'String n = name != null ? name : "游客";'],
      q: '(elvis_expression "?:" @hit)', kw: '\\?:', tags: ['?:', 'elvis', '默认值', '??'],
    },
    {
      id: 'kt-not-null', title: '!! 非空断言', syntax: 'a!!',
      why: '你确定一个可空值此刻不是 null，想当非空类型直接用。编译器不再检查；万一真是 null，运行时立刻抛 `NullPointerException`。',
      example: 'val map = mapOf("a" to 1)\n\nval v: Int? = map["a"]     // Map 取值的结果是可空的\nval n: Int = v!!           // 断言不是 null\nprintln(n + 1)             // 输出：2\n\nval w: Int? = map["b"]\nprintln(w!! + 1)           // 运行时抛 NullPointerException',
      vs: ['!! 和更安全的写法', 'val map = mapOf("a" to 1)\nval w: Int? = map["b"]        // 取不到，w 是 null\n\n// val a = w!!                // 是 null 就崩溃：运行时抛 NullPointerException\nval b = w ?: 0                // 是 null 就用默认值\nval d = w?.plus(1)            // 是 null 就跳过，结果也是 null\nprintln("$b $d")              // 输出：0 null\nval c = w ?: error("缺少 b")   // 是 null 就抛出带说明的异常：IllegalStateException: 缺少 b，排查更方便'],
      ts: 'const v = map.get("a")!;   // TS 的 ! 写法相同\nconsole.log(v + 1);\n// 关键区别：TS 的 ! 只是告诉编译器"别检查"，运行时不做任何事；\n// Kotlin 的 !! 运行时会检查，是 null 立刻抛异常',
      desc: '- `x!!` 的类型是非空的 `T`\n- 一行里出现多个 `!!` 时，异常堆栈不好看出是哪一个',
      pit: '尽量少用。确实需要时，用 `?: error("原因")` 或 `requireNotNull(x) { "原因" }`，出错时信息更清楚。',
      q: '(postfix_expression "!!" @hit)', kw: '!!', tags: ['!!', 'NPE', '非空断言'],
    },
    {
      id: 'kt-smart-cast', title: 'is 类型判断与智能转换', syntax: 'if (x is String) x.length',
      why: '判断一个值是不是某种类型，判断成立后不用手动强转：编译器在那个分支里自动把它当作该类型。判空后也一样，会自动当成非空类型。',
      example: 'fun describe(x: Any): String {\n    if (x is String) {\n        return "字符串，长度 ${x.length}"   // 这里 x 已经被当成 String\n    }\n    if (x !is Int) return "未知类型"\n    return "整数，加一是 ${x + 1}"          // 这里 x 被当成 Int\n}\n\nprintln(describe("hi"))   // 输出：字符串，长度 2\nprintln(describe(41))     // 输出：整数，加一是 42\nprintln(describe(1.5))    // 输出：未知类型',
      vs: ['不用智能转换（Java 老写法）', 'fun old(x: Any) {\n    if (x is String) {\n        val s = x as String     // 多余的手动强转：上一行判断过，x 已经是 String\n        println(s.length)\n    }\n}\n\n// 智能转换失效的情况：可变属性在判断之后可能被别的代码改掉\nclass Box(var v: Any)\nfun f(b: Box) {\n    if (b.v is String) {\n        // println(b.v.length)  // 编译错误：Smart cast to \'String\' is impossible, because \'v\' is a mutable property that could be mutated concurrently\n    }\n    val v = b.v                 // 解决办法：先存进局部 val\n    if (v is String) println(v.length)\n}'],
      ts: 'function describe(x: unknown): string {\n  if (typeof x === "string") return `字符串，长度 ${x.length}`;   // TS 的类型收窄\n  if (typeof x !== "number") return "未知类型";\n  return `整数，加一是 ${x + 1}`;\n}\n// 类实例用 instanceof：if (x instanceof Date) x.getTime()',
      desc: '- `!is` 表示"不是"\n- `when` 里也能用：`is String -> ...`\n- 智能转换只对编译器能确定"判断之后没被改过"的变量生效，比如局部变量、`val` 属性',
      cmp: ['Java', 'if (obj instanceof String s) {\n    System.out.println(s.length());\n}'],
      pit: '可变的类属性（`var`）不会智能转换，因为判断之后可能被别的线程改掉。先赋给局部变量再判断：`val v = b.v; if (v is String) v.length`。',
      q: '[(check_expression "is" @hit) (type_test "is" @hit)]', tags: ['is', 'instanceof', '智能转换', 'smart cast', '类型收窄'],
    },
    {
      id: 'kt-as', title: 'as / as? 类型转换', syntax: 'x as String    x as? String',
      why: '把一个"宽"类型（比如 `Any`、父类、接口）当成具体类型来用。`as` 转不成功就抛异常；`as?` 转不成功就得到 null，配合 `?:` 可以安全地兜底。',
      example: 'val values: List<Any> = listOf("hi", 42)\n\nval s = values[0] as String       // 确定是 String\nprintln(s.length)                 // 输出：2\n\nval n = values[0] as? Int         // 不是 Int，得到 null\nprintln(n)                        // 输出：null\nprintln(values[1] as? Int ?: 0)   // 输出：42\n\nval bad = values[1] as String     // 运行时抛 ClassCastException',
      vs: ['as 和 as? 的区别', 'val x: Any = 42\nval a = x as String      // 运行时抛 ClassCastException\nval b = x as? String     // 得到 null，类型是 String?\nval c = (x as? String) ?: "默认"   // 常见用法'],
      ts: 'const values: unknown[] = ["hi", 42];\nconst s = values[0] as string;   // TS 的 as 只在编译期生效，运行时不检查\nconsole.log(s.length);\n// Kotlin 的 as 运行时会检查，类型不对就抛异常\nconst n = typeof values[0] === "number" ? values[0] : null;   // 相当于 as? Int',
      desc: '- 转换前已经用 `is` 判断过，就不需要 `as`，智能转换会自动处理\n- 泛型参数在运行时被擦除，`x as List<String>` 只能检查到是 List，编译器会给出 unchecked cast 警告',
      cmp: ['Java', 'String s = (String) obj;   // 失败同样抛 ClassCastException'],
      q: '(as_expression) @hit', tags: ['as', 'as?', '强转', 'cast', '类型转换'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
