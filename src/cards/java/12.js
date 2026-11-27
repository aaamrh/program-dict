// java · Android（4 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('Android', [
    {
      id: 'java-android-log', title: 'Log.i / Log.d / Log.e', syntax: 'Log.i(TAG, "msg");',
      why: '在 Android 上打印调试信息。App 运行在手机上，没有你熟悉的控制台；日志会进入系统日志 Logcat，在 Android Studio 或 `adb logcat` 里查看，可以按 tag 和级别过滤。',
      example: 'public class LoginActivity extends Activity {\n    private static final String TAG = "Login";   // 一般用类名当 tag，方便过滤\n\n    void login(String user) {\n        Log.d(TAG, "开始登录 user=" + user);\n        try {\n            Integer.parseInt(user);\n            Log.i(TAG, "登录成功");\n        } catch (NumberFormatException e) {\n            Log.e(TAG, "登录失败", e);           // 第三个参数带上异常，会打出完整堆栈\n        }\n    }\n}\n// Logcat 里显示类似：\n// D/Login: 开始登录 user=tom\n// E/Login: 登录失败\n//     java.lang.NumberFormatException: For input string: "tom" ...',
      vs: ['System.out.println vs Log', 'System.out.println("hello");   // 在 Android 上也会进 Logcat，但 tag 固定是 System.out，没有级别，不好过滤\n\nLog.i(TAG, "hello");           // 能按 tag、级别过滤\nLog.e(TAG, "出错", e);          // 能带异常堆栈'],
      ts: 'const TAG = "Login";\nconsole.debug(TAG, "开始登录 user=" + user);  // Log.d\nconsole.info(TAG, "登录成功");                 // Log.i\nconsole.error(TAG, "登录失败", e);             // Log.e，浏览器控制台里同样能按级别过滤',
      desc: '- 级别从低到高：`Log.v`（详细）、`Log.d`（调试）、`Log.i`（信息）、`Log.w`（警告）、`Log.e`（错误）\n- tag 一般定义成 `private static final String TAG`\n- 不要把 token、密码、手机号这类敏感信息写进日志，日志可能被别的工具读到',
      cmp: ['Kotlin', 'Log.e(TAG, "登录失败", e)'],
      api: ['Log'], tags: ['Log', '日志', 'logcat', '调试'],
    },
    {
      id: 'java-android-context', title: 'Context：App 和系统打交道的入口对象', syntax: 'getApplicationContext().getPackageManager()',
      why: '`Context` 就是一个普通的类，没有特殊语法。浏览器里 `localStorage`、`location`、`navigator` 都是全局变量，随手就能用；Android 没有这些全局变量，"本 App 能在系统里做的事"（存数据、跳页面、调系统服务、查其他 App）都是 Context 对象上的方法，必须先拿到一个 Context 才能调用。',
      example: 'public class MainActivity extends Activity {\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        // Activity 本身就是 Context，下面这些方法都是继承来的\n        SharedPreferences sp = getSharedPreferences("settings", MODE_PRIVATE);\n        sp.edit().putString("name", "Tom").apply();   // 类似 localStorage.setItem\n        String name = sp.getString("name", "");       // 结果："Tom"\n\n        Context app = getApplicationContext();        // 代表整个 App 的 Context\n        PackageManager pm = app.getPackageManager();  // 查询手机上装的 App\n        Intent launch = pm.getLaunchIntentForPackage("com.android.settings");\n        // 结果：能启动"设置"的 Intent；查不到时是 null\n    }\n}',
      vs: ['长期保存：this vs getApplicationContext()', 'class Holder {\n    static Context ctx;\n}\nHolder.ctx = this;                      // 错误：静态变量拖住了 Activity，页面关了也回收不掉（内存泄漏）\nHolder.ctx = getApplicationContext();   // 正确：Application 和进程活得一样久\n\n// 反过来，弹对话框要用 Activity 本身：\nnew AlertDialog.Builder(this).setMessage("hi").show();\n// 换成 getApplicationContext()，显示时会崩溃'],
      ts: '// 浏览器：能力是全局的，直接用\nlocalStorage.setItem("name", "Tom");\nlocation.href = "/detail";\n\n// Android：能力挂在 Context 对象上，要先拿到它\n// ctx.getSharedPreferences("settings", MODE_PRIVATE).edit().putString("name", "Tom").apply();\n// 就像把 window 当参数传来传去：function save(win: Window) { win.localStorage.setItem(...) }',
      desc: '- 为什么能直接调用 `getApplicationContext()`：`Activity`、`Service`、`Application` 都继承自 Context（比如 `Service extends ContextWrapper extends Context`），这些方法是继承来的\n- 常用：`getSharedPreferences`、`startActivity`、`getSystemService`、`getPackageManager`、`getResources`、`getString(R.string.xxx)`、`getFilesDir`\n- Android 11+ 查询其他 App 时，可能需要在 Manifest 里声明 `<queries>`，否则查不到',
      cmp: ['Kotlin', 'val app = applicationContext        // Kotlin 把 getXxx() 写成属性\nval pm = app.packageManager'],
      api: ['Context', 'getApplicationContext', 'getPackageManager', 'getSystemService', 'getSharedPreferences', 'getResources', 'getString'], tags: ['Context', 'Android', 'applicationContext'],
    },
    {
      id: 'java-android-intent', title: 'Intent 启动组件', syntax: 'startActivity(new Intent(ctx, MainActivity.class));',
      why: '在 Android 里打开另一个页面、启动后台服务、打开别的 App（浏览器、拨号、相机），都要先创建一个 Intent，写明"要做什么、带什么数据"，再交给系统去执行。',
      example: '// 页面 A：带上数据跳到 DetailActivity\nIntent i = new Intent(this, DetailActivity.class);   // 要启动哪个页面\ni.putExtra("userId", 42);                            // 附带数据\nstartActivity(i);\n\n// 页面 B（DetailActivity 的 onCreate 里）：取出数据\nint id = getIntent().getIntExtra("userId", -1);      // 结果：42，取不到时是 -1\n\n// 打开网页：只说"要查看这个网址"，由系统挑一个浏览器\nIntent web = new Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"));\nstartActivity(web);',
      vs: ['显式 Intent vs 隐式 Intent；从 Service 启动页面', 'new Intent(this, DetailActivity.class);            // 显式：指定具体的类，启动自己 App 的页面\nnew Intent(Intent.ACTION_VIEW, Uri.parse(url));    // 隐式：只说动作，系统找能处理的 App\n\n// 在 Service 里（不是 Activity）启动页面：\nstartActivity(new Intent(this, MainActivity.class));\n// 运行时抛 AndroidRuntimeException：requires the FLAG_ACTIVITY_NEW_TASK flag\nIntent i = new Intent(this, MainActivity.class);\ni.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);         // 加上这个 flag 就行\nstartActivity(i);'],
      ts: '// TS 没有对应概念：Intent 是 Android 组件之间的消息。\n// 最接近的是前端路由跳转加参数：\nrouter.push({ path: "/detail", query: { userId: "42" } });\nconst id = Number(route.query.userId ?? -1);\nwindow.open("https://example.com");   // 类似隐式 Intent 打开网页',
      desc: '- 带数据：`putExtra(键, 值)`；取数据：`getIntent().getStringExtra(键)`、`getIntExtra(键, 默认值)`\n- `DetailActivity.class` 是"类对象"，用来告诉系统要启动哪个类\n- 启动服务用 `startService` / `startForegroundService`，发广播用 `sendBroadcast`\n- 隐式 Intent 找不到能处理的 App 时，会抛 `ActivityNotFoundException`',
      cmp: ['Kotlin', 'val i = Intent(this, DetailActivity::class.java)\ni.putExtra("userId", 42)\nstartActivity(i)'],
      api: ['Intent', 'startActivity', 'startService', 'startForegroundService', 'sendBroadcast', 'addFlags', 'putExtra', 'getStringExtra', 'getIntExtra', 'getLaunchIntentForPackage'], tags: ['Intent', 'Activity', 'Service', '跳转'],
    },
    {
      id: 'java-android-accessibility', title: 'AccessibilityService 无障碍服务', syntax: 'performGlobalAction(GLOBAL_ACTION_BACK)',
      why: '让 App 读取屏幕上任意界面的内容，并代替用户点击、返回。它本来是给视障用户的读屏等辅助工具用的；自动化测试、自动操作类工具也靠它，因为普通 App 只能操作自己的界面。',
      example: 'public class MyService extends AccessibilityService {\n    @Override\n    public void onAccessibilityEvent(AccessibilityEvent event) {\n        // 界面有变化时，系统会调用这里\n        AccessibilityNodeInfo root = getRootInActiveWindow();   // 当前界面的根节点\n        if (root == null) return;\n        List<AccessibilityNodeInfo> btns = root.findAccessibilityNodeInfosByViewId("com.example:id/ok");\n        if (!btns.isEmpty()) {\n            btns.get(0).performAction(AccessibilityNodeInfo.ACTION_CLICK);   // 点击"确定"按钮\n        }\n    }\n\n    @Override\n    public void onInterrupt() { }\n\n    void goBack() {\n        boolean ok = performGlobalAction(GLOBAL_ACTION_BACK);   // 相当于按一下返回键，成功时为 true\n    }\n}',
      vs: ['自己的界面 vs 别的 App 的界面', '// 普通代码只能操作自己 App 的界面：\nButton b = findViewById(R.id.ok);\nb.performClick();\n\n// 无障碍服务能读取、点击别的 App 的界面，但用户必须在系统设置里手动开启：\nroot.findAccessibilityNodeInfosByViewId("com.other.app:id/ok").get(0)\n    .performAction(AccessibilityNodeInfo.ACTION_CLICK);\n\nnew MyService();   // 没用：服务对象必须由系统创建，自己 new 出来的拿不到界面'],
      ts: '// TS 没有对应概念。网页里最接近的是读 DOM 树再模拟操作（只能操作当前页面）：\nconst root = document.body;                      // getRootInActiveWindow()\nconst ok = document.querySelector<HTMLButtonElement>("#ok");\nok?.click();                                     // performAction(ACTION_CLICK)\nhistory.back();                                  // performGlobalAction(GLOBAL_ACTION_BACK)',
      desc: '- 需要在 `AndroidManifest.xml` 里声明服务，并由用户在"设置 → 无障碍"里开启，系统才会创建它\n- 常用回调：`onServiceConnected()`（开启成功）、`onAccessibilityEvent(event)`（界面变化）、`onInterrupt()`\n- 常用方法：`getRootInActiveWindow()`、`performGlobalAction(GLOBAL_ACTION_BACK / GLOBAL_ACTION_HOME)`\n- 节点 `AccessibilityNodeInfo`：`getText()`、`getViewIdResourceName()`、`getChild(i)`、`performAction(...)`',
      cmp: ['Kotlin', 'val root = rootInActiveWindow\nval ok = performGlobalAction(GLOBAL_ACTION_BACK)'],
      api: ['AccessibilityService', 'AccessibilityNodeInfo', 'AccessibilityEvent', 'performGlobalAction', 'getRootInActiveWindow', 'onAccessibilityEvent', 'onServiceConnected', 'onInterrupt', 'GLOBAL_ACTION_BACK', 'GLOBAL_ACTION_HOME', 'performAction', 'findAccessibilityNodeInfosByViewId', 'getChild', 'getChildCount'], tags: ['无障碍', 'Accessibility', 'performGlobalAction', '自动化'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
