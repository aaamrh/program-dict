// kotlin · 文件结构（1 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'kotlin', cat, ...c }));

  add('文件结构', [
    {
      id: 'kt-package', title: 'package / import', syntax: 'import a.b.C as D',
      why: '`package` 给代码分组、避免重名；`import` 把别的包里的类和函数拿进当前文件用，`as` 给它起别名，解决两个包里有同名类时的冲突。',
      example: 'package com.example.app               // 1. 本文件属于哪个包\n\nimport android.util.Log               // 2. 导入一个类\nimport kotlin.math.max                // 3. 可以直接导入顶层函数\nimport com.a.Config as RemoteConfig   // 4. 起别名，避免和本地的 Config 重名\n\nclass Config(val debug: Boolean)\n\nfun main() {\n    println(max(3, 7))            // 输出：7\n    val local = Config(true)\n    val remote = RemoteConfig()   // 用别名访问另一个包的 Config\n}',
      vs: ['不 import 时要写全名', 'fun main() {\n    println(kotlin.math.max(3, 7))   // 不 import 也行，但要写完整包名\n    println(max(3, 7))               // 编译错误：Unresolved reference: max（没有 import）\n}'],
      ts: 'import { max } from "./math";\nimport { Config as RemoteConfig } from "./remote";   // import ... as 写法一致\n// TS 没有 package 声明，一个文件就是一个模块',
      desc: '- 文件名不必和类名一致，一个文件可以放多个类和顶层函数\n- `kotlin.*`、`kotlin.collections.*` 等常用包默认已经导入\n- 包名不强制和目录对应，但建议保持一致',
      cmp: ['Java', 'package com.example.app;\nimport android.util.Log;\n// Java 没有 import ... as'],
      q: '[(package_header) (import_header)] @hit', tags: ['package', 'import', 'as'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
