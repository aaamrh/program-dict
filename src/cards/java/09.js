// java · 方法参数（1 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('方法参数', [
    {
      id: 'java-varargs', title: 'Type... 可变参数', syntax: 'int sum(int... xs)',
      why: '参数个数不固定时用，比如求任意多个数的和、`String.format("%s %s", a, b)`。调用方直接传就行，不用先自己把参数装进数组。',
      example: 'class Demo {\n    static int sum(int... xs) {        // 方法里 xs 就是 int[]\n        int s = 0;\n        for (int x : xs) s += x;\n        return s;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(sum());            // 输出：0\n        System.out.println(sum(1, 2));        // 输出：3\n        System.out.println(sum(1, 2, 3, 4));  // 输出：10\n        int[] arr = {5, 5};\n        System.out.println(sum(arr));         // 也能直接传数组，输出：10\n    }\n}',
      vs: ['不用可变参数：调用方要自己建数组', 'static int sum(int[] xs) { ... }\nsum(new int[]{1, 2, 3});   // 每次都得 new 一个数组\nsum(1, 2, 3);              // 编译错误：参数类型不匹配\n\nstatic int sum2(int... xs) { ... }\nsum2(1, 2, 3);             // 直接传\n\n// static int bad(int... xs, String s)\n// 编译错误：可变参数必须是最后一个参数'],
      ts: 'function sum(...xs: number[]): number {\n  let s = 0;\n  for (const x of xs) s += x;\n  return s;\n}\nsum(1, 2, 3);    // 6\nconst arr = [5, 5];\nsum(...arr);     // 10 —— TS 传数组要用 ... 展开，Java 可以直接传数组',
      desc: '- 写法：`类型... 名字`，方法内部它就是数组\n- 一个方法只能有一个可变参数，而且必须放在最后\n- 一个参数都不传时，得到的是长度为 0 的数组，不是 null',
      cmp: ['Kotlin', 'fun sum(vararg xs: Int) = xs.sum()\nsum(*intArrayOf(5, 5))  // Kotlin 传数组要用 * 展开'],
      q: '(spread_parameter "..." @hit)', tags: ['...', 'varargs', '可变参数'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
