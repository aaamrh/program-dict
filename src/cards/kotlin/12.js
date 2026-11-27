// kotlin · Android（4 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'kotlin', cat, ...c }));

  add('Android', [
    {
      id: 'kt-android-log', title: 'Log.i / Log.d / Log.e', syntax: 'Log.i(TAG, "msg")',
      why: '手机上运行的代码没有控制台可看。用 `Log` 把信息写进系统日志，再到 Android Studio 的 Logcat 里按 tag 和级别过滤查看，排查问题主要靠它。',
      example: 'class LoginRepo {\n    companion object { private const val TAG = "Login" }\n\n    fun login(user: String) {\n        Log.d(TAG, "开始登录 user=$user")   // 调试信息\n        try {\n            error("密码错误")\n        } catch (e: Exception) {\n            Log.e(TAG, "登录失败", e)        // 错误信息 + 异常堆栈\n        }\n    }\n}\n// Logcat 里过滤 tag:Login 看到：\n// D/Login: 开始登录 user=tom\n// E/Login: 登录失败\n//     java.lang.IllegalStateException: 密码错误\n//         at LoginRepo.login(...)',
      vs: ['各个级别怎么选', 'private const val TAG = "Demo"   // 一般放在文件顶部或 companion object 里\n\nfun demo(e: Exception) {\n    Log.v(TAG, "很细的过程")       // verbose：最啰嗦，一般不看\n    Log.d(TAG, "调试信息")         // debug：开发时看\n    Log.i(TAG, "关键节点")         // info：比如"服务已启动"\n    Log.w(TAG, "不正常但能继续")   // warn\n    Log.e(TAG, "出错了", e)        // error：传入异常会打印堆栈\n    println("hello")               // 也会进 Logcat，但 tag 固定是 System.out，不好过滤\n}'],
      ts: 'console.debug("开始登录 user=tom");   // Log.d\nconsole.error("登录失败", e);          // Log.e：控制台也会显示堆栈\n// TS 没有 tag，常见做法是加前缀：console.log("[Login]", ...)',
      desc: '- 级别从低到高：`v` `d` `i` `w` `e`\n- tag 用来过滤，通常放在 `companion object` 里的 `TAG` 常量\n- 发布版本里这些日志默认也会输出，不要打印密码、token 等敏感信息',
      api: ['Log'], tags: ['Log', '日志', 'logcat'],
    },
    {
      id: 'kt-android-context', title: 'Context：App 和系统打交道的入口对象', syntax: 'applicationContext.packageManager',
      why: 'Android 没有浏览器那样的全局对象：存数据、跳页面、拿系统服务、查询已安装的 App，都要通过一个 Context 对象来调用。Activity、Service 本身就是 Context，所以在它们里面可以直接用这些方法。',
      example: 'class MyService : Service() {\n    override fun onBind(intent: Intent?): IBinder? = null\n\n    override fun onCreate() {\n        super.onCreate()\n        // Service 本身就是 Context，下面这些都是继承来的：\n        val ctx: Context = applicationContext                  // App 级别的 Context\n        val prefs = getSharedPreferences("settings", MODE_PRIVATE)\n        prefs.edit().putString("user", "tom").apply()          // 存数据，类似 localStorage\n        println(prefs.getString("user", null))                 // 输出：tom\n\n        val pm = ctx.packageManager                            // 查询已安装的 App\n        val launch = pm.getLaunchIntentForPackage("com.android.settings")\n        println(launch != null)                                // 输出：true（手机上装了"设置"）\n    }\n}',
      vs: ['applicationContext 和 this（Activity）的区别', 'object Cache {\n    var ctx: Context? = null\n}\n\nclass MainActivity : Activity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        Cache.ctx = this                 // 错误做法：页面关闭后 Activity 仍被单例拖住，内存泄漏\n        Cache.ctx = applicationContext   // 正确：App 级别的 Context 和进程活得一样久\n    }\n}'],
      ts: '// 浏览器：能力是全局的，直接用\nlocalStorage.setItem("k", "v");\nlocation.href = "/detail";\n\n// Android：能力挂在 Context 对象上，要先拿到它\n// ctx.getSharedPreferences("p", 0).edit().putString("k", "v").apply()\n// ctx.startActivity(intent)\n// 类似把 window 当参数传来传去：function f(win: Window) { win.localStorage... }',
      desc: '`Context` 就是一个普通的类，`ctx` 就是这个类的一个对象，没有什么特殊语法。\n它存在的原因：浏览器里 `localStorage`、`location`、`navigator` 都是全局变量，随手就能用；Android 没有这些全局变量，"本 App 在系统里能做的事"都做成了 Context 对象上的方法，必须先拿到一个 Context 才能调用：\n- 存储：`ctx.getSharedPreferences(...)`，类似 `localStorage`\n- 跳转：`ctx.startActivity(intent)`，类似 `location.href = ...`\n- 系统能力：`ctx.getSystemService(...)`，类似 `navigator.clipboard`\n- 其他 App 的信息：`ctx.packageManager`，查询手机上装了哪些 App、怎么启动它们\n- 资源和文件：`ctx.resources`、`ctx.filesDir`\n**为什么代码里找不到 `applicationContext` 的定义**：`Activity`、`Service`、`Application` 都继承自 Context，比如 `MyAccessibilityService → AccessibilityService → Service → ContextWrapper → Context`。所以在它们内部，`applicationContext`、`packageManager` 都是继承来的成员，可以直接写。\n**`applicationContext` 和 `this` 有什么区别**：`this`（当前 Activity）关闭后就该被回收；`applicationContext` 代表整个 App，和进程活得一样久。要长期保存 Context，比如传给单例或长寿命对象，用 `applicationContext`，否则会拖住已关闭的页面，造成内存泄漏。',
      cmp: ['Java', 'Context ctx = getApplicationContext();\nPackageManager pm = ctx.getPackageManager();  // Kotlin 把 getXxx() 写成属性 xxx'],
      pit: '`ctx.packageManager` 看起来像字段，其实调用的是 Java 方法 `getPackageManager()`。Kotlin 会把 Java 的 `getXxx()` 自动显示成属性 `xxx`，见"Java getter 写成属性"卡片。',
      api: ['Context', 'applicationContext', 'packageManager', 'getSystemService', 'getSharedPreferences', 'filesDir'], tags: ['Context', 'applicationContext', 'Android', '全局', 'window'],
    },
    {
      id: 'kt-java-getter', title: 'Java getter 写成属性 obj.xxx', syntax: 'node.viewIdResourceName  // = getViewIdResourceName()',
      why: '用 Kotlin 调用 Android/Java 的类时，到处是 `node.childCount`、`ctx.packageManager` 这种"看起来像字段"的写法。知道它们其实是在调用 `getXxx()` 方法，才能在文档里搜到，也才明白每次读取都会执行代码。',
      example: '// 一个 Java 类（比如 Android SDK 里的）：\n// public class Node {\n//     public int getChildCount() { ... }\n//     public String getText() { ... }\n//     public void setText(String t) { ... }\n//     public boolean isClickable() { ... }\n// }\n\n// Kotlin 里这样用：\nval n = node.childCount    // 调用 getChildCount()\nnode.text = "hi"           // 调用 setText("hi")\nprintln(node.text)         // 调用 getText()，输出：hi\nif (node.isClickable) { }  // 调用 isClickable()\nval desc = node.contentDescription\nval id = node.viewIdResourceName',
      vs: ['方法写法和属性写法', '// Java 的 File 有 getName()，Kotlin 里两种写法都行：\nval f = java.io.File("/tmp/a.txt")\nprintln(f.getName())   // 输出：a.txt（能编译，但 IDE 会提示改成 f.name）\nprintln(f.name)        // 输出：a.txt（推荐）\n\n// 只有 setXxx、没有 getXxx 的 Java 方法，不会变成属性。\n// 比如 java.util.Random 只有 setSeed(long)，没有 getSeed()：\nval r = java.util.Random()\nr.setSeed(42)          // 只能这样调用\n// r.seed = 42         // 编译错误：Unresolved reference \'seed\''],
      ts: '// 类似 TS 的 getter：看起来是属性，读取时其实在执行函数\nclass Node {\n  get childCount(): number { return this.children.length; }\n}\nnode.childCount; // 不写括号',
      desc: '- `getXxx()` 变成只读属性 `xxx`；同时有 `setXxx(v)` 时变成可写属性\n- 布尔值的 `isXxx()` 保持名字 `isXxx`\n- 去 Android 文档里查时，要搜 `getPackageManager`、`getViewIdResourceName` 这样的方法名',
      cmp: ['Java', 'String id = node.getViewIdResourceName();\nint n = node.getChildCount();'],
      api: ['viewIdResourceName', 'contentDescription', 'rootInActiveWindow', 'childCount', 'className', 'packageName', 'isClickable', 'isVisibleToUser', 'contentResolver'], tags: ['getter', 'setter', '属性', 'getXxx', 'Java 互操作'],
    },
    {
      id: 'kt-android-intent', title: 'Intent 启动组件', syntax: 'startActivity(Intent(ctx, A::class.java))',
      why: 'Android 里打开另一个页面、启动后台服务、打开别的 App、发广播，都不是直接调用对方的代码，而是把一个 Intent 消息交给系统，由系统去启动对应的组件。',
      example: '// 1. 打开自己 App 里的另一个页面，并带上参数\nval i = Intent(ctx, DetailActivity::class.java)\ni.putExtra("id", 42)\nctx.startActivity(i)\n\n// 2. 在 DetailActivity 里取参数\nval id = intent.getIntExtra("id", -1)   // id = 42\n\n// 3. 打开别的 App（只知道包名）\nval launch = ctx.packageManager.getLaunchIntentForPackage("com.android.settings")\nif (launch != null) {\n    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)   // 从 Service 等非页面的 Context 启动时必须加\n    ctx.startActivity(launch)\n}',
      vs: ['显式 Intent 和隐式 Intent', '// 显式：指定要打开哪个类，一般用于自己 App 里的页面\nIntent(ctx, DetailActivity::class.java)\n\n// 隐式：只说"要做什么"，由系统找能处理的 App\nval web = Intent(Intent.ACTION_VIEW, Uri.parse("https://a.com"))   // 系统会用浏览器打开\nctx.startActivity(web)'],
      ts: '// TS 没有对应写法：Intent 是交给 Android 系统的消息，由系统决定启动哪个组件。\n// 粗略类比：\nrouter.push({ path: "/detail", query: { id: 42 } });   // 显式 Intent + putExtra\nwindow.open("https://a.com");                          // 隐式 Intent（ACTION_VIEW）',
      desc: '- `putExtra` 附带数据，接收方用 `getXxxExtra` 读取\n- `startActivity` 打开页面，`startService` / `startForegroundService` 启动服务，`sendBroadcast` 发广播',
      pit: '从 Service 或 `applicationContext` 这类非 Activity 的 Context 启动页面时，不加 `FLAG_ACTIVITY_NEW_TASK` 会在运行时抛 `AndroidRuntimeException`。',
      api: ['Intent', 'startActivity', 'startService', 'startForegroundService', 'sendBroadcast'], tags: ['Intent', 'Activity', 'Service'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
