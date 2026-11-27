// rust · impl 与方法（6 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'rust', cat, ...c }));

  add('impl 与方法', [
    {
      id: 'rs-impl', title: 'impl Type { } 方法实现块', syntax: 'impl User { fn new() -> Self { .. } }',
      why: '给结构体或枚举加上"能做的事"。数据在 `struct` 里定义，行为写在 `impl` 块里。里面的函数分两种：带 `self` 的是方法，用 `u.f()` 调用；不带 `self` 的是关联函数，用 `User::f()` 调用，相当于静态方法，最常见的就是 `new`。',
      example: 'struct Counter {\n    n: u32,\n}\n\nimpl Counter {\n    // 关联函数（没有 self）：用 Counter::new() 调用\n    fn new() -> Self {\n        Self { n: 0 }\n    }\n\n    // 方法（有 self）：用 c.inc() 调用\n    fn inc(&mut self) {\n        self.n += 1;\n    }\n    fn get(&self) -> u32 {\n        self.n\n    }\n}\n\nfn main() {\n    let mut c = Counter::new();\n    c.inc();\n    c.inc();\n    println!("{}", c.get());   // 输出：2\n}',
      vs: ['方法 vs 关联函数：调用方式不同', 'impl Counter {\n    fn new() -> Self { Self { n: 0 } }   // 没有 self\n    fn get(&self) -> u32 { self.n }      // 有 self\n}\n\nlet c = Counter::new();   // 关联函数用 ::\nc.get();                  // 方法用 .\n\nc.new();                  // 编译错误：no method named `new` found\n                          // 编译器提示：this is an associated function, not a method\nCounter::get(&c);         // 可以：方法也能用 :: 调用，要手动传 self'],
      ts: 'class Counter {\n  n = 0;\n  static create() { return new Counter(); }   // ≈ 关联函数 Counter::new()\n  inc() { this.n += 1; }                      // ≈ 方法\n  get() { return this.n; }\n}\nconst c = Counter.create();\nc.inc(); c.inc();\nconsole.log(c.get());   // 2',
      desc: '- 一个类型可以有多个 `impl` 块，效果等于合并在一起\n- `new` 只是约定俗成的名字，不是关键字，也可以叫 `with_capacity`、`from_str` 等\n- 给别人的 trait 实现方法用另一种写法 `impl Trait for Type`，见对应卡片',
      cmp: ['Kotlin', 'class Counter {\n    var n = 0\n    fun inc() { n++ }\n    companion object { fun create() = Counter() }\n}'],
      q: '(impl_item !trait "impl" @hit)', tags: ['impl', '方法', 'method', '静态方法'],
    },
    {
      id: 'rs-self-param', title: 'self / &self / &mut self', syntax: 'fn get(&self)    fn set(&mut self)    fn into(self)',
      why: '方法的第一个参数决定它怎么对待调用者：只是看看（`&self`）、要修改（`&mut self`）、还是用完就拿走（`self`）。光看方法签名，就能知道调用之后原对象还能不能用、会不会被改。',
      example: 'struct Order {\n    items: Vec<String>,\n}\n\nimpl Order {\n    fn count(&self) -> usize {            // &self：只读\n        self.items.len()\n    }\n    fn add(&mut self, item: &str) {       // &mut self：修改\n        self.items.push(item.to_string());\n    }\n    fn submit(self) -> String {           // self：拿走所有权，订单"用掉了"\n        format!("提交了 {} 件", self.items.len())\n    }\n}\n\nfn main() {\n    let mut o = Order { items: vec![] };\n    o.add("书");\n    println!("{}", o.count());     // 输出：1\n    println!("{}", o.submit());    // 输出：提交了 1 件\n    // o.count();                  // 编译错误：borrow of moved value: `o`\n}',
      vs: ['三种 self 的限制', 'let o = Order { items: vec![] };    // 注意：没有 mut\n\no.count();     // 可以：&self 只读\no.add("书");   // 编译错误：cannot borrow `o` as mutable, as it is not declared as mutable\no.submit();    // 可以：self 把 o 拿走\no.count();     // 编译错误：borrow of moved value: `o`'],
      ts: 'class Order {\n  items: string[] = [];\n  count() { return this.items.length; }   // 对应 &self\n  add(item: string) { this.items.push(item); }   // 对应 &mut self\n  submit() { return `提交了 ${this.items.length} 件`; }   // 对应 self\n}\n// TS 不区分这三种：任何方法都能改 this，调用后对象也一直能用',
      desc: '- 优先用 `&self`；需要改字段才用 `&mut self`\n- 用 `self` 的方法一般表示"转换成别的东西"，比如 `into_bytes()`、builder 的 `build()`\n- 调用时编译器会自动加 `&` 或 `&mut`，所以写 `o.add(..)` 而不是 `(&mut o).add(..)`',
      cmp: ['Java', 'int count() { return this.items.size(); }  // Java 的 this 是隐式的，也不区分只读和可改'],
      q: '(self_parameter) @hit', tags: ['self', '&self', '&mut self', 'this'],
    },
    {
      id: 'rs-Self', title: 'Self 类型', syntax: 'fn new() -> Self { Self { .. } }',
      why: '在 `impl` 或 `trait` 里指代"当前这个类型"，不用重复写类型名。类型改名时少改几处；在 trait 里更是必须用它，因为写 trait 时还不知道会是哪个类型来实现。',
      example: 'struct Point {\n    x: i32,\n    y: i32,\n}\n\nimpl Point {\n    fn origin() -> Self {           // Self 就是 Point\n        Self { x: 0, y: 0 }         // 等于 Point { x: 0, y: 0 }\n    }\n    fn moved(&self, dx: i32) -> Self {\n        Self { x: self.x + dx, y: self.y }   // 大写 Self 是类型，小写 self 是当前实例\n    }\n}\n\nfn main() {\n    let p = Point::origin().moved(5);\n    println!("{} {}", p.x, p.y);    // 输出：5 0\n}',
      vs: ['Self（类型）vs self（实例）', 'impl Point {\n    fn a() -> Self { Self { x: 0, y: 0 } }     // Self = 类型 Point\n    fn b(&self) -> i32 { self.x }             // self = 调用方法的那个实例\n\n    fn c() -> i32 { self.x }\n    // 编译错误：expected value, found module `self`\n    // 没有 self 参数的关联函数里不能用 self\n}'],
      ts: 'class Point {\n  constructor(public x: number, public y: number) {}\n  static origin(): Point { return new Point(0, 0); }\n  moved(dx: number): this {          // TS 的 this 类型最接近 Self\n    return new (this.constructor as any)(this.x + dx, this.y);\n  }\n}',
      desc: '- 只能在 `impl`、`trait` 里用\n- 在 trait 里：`fn clone(&self) -> Self` 表示"返回和实现者相同的类型"\n- 枚举也一样：`Self::Variant` 等于 `MyEnum::Variant`',
      q: '((type_identifier) @hit (#eq? @hit "Self"))', tags: ['Self', '当前类型'],
    },
    {
      id: 'rs-assoc-call', title: 'Type::f() 关联函数调用', syntax: 'String::from("a")    Vec::new()',
      why: '创建对象、或者调用"属于类型、不属于某个实例"的函数时，用 `类型::函数()`。Rust 没有 `new` 关键字，几乎所有对象都是通过 `Type::new()`、`Type::from()` 这样创建的。',
      example: 'use std::collections::HashMap;\n\nfn main() {\n    let mut names = Vec::new();                 // 空的 Vec\n    names.push("Tom");\n\n    let s = String::from("你好");               // 从 &str 创建 String\n    let n = i32::from_str_radix("ff", 16).unwrap();   // 基本类型也有关联函数\n    let mut m = HashMap::new();\n    m.insert("a", 1);\n\n    println!("{:?} {} {} {:?}", names, s, n, m);\n    // 输出：["Tom"] 你好 255 {"a": 1}\n}',
      vs: [':: 和 . 的区别', 'let s = String::from("hi");   // :: 调关联函数，不需要实例\nlet n = s.len();              // .  调方法，需要一个实例\n\nlet bad = String.from("hi");  // 编译错误：expected value, found struct `String`\n                              // 编译器提示：use the path separator to refer to an item: `String::from`'],
      ts: 'const names: string[] = [];              // Vec::new()\nnames.push("Tom");\nconst s = String("你好");                // String::from("你好")\nconst n = parseInt("ff", 16);            // 255\nconst m = new Map<string, number>();     // HashMap::new()\n// Type::f() 相当于 TS 的静态方法 Type.f()',
      desc: '- 常见的创建函数：`new()`、`with_capacity(n)`、`from(x)`、`default()`\n- 方法也能用这种写法调用，要手动传 self：`String::len(&s)` 等于 `s.len()`\n- 泛型参数写在 `::` 后面：`Vec::<i32>::new()`',
      cmp: ['Java', 'List<String> names = new ArrayList<>();\nint n = Integer.parseInt("ff", 16);'],
      q: '(call_expression function: (scoped_identifier) @hit)', tags: ['::', '关联函数', '静态方法', 'new'],
    },
    {
      id: 'rs-method-call', title: 'x.f() 方法调用与自动引用', syntax: 'v.len()    s.push_str("x")',
      why: '调用方法时，方法要求 `&self` 还是 `&mut self`，编译器会自动帮你加 `&` 或 `&mut`，引用和智能指针也会自动解开。所以写起来和 TS 一样直接，不用到处写 `(&x).f()`。',
      example: 'fn main() {\n    let mut s = String::new();\n    s.push_str("hello");            // push_str 要 &mut self，编译器自动传 &mut s\n    println!("{}", s.len());        // len 要 &self，自动传 &s。输出：5\n\n    let r = &s;\n    println!("{}", r.to_uppercase());   // r 是引用，也能直接调方法。输出：HELLO\n\n    let b = Box::new(String::from("box"));\n    println!("{}", b.len());        // Box 会自动解开。输出：3\n\n    // 链式调用：每一步都这样自动处理\n    let words: Vec<&str> = "a b c".split(\' \').collect();\n    println!("{:?}", words);        // 输出：["a", "b", "c"]\n}',
      vs: ['自动引用不会帮你把不可变变成可变', 'let s = String::new();      // 没有 mut\ns.len();                    // 可以：只需要 &s\ns.push_str("x");            // 编译错误：cannot borrow `s` as mutable, as it is not declared as mutable\n\n// 字段访问也会自动解引用：r.len() 等于 (*r).len()'],
      ts: 'let s = "";\ns += "hello";\nconsole.log(s.length);           // 5\nconsole.log(s.toUpperCase());    // HELLO\nconst words = "a b c".split(" ");   // ["a", "b", "c"]\n// TS 没有引用和可变借用的区别，自然也不需要"自动引用"',
      desc: '- 只有方法调用 `x.f()` 和字段访问 `x.field` 会自动加 `&`、`&mut` 或解引用\n- 普通函数参数不会：`fn f(s: &String)` 必须写 `f(&s)`\n- 原变量要声明成 `let mut`，才能调用 `&mut self` 方法',
      q: '(call_expression function: (field_expression field: (field_identifier) @hit))', tags: ['方法调用', '.', '自动解引用', '自动引用'],
    },
    {
      id: 'rs-path', title: 'a::b 路径', syntax: 'std::collections::HashMap    Msg::Quit',
      why: '`::` 用来"进入"一个模块或类型，拿到里面的东西：模块里的类型、类型的关联函数、枚举的成员。读代码时看到 `::`，左边是模块或类型，不是变量。',
      example: 'enum Msg {\n    Quit,\n    Write(String),\n}\n\nfn main() {\n    // 模块路径：std 模块 → collections 模块 → HashMap 类型\n    let mut m = std::collections::HashMap::new();\n    m.insert("k", 1);\n\n    let q = Msg::Quit;                         // 枚举成员\n    let w = Msg::Write(String::from("hi"));\n    let max = i32::MAX;                        // 类型的关联常量\n\n    if let Msg::Write(t) = w {\n        println!("{} {:?} {}", t, m, max);     // 输出：hi {"k": 1} 2147483647\n    }\n    let _ = q;\n}',
      vs: [':: 和 . 分别用在哪', 'std::fs::read_to_string("a.txt")   // :: 模块里的函数\nString::new()                      // :: 类型的关联函数\nOrdering::Less                     // :: 枚举成员\n\nuser.name                          // .  实例的字段\nuser.greet()                       // .  实例的方法\n\nuser::name                         // 错：user 是变量，不是模块或类型'],
      ts: 'import { readFileSync } from "fs";       // 模块路径在 import 里写\nconst m = new Map<string, number>();\nm.set("k", 1);\nconst max = Number.MAX_SAFE_INTEGER;    // TS 里类型和模块都用 . 访问\n// Rust 区分得更清楚：模块、类型、枚举用 ::，实例的字段和方法用 .',
      desc: '- 长路径可以先 `use` 进来再用短名字：`use std::collections::HashMap;`\n- `crate::`、`super::`、`self::` 是相对路径的开头，见对应卡片\n- 泛型也可以出现在路径里：`Vec::<i32>::new()`',
      cmp: ['Java', 'java.util.HashMap<String, Integer> m = new java.util.HashMap<>();  // Java 一律用 .'],
      q: '(scoped_identifier "::" @hit)', tags: ['::', '路径', 'path'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
