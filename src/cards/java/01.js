// java · 变量与类型（10 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('变量与类型', [
    {
      id: 'java-local-var', title: '局部变量声明 Type name = value;', syntax: 'int count = 0;',
      why: '在方法里临时保存一个值。Java 要求先写类型，编译器据此检查后面的用法：类型对不上、没赋值就用，都会直接编译失败，不用等到运行才发现。',
      example: 'int count = 0;                 // 类型写在名字前面，语句以分号结尾\nString name = "Tom";\ncount = count + 1;             // 普通变量可以重新赋值\nSystem.out.println(name + " " + count);  // 输出：Tom 1',
      vs: ['必须先赋值，类型不能变', 'int a;\nSystem.out.println(a);   // 编译错误：variable a might not have been initialized\n\nint b = 0;\nb = "Tom";               // 编译错误：incompatible types: String cannot be converted to int'],
      ts: 'let count: number = 0;       // TS 类型写在冒号后面\nconst name: string = "Tom";\ncount = count + 1;\nconsole.log(name + " " + count); // Tom 1',
      desc: '- 局部变量没有默认值，使用前必须赋值；字段（成员变量）才有默认值 0/false/null\n- 同一作用域里不能重复声明同名变量',
      cmp: ['Kotlin', 'var count = 0\nval name = "Tom"'],
      q: '(local_variable_declaration type: (_) @hit)', tags: ['变量', '声明'],
    },

    {
      id: 'java-var', title: 'var 局部类型推断', syntax: 'var list = new ArrayList<String>();',
      why: '右边已经写明了类型时，左边不用再抄一遍。像 `Map<String, List<Integer>> m = new HashMap<String, List<Integer>>()` 这种长类型，用 `var` 能少写一半。Java 10 起可用。',
      example: 'var users = new ArrayList<String>();   // 编译器推断出 ArrayList<String>\nusers.add("Tom");\nfor (var u : users) {\n    System.out.println(u);              // 输出：Tom\n}\nusers = new ArrayList<>();              // 可以重新赋值：var 不是 final',
      vs: ['var 和写明类型的区别', 'ArrayList<String> a = new ArrayList<String>();  // 类型写了两遍\nvar b = new ArrayList<String>();                 // 只写一遍，效果完全相同\n\nvar c;          // 编译错误：cannot infer type for local variable c（必须当场赋值）\nvar d = null;   // 编译错误：推断不出类型（variable initializer is \'null\'）\nb.add(1);       // 编译错误：b 已推断为 ArrayList<String>，类型照样固定'],
      ts: 'const users = new Array<string>();  // TS 默认就会推断类型\nusers.push("Tom");\nfor (const u of users) {\n  console.log(u);                    // Tom\n}',
      desc: '- 只能用于局部变量（包括 for 循环变量、try-with-resources），不能用于字段、方法参数和返回值\n- `var` 只是省略类型，变量仍然是强类型的',
      cmp: ['Kotlin', 'var users = ArrayList<String>()'],
      pit: '`var` 不是只读的，要只读得写 `final var`。它对应 Kotlin 的 `var`，不是 `val`。',
      q: '((type_identifier) @hit (#eq? @hit "var"))', api: ['var'], tags: ['var', '类型推断'],
    },

    {
      id: 'java-primitive', title: '基本类型 int / long / double / boolean', syntax: 'int i; long l; double d; boolean b; char c;',
      why: '数字、真假、字符这些最常用的值，Java 用"基本类型"直接存储，不是对象，所以快、省内存。读代码时要知道它们的范围和计算规则，比如整数相除会丢掉小数、溢出不会报错。',
      example: 'int a = 7, b = 2;\nSystem.out.println(a / b);      // 输出：3（整数相除，小数部分直接丢掉）\nSystem.out.println(7.0 / 2);    // 输出：3.5\nlong big = 3_000_000_000L;      // 超过 int 范围要用 long，数字后加 L\nint max = Integer.MAX_VALUE;\nSystem.out.println(max + 1);    // 输出：-2147483648（溢出，不报错）\nchar c = \'A\';\nSystem.out.println(c + 1);      // 输出：66（char 参与运算时当数字）\nboolean ok = big > max;         // true',
      vs: ['基本类型 int 和包装类 Integer', 'int x = null;               // 编译错误：基本类型不能是 null\nInteger y = null;           // 可以：包装类是对象\nint z = y;                  // 运行时抛 NullPointerException（自动拆箱遇到 null）\n\nInteger a = 1000, b = 1000;\nSystem.out.println(a == b);      // 输出：false（== 比较的是两个对象）\nSystem.out.println(a.equals(b)); // 输出：true'],
      ts: 'const a = 7, b = 2;\nconsole.log(a / b);              // 3.5（TS 只有 number，不会丢小数）\nconsole.log(Math.trunc(a / b));  // 3：要模拟 Java 整数除法得自己取整\nconst big = 3_000_000_000;       // number 能精确表示到 2^53，更大才需要 bigint\nconsole.log("A".charCodeAt(0) + 1); // 66：TS 没有 char，单个字符也是 string',
      desc: '- 8 种：`byte` `short` `int` `long` `float` `double` `char` `boolean`\n- 字段默认值是 0/false；放进集合时自动装箱成 `Integer` 等包装类',
      cmp: ['Kotlin', 'val n: Int = 1  // Kotlin 写法上不区分基本类型和包装类'],
      pit: '包装类之间用 `==` 比较的是引用。`Integer` 在 -128~127 之间有缓存，所以小数字 `==` 碰巧是 true，大数字就是 false，一律用 `equals`。',
      q: '[(integral_type) (floating_point_type) (boolean_type)] @hit', tags: ['int', 'long', 'boolean', 'double', '基本类型', '装箱'],
    },

    {
      id: 'java-final', title: 'final 不可变', syntax: 'final int x = 1;    final class A    final void f()',
      why: '把"不该被改的东西"锁住：变量只能赋值一次，方法不能被子类重写，类不能被继承。编译器帮你保证，别人改了会直接编译失败。',
      example: 'class Config {\n    private final String host;            // final 字段：只能在构造函数里赋值一次\n    Config(String host) { this.host = host; }\n    String host() { return host; }\n}\nfinal class Utils {                       // final 类：不能被继承\n    static final int TIMEOUT = 3000;      // 常量\n}\nConfig c = new Config("a.com");\nSystem.out.println(c.host());             // 输出：a.com',
      vs: ['final 变量和普通变量', 'final int max = 3;\nmax = 4;                   // 编译错误：cannot assign a value to final variable max\n\nfinal List<String> names = new ArrayList<>();\nnames.add("Tom");          // 可以：final 只锁住变量本身，不锁对象内容\nnames = new ArrayList<>(); // 编译错误：不能再指向别的对象\n\nclass MyUtils extends Utils {}  // 编译错误：cannot inherit from final Utils'],
      ts: 'class Config {\n  constructor(private readonly host: string) {}  // final 字段 ≈ readonly\n  getHost() { return this.host; }\n}\nconst TIMEOUT = 3000;                 // final 局部变量 ≈ const\n// final class / final 方法：TS 没有对应写法',
      desc: '- 变量：只能赋值一次\n- 方法：子类不能重写\n- 类：不能被继承，比如 `String` 就是 final 类',
      cmp: ['Kotlin', 'val host = "a.com"  // Kotlin 的类和方法默认就是 final，要继承得写 open'],
      pit: '`final` 只保证引用不变，对象内部仍然可以改，比如 `final List<String> l` 照样能 `l.add()`。',
      q: '(modifiers "final" @hit)', tags: ['final', '常量', '不可变'],
    },

    {
      id: 'java-static', title: 'static 静态成员', syntax: 'static int count;    static void f()',
      why: '有些数据和方法属于"整个类"，不属于某个对象，比如计数器、常量、工具方法。标成 `static` 后，用 `类名.成员` 直接访问，不需要先 `new` 一个对象。',
      example: 'class Counter {\n    static int total = 0;     // 静态字段：所有对象共用一份\n    int mine = 0;             // 实例字段：每个对象各一份\n\n    void hit() { total++; mine++; }\n    static int add(int a, int b) { return a + b; }  // 静态方法：不需要对象\n}\nCounter a = new Counter(), b = new Counter();\na.hit(); a.hit(); b.hit();\nSystem.out.println(Counter.total);         // 输出：3\nSystem.out.println(a.mine + " " + b.mine); // 输出：2 1\nSystem.out.println(Counter.add(1, 2));     // 输出：3',
      vs: ['static 和实例成员', 'class Counter {\n    int mine = 0;\n    static void reset() {\n        mine = 0;        // 编译错误：non-static variable mine cannot be referenced from a static context\n        this.mine = 0;   // 编译错误：静态方法里没有 this\n    }\n}\nint m = Counter.mine;    // 编译错误：实例字段要通过对象访问，如 new Counter().mine'],
      ts: 'class Counter {\n  static total = 0;\n  mine = 0;\n  hit() { Counter.total++; this.mine++; }  // TS 访问静态字段必须写类名\n  static add(a: number, b: number) { return a + b; }\n}\nconsole.log(Counter.add(1, 2));            // 3',
      desc: '- 静态方法里不能直接访问实例字段和实例方法\n- `static final` 常用来定义常量，命名习惯是全大写，如 `TAG`、`MAX_SIZE`',
      cmp: ['Kotlin', 'companion object {\n    var total = 0\n    fun add(a: Int, b: Int) = a + b\n}'],
      q: '(modifiers "static" @hit)', tags: ['static', '静态', '常量'],
    },

    {
      id: 'java-access', title: 'public / private / protected 访问修饰符', syntax: 'private int x;',
      why: '控制"谁能用这个成员"。内部细节标 `private` 藏起来，只把该给别人用的方法标 `public`。这样以后改内部实现时，不会影响外面的代码。',
      example: 'public class Account {\n    private int balance = 0;              // 外部不能直接改余额\n    public void deposit(int amount) {     // 只能通过这个方法存钱\n        if (amount > 0) balance += amount;\n    }\n    public int getBalance() { return balance; }\n}\nAccount acc = new Account();\nacc.deposit(100);\nSystem.out.println(acc.getBalance());     // 输出：100',
      vs: ['从类外部访问会怎样', 'Account acc = new Account();\nacc.balance = 999;      // 编译错误：balance has private access in Account\nacc.deposit(-5);        // 可以调用，但方法内部会拒绝负数\n\n// 四种级别从宽到窄：\n// public     所有地方\n// protected  同一个包 + 子类\n// （不写）    同一个包\n// private    只有本类'],
      ts: 'class Account {\n  private balance = 0;          // TS 的 private 只在编译期检查，运行时私有要写 #balance\n  deposit(amount: number) { if (amount > 0) this.balance += amount; }\n  getBalance() { return this.balance; }  // TS 不写修饰符默认 public\n}\nconst acc = new Account();\nacc.deposit(100);\nconsole.log(acc.getBalance()); // 100',
      desc: '- Java 什么都不写是"包级可见"，不是 public，这点和 TS、Kotlin 都不一样\n- 一个 `.java` 文件里只能有一个 public 顶层类，并且类名要和文件名相同',
      cmp: ['Kotlin', 'private var balance = 0  // Kotlin 默认 public，没有包级可见，多了 internal'],
      q: '(modifiers ["public" "private" "protected"] @hit)', tags: ['public', 'private', 'protected', '可见性'],
    },

    {
      id: 'java-array', title: '数组 int[] / new int[n] / a[i]', syntax: 'int[] a = new int[3];    String[] s = {"a", "b"};',
      why: '保存固定数量的同类型元素，按下标读写，速度最快。Java 的数组长度创建后就不能变；需要增删元素时一般改用 `ArrayList`。`main(String[] args)` 和很多老 API 都在用数组。',
      example: 'int[] scores = new int[3];          // 长度 3，元素默认都是 0\nscores[0] = 90;\nscores[1] = 80;\nString[] names = {"Tom", "Jerry"};  // 直接列出元素\nSystem.out.println(scores.length);  // 输出：3（length 是字段，不加括号）\nSystem.out.println(scores[2]);      // 输出：0\nfor (String n : names) {\n    System.out.println(n);          // 输出：Tom、Jerry\n}',
      vs: ['数组和 ArrayList', 'int[] a = new int[2];\na[2] = 1;                // 运行时抛 ArrayIndexOutOfBoundsException（下标从 0 到 1）\n// 数组没有 add，长度固定\n\nList<Integer> list = new ArrayList<>();\nlist.add(1);             // ArrayList 可以随时增删\nlist.add(2);\nSystem.out.println(list.size());  // 输出：2（集合用 size()，数组用 length）'],
      ts: 'const scores = new Array<number>(3).fill(0); // new int[3]\nscores[0] = 90;\nconst names = ["Tom", "Jerry"];\nconsole.log(scores.length);     // 3\nnames.push("Spike");            // TS 数组可以变长，更像 Java 的 ArrayList',
      desc: '- 长度：数组用 `a.length`，String 用 `s.length()`，集合用 `list.size()`\n- 打印数组要用 `Arrays.toString(a)`，直接 println 只会打出类似 `[I@1b6d3586` 的地址',
      cmp: ['Kotlin', 'val scores = IntArray(3)\nval names = arrayOf("Tom", "Jerry")'],
      pit: '下标越界抛 `ArrayIndexOutOfBoundsException`，不会像 TS 那样返回 undefined。',
      q: '[(array_type) (array_creation_expression) (array_access)] @hit', tags: ['数组', 'array', '[]', 'length'],
    },

    {
      id: 'java-cast', title: '(Type) 强制类型转换', syntax: '(String) obj    (int) 3.7',
      why: '两种场景：一是数字之间转换，比如把 `long` 或 `double` 转成 `int`；二是你知道一个 `Object` 实际是什么类型，要把它当成那个类型来用，比如从老式集合或回调参数里拿出来的值。',
      example: 'double price = 9.99;\nint yuan = (int) price;            // 直接截断小数，不是四舍五入\nSystem.out.println(yuan);          // 输出：9\n\nObject obj = "hello";              // 声明类型是 Object，实际是 String\nString s = (String) obj;           // 告诉编译器"它就是 String"\nSystem.out.println(s.length());    // 输出：5',
      vs: ['转换失败会怎样', 'Object obj = 123;                  // 实际是 Integer\nString s = (String) obj;           // 运行时抛 ClassCastException\n\n// 安全的写法：先判断再转\nif (obj instanceof String str) {   // Java 16+：判断成功直接得到 str\n    System.out.println(str.length());\n}\nint n = (int) 3_000_000_000L;      // 不报错，但溢出成 -1294967296'],
      ts: 'const yuan = Math.trunc(9.99);     // (int) 在 TS 里要自己取整\nconst obj: unknown = "hello";\nconst s = obj as string;           // as 只骗编译器，运行时不检查，转错也不会抛异常\nconsole.log(s.length);             // 5',
      desc: '- 小类型转大类型（如 int 转 long）是自动的，不用写括号\n- 大转小、浮点转整数要显式强转，可能丢精度或溢出',
      cmp: ['Kotlin', 'val yuan = price.toInt()\nval s = obj as String'],
      q: '(cast_expression) @hit', tags: ['强转', 'cast', '类型转换'],
    },

    {
      id: 'java-text-block', title: '"""文本块"""', syntax: '"""\\n  多行\\n  """',
      why: '写 SQL、JSON、HTML 这类多行文本时，不用再拼一堆 `"...\\n" +`，也不用转义双引号。Java 15 起可用。',
      example: 'String json = """\n    {\n      "name": "Tom",\n      "age": 18\n    }\n    """;\nSystem.out.println(json);\n// 输出：\n// {\n//   "name": "Tom",\n//   "age": 18\n// }\n// 公共缩进被自动去掉，引号也不用转义',
      vs: ['不用文本块的写法', 'String json = "{\\n" +\n    "  \\"name\\": \\"Tom\\",\\n" +\n    "  \\"age\\": 18\\n" +\n    "}";                  // 每行都要拼接、手写 \\n、转义双引号\n\nString bad = """abc""";  // 编译错误：开头的 """ 后面必须换行'],
      ts: 'const json = `\n{\n  "name": "Tom",\n  "age": 18\n}`;\nconsole.log(json);   // 模板字符串也能跨行，但不会自动去掉缩进',
      desc: '- 开头的 `"""` 后面必须换行\n- 结尾 `"""` 的位置决定去掉多少缩进；放在单独一行时，结果末尾会带一个换行',
      cmp: ['Kotlin', 'val json = """\n    {"name": "Tom"}\n""".trimIndent()'],
      q: '((string_literal) @hit (#match? @hit "^\\"\\"\\""))', tags: ['"""', '多行字符串', '文本块'],
    },

    {
      id: 'java-null', title: 'null 与 NullPointerException', syntax: 'String s = null;',
      why: '`null` 表示"没有对象"，比如查不到的用户、还没初始化的字段。Java 编译器不检查空值，任何对象变量都可能是 null，对它调用方法就会崩溃（NPE），所以读 Java 代码时到处能看到 `if (x != null)`。',
      example: 'String findName(int id) {\n    return id == 1 ? "Tom" : null;   // 查不到就返回 null\n}\nString name = findName(2);\nif (name != null) {\n    System.out.println(name.length());\n} else {\n    System.out.println("没找到");     // 输出：没找到\n}',
      vs: ['不判空会怎样', 'String name = findName(2);    // 得到 null，编译器不会提醒\nname.length();                 // 运行时抛 NullPointerException\n\n// 更安全的写法：用 Optional 表示"可能没有"\nOptional<String> opt = Optional.ofNullable(findName(2));\nSystem.out.println(opt.orElse("没找到"));  // 输出：没找到'],
      ts: 'function findName(id: number): string | null {\n  return id === 1 ? "Tom" : null;   // TS 在类型里写明可能是 null，编译器会强制你判空\n}\nconst name = findName(2);\nconsole.log(name?.length ?? "没找到"); // Java 没有 ?. 和 ??，只能手写 if',
      desc: '- 基本类型（int、boolean 等）不能是 null，对象类型都可以\n- `@Nullable` / `@NonNull` 注解只是给 IDE 和工具看的提示，编译器本身不强制',
      cmp: ['Kotlin', 'val name: String? = findName(2)\nprintln(name?.length ?: "没找到")  // Kotlin 在类型上区分可空和非空'],
      q: '(null_literal) @hit', tags: ['null', 'NPE', '空指针'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
