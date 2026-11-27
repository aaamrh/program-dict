// kotlin · 属性委托（2 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'kotlin', cat, ...c }));

  add('属性委托', [
    {
      id: 'kt-by-lazy', title: 'by lazy { } 延迟初始化', syntax: 'val x by lazy { create() }',
      why: '有些对象创建成本高，或者创建时依赖稍后才可用的东西（比如 Android 的 `applicationContext`），希望"第一次用到时才创建，之后一直复用"。不用 `lazy` 就得自己写 null 判断和缓存，还要考虑多线程。',
      example: 'class Repo {\n    // 1. 声明时不创建，第一次读 db 时才执行大括号\n    val db by lazy {\n        println("打开数据库")\n        "DB 连接"\n    }\n}\n\nval r = Repo()\nprintln("Repo 已创建")   // 输出：Repo 已创建（此时还没打开数据库）\nprintln(r.db)           // 输出：打开数据库\n                        //       DB 连接\nprintln(r.db)           // 输出：DB 连接（第二次直接返回缓存，不再执行大括号）',
      vs: ['直接赋值和 by lazy 的区别', 'fun heavy(): String { println("heavy() 执行了"); return "结果" }\n\nclass A {\n    val x = heavy()             // 创建 A 时立刻执行 heavy()，哪怕之后根本没用到 x\n    val y by lazy { heavy() }   // 第一次读 y 时才执行，以后复用\n}\nA()                             // 输出：heavy() 执行了（只有 x 的那一次，y 还没被读）\n\n// Android 里的典型坑：\nclass MyService : Service() {\n    val ctx = applicationContext             // 运行时抛 NullPointerException：属性初始化时 Service 还没关联 Context\n    val ctx2 by lazy { applicationContext }  // 第一次用到时 Service 已经启动好了\n    override fun onBind(intent: Intent?): IBinder? = null\n}'],
      ts: 'class Repo {\n  #db?: string;\n  get db() {\n    // 第一次读取才创建，之后复用\n    return (this.#db ??= (console.log("打开数据库"), "DB 连接"));\n  }\n}',
      desc: '- 只能用于 `val`\n- 默认线程安全：多个线程同时首次访问，也只会执行一次\n- 大括号里抛了异常，下次访问会重新执行',
      cmp: ['Java', 'private Pages pages;\nsynchronized Pages getPages() {\n    if (pages == null) pages = new Pages(...);\n    return pages;\n}'],
      pit: '确定只在单线程使用时，可以写 `lazy(LazyThreadSafetyMode.NONE) { ... }` 省掉加锁的开销。',
      q: '(property_delegate (call_expression (simple_identifier) @n (#eq? @n "lazy"))) @hit', api: ['lazy'], kw: '\\bby\\s+lazy\\b', tags: ['lazy', 'by', '延迟初始化', '单例', '缓存'],
    },
    {
      id: 'kt-delegate', title: 'by 属性委托', syntax: 'var x by 委托对象',
      why: '好几个属性在读、写时要做同样的事（比如打日志、延迟创建、检查有没有赋值），不想每个属性都手写一遍 getter/setter。用 `by` 把这段逻辑写成一个对象，属性"交给它管"就行。',
      example: '// 1. 委托对象：规定读、写属性时做什么\nclass Logged(private var value: String) {\n    operator fun getValue(thisRef: Any?, prop: KProperty<*>): String = value\n    operator fun setValue(thisRef: Any?, prop: KProperty<*>, new: String) {\n        println("${prop.name}: $value -> $new")\n        value = new\n    }\n}\n\n// 2. 用 by 把属性交给它\nclass User {\n    var name by Logged("")\n    var email by Logged("")\n}\n\n// 3. 使用：和普通属性一样，但读写时调用的是 Logged 的方法\nval u = User()\nu.name = "Tom"        // 输出：name:  -> Tom\nu.email = "a@b.com"   // 输出：email:  -> a@b.com\nprintln(u.name)       // 输出：Tom',
      vs: ['不用 by：每个属性都要手写一遍 setter', 'class User {\n    var name: String = ""\n        set(value) { println("name: $field -> $value"); field = value }\n    var email: String = ""\n        set(value) { println("email: $field -> $value"); field = value }  // 同样的逻辑又抄一遍\n}'],
      ts: '// TS 没有 by。作用最接近的是 TS 5 的 accessor 装饰器：\nfunction logged(target: any, ctx: ClassAccessorDecoratorContext) {\n  return {\n    set(this: any, v: string) { console.log(`${String(ctx.name)} = ${v}`); target.set.call(this, v); },\n  };\n}\nclass User {\n  @logged accessor name = "";\n  @logged accessor email = "";\n}',
      desc: '`var x by D`：读 `x` 时调用 `D.getValue()`，写 `x` 时调用 `D.setValue()`。\n平时很少自己写委托对象，一般用现成的：\n- `by lazy { ... }`：第一次读时才创建，之后复用\n- `by Delegates.observable(初值) { _, old, new -> }`：每次赋值后回调\n- `by Delegates.notNull()`：先不赋值，没赋值就读会报错\n- `by viewModels()`：Android 里自动创建或复用页面的 ViewModel\n- `by map`：从一个 Map 里按属性名取值',
      q: '(property_delegate "by" @hit)', kw: '\\bby\\s+\\w', tags: ['by', '委托', 'delegate'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
