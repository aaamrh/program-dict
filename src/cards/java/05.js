// java · 泛型（3 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('泛型', [
    {
      id: 'java-type-params', title: '<T> 泛型声明', syntax: 'class Box<T>    <T> T first(List<T> l)',
      why: '同一段逻辑要用于不同类型，又不想丢掉类型检查。比如写一个"取列表第一个元素"的方法，用 `<T>` 后，传 `List<String>` 返回 `String`，传 `List<Integer>` 返回 `Integer`，不用写两遍，也不用到处强转。',
      example: 'class Box<T> {                         // 泛型类：T 由使用者决定\n    private T value;\n    Box(T value) { this.value = value; }\n    T get() { return value; }\n}\nstatic <T> T first(List<T> list) {     // 泛型方法：<T> 写在返回类型前面\n    return list.get(0);\n}\n\nBox<String> b = new Box<>("hi");\nString s = b.get();                     // 不用强转\nInteger n = first(List.of(3, 4));       // T 自动推断为 Integer\nSystem.out.println(s + " " + n);        // 输出：hi 3',
      vs: ['不用泛型（用 Object）', 'class ObjBox {\n    private Object value;\n    ObjBox(Object v) { value = v; }\n    Object get() { return value; }\n}\nObjBox b = new ObjBox("hi");\nString s = (String) b.get();    // 每次都要强转\nInteger n = (Integer) b.get();  // 编译通过，运行时抛 ClassCastException\n\nBox<String> g = new Box<>("hi");\nInteger m = g.get();            // 泛型版：编译错误，提前发现'],
      ts: 'class Box<T> {\n  constructor(private value: T) {}\n  get(): T { return this.value; }\n}\nfunction first<T>(list: T[]): T { return list[0]; }  // TS 的 <T> 写在函数名后面\nconst n = first([3, 4]);  // number',
      desc: '- `<T extends Number>`：限定 T 必须是 Number 或它的子类，这样就能调用 Number 的方法\n- 可以有多个类型参数：`Map<K, V>`',
      cmp: ['Kotlin', 'class Box<T>(val value: T)\nfun <T> first(list: List<T>): T = list[0]'],
      pit: 'Java 泛型在运行时会被擦除：不能 `new T()`，不能写 `x instanceof List<String>`，`List<String>` 和 `List<Integer>` 运行时是同一个类。',
      q: '(type_parameters) @hit', tags: ['泛型', 'generic', '<T>'],
    },

    {
      id: 'java-type-args', title: 'List<String> 类型实参 / <> 菱形', syntax: 'List<String> l = new ArrayList<>();',
      why: '使用泛型类时，在尖括号里说明"装的是什么"。编译器据此检查放进去的东西对不对，取出来时也不用强转。右边的 `<>`（菱形语法）让编译器照抄左边的类型，不用写两遍。',
      example: 'List<String> names = new ArrayList<>();          // <> 自动推断为 ArrayList<String>\nnames.add("Tom");\nString first = names.get(0);                     // 取出来就是 String\n\nMap<String, List<Integer>> scores = new HashMap<>();\nscores.put("Tom", List.of(90, 85));\nSystem.out.println(scores.get("Tom").get(1));    // 输出：85',
      vs: ['不写类型实参（原始类型）', 'List raw = new ArrayList();      // 原始类型：编译器只给警告\nraw.add("Tom");\nraw.add(123);                    // 什么都能放\nString s = (String) raw.get(1);  // 运行时抛 ClassCastException\n\nList<String> safe = new ArrayList<>();\nsafe.add(123);                   // 编译错误：incompatible types: int cannot be converted to String'],
      ts: 'const names: string[] = [];\nnames.push("Tom");\nconst scores = new Map<string, number[]>();   // TS 能推断时连 <> 都不用写\nscores.set("Tom", [90, 85]);',
      desc: '- 类型实参只能是对象类型：要写 `List<Integer>`，不能写 `List<int>`\n- 菱形 `<>` 从 Java 7 开始支持',
      cmp: ['Kotlin', 'val names = mutableListOf<String>()\nval scores = HashMap<String, List<Int>>()'],
      q: '(generic_type (type_arguments) @hit)', tags: ['泛型', '<>', '菱形'],
    },

    {
      id: 'java-wildcard', title: '? extends / ? super 通配符', syntax: 'List<? extends Number>    Comparator<? super T>',
      why: '`List<Integer>` 并不是 `List<Number>` 的子类型，所以一个参数写成 `List<Number>` 的方法收不了 `List<Integer>`。通配符让方法能接收"一类"泛型：只读数据用 `? extends`，只往里写用 `? super`。读 JDK 和库的方法签名时经常会看到。',
      example: 'static double sum(List<? extends Number> nums) {  // 接收 Integer、Double 等任意 Number 列表\n    double total = 0;\n    for (Number n : nums) total += n.doubleValue();   // 只读：取出来当 Number 用\n    return total;\n}\nstatic void fillOnes(List<? super Integer> out) {   // 接收 Integer、Number、Object 列表\n    out.add(1);                                      // 只写：可以放 Integer\n}\nSystem.out.println(sum(List.of(1, 2, 3)));         // 输出：6.0\nList<Number> nums = new ArrayList<>();\nfillOnes(nums);\nSystem.out.println(nums);                          // 输出：[1]',
      vs: ['不用通配符会怎样', 'static double sum2(List<Number> nums) { return 0; }\nsum2(List.of(1, 2, 3));     // 编译错误：List<Integer> cannot be converted to List<Number>\n\nstatic void bad(List<? extends Number> nums) {\n    nums.add(1);            // 编译错误：? extends 只能读不能写（它可能是 List<Double>）\n}'],
      ts: '// TS 没有 ? extends / ? super：数组类型按结构自动判断兼容\nfunction sum(nums: readonly number[]) {   // readonly 数组近似"只读"的 ? extends\n  return nums.reduce((a, b) => a + b, 0);\n}\nsum([1, 2, 3]);  // 6',
      desc: '- 口诀 PECS：Producer Extends, Consumer Super。从参数里读数据用 extends，往参数里写数据用 super\n- 单独的 `?`（如 `List<?>`）表示任意类型，只能读成 Object',
      cmp: ['Kotlin', 'fun sum(nums: List<out Number>): Double\nfun fillOnes(out: MutableList<in Int>)  // Kotlin 用 out / in'],
      q: '(wildcard) @hit', tags: ['?', 'extends', 'super', '通配符', 'PECS'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
