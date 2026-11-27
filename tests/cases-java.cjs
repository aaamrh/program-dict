// Java 验收用例：真实风格代码片段（含不完整片段）必须识别出 expect 里的卡片。
module.exports = [
  {
    name: 'java: 完整的类（自动识别）', lang: 'java', detect: true, verbose: true,
    code: `public class AndroidAppLauncher implements AppLauncher {
    private static final String TAG = "AppLauncher";
    private final Context context;

    public AndroidAppLauncher(Context context) {
        this.context = context;
    }

    @Override
    public boolean open(String packageName) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
        if (launchIntent == null) {
            return false;
        }
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(launchIntent);
        Log.i(TAG, "opened " + packageName);
        return true;
    }
}`,
    expect: ['java-class', 'java-implements', 'java-static', 'java-final', 'java-access', 'java-constructor', 'java-this', 'java-override', 'java-method', 'java-if', 'java-equality', 'java-null', 'java-android-intent', 'java-android-context', 'java-android-log', 'java-string-concat', 'java-field'],
    reject: ['java-extends', 'java-anonymous-class'],
  },
  {
    name: 'java: 方法体中间几行', lang: 'java', detect: true,
    code: `        List<String> names = new ArrayList<>();
        for (User u : users) {
            if (u.age > 18) names.add(u.name);
        }
        String joined = names.stream().filter(n -> !n.isEmpty()).collect(Collectors.joining(","));`,
    expect: ['java-local-var', 'java-type-args', 'java-new', 'java-foreach', 'java-collections', 'java-stream', 'java-lambda', 'java-string-api'],
  },
  {
    name: 'java: 从表达式中间截断', lang: 'java', verbose: true,
    code: `            .filter(u -> u.age > 18)
            .map(User::getName)
            .collect(Collectors.toList());`,
    expect: ['java-lambda', 'java-method-ref', 'java-stream'],
  },
  {
    name: 'java: Android 无障碍服务与匿名回调', lang: 'java', detect: true, verbose: true,
    code: `public class MyAccessibilityService extends AccessibilityService {
    private static volatile MyAccessibilityService current;

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        current = this;
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                if (root == null) return;
                performGlobalAction(GLOBAL_ACTION_BACK);
            }
        }, 500L);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {}

    @Override
    public void onInterrupt() {}

    public static MyAccessibilityService current() {
        return current;
    }`,
    expect: ['java-extends', 'java-volatile', 'java-static', 'java-override', 'java-super', 'java-anonymous-class', 'java-android-accessibility', 'java-method'],
  },
  {
    name: 'java: switch 表达式、try-with-resources、instanceof', lang: 'java', detect: true,
    code: `String read(Object src) throws IOException {
    if (!(src instanceof String path)) throw new IllegalArgumentException("bad");
    try (var reader = new BufferedReader(new FileReader(path))) {
        String first = reader.readLine();
        return switch (first.length()) {
            case 0 -> "empty";
            default -> {
                yield first.trim();
            }
        };
    }
}`,
    expect: ['java-throws', 'java-instanceof', 'java-throw', 'java-try-resources', 'java-var', 'java-switch-arrow', 'java-exceptions', 'java-string-api'],
  },
];
