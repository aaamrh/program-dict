// java · 注解（3 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('注解', [
    {
      id: 'java-annotation', title: '@注解', syntax: '@Override    @SuppressWarnings("x")',
      why: '给代码贴"标签"，告诉编译器、IDE 或框架一些额外信息。注解本身不执行任何逻辑，要靠读取它的工具起作用：编译器据此报警告，框架据此自动生成代码或注入对象（如 Room 的 `@Entity`、Retrofit 的 `@GET`）。',
      example: 'class Api {\n    @Deprecated                       // 告诉调用方：这个方法过时了，IDE 会划删除线\n    void oldLogin() {}\n\n    @SuppressWarnings("unchecked")    // 让编译器别对这里报 unchecked 警告\n    List<String> load(Object raw) {\n        return (List<String>) raw;\n    }\n\n    void greet(@NonNull String name) {}   // 给 IDE 和静态检查看：不要传 null\n}\nnew Api().oldLogin();   // 能编译运行，但会收到"已过时"警告',
      vs: ['有注解和没注解的区别', '// 注解不改变代码的运行逻辑：\nvoid greet(@NonNull String name) { System.out.println(name.length()); }\ngreet(null);   // 能编译通过（最多有个 IDE 警告），运行时照样抛 NullPointerException\n\n// 注解的作用取决于谁读它：\n// @Override      编译器检查是否真的重写了\n// @Deprecated    编译器给调用方报警告\n// @GET("/user")  Retrofit 在运行时读取，生成网络请求'],
      ts: 'class Api {\n  /** @deprecated 用 login 代替 */  // JSDoc 注释，编辑器同样会划删除线\n  oldLogin() {}\n  // eslint-disable-next-line       // 相当于 @SuppressWarnings\n  load(raw: unknown) { return raw as string[]; }\n}\n// TS 的装饰器 @xxx 是会执行的函数，和 Java 注解不同',
      desc: '- 可以加在类、方法、字段、参数、局部变量上\n- 带参数：`@SuppressWarnings("unused")`；只有一个名为 value 的参数时，可以省略 `value =`',
      cmp: ['Kotlin', '@Deprecated("用 login 代替")\nfun oldLogin() {}\n@Suppress("UNCHECKED_CAST")'],
      q: '[(annotation) (marker_annotation)] @hit', tags: ['@', '注解', 'annotation'],
    },

    {
      id: 'java-override', title: '@Override 重写', syntax: '@Override public void run()',
      why: '标明"这个方法是在重写父类或接口的方法"。不写也能重写，但写上之后，如果方法名或参数写错了（实际上没重写成），编译器会直接报错，不会悄悄变成一个新方法。',
      example: 'class Animal {\n    String speak() { return "..."; }\n}\nclass Cat extends Animal {\n    @Override\n    String speak() { return "喵"; }   // 确实重写了父类方法\n}\nAnimal a = new Cat();\nSystem.out.println(a.speak());        // 输出：喵',
      vs: ['不写 @Override 时拼错了方法名', 'class Cat extends Animal {\n    String speek() { return "喵"; }   // 拼错了：这是一个新方法，没有重写\n}\nnew Cat().speak();                    // 返回 "..."，bug 很难发现\n\nclass Dog extends Animal {\n    @Override\n    String speek() { return "汪"; }   // 编译错误：method does not override or implement a method from a supertype\n}'],
      ts: 'class Cat extends Animal {\n  override speak() { return "喵"; }  // TS 4.3+ 的 override 关键字，作用相同\n}\n// 开启 noImplicitOverride 后，TS 要求重写时必须写 override',
      desc: '- 实现接口方法时也可以写 `@Override`\n- Android 里重写 `onCreate`、`onClick` 等方法时，几乎都会带上它',
      cmp: ['Kotlin', 'override fun speak() = "喵"  // Kotlin 重写时必须写 override，是关键字而不是注解'],
      q: '((marker_annotation (identifier) @hit) (#eq? @hit "Override"))', tags: ['@Override', 'override', '重写'],
    },

    {
      id: 'java-annotation-decl', title: '@interface 定义注解', syntax: '@interface MyAnno { String value(); }',
      why: '自己定义一种注解，给框架或自己写的工具读取。业务代码很少需要写，但读框架源码、看到 `@interface` 时要知道它是在"定义注解"，不是在定义接口。',
      example: 'import java.lang.annotation.*;\n\n@Retention(RetentionPolicy.RUNTIME)   // 保留到运行时，才能通过反射读取\n@Target(ElementType.METHOD)           // 只能加在方法上\n@interface Route {\n    String value();                   // 看起来像方法，其实是注解参数\n    int timeout() default 3000;       // 带默认值的参数\n}\n\nclass Pages {\n    @Route("/home")                   // 只传 value 时可以省略参数名\n    void home() {}\n}\nRoute r = Pages.class.getDeclaredMethod("home").getAnnotation(Route.class);\nSystem.out.println(r.value() + " " + r.timeout());  // 输出：/home 3000',
      vs: ['@interface 和 interface', 'interface Greeter { String greet(); }   // 普通接口：要被类实现\n@interface Route { String value(); }      // 注解类型：只能用来贴标签 @Route("/x")\n\nclass Pages {\n    @Route void home() {}   // 编译错误：value 没有默认值，必须传参数\n}'],
      ts: '// TS 没有对应写法：TS 装饰器是一个普通函数，没有"声明注解类型"这一步\nfunction Route(path: string) {\n  return (target: unknown, ctx: ClassMethodDecoratorContext) => {\n    console.log("注册路由", path, String(ctx.name));\n  };\n}',
      desc: '- `@Retention` 决定注解保留到哪一步：`SOURCE` 只在源码中（如 `@Override`），`CLASS` 保留到字节码，`RUNTIME` 运行时可以反射读取\n- 不写 `@Retention` 时默认是 `CLASS`，运行时用反射读不到',
      cmp: ['Kotlin', 'annotation class Route(val value: String, val timeout: Int = 3000)'],
      q: '(annotation_type_declaration "@interface" @hit)', tags: ['@interface', '自定义注解'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
