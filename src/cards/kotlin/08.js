// kotlin · 泛型（4 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'kotlin', cat, ...c }));

  add('泛型', [
    {
      id: 'kt-generics', title: '<T> 泛型', syntax: 'fun <T> f(x: T)    class Box<T>',
      why: '写一份代码适用于多种类型，同时保留类型检查。比如"取列表第一个，没有就返回默认值"，对 `List<String>`、`List<Int>` 都能用，返回值的类型也跟着变，不用强转。',
      example: '// 1. 泛型函数：T 由调用时的参数决定\nfun <T> firstOr(list: List<T>, default: T): T = list.firstOrNull() ?: default\n\nval s: String = firstOr(listOf("a", "b"), "none")   // T = String\nval n: Int = firstOr(emptyList(), 0)                // T = Int\nprintln(s)   // 输出：a\nprintln(n)   // 输出：0\n\n// 2. 泛型类\nclass Box<T>(val value: T)\nval b = Box(42)          // 推断出 Box<Int>\nprintln(b.value + 1)     // 输出：43（不用强转）',
      vs: ['用 Any 代替泛型会怎样', 'fun firstOrAny(list: List<Any>, default: Any): Any = list.firstOrNull() ?: default\n\nval s = firstOrAny(listOf("a"), "none")\nprintln(s.length)               // 编译错误：Any 没有 length，类型信息丢了\nprintln((s as String).length)   // 只能强转，转错了运行时抛 ClassCastException'],
      ts: 'function firstOr<T>(list: T[], d: T): T { return list[0] ?? d; }\nconst s = firstOr(["a", "b"], "none");   // T = string\nclass Box<T> { constructor(readonly value: T) {} }\nconst b = new Box(42);                   // Box<number>',
      desc: '- `<T : Comparable<T>>` 限定上界：T 必须能比较大小\n- 多个约束用 `where T : A, T : B`\n- 运行时 T 会被擦除，要在运行时拿到 T 需要 `reified`',
      cmp: ['Java', '<T> T firstOr(List<T> list, T d) { return list.isEmpty() ? d : list.get(0); }'],
      q: '(type_parameters) @hit', tags: ['泛型', 'generic', '<T>'],
    },
    {
      id: 'kt-type-args', title: 'Foo<Bar> 类型实参', syntax: 'List<String>    MutableSharedFlow<Unit>()',
      why: '告诉泛型类或函数"这次具体用哪种类型"，编译器据此检查放进去、取出来的值。能从参数推断出来时可以省略。',
      example: '// 1. 明确写出类型实参：之后只能放 String\nval names: MutableList<String> = mutableListOf()\nnames.add("Tom")\nprintln(names)            // 输出：[Tom]\n\n// 2. 没有参数可推断时必须写\nval empty = emptyList<Int>()\nval flow = MutableSharedFlow<Unit>(extraBufferCapacity = 1)\n\n// 3. 能推断时省略\nval ids = listOf(1, 2, 3)   // 推断出 List<Int>\nprintln(ids.sum())          // 输出：6',
      vs: ['写与不写类型实参', 'val a = mutableListOf<String>()   // 写了：之后只能放 String\na.add(42)                          // 编译错误：Int 不能放进 MutableList<String>\nval b = mutableListOf()            // 编译错误：Not enough information to infer type variable T\nval c = mutableListOf("x")         // 能从参数推断出 MutableList<String>，可以不写'],
      ts: 'const names: string[] = [];\nconst empty: number[] = [];\nconst subject = new Subject<void>();   // 写法相同：类型实参放在尖括号里\nconst ids = [1, 2, 3];                // 推断出 number[]',
      desc: '- 写在类型后面：`List<String>`；写在函数名后面：`emptyList<Int>()`\n- `<*>` 表示"某种不确定的类型"，类似 Java 的 `<?>`',
      q: '(type_arguments) @hit', tags: ['泛型', '<>', '类型实参'],
    },
    {
      id: 'kt-variance', title: 'out / in 型变', syntax: 'class Box<out T>    fun f(c: Comparator<in T>)',
      why: '解决"`Source<String>` 能不能当 `Source<Any>` 用"这类问题。只往外取值的类型参数标 `out`，就能安全地当成父类型用；只往里放值的标 `in`。不标的话，编译器为了安全一律拒绝。',
      example: '// 1. out：只产出 T，所以 Source<String> 可以当 Source<Any> 用\ninterface Source<out T> { fun next(): T }\nclass Names : Source<String> { override fun next() = "Tom" }\n\nfun printAny(src: Source<Any>) = println(src.next())\nprintAny(Names())    // 输出：Tom（因为标了 out，才允许这样传）\n\n// 2. in：只消费 T，所以 Sink<Any> 可以当 Sink<String> 用\ninterface Sink<in T> { fun put(x: T) }\nval anySink = object : Sink<Any> { override fun put(x: Any) = println("got $x") }\nval strSink: Sink<String> = anySink\nstrSink.put("hi")    // 输出：got hi',
      vs: ['不标 out 会怎样', 'interface Box<T> { fun get(): T }\nfun take(b: Box<Any>) {}\nval sb: Box<String> = object : Box<String> { override fun get() = "x" }\ntake(sb)   // 编译错误：Type mismatch，Box<String> 不是 Box<Any>\n\ninterface Source<out T> {\n    fun put(x: T)   // 编译错误：T 标了 out，却出现在参数位置（in position）\n}'],
      ts: 'interface Source<out T> { next(): T }   // TS 4.7+ 也能显式标注 in/out\ninterface Sink<in T> { put(x: T): void }\n// 不标时 TS 按结构自动推断；数组 T[] 在 TS 里按协变处理（并不完全安全）',
      desc: '- `out T` 对应 Java 的 `? extends T`，`in T` 对应 `? super T`\n- 标准库的 `List<out E>` 只读，所以 `List<String>` 可以当 `List<Any>`；`MutableList<E>` 不行\n- 也可以在使用处标：`fun copy(from: Array<out Any>)`',
      cmp: ['Java', 'List<? extends Number> src;\nComparator<? super T> cmp;'],
      q: '(variance_modifier) @hit', tags: ['out', 'in', '协变', '逆变', 'extends', 'super'],
    },
    {
      id: 'kt-reified', title: 'inline + reified 具体化类型参数', syntax: 'inline fun <reified T> f()',
      why: '普通泛型在运行时会被擦除，函数里不知道 T 到底是什么，所以不能写 `x is T`、`T::class`。`inline` 加 `reified` 让编译器在调用处把 T 换成真实类型，就能按类型过滤、按类型取对象，调用时也不用额外传 Class 参数。',
      example: '// 1. 按类型过滤：调用处的 T 会被替换成真实类型\ninline fun <reified T> List<Any>.only(): List<T> = filter { it is T }.map { it as T }\n\nval mixed = listOf(1, "a", 2, "b")\nprintln(mixed.only<String>())   // 输出：[a, b]\nprintln(mixed.only<Int>())      // 输出：[1, 2]\n\n// 2. 拿到类名\ninline fun <reified T> typeName() = T::class.simpleName\nprintln(typeName<String>())     // 输出：String',
      vs: ['不加 reified 会怎样', 'import kotlin.reflect.KClass\n\n// fun <T> isA(x: Any) = x is T   // 编译错误：Cannot check for instance of erased type \'T\'\n\n// 不用 reified，只能显式传 Class：\nfun <T : Any> isA(x: Any, cls: KClass<T>) = cls.isInstance(x)\nprintln(isA("a", String::class))   // 输出：true（每次调用都要多传一个参数）'],
      ts: '// TS 没有对应写法：类型在运行时全部擦除，拿不到 T。只能显式传入类：\nfunction only<T>(xs: unknown[], cls: new (...a: any[]) => T): T[] {\n  return xs.filter((x): x is T => x instanceof cls);\n}\nonly([new Date(), "a"], Date);   // [Date]',
      desc: '- 只能用在 `inline` 函数上\n- 标准库的 `filterIsInstance<T>()` 就是这样实现的',
      q: '(reification_modifier) @hit', tags: ['reified', '类型擦除', 'inline'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
