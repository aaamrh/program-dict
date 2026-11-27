// rust · 宏与属性（7 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'rust', cat, ...c }));

  add('宏与属性', [
    {
      id: 'rs-macro-call', title: 'name!(...) 宏调用', syntax: 'println!("{}", x)    vec![1, 2]',
      why: '有些事普通函数做不到：参数个数不固定（`println!` 能传任意多个值），在编译期检查格式字符串，生成重复代码。Rust 用宏来做这些，名字后面带 `!`，提醒你这不是普通函数。',
      example: 'fn main() {\n    let name = "Tom";\n    let age = 18;\n    println!("{} 今年 {} 岁", name, age);   // 输出：Tom 今年 18 岁（参数个数随意）\n    let msg = format!("{}-{}", name, age);  // 格式和 println! 一样，但返回 String\n    println!("{}", msg);                    // 输出：Tom-18\n    let v = vec![1, 2, 3];                  // 创建 Vec 的宏，习惯用 []\n    assert_eq!(v.len(), 3);                 // 不相等就 panic\n    println!("{:?}", v);                    // 输出：[1, 2, 3]\n}',
      vs: ['宏和函数的区别', 'println!("{} {}", 1);\n// 编译错误：2 positional arguments in format string, but there is 1 argument\n// 宏在编译期展开，所以能检查 {} 的个数和参数对不对得上\n\nprintln("hi");\n// 编译错误：expected function, found macro `println`（漏写了 !）'],
      ts: 'const name = "Tom", age = 18;\nconsole.log(`${name} 今年 ${age} 岁`);   // println!\nconst msg = `${name}-${age}`;            // format!\nconst v = [1, 2, 3];                     // vec!\nconsole.assert(v.length === 3);          // assert_eq!（TS 里只打印错误，不会中断程序）\n// TS 没有宏：模板字符串写错了不会在编译期报错',
      desc: '- 括号 `()`、`[]`、`{}` 都可以，习惯上 `vec!` 用 `[]`\n- 常用宏：`println!`、`format!`、`vec!`、`assert!`、`assert_eq!`、`panic!`、`todo!`、`dbg!`',
      q: '(macro_invocation "!" @hit)', kw: '\\w+!\\s*[(\\[{]', tags: ['宏', 'macro', '!'],
    },
    {
      id: 'rs-macro-rules', title: 'macro_rules! 定义宏', syntax: 'macro_rules! sq { ($x:expr) => { $x * $x }; }',
      why: '同样的代码模式要写很多遍，又没法用普通函数表达（比如要接收任意个参数，或者要生成函数、结构体），可以自己定义宏。业务代码很少需要，主要是写库的时候用。',
      example: '// 定义：匹配"一个或多个用逗号分隔的表达式"，展开成求和\nmacro_rules! sum {\n    ($($x:expr),+) => {\n        0 $(+ $x)+\n    };\n}\n\nfn main() {\n    let a = sum!(1, 2, 3);   // 展开成 0 + 1 + 2 + 3\n    println!("{}", a);       // 输出：6\n    let b = sum!(10);        // 参数个数随意\n    println!("{}", b);       // 输出：10\n}',
      vs: ['宏和函数：函数的参数个数是固定的', 'fn sum3(a: i32, b: i32, c: i32) -> i32 { a + b + c }\nsum3(1, 2, 3);   // 只能正好 3 个\nsum3(1, 2);      // 编译错误：this function takes 3 arguments but 2 arguments were supplied\n\n// 只是想接收任意个数字的话，用切片通常比写宏简单：\nfn sum(xs: &[i32]) -> i32 { xs.iter().sum() }\nsum(&[1, 2, 3]);'],
      ts: '// TS 没有宏，也不能在编译期生成代码。任意个参数用剩余参数：\nconst sum = (...xs: number[]) => xs.reduce((a, b) => a + b, 0);\nsum(1, 2, 3);   // 6\nsum(10);        // 10',
      desc: '- `$x:expr` 匹配一个表达式；其他片段类型有 `ident`（名字）、`ty`（类型）、`tt`（任意记号）等\n- `$(...),*` 表示重复零次或多次，`$(...),+` 表示至少一次\n- 宏要先定义再使用；要在别的 crate 里用，加 `#[macro_export]`',
      q: '(macro_definition "macro_rules!" @hit)', tags: ['macro_rules', '宏定义'],
    },
    {
      id: 'rs-attribute', title: '#[...] 属性', syntax: '#[derive(Debug)]    #[test]    #[allow(dead_code)]',
      why: '给后面紧跟的函数、结构体或模块附加"说明"，让编译器或工具照着处理：自动生成代码、标记测试、关掉某个警告、按平台决定编译哪段代码。相当于 Java 注解、TS 装饰器。',
      example: '#[derive(Debug)]                 // 自动实现 Debug，才能用 {:?} 打印\nstruct User {\n    name: String,\n}\n\n#[allow(dead_code)]              // 这个函数暂时没用到，不要报警告\nfn helper() {}\n\n#[cfg(target_os = "windows")]    // 只在 Windows 上编译这个版本\nfn platform() -> &\'static str { "windows" }\n\n#[cfg(not(target_os = "windows"))]\nfn platform() -> &\'static str { "其他系统" }\n\nfn main() {\n    println!("{:?}", User { name: "Tom".into() });   // 输出：User { name: "Tom" }\n    println!("{}", platform());                      // 在 Windows 上输出：windows\n}',
      vs: ['不加 #[derive(Debug)] 会怎样', 'struct User { name: String }\nprintln!("{:?}", User { name: "Tom".into() });\n// 编译错误：`User` doesn\'t implement `Debug`\n// 编译器提示：add `#[derive(Debug)]` to `User`'],
      ts: '// 最接近的是装饰器（TS 5 标准装饰器）\nfunction logged(fn: Function, ctx: ClassMethodDecoratorContext) { /* ... */ }\nclass Svc {\n  @logged run() {}\n}\n// 关警告：// eslint-disable-next-line\n// 条件编译：TS 没有，只能靠打包工具替换 process.env.X',
      desc: '- 常见属性：`#[derive(...)]`、`#[test]`、`#[allow(...)]`、`#[cfg(...)]`、`#[inline]`、`#[deprecated]`\n- 只作用于紧跟在后面的那一项；作用于整个模块要用 `#![...]`',
      cmp: ['Java', '@SuppressWarnings("unused")\nvoid helper() {}'],
      q: '(attribute_item) @hit', kw: '#\\[', tags: ['#[]', '属性', 'attribute', '注解'],
    },
    {
      id: 'rs-derive', title: '#[derive(Debug, Clone, ...)] 自动实现', syntax: '#[derive(Debug, Clone, PartialEq)]',
      why: '打印、复制、比较相等、当 HashMap 的键，这些能力在 Rust 里都要实现对应的 trait 才有。大多数实现是机械地逐个字段处理，`#[derive(...)]` 让编译器自动生成，不用手写。',
      example: '#[derive(Debug, Clone, PartialEq, Default)]\nstruct Config {\n    host: String,\n    port: u16,\n}\n\nfn main() {\n    let a = Config { host: "localhost".into(), port: 8080 };\n    let b = a.clone();           // Clone：复制一份\n    println!("{:?}", b);         // Debug，输出：Config { host: "localhost", port: 8080 }\n    println!("{}", a == b);      // PartialEq，输出：true\n    let d = Config::default();   // Default：每个字段取默认值\n    println!("{:?}", d);         // 输出：Config { host: "", port: 0 }\n}',
      vs: ['不用 derive：要自己手写实现', 'impl PartialEq for Config {\n    fn eq(&self, other: &Self) -> bool {\n        self.host == other.host && self.port == other.port\n    }\n}\n\n// 既没 derive 也没手写，就去比较：\n// 编译错误：binary operation `==` cannot be applied to type `Config`'],
      ts: 'interface Config { host: string; port: number }\nconst a: Config = { host: "localhost", port: 8080 };\nconst b = structuredClone(a);                         // Clone\nconsole.log(b);                                       // Debug：TS 对象天然能打印\nconsole.log(a === b);                                 // false！=== 比较的是引用\nconsole.log(a.host === b.host && a.port === b.port);  // PartialEq 要自己逐个字段比',
      desc: '- `Debug`：`{:?}` 打印；`Clone`：`.clone()`；`PartialEq`/`Eq`：`==`；`Hash`：当 HashMap 的键；`Default`：`T::default()`；`PartialOrd`/`Ord`：比较和排序\n- `Copy`：赋值时复制而不是移动，要求所有字段都是 Copy，并且同时 derive `Clone`\n- `Serialize`/`Deserialize` 不是标准库的，来自 serde 库',
      cmp: ['Kotlin', 'data class Config(val host: String = "", val port: Int = 0)  // 自动生成 equals/toString/copy'],
      q: '((attribute (identifier) @n) @hit (#eq? @n "derive"))', tags: ['derive', 'Debug', 'Clone', 'Copy', 'PartialEq', 'Default', 'Hash'],
    },
    {
      id: 'rs-cfg-test', title: '#[cfg(test)] / #[test] 测试', syntax: '#[cfg(test)] mod tests { #[test] fn t() {} }',
      why: 'Rust 自带测试工具，不用装 Jest 这类库。用 `#[test]` 标记测试函数，`cargo test` 会找到并运行它们；`#[cfg(test)]` 让测试代码只在测试时编译，不进正式程序。',
      example: 'pub fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n\n#[cfg(test)]          // 这个模块只在 cargo test 时编译\nmod tests {\n    use super::*;     // 引入上面的 add\n\n    #[test]           // 标记为测试函数\n    fn adds_two_numbers() {\n        assert_eq!(add(1, 2), 3);\n    }\n\n    #[test]\n    #[should_panic]   // 期望这个测试 panic，panic 了才算通过\n    fn index_out_of_bounds_panics() {\n        let v: Vec<i32> = vec![];\n        let _ = v[0];\n    }\n}\n// 运行 cargo test，输出类似：\n// test tests::adds_two_numbers ... ok\n// test tests::index_out_of_bounds_panics - should panic ... ok',
      vs: ['不加 #[cfg(test)] 会怎样', 'mod tests {\n    use super::*;\n    #[test]\n    fn adds() { assert_eq!(add(1, 2), 3); }\n}\n// #[test] 函数本身在正式构建时会被去掉，但 mod tests 里的其他代码和 use 会被编译，\n// 常见现象是正式构建时出现 unused import 警告'],
      ts: '// Jest / Vitest：测试一般放在单独的 add.test.ts 文件里\nimport { add } from "./add";\ntest("adds two numbers", () => {\n  expect(add(1, 2)).toBe(3);\n});\ntest("throws", () => {\n  expect(() => { throw new Error(); }).toThrow();   // 对应 #[should_panic]\n});',
      desc: '- 测试一般写在同一个文件底部的 `mod tests` 里，用 `use super::*;` 引入被测代码\n- 集成测试放在项目根目录的 `tests/` 文件夹里，不需要 `#[cfg(test)]`\n- `cargo test 名字` 只运行名字里包含这段文字的测试',
      cmp: ['Java', '@Test\nvoid addsTwoNumbers() { assertEquals(3, add(1, 2)); }'],
      q: '((attribute (identifier) @n) @hit (#match? @n "^(cfg|test)$"))', tags: ['test', 'cfg', '测试', '条件编译'],
    },
    {
      id: 'rs-inner-attr', title: '#![...] 内部属性', syntax: '#![allow(unused)]',
      why: '想让一个设置作用于整个文件、整个模块甚至整个项目，而不是只作用于某一个函数时，用带 `!` 的内部属性，写在文件或模块的开头。',
      example: '// 写在 crate 根文件（main.rs / lib.rs）开头：作用于整个 crate\n#![allow(dead_code)]\n\nfn unused() {}   // 不会报"未使用"警告\n\nmod net {\n    #![allow(unused_imports)]   // 写在模块内部开头：只作用于 net 这个模块\n    use std::collections::HashMap;\n}\n\nfn main() {\n    println!("ok");   // 输出：ok\n}',
      vs: ['#[...] 和 #![...] 的区别', '#[allow(dead_code)]   // 外部属性：只作用于紧跟在后面的 a\nfn a() {}\nfn b() {}             // b 不受影响，仍然会报警告\n\n// #![...] 必须写在所在模块的最开头，写在中间：\n// 编译错误：an inner attribute is not permitted in this context'],
      ts: '/* eslint-disable no-unused-vars */   // 写在文件开头，作用于整个文件\n// @ts-nocheck                         // 关闭整个文件的类型检查\n// TS 没有"作用于整个模块"的语法，只能靠这类工具注释',
      desc: '- 常见用法：`#![allow(...)]`、`#![deny(warnings)]`、`#![no_std]`（不用标准库）\n- 写在 `main.rs` 或 `lib.rs` 开头时作用于整个 crate',
      q: '[(inner_attribute_item) @hit ((shebang) @hit (#match? @hit "^#!\\\\["))]', tags: ['#!', '内部属性', 'crate'],
    },
    {
      id: 'rs-doc-comment', title: '/// 文档注释', syntax: '/// 说明    //! 模块说明',
      why: '给函数、结构体写说明，编辑器悬停时会显示，`cargo doc` 还能生成文档网页。和普通注释的区别是，它会被工具收集起来。',
      example: '//! 一个简单的数学工具（//! 写在文件开头，说明整个模块）\n\n/// 计算两数之和。\n///\n/// # 示例\n///\n/// ```\n/// assert_eq!(my_math::add(1, 2), 3);\n/// ```\npub fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n\n// 普通注释：不会出现在文档里\nfn main() {\n    println!("{}", add(1, 2));   // 输出：3\n}\n// cargo doc --open：生成并打开文档网页\n// 库项目里 cargo test 还会把文档中的代码块当成测试运行',
      vs: ['///、//! 和 // 的区别', '/// 给紧跟在后面的函数或结构体写文档，会出现在生成的文档网页上\n//! 给所在的模块或整个 crate 写文档，写在文件开头\n// 普通注释，只给读代码的人看，不进文档'],
      ts: '/**\n * 计算两数之和。\n * @example add(1, 2) // 3\n */\nexport function add(a: number, b: number): number {\n  return a + b;\n}\n// 对应 TSDoc / JSDoc：编辑器悬停时显示，但 TS 不会运行文档里的示例',
      desc: '- 文档注释支持 Markdown\n- `# Examples`、`# Panics`、`# Errors` 是常见的小标题约定',
      cmp: ['Java', '/** 计算两数之和 */'],
      q: '((line_comment) @hit (#match? @hit "^//[/!]"))', tags: ['///', '文档', 'doc', '注释'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
