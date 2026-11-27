// java · Lambda 与函数式（2 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('Lambda 与函数式', [
    {
      id: 'java-lambda', title: '(a, b) -> 表达式 Lambda', syntax: '(a, b) -> a + b    x -> { ... }',
      why: '把"一段逻辑"当作参数传给别的方法，比如排序规则、过滤条件、点击回调、线程任务。Java 8 之前只能写匿名内部类，动辄五六行；lambda 一行就能写完。',
      example: 'List<String> names = new ArrayList<>(List.of("Tom", "Al", "Jerry"));\n\nnames.sort((a, b) -> a.length() - b.length());   // 传入排序规则：按长度\nSystem.out.println(names);                       // 输出：[Al, Tom, Jerry]\n\nnames.removeIf(n -> n.startsWith("J"));          // 一个参数可以省略括号\nSystem.out.println(names);                       // 输出：[Al, Tom]\n\nRunnable task = () -> {                          // 多行要用大括号\n    System.out.println("在后台执行");\n};\nnew Thread(task).start();                        // 输出：在后台执行',
      vs: ['lambda 和匿名内部类', '// Java 8 之前：\nnames.sort(new Comparator<String>() {\n    @Override\n    public int compare(String a, String b) {\n        return a.length() - b.length();\n    }\n});\n// lambda：\nnames.sort((a, b) -> a.length() - b.length());\n\nint count = 0;\nnames.forEach(n -> count++);  // 编译错误：lambda 里不能修改外部局部变量（必须是事实上 final）'],
      ts: 'const names = ["Tom", "Al", "Jerry"];\nnames.sort((a, b) => a.length - b.length);  // Java 的 -> 对应 TS 的 =>\nconst rest = names.filter((n) => !n.startsWith("J"));\nlet count = 0;\nnames.forEach(() => count++);  // TS 闭包可以修改外部变量，Java 不行',
      desc: '- lambda 只能用在需要"函数式接口"（只有一个抽象方法的接口）的地方，如 `Runnable`、`Comparator`、`Predicate`、`Function`\n- 参数类型能推断时可以不写；只有一个表达式时省略大括号和 return',
      cmp: ['Kotlin', 'names.sortBy { it.length }\nnames.removeIf { it.startsWith("J") }'],
      pit: 'lambda 里用到的外部局部变量必须是 final 或"事实上 final"（赋值后再没改过）。要累加时可以用数组、`AtomicInteger`，或者改用 stream 的 `count()`。',
      q: '(lambda_expression) @hit', tags: ['lambda', '->', '函数式接口'],
    },

    {
      id: 'java-method-ref', title: ':: 方法引用', syntax: 'String::length    System.out::println    User::new',
      why: '当 lambda 只是"把参数原样交给另一个已有的方法"时，比如 `x -> System.out.println(x)`，可以直接写方法名 `System.out::println`，更短也更好读。',
      example: 'List<String> words = List.of("3", "10", "7");\n\nwords.forEach(System.out::println);          // 等于 w -> System.out.println(w)\n// 输出：3、10、7（每行一个）\n\nList<Integer> nums = words.stream()\n    .map(Integer::parseInt)                  // 等于 s -> Integer.parseInt(s)\n    .collect(Collectors.toList());\nSystem.out.println(nums);                    // 输出：[3, 10, 7]\n\nList<Integer> lens = words.stream().map(String::length).toList();  // 等于 s -> s.length()\nSystem.out.println(lens);                    // 输出：[1, 2, 1]',
      vs: ['四种写法对应的 lambda', 'Function<String, Integer> a = Integer::parseInt;   // 静态方法：s -> Integer.parseInt(s)\nConsumer<String> b = System.out::println;          // 某个对象的方法：s -> System.out.println(s)\nFunction<String, Integer> c = String::length;      // 类名::实例方法：s -> s.length()（参数自己当调用者）\nSupplier<ArrayList<String>> d = ArrayList::new;    // 构造函数：() -> new ArrayList<>()\n\nRunnable r = String::length;  // 编译错误：Runnable 没有参数，length 需要一个 String 调用者'],
      ts: 'const words = ["3", "10", "7"];\nwords.forEach((w) => console.log(w));   // TS 没有 ::，传函数本身或包一层箭头函数\nconst nums = words.map(Number);          // 直接传函数也可以，但 map(parseInt) 会因多传了下标参数出错\nconst lens = words.map((s) => s.length);',
      desc: '- 能写成方法引用的前提：lambda 的参数和返回值正好对应那个方法的参数和返回值\n- `User::new` 引用构造函数，常用于 `map(User::new)`',
      cmp: ['Kotlin', 'words.forEach(::println)\nwords.map(String::toInt)'],
      q: '(method_reference) @hit', tags: ['::', '方法引用'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
