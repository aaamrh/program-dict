// java · 类与对象（19 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('类与对象', [
    {
      id: 'java-class', title: 'class 类声明', syntax: 'public class User { ... }',
      why: '把一组相关的数据（字段）和操作这些数据的方法打包在一起，作为一种新类型。Java 里所有代码都必须写在类里，没有顶层函数，所以读 Java 代码首先看到的就是 class。',
      example: 'public class User {\n    private String name;                 // 数据\n    private int age;\n\n    public User(String name, int age) {  // 构造函数：new 的时候调用\n        this.name = name;\n        this.age = age;\n    }\n    public String greet() {              // 行为\n        return "Hi, " + name;\n    }\n}\n\nUser u = new User("Tom", 18);\nSystem.out.println(u.greet());           // 输出：Hi, Tom',
      vs: ['一个文件里的类有什么限制', '// 文件 User.java\npublic class User {}        // public 类必须和文件同名\nclass Helper {}             // 可以有，但不能是 public\npublic class Order {}       // 编译错误：class Order is public, should be declared in a file named Order.java'],
      ts: 'class User {\n  constructor(private name: string, private age: number) {}  // TS 可以在参数里直接声明字段\n  greet() { return "Hi, " + this.name; }\n}\nconst u = new User("Tom", 18);\nconsole.log(u.greet());  // Hi, Tom',
      desc: '- 类里通常包含：字段、构造函数、方法，也可以有嵌套类\n- 一个 `.java` 文件只能有一个 public 顶层类，文件名必须和它同名',
      cmp: ['Kotlin', 'class User(private val name: String, private val age: Int) {\n    fun greet() = "Hi, $name"\n}'],
      q: '(class_declaration name: (identifier) @hit)', tags: ['class', '类'],
    },

    {
      id: 'java-extends', title: 'extends 继承', syntax: 'class A extends Base',
      why: '在已有的类的基础上做扩展：子类自动拥有父类的字段和方法，只需要写新增或要改的部分。Android 开发里到处都是，比如自己写的页面 `extends Activity`、服务 `extends Service`。',
      example: 'class Animal {\n    String name = "动物";\n    String speak() { return "..."; }\n}\nclass Dog extends Animal {              // Dog 继承 Animal\n    @Override\n    String speak() { return "汪"; }      // 重写父类方法\n}\n\nDog d = new Dog();\nSystem.out.println(d.name);             // 输出：动物（继承来的字段）\nSystem.out.println(d.speak());          // 输出：汪\nAnimal a = d;                           // 子类对象可以当父类用\nSystem.out.println(a.speak());          // 输出：汪（实际调用的仍是 Dog 的版本）',
      vs: ['extends 和 implements 的区别', 'class Dog extends Animal {}                  // extends 类：继承实现，只能有一个\nclass Dog extends Animal, Pet {}             // 编译错误：Java 不支持多继承\nclass Dog extends Animal implements Runnable, Comparable<Dog> {}\n                                             // implements 接口：可以有多个\nfinal class Cat {}\nclass Kitten extends Cat {}                  // 编译错误：cannot inherit from final Cat'],
      ts: 'class Animal {\n  name = "动物";\n  speak() { return "..."; }\n}\nclass Dog extends Animal {\n  override speak() { return "汪"; }  // TS 4.3+ 可写 override\n}\nconsole.log(new Dog().speak());     // 汪',
      desc: '- 只能继承一个类，但可以同时实现多个接口\n- 父类的 private 成员子类访问不到\n- 子类构造函数会先调用父类构造函数（不写时隐式调用 `super()`）',
      cmp: ['Kotlin', 'class Dog : Animal() {  // Kotlin 用冒号，父类必须是 open\n    override fun speak() = "汪"\n}'],
      q: '(superclass) @hit', tags: ['extends', '继承', '父类'],
    },

    {
      id: 'java-implements', title: 'implements 实现接口', syntax: 'class A implements Runnable, Closeable',
      why: '接口只规定"必须有哪些方法"，`implements` 表示"我承诺提供这些方法"。这样别的代码只依赖接口，不关心具体是哪个类，比如线程池只要求任务是 `Runnable`。',
      example: 'interface Greeter {\n    String greet(String name);\n}\nclass ChineseGreeter implements Greeter {\n    public String greet(String name) { return "你好，" + name; }\n}\nclass EnglishGreeter implements Greeter {\n    public String greet(String name) { return "Hello, " + name; }\n}\n\nGreeter g = new ChineseGreeter();      // 变量类型写接口\nSystem.out.println(g.greet("Tom"));    // 输出：你好，Tom\ng = new EnglishGreeter();              // 换实现，调用方代码不用改\nSystem.out.println(g.greet("Tom"));    // 输出：Hello, Tom',
      vs: ['漏实现方法会怎样', 'class Lazy implements Greeter {}\n// 编译错误：Lazy is not abstract and does not override abstract method greet(String)\n\nclass Quiet implements Greeter {\n    String greet(String name) { return ""; }\n    // 编译错误：接口方法默认 public，实现时不能降低可见性，必须写 public\n}'],
      ts: 'interface Greeter { greet(name: string): string; }\nclass ChineseGreeter implements Greeter {\n  greet(name: string) { return "你好，" + name; }\n}\n// TS 是结构化类型：只要形状对得上，不写 implements 也能赋给 Greeter\nconst g: Greeter = { greet: (n) => "Hi " + n };',
      desc: '- 可以实现多个接口：`implements A, B`\n- 抽象类实现接口时可以不实现全部方法，留给子类',
      cmp: ['Kotlin', 'class ChineseGreeter : Greeter {\n    override fun greet(name: String) = "你好，$name"\n}'],
      q: '(super_interfaces) @hit', tags: ['implements', '接口', '实现'],
    },

    {
      id: 'java-constructor', title: '构造函数', syntax: 'public User(String name) { this.name = name; }',
      why: '`new` 一个对象时自动执行，用来给字段设初值、检查参数。保证对象一创建出来就是可用的状态。',
      example: 'public class User {\n    private final String name;\n    private int age;\n\n    public User(String name, int age) {   // 和类同名，没有返回类型\n        if (age < 0) throw new IllegalArgumentException("age < 0");\n        this.name = name;\n        this.age = age;\n    }\n    public User(String name) {            // 重载：参数不同的另一个构造函数\n        this(name, 0);                    // 调用上面那个\n    }\n}\n\nUser a = new User("Tom", 18);\nUser b = new User("Jerry");               // age 为 0',
      vs: ['不写构造函数会怎样', 'class A {}\nnew A();          // 可以：编译器自动生成无参构造函数\n\nclass B {\n    B(int x) {}\n}\nnew B();          // 编译错误：constructor B in class B cannot be applied（写了有参构造后，不再自动生成无参构造）\n\nclass C {\n    void C() {}   // 这不是构造函数：写了返回类型 void，它只是一个普通方法\n}'],
      ts: 'class User {\n  constructor(private readonly name: string, private age = 0) {\n    if (age < 0) throw new Error("age < 0");\n  }\n}\n// TS 只能有一个 constructor，用可选参数/默认值代替重载\nnew User("Jerry");',
      desc: '- 可以有多个（重载），按参数类型和个数区分\n- `this(...)` 调用本类另一个构造函数，`super(...)` 调用父类构造函数，都必须写在第一行',
      cmp: ['Kotlin', 'class User(val name: String, var age: Int = 0)  // 主构造函数 + 默认参数，代替重载'],
      q: '(constructor_declaration name: (identifier) @hit)', tags: ['构造函数', 'constructor'],
    },

    {
      id: 'java-new', title: 'new 创建对象', syntax: 'new User("Tom")',
      why: '类只是"图纸"，`new` 按图纸造出一个具体的对象，并调用构造函数初始化。每次 `new` 都得到一个全新的、独立的对象。',
      example: 'User a = new User("Tom");\nUser b = new User("Tom");\nSystem.out.println(a == b);       // 输出：false（两次 new 是两个不同的对象）\n\nList<String> list = new ArrayList<>();  // <> 让编译器从左边推断泛型\nlist.add("x");\nint[] nums = new int[3];          // 数组也用 new',
      vs: ['new 和不 new', 'User u;                    // 只声明了变量，没有对象\nu.greet();                 // 编译错误：variable u might not have been initialized\nUser v = null;\nv.greet();                 // 运行时抛 NullPointerException\n\nUser w = new User("Tom");  // 有了对象才能调用方法\nUser x = w;                // 没有 new：x 和 w 指向同一个对象'],
      ts: 'const a = new User("Tom");\nconst list: string[] = [];   // TS 数组、对象常用字面量，不需要 new\nconst obj = { name: "Tom" }; // Java 没有对象字面量，必须先定义类再 new',
      desc: '- 写法：`new 类名(构造参数)`\n- 赋值 `x = w` 不会复制对象，两个变量指向同一个对象',
      cmp: ['Kotlin', 'val a = User("Tom")  // Kotlin 不写 new'],
      q: '(object_creation_expression "new" @hit)', tags: ['new', '创建对象', '实例化'],
    },

    {
      id: 'java-this', title: 'this 当前对象', syntax: 'this.name = name;    this(a, 0);',
      why: '在方法里指代"调用这个方法的那个对象"。最常见的用途是参数和字段同名时，用 `this.name` 表示字段；也可以把当前对象传给别人，比如 `listener.register(this)`。',
      example: 'class User {\n    private String name;\n    User(String name) {\n        this.name = name;     // 左边是字段，右边是参数\n    }\n    User rename(String name) {\n        this.name = name;\n        return this;          // 返回当前对象，可以链式调用\n    }\n    String getName() { return name; }  // 不同名时可以省略 this\n}\nUser u = new User("Tom").rename("Jerry");\nSystem.out.println(u.getName());  // 输出：Jerry',
      vs: ['漏写 this 会怎样', 'class User {\n    private String name;\n    User(String name) {\n        name = name;    // 不报错，但只是把参数赋给参数自己，字段仍然是 null\n    }\n    static void f() {\n        this.name = "x"; // 编译错误：non-static variable this cannot be referenced from a static context\n    }\n}'],
      ts: 'class User {\n  constructor(private name: string) {}\n  rename(name: string) { this.name = name; return this; }\n}\n// TS 访问字段必须写 this.；Java 不同名时可以省略\n// TS 回调里的 this 可能丢失（要用箭头函数），Java 没有这个问题',
      desc: '- `this.字段`、`this.方法()`：访问当前对象的成员\n- 构造函数第一行的 `this(...)`：调用本类另一个构造函数\n- 静态方法里没有 this',
      cmp: ['Kotlin', 'class User(private var name: String) {\n    fun rename(name: String) = apply { this.name = name }\n}'],
      q: '(this) @hit', tags: ['this'],
    },

    {
      id: 'java-super', title: 'super 父类', syntax: 'super(ctx);    super.onCreate();',
      why: '子类重写了父类方法后，还想执行父类原来的逻辑，就用 `super.方法()`。Android 里重写 `onCreate`、`onDestroy` 等生命周期方法时，必须先调用 `super`，否则系统会报错。',
      example: 'class Animal {\n    String name;\n    Animal(String name) { this.name = name; }\n    String describe() { return "我是" + name; }\n}\nclass Dog extends Animal {\n    Dog() { super("狗"); }                       // 调用父类构造函数，必须第一行\n    @Override\n    String describe() {\n        return super.describe() + "，会汪汪叫";   // 先拿父类的结果，再追加\n    }\n}\nSystem.out.println(new Dog().describe());  // 输出：我是狗，会汪汪叫',
      vs: ['不调用 super 会怎样', 'class Dog extends Animal {\n    Dog() {}   // 编译错误：constructor Animal in class Animal cannot be applied（父类没有无参构造，必须显式 super("狗")）\n}\n\npublic class MainActivity extends Activity {\n    @Override\n    protected void onCreate(Bundle b) {\n        // 漏了 super.onCreate(b);\n    }   // 运行时抛 SuperNotCalledException：Android 会检查是否调用了 super\n}'],
      ts: 'class Dog extends Animal {\n  constructor() { super("狗"); }     // TS 也要求子类构造先调 super\n  override describe() {\n    return super.describe() + "，会汪汪叫";\n  }\n}',
      desc: '- `super(...)`：调用父类构造函数，只能写在构造函数第一行；不写时编译器自动插入 `super()`\n- `super.方法()`：调用父类版本的方法',
      cmp: ['Kotlin', 'class Dog : Animal("狗") {\n    override fun describe() = super.describe() + "，会汪汪叫"\n}'],
      q: '(super) @hit', tags: ['super', '父类'],
    },

    {
      id: 'java-field', title: '字段（成员变量）', syntax: 'private int count;',
      why: '对象要"记住"的数据放在字段里，比如用户的名字、计数器的当前值。字段写在类里、方法外，跟着对象一直存在；方法里的局部变量在方法结束后就没了。',
      example: 'class Counter {\n    private int count;             // 没赋值：默认是 0\n    private String label = "点击"; // 可以直接给初值\n    private String note;           // 对象类型默认是 null\n\n    void click() { count++; }\n    String show() { return label + count + " " + note; }\n}\nCounter c = new Counter();\nc.click();\nc.click();\nSystem.out.println(c.show());     // 输出：点击2 null',
      vs: ['字段和局部变量', 'class Counter {\n    int count;            // 字段：有默认值 0，跟着对象一直存在\n    void click() {\n        int temp;         // 局部变量：没有默认值\n        temp++;           // 编译错误：variable temp might not have been initialized\n        count++;          // 可以\n    }\n}'],
      ts: 'class Counter {\n  private count = 0;          // TS 没有默认值：不初始化就是 undefined（strict 模式会报错）\n  private label = "点击";\n  click() { this.count++; }\n}',
      desc: '- 默认值：数字 0，boolean false，char `\\u0000`，对象 null\n- 加 `static` 属于类，所有对象共用一份；不加则每个对象各一份\n- 通常设为 private，再通过方法读写',
      cmp: ['Kotlin', 'private var count = 0  // Kotlin 的属性必须初始化，没有默认值'],
      q: '(field_declaration declarator: (variable_declarator name: (identifier) @hit))', tags: ['字段', 'field', '成员变量'],
    },

    {
      id: 'java-method', title: '方法声明', syntax: 'public int add(int a, int b) { return a + b; }',
      why: '把一段可以复用的逻辑起个名字，需要时调用。Java 没有独立的函数，所有函数都是写在类里的"方法"。',
      example: 'class Calc {\n    // 修饰符  返回类型  方法名(参数类型 参数名, ...)\n    public int add(int a, int b) {\n        return a + b;\n    }\n    public void log(String msg) {     // void：没有返回值\n        System.out.println("[log] " + msg);\n    }\n    public static int square(int x) { // static：不需要对象就能调用\n        return x * x;\n    }\n}\nCalc c = new Calc();\nSystem.out.println(c.add(1, 2));      // 输出：3\nc.log("hi");                          // 输出：[log] hi\nSystem.out.println(Calc.square(4));   // 输出：16',
      vs: ['方法重载：同名不同参数', 'class Calc {\n    int add(int a, int b) { return a + b; }\n    double add(double a, double b) { return a + b; }  // 可以：参数类型不同\n    int add(int a, int b, int c) { return a + b + c; } // 可以：参数个数不同\n    long add(int a, int b) { return a + b; }\n    // 编译错误：method add(int,int) is already defined（只有返回类型不同不算重载）\n}\nnew Calc().add(1.5, 2);   // 调用 double 版本，结果 3.5'],
      ts: 'class Calc {\n  add(a: number, b: number): number { return a + b; }  // TS 返回类型写在后面\n  log(msg: string): void { console.log("[log] " + msg); }\n  static square(x: number) { return x * x; }\n}\n// TS 没有真正的重载，只能写多个签名 + 一个实现\nfunction plus(a: number, b: number): number;',
      desc: '- 有返回类型的方法，每条执行路径都必须 `return` 一个值\n- 参数是按值传递：基本类型传副本；对象传的是引用的副本，方法里可以修改对象内容，但不能让外面的变量指向别的对象',
      cmp: ['Kotlin', 'fun add(a: Int, b: Int): Int = a + b  // Kotlin 可以写顶层函数，不必放在类里'],
      q: '(method_declaration name: (identifier) @hit)', tags: ['方法', 'method', 'void', '函数', '重载'],
    },

    {
      id: 'java-abstract', title: 'abstract 抽象类与抽象方法', syntax: 'abstract class Shape { abstract double area(); }',
      why: '父类知道"每个子类都必须有这个方法"，但自己写不出具体实现，比如每种图形都有面积，算法却各不相同。标成 abstract 后，编译器会强制每个子类实现它；公共的逻辑仍然可以写在父类里。',
      example: 'abstract class Shape {\n    abstract double area();             // 只声明，没有方法体\n    String describe() {                 // 普通方法：可以直接调用 area()\n        return "面积是 " + area();\n    }\n}\nclass Square extends Shape {\n    double side;\n    Square(double side) { this.side = side; }\n    double area() { return side * side; }  // 子类必须实现\n}\nShape s = new Square(3);\nSystem.out.println(s.describe());       // 输出：面积是 9.0',
      vs: ['抽象类和接口', 'new Shape();               // 编译错误：Shape is abstract; cannot be instantiated\nclass Circle extends Shape {}  // 编译错误：Circle is not abstract and does not override abstract method area()\n\n// 抽象类：可以有字段、构造函数、普通方法；只能 extends 一个\n// 接口：  不能有实例字段；一个类可以 implements 多个\n// 有共享状态或公共实现用抽象类，只规定能力用接口'],
      ts: 'abstract class Shape {\n  abstract area(): number;\n  describe() { return "面积是 " + this.area(); }\n}\nclass Square extends Shape {\n  constructor(private side: number) { super(); }\n  area() { return this.side * this.side; }\n}',
      desc: '- 有抽象方法的类必须声明为 abstract\n- 抽象类可以有构造函数，供子类用 `super(...)` 调用',
      cmp: ['Kotlin', 'abstract class Shape {\n    abstract fun area(): Double\n}'],
      q: '(modifiers "abstract" @hit)', tags: ['abstract', '抽象'],
    },

    {
      id: 'java-interface', title: 'interface 接口', syntax: 'interface AppLauncher { boolean open(String pkg); }',
      why: '规定"一种能力需要哪些方法"，不管谁来实现。代码只依赖接口，就能随时替换实现：测试时传一个假的，正式运行时传真的。回调和监听器（`OnClickListener`、`Runnable`）也都是接口。',
      example: 'interface AppLauncher {\n    boolean open(String pkg);        // 只有签名，默认 public abstract\n}\nclass FakeLauncher implements AppLauncher {   // 测试用的假实现\n    public boolean open(String pkg) {\n        System.out.println("假装打开 " + pkg);\n        return true;\n    }\n}\nclass Starter {\n    private final AppLauncher launcher;       // 只依赖接口\n    Starter(AppLauncher launcher) { this.launcher = launcher; }\n    void start() { launcher.open("com.example"); }\n}\nnew Starter(new FakeLauncher()).start();      // 输出：假装打开 com.example',
      vs: ['接口里能写什么', 'interface Config {\n    int TIMEOUT = 3000;          // 字段默认 public static final，即常量\n    void load();                 // 抽象方法\n    default void reload() { load(); }   // Java 8+：带实现的默认方法\n    static Config empty() { return () -> {}; }  // Java 8+：静态方法\n    int count;                   // 编译错误：接口字段必须初始化（它是常量）\n}\nnew Config();                    // 编译错误：Config is abstract; cannot be instantiated'],
      ts: 'interface AppLauncher { open(pkg: string): boolean; }\nconst fake: AppLauncher = {\n  open(pkg) { console.log("假装打开 " + pkg); return true; },\n};\n// TS 接口只在编译期存在，运行期不能 instanceof AppLauncher；Java 接口运行期也存在',
      desc: '- 只有一个抽象方法的接口叫"函数式接口"，可以用 lambda 实现\n- 一个类可以实现多个接口，接口也可以 `extends` 多个接口',
      cmp: ['Kotlin', 'interface AppLauncher { fun open(pkg: String): Boolean }'],
      q: '(interface_declaration "interface" @hit)', tags: ['interface', '接口'],
    },

    {
      id: 'java-default-method', title: 'default 接口默认方法', syntax: 'default String name() { return "x"; }',
      why: '给接口加新方法时，如果是抽象方法，所有已有的实现类都会编译失败。写成带默认实现的 `default` 方法，老的实现类不用改，想定制的再去重写。Java 8 就是这样给 `List` 加上 `forEach`、`sort` 的。',
      example: 'interface Greeter {\n    String name();\n    default String greet() {              // 带方法体，实现类可以不重写\n        return "Hello, " + name();\n    }\n}\nclass Tom implements Greeter {\n    public String name() { return "Tom"; }  // 只实现抽象方法\n}\nclass Jerry implements Greeter {\n    public String name() { return "Jerry"; }\n    public String greet() { return "Hi~ " + name(); }  // 也可以重写默认方法\n}\nSystem.out.println(new Tom().greet());    // 输出：Hello, Tom\nSystem.out.println(new Jerry().greet());  // 输出：Hi~ Jerry',
      vs: ['两个接口有同名的默认方法', 'interface A { default String hi() { return "A"; } }\ninterface B { default String hi() { return "B"; } }\nclass C implements A, B {}\n// 编译错误：class C inherits unrelated defaults for hi() from types A and B\n\nclass D implements A, B {\n    public String hi() { return A.super.hi(); }  // 必须自己重写，可以指定用哪个\n}'],
      ts: '// TS 没有对应写法：接口不能带实现，只能描述形状。\n// 最接近的是抽象类（只能继承一个）或 mixin：\nabstract class Greeter {\n  abstract name(): string;\n  greet() { return "Hello, " + this.name(); }\n}',
      desc: '- 默认方法可以调用接口里的其他方法\n- 这里的 `default` 和 switch 里的 `default:` 是两回事',
      cmp: ['Kotlin', 'interface Greeter {\n    fun name(): String\n    fun greet() = "Hello, ${name()}"  // Kotlin 接口方法直接写方法体，不用 default 关键字\n}'],
      q: '(method_declaration (modifiers "default" @hit))', tags: ['default', '默认方法', '接口'],
    },

    {
      id: 'java-nested-class', title: '内部类与 static 嵌套类', syntax: 'static class Builder {}    class Inner {}',
      why: '只给某个类用的辅助类，写在它里面，代码放在一起更好找。常见的有 `Builder`、`ViewHolder`、回调监听器。关键是分清有没有 `static`：它决定了这个嵌套类能不能访问外部对象。',
      example: 'class Pizza {\n    private final String size;\n    private Pizza(Builder b) { size = b.size; }\n    String size() { return size; }\n\n    static class Builder {            // static 嵌套类：和外部对象无关\n        private String size = "M";\n        Builder size(String s) { size = s; return this; }\n        Pizza build() { return new Pizza(this); }\n    }\n}\nPizza p = new Pizza.Builder().size("L").build();  // 直接 new，不需要先有 Pizza 对象\nSystem.out.println(p.size());                     // 输出：L',
      vs: ['static 嵌套类和非 static 内部类', 'class Outer {\n    int x = 1;\n    static class Nested {\n        int get() { return x; }   // 编译错误：静态嵌套类不能访问外部对象的字段\n    }\n    class Inner {\n        int get() { return x; }   // 可以：内部类隐式持有外部对象\n    }\n}\nOuter.Nested n = new Outer.Nested();      // 直接创建\nOuter o = new Outer();\nOuter.Inner i = o.new Inner();            // 必须通过外部对象创建，写法很特别'],
      ts: 'class Pizza {\n  static Builder = class {          // 类似 static 嵌套类\n    size = "M";\n  };\n}\nconst b = new Pizza.Builder();\n// 非 static 内部类（隐式持有外部对象）：TS 没有对应写法，只能手动传 outer 引用',
      desc: '- 嵌套类可以访问外部类的 private 成员\n- 拿不准时优先写 `static class`，需要访问外部对象时再去掉 static',
      cmp: ['Kotlin', 'class Outer {\n    class Nested       // Kotlin 默认就是 static 嵌套\n    inner class Inner  // 要持有外部对象得写 inner\n}'],
      pit: 'Android 里非静态内部类（包括匿名类）会持有外部 Activity 的引用。如果它被后台线程或单例长期持有，Activity 关闭后无法回收，造成内存泄漏。',
      q: '(class_body (class_declaration name: (identifier) @hit))', tags: ['内部类', '嵌套类', 'static class', 'inner', 'Builder'],
    },

    {
      id: 'java-anonymous-class', title: 'new Iface() { ... } 匿名内部类', syntax: 'new Runnable() { public void run() {} }',
      why: '需要一个"只用一次"的接口实现时，比如一个点击回调、一个线程任务，不想为它专门起名写一个类，就当场定义并 new 出来。老的 Android 代码里大量的监听器都是这样写的。',
      example: 'Runnable task = new Runnable() {     // 定义一个没有名字的类，同时创建它的对象\n    private int times = 0;           // 匿名类里也可以有字段\n    @Override\n    public void run() {\n        times++;\n        System.out.println("第 " + times + " 次执行");\n    }\n};\ntask.run();                          // 输出：第 1 次执行\ntask.run();                          // 输出：第 2 次执行',
      vs: ['匿名类和 lambda', '// 接口只有一个抽象方法时，lambda 更短：\nRunnable a = new Runnable() {\n    @Override public void run() { System.out.println("hi"); }\n};\nRunnable b = () -> System.out.println("hi");   // 效果相同\n\n// 区别：匿名类里的 this 指匿名类对象本身，lambda 里的 this 指外部对象\n// 接口有多个抽象方法、或者需要字段时，只能用匿名类'],
      ts: 'let times = 0;\nconst task: Runnable = {      // TS 直接写对象字面量，不需要匿名类\n  run() { times++; console.log(`第 ${times} 次执行`); },\n};\ntask.run();  // 第 1 次执行',
      desc: '- 也可以继承一个类：`new Thread() { public void run() {...} }`\n- 引用的外部局部变量必须是 final 或"事实上 final"（赋值后没改过）',
      cmp: ['Kotlin', 'val task = object : Runnable {\n    override fun run() { println("执行") }\n}'],
      pit: '在 Activity 里创建的匿名类会持有 Activity 引用。交给后台线程或长时间存在的对象时，可能造成内存泄漏。',
      q: '(object_creation_expression type: (_) @hit (class_body))', tags: ['匿名内部类', '匿名类', '回调', 'listener'],
    },

    {
      id: 'java-enum', title: 'enum 枚举', syntax: 'enum Color { RED, GREEN }',
      why: '一个值只能是固定几种之一时（状态、方向、颜色），用枚举代替散落的字符串或数字常量。传错值会直接编译失败，而且能在 switch 里逐个处理。',
      example: 'enum Status {\n    PENDING("待处理"), DONE("已完成");     // 每个常量都是一个对象，括号里是构造参数\n    private final String label;\n    Status(String label) { this.label = label; }\n    String label() { return label; }\n}\nStatus s = Status.DONE;\nSystem.out.println(s.label());            // 输出：已完成\nSystem.out.println(s.name());             // 输出：DONE\nSystem.out.println(Status.valueOf("PENDING").ordinal());  // 输出：0\nfor (Status x : Status.values()) System.out.print(x + " ");  // 输出：PENDING DONE',
      vs: ['不用枚举、用字符串常量', 'static final String PENDING = "pending";\nstatic final String DONE = "done";\nvoid update(String status) {}\nupdate("pendng");                 // 拼错了，编译器发现不了\n\nvoid update2(Status status) {}\nupdate2(Status.PENDNG);           // 编译错误：cannot find symbol\nStatus.valueOf("UNKNOWN");        // 运行时抛 IllegalArgumentException'],
      ts: 'enum Status { PENDING = "待处理", DONE = "已完成" }\nconsole.log(Status.DONE);  // 已完成\n// TS 枚举不能带字段和方法，常用字面量联合类型代替：\ntype Status2 = "pending" | "done";',
      desc: '- 常用方法：`values()` 所有常量，`valueOf("X")` 按名字查找，`name()` 名字，`ordinal()` 序号（从 0 开始）\n- 枚举可以直接用在 switch 里，case 里不用写类名前缀',
      cmp: ['Kotlin', 'enum class Status(val label: String) { PENDING("待处理"), DONE("已完成") }'],
      q: '(enum_declaration "enum" @hit)', tags: ['enum', '枚举'],
    },

    {
      id: 'java-record', title: 'record 记录类', syntax: 'record Point(int x, int y) {}',
      why: '只用来装数据的类，以前要手写字段、构造函数、getter、`equals`、`hashCode`、`toString`，几十行代码。`record` 一行搞定，而且不可变。Java 16 起可用。',
      example: 'record Point(int x, int y) {}             // 一行声明\n\nPoint p = new Point(1, 2);\nSystem.out.println(p.x());                 // 输出：1（访问方法叫 x()，不是 getX()）\nSystem.out.println(p);                     // 输出：Point[x=1, y=2]\nPoint q = new Point(1, 2);\nSystem.out.println(p.equals(q));           // 输出：true（按字段内容比较）\nSystem.out.println(p == q);                // 输出：false（仍然是两个对象）',
      vs: ['不用 record 要写多少', 'final class Point {\n    private final int x, y;\n    Point(int x, int y) { this.x = x; this.y = y; }\n    int x() { return x; }\n    int y() { return y; }\n    @Override public boolean equals(Object o) { /* 逐个比较字段 */ return false; }\n    @Override public int hashCode() { return Objects.hash(x, y); }\n    @Override public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }\n}\n// record 里的字段不能修改：没有 setter，p.x = 3 会编译错误'],
      ts: 'type Point = Readonly<{ x: number; y: number }>;\nconst p: Point = { x: 1, y: 2 };\nconst q: Point = { x: 1, y: 2 };\nconsole.log(p === q);  // false：TS 没有自动按内容比较的 equals',
      desc: '- 字段都是 final，不能继承别的类（可以实现接口）\n- 可以在大括号里加方法，或写"紧凑构造函数"做参数校验',
      cmp: ['Kotlin', 'data class Point(val x: Int, val y: Int)'],
      q: '(record_declaration "record" @hit)', tags: ['record', '数据类'],
    },

    {
      id: 'java-sealed', title: 'sealed / permits 密封类', syntax: 'sealed interface Shape permits Circle, Square {}',
      why: '表示"这个类型只有这几种情况"，比如结果只能是成功或失败。别人不能再随意加子类，编译器知道全部可能，配合 switch 可以检查有没有漏处理某种情况。Java 17 起可用。',
      example: 'sealed interface Result permits Ok, Err {}   // 只允许 Ok 和 Err 实现\nrecord Ok(String data) implements Result {}  // record 默认是 final\nrecord Err(String msg) implements Result {}\n\nstatic String show(Result r) {\n    return switch (r) {                      // Java 21：列全子类就不需要 default\n        case Ok ok -> "成功：" + ok.data();\n        case Err e -> "失败：" + e.msg();\n    };\n}\nSystem.out.println(show(new Ok("hi")));      // 输出：成功：hi',
      vs: ['不在 permits 里的类', 'record Timeout() implements Result {}\n// 编译错误：class is not allowed to extend sealed class: Result\n\nsealed class Shape permits Circle {}\nclass Circle extends Shape {}\n// 编译错误：子类必须声明为 final、sealed 或 non-sealed'],
      ts: 'type Result = { kind: "ok"; data: string } | { kind: "err"; msg: string };\nfunction show(r: Result) {\n  switch (r.kind) {               // TS 用可辨识联合类型实现同样的效果\n    case "ok": return "成功：" + r.data;\n    case "err": return "失败：" + r.msg;\n  }\n}',
      desc: '- 子类必须是 `final`（不能再被继承）、`sealed`（继续限定）或 `non-sealed`（放开限制）之一\n- 子类和父类在同一个文件里时，可以省略 `permits`',
      cmp: ['Kotlin', 'sealed interface Result\ndata class Ok(val data: String) : Result\ndata class Err(val msg: String) : Result'],
      q: '[(modifiers ["sealed" "non-sealed"] @hit) (permits) @hit]', tags: ['sealed', 'permits', '密封'],
    },

    {
      id: 'java-init-block', title: 'static { } / { } 初始化块', syntax: 'static { load(); }',
      why: '有些初始化写在一行赋值里放不下，比如要循环往 Map 里填数据、加载 native 库。`static { }` 在类第一次被使用时执行一次，适合初始化静态数据。',
      example: 'class Codes {\n    static final Map<Integer, String> NAMES = new HashMap<>();\n    static {                                   // 类第一次被使用时执行，只执行一次\n        NAMES.put(200, "OK");\n        NAMES.put(404, "Not Found");\n        System.out.println("初始化 Codes");\n    }\n}\nSystem.out.println(Codes.NAMES.get(404));      // 输出：初始化 Codes，然后输出：Not Found\nSystem.out.println(Codes.NAMES.get(200));      // 输出：OK（不会再次初始化）',
      vs: ['static 块和普通初始化块', 'class A {\n    static { System.out.println("static 块"); }  // 类加载时执行一次\n    { System.out.println("实例块"); }             // 每次 new 都执行，早于构造函数体\n    A() { System.out.println("构造函数"); }\n}\nnew A(); new A();\n// 输出：static 块、实例块、构造函数、实例块、构造函数'],
      ts: 'class Codes {\n  static NAMES = new Map<number, string>();\n  static {                       // TS 4.4+ 也有 static 块\n    Codes.NAMES.set(200, "OK");\n  }\n}',
      desc: '- Android 里常见写法：`static { System.loadLibrary("native-lib"); }`，加载 C/C++ 库\n- 实例初始化块很少用，一般直接写在构造函数里',
      cmp: ['Kotlin', 'companion object {\n    val NAMES = mutableMapOf<Int, String>()\n    init { NAMES[200] = "OK" }\n}'],
      q: '[(static_initializer "static" @hit) (class_body (block) @hit)]', tags: ['static', '初始化块', 'init'],
    },

    {
      id: 'java-instanceof', title: 'instanceof 类型判断（含模式匹配）', syntax: 'if (o instanceof String s) s.length();',
      why: '拿到一个类型比较笼统的值（如 `Object`、父类、接口），需要按实际类型做不同处理时，先用 `instanceof` 判断。Java 16 起可以在判断的同时声明变量，省掉强转。',
      example: 'static String describe(Object obj) {\n    if (obj instanceof String s) {        // 判断成功，s 就是转换好的 String\n        return "字符串，长度 " + s.length();\n    } else if (obj instanceof Integer n && n > 0) {  // 可以接着用 &&\n        return "正整数 " + n;\n    }\n    return "其他：" + obj;\n}\nSystem.out.println(describe("hello"));   // 输出：字符串，长度 5\nSystem.out.println(describe(42));        // 输出：正整数 42\nSystem.out.println(describe(null));      // 输出：其他：null（null instanceof 任何类型都是 false）',
      vs: ['Java 16 之前的写法', 'if (obj instanceof String) {\n    String s = (String) obj;      // 判断完还要再强转一次\n    System.out.println(s.length());\n}\n\nInteger n = 1;\nif (n instanceof String s) {}     // 编译错误：Integer 不可能是 String（incompatible types）'],
      ts: 'function describe(obj: unknown) {\n  if (typeof obj === "string") return "字符串，长度 " + obj.length;  // TS 自动收窄类型\n  if (typeof obj === "number" && obj > 0) return "正整数 " + obj;\n  return "其他：" + obj;\n}\n// 判断类实例用 obj instanceof Foo，和 Java 一样',
      desc: '- `null instanceof X` 永远是 false，所以不用先判空\n- 绑定的变量只在判断为真的分支里可用',
      cmp: ['Kotlin', 'if (obj is String) println(obj.length)  // Kotlin 判断后自动转换，不用声明新变量'],
      q: '(instanceof_expression "instanceof" @hit)', tags: ['instanceof', '类型判断', '模式匹配'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
