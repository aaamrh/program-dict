// rust · 模块与可见性（4 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'rust', cat, ...c }));

  add('模块与可见性', [
    {
      id: 'rs-mod', title: 'mod 模块', syntax: 'mod net;    mod util { ... }',
      why: '代码多了要分组，避免所有函数挤在一起、互相重名。`mod` 把相关代码放进一个命名空间，外面用 `模块名::函数名` 访问，没写 `pub` 的东西外面看不到。',
      example: '// 这里在同一个文件里用 mod 分组；大项目通常一个模块一个文件：\n// mod util;  表示内容在 util.rs 或 util/mod.rs\nmod util {\n    pub fn add(a: i32, b: i32) -> i32 {\n        a + b\n    }\n\n    fn secret() {}   // 没写 pub：模块外看不到\n\n    pub mod text {   // 模块可以嵌套\n        pub fn shout(s: &str) -> String {\n            s.to_uppercase()\n        }\n    }\n}\n\nfn main() {\n    println!("{}", util::add(1, 2));           // 输出：3\n    println!("{}", util::text::shout("hi"));   // 输出：HI\n}',
      vs: ['Rust 模块和 TS 模块的区别', '// TS：一个文件自动就是一个模块，新建文件就能 import\n// Rust：新建 util.rs 还不够，必须在 main.rs 或 lib.rs 里写 mod util; 才会被编译\n\nutil::secret();   // 编译错误：function `secret` is private'],
      ts: '// util.ts\nexport function add(a: number, b: number) { return a + b; }\nfunction secret() {}   // 不 export 就是私有\nexport const text = { shout: (s: string) => s.toUpperCase() };\n\n// main.ts\nimport * as util from "./util";\nconsole.log(util.add(1, 2));   // 3',
      desc: '- 模块组成一棵树，根是 `main.rs`（程序）或 `lib.rs`（库）\n- `mod a;` 会去找 `a.rs` 或 `a/mod.rs`',
      cmp: ['Java', 'package com.example.util;'],
      q: '(mod_item "mod" @hit)', tags: ['mod', '模块', 'package'],
    },
    {
      id: 'rs-use', title: 'use 导入', syntax: 'use std::collections::{HashMap, HashSet};',
      why: '别的模块里的东西，完整路径往往很长（`std::collections::HashMap`）。`use` 把路径引进来，之后直接写短名字。',
      example: 'use std::collections::HashMap;     // 引入后直接写 HashMap\nuse std::fmt::{self, Display};     // 一次引入多个；self 表示 fmt 模块本身\nuse std::io::Result as IoResult;   // as 起别名，避免和 Result 重名\n\nfn main() {\n    let mut m = HashMap::new();\n    m.insert("a", 1);\n    println!("{:?}", m);   // 输出：{"a": 1}\n\n    // 不 use 也行，但要写完整路径\n    let s: std::collections::HashSet<i32> = [1, 2, 2].into_iter().collect();\n    println!("{}", s.len());   // 输出：2\n}',
      vs: ['不 use：每次都写完整路径', 'let m: std::collections::HashMap<&str, i32> = std::collections::HashMap::new();\n\n// 忘了 use 就直接写短名：\nlet m = HashMap::new();\n// 编译错误：cannot find type `HashMap` in this scope（标注：use of undeclared type `HashMap`）'],
      ts: '// Rust 的 use 对应 import（下面的路径只是示意）\nimport { HashMap } from "std/collections";\nimport * as fmt from "std/fmt";\nimport { Result as IoResult } from "std/io";\n// 差异：TS 的 import 会加载文件；Rust 的 use 只是起个短名，模块编不编译由 mod 决定',
      desc: '- `{a, b}` 一次导入多个，`as` 起别名，`*` 导入全部（一般只在测试里用 `use super::*;`）\n- 常用类型如 `Vec`、`String`、`Option` 在预导入（prelude）里，不用 use',
      cmp: ['Java', 'import java.util.HashMap;'],
      q: '(use_declaration "use" @hit)', tags: ['use', 'import', '导入'],
    },
    {
      id: 'rs-pub', title: 'pub / pub(crate) 可见性', syntax: 'pub fn f()    pub(crate) struct S',
      why: '控制谁能用这段代码。Rust 默认一切都是私有的，只有标了 `pub` 才对外公开。这样能把内部数据藏起来，比如余额不能被外面随便改，只能通过方法改。',
      example: 'mod bank {\n    pub struct Account {\n        pub owner: String,   // 字段也要单独加 pub，外面才能读写\n        balance: i64,        // 私有字段：外面不能直接改\n    }\n\n    impl Account {\n        pub fn new(owner: &str) -> Self {\n            Account { owner: owner.to_string(), balance: 0 }\n        }\n        pub fn deposit(&mut self, n: i64) { self.balance += n; }\n        pub fn balance(&self) -> i64 { self.balance }\n    }\n\n    pub(crate) fn audit() {}   // 只在本 crate 内可见\n}\n\nfn main() {\n    let mut a = bank::Account::new("Tom");\n    a.deposit(100);\n    println!("{} {}", a.owner, a.balance());   // 输出：Tom 100\n    // a.balance = 1_000_000;\n    // 编译错误：field `balance` of struct `Account` is private\n}',
      vs: ['不写、pub、pub(crate)、pub(super) 的区别', 'fn f() {}              // 不写：只有当前模块和它的子模块能用\npub fn g() {}          // 公开：谁都能用（前提是所在模块也能访问到）\npub(crate) fn h() {}   // 只在当前 crate（这个项目）内能用，别的项目引用这个库时看不到\npub(super) fn k() {}   // 只对父模块公开'],
      ts: 'export class Account {\n  owner: string;   // TS 字段默认 public\n  #balance = 0;    // 私有字段要显式写 # 或 private\n  constructor(owner: string) { this.owner = owner; }\n  deposit(n: number) { this.#balance += n; }\n  get balance() { return this.#balance; }\n}\n// 差异：Rust 默认全部私有，要公开才写 pub；TS 默认公开，要私有才写 private',
      desc: '- 结构体是 `pub` 不代表字段是 `pub`，字段要逐个加\n- 枚举是 `pub` 时，它的所有成员自动公开',
      cmp: ['Kotlin', 'class Account(val owner: String) { private var balance = 0L }\ninternal fun audit() {}   // 对应 pub(crate)'],
      q: '(visibility_modifier) @hit', tags: ['pub', 'pub(crate)', '可见性', 'public', 'private'],
    },
    {
      id: 'rs-crate-super', title: 'crate:: / super:: / self::', syntax: 'use crate::util::helper;    super::parent_fn()',
      why: '在模块树里引用别的模块时，要说明从哪里开始找：从项目根找、从上一级找，还是从当前模块找。相当于 TS import 里的 `@/`、`../`、`./`。',
      example: 'mod config {\n    pub fn port() -> u16 { 8080 }\n}\n\nmod server {\n    pub mod http {\n        pub fn start() {\n            let p = crate::config::port();   // crate::：从项目根开始找\n            super::log("启动");              // super::：从父模块 server 开始找\n            self::listen(p);                 // self::：从当前模块 http 开始找\n        }\n        fn listen(p: u16) { println!("监听 {}", p); }\n    }\n    fn log(msg: &str) { println!("[server] {}", msg); }\n}\n\nfn main() {\n    server::http::start();\n    // 输出：\n    // [server] 启动\n    // 监听 8080\n}',
      vs: ['分别对应 TS 的哪种路径', 'use crate::config::port;   // ≈ import { port } from "@/config"（从项目根）\nuse super::log;            // ≈ import { log } from "../log"（上一级）\nuse self::listen;          // ≈ import { listen } from "./listen"（当前目录）\n\n// 在子模块里省略起点直接写：\nuse config::port;          // 编译错误：unresolved import `config`'],
      ts: 'import { port } from "@/config";    // crate::config（需要配置路径别名）\nimport { log } from "../log";        // super::log\nimport { listen } from "./listen";   // self::listen',
      desc: '- 子模块可以访问父模块的私有项，所以上面 `http` 里能调用 `server` 的私有函数 `log`',
      q: '[(crate) (super)] @hit', tags: ['crate', 'super', 'self', '路径'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
