// java · 文件结构（2 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('文件结构', [
    {
      id: 'java-package-import', title: 'package / import', syntax: 'package com.a;    import java.util.*;',
      why: '项目里类很多，难免重名（比如自己写的 `List` 和 `java.util.List`）。`package` 给类加上"所在目录"作为全名，`import` 让你在文件里只写短名字。',
      example: 'package com.example.app;          // 这个文件里的类，全名是 com.example.app.Main\n\nimport java.util.ArrayList;       // 导入一个类\nimport java.util.List;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> names = new ArrayList<>();   // 有了 import，只写短名字\n        names.add("Tom");\n        String s = "不用 import";                  // java.lang 下的类自动可用\n        System.out.println(names + " " + s);      // 输出：[Tom] 不用 import\n    }\n}',
      vs: ['不 import：每次都写全名', 'java.util.List<String> names = new java.util.ArrayList<>();   // 能用，但太长\n\nimport java.util.*;     // 导入 java.util 下的所有类，不包括子包（如 java.util.concurrent）\n\n// 两个包里都有 Date，同时按名字导入会冲突：\nimport java.util.Date;\nimport java.sql.Date;   // 编译错误：Date 重名\n// 解决：只导入一个，另一个用全名 java.sql.Date'],
      ts: '// TS 没有 package：一个文件就是一个模块，文件路径就是它的"全名"\nimport { ArrayList } from "./util/ArrayList";\nimport * as util from "./util";              // 近似 import java.util.*\nimport { Date as SqlDate } from "./sql";     // 重名时 TS 可以改名，Java 不行',
      desc: '- `package` 必须写在文件开头（注释除外），并且和目录一致：`com/example/app/Main.java`\n- `public` 类的名字必须和文件名相同\n- `java.lang` 包（`String`、`Integer`、`Math`、`System`）不需要 import\n- Java 的 import 不能起别名，重名时只能写全名',
      cmp: ['Kotlin', 'package com.example.app\nimport java.sql.Date as SqlDate  // Kotlin 可以用 as 起别名'],
      q: '[(package_declaration) (import_declaration)] @hit', tags: ['package', 'import', '包'],
    },
    {
      id: 'java-import-static', title: 'import static 静态导入', syntax: 'import static java.lang.Math.max;',
      why: '某个类的静态方法或常量用得很频繁（比如 `Math.max`、测试里的 `assertEquals`），每次都写类名很啰嗦。静态导入之后可以直接写方法名。',
      example: 'import static java.lang.Math.max;\nimport static java.lang.Math.PI;\n\npublic class Demo {\n    public static void main(String[] args) {\n        System.out.println(max(3, 7));   // 不用写 Math.max，输出：7\n        System.out.println(PI);          // 输出：3.141592653589793\n    }\n}',
      vs: ['普通 import vs import static', 'import java.util.Collections;\nCollections.sort(list);                   // 导入的是类，调用时要写类名\n\nimport static java.util.Collections.sort;\nsort(list);                               // 导入的是静态方法，直接写方法名\n\nimport static java.lang.Math.*;           // 导入全部静态成员，但读代码时看不出 max 来自哪里'],
      ts: 'import { max } from "./math";   // TS 的具名导入本来就能直接用\nconst { PI } = Math;             // 或者从对象上解构出来\nconsole.log(max(3, 7), PI);',
      desc: '- 只能导入静态成员（静态方法、静态常量），不能导入实例方法\n- 用多了会让人分不清方法来自哪个类，一般只用在测试和常量上',
      cmp: ['Kotlin', 'import kotlin.math.max\nimport kotlin.math.PI  // Kotlin 没有 static，直接导入顶层函数和常量'],
      q: '(import_declaration "static" @hit)', tags: ['import static', '静态导入'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
