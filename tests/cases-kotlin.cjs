// 验收用例：真实代码片段（含不完整片段）必须识别出 expect 里的卡片。
// detect: true 表示用自动识别语言，并检查识别结果。verbose: true 打印识别明细。
module.exports = [
  {
    name: 'kotlin: MyAccessibilityService 开头（缺结尾括号）', lang: 'kotlin', detect: true, verbose: true,
    code: `class MyAccessibilityService : AccessibilityApi() {
    override val enableListenPageUpdate: Boolean = true
    private val mutablePageUpdates = MutableSharedFlow<Unit>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val pageUpdates = mutablePageUpdates.asSharedFlow()
    private val chatObserver by lazy {
        ChatObserver(
            PreferenceStore(applicationContext),
        )
    }`,
    expect: ['kt-inherit', 'kt-override', 'kt-val-var', 'kt-type-annotation', 'kt-visibility', 'kt-type-args', 'kt-named-arg', 'kt-shared-flow', 'kt-by-lazy', 'kt-trailing-lambda', 'kt-lambda', 'kt-android-context'],
    reject: ['kt-class', 'kt-implement'],
  },
  {
    name: 'kotlin: 函数类型参数与 ?. == true', lang: 'kotlin', detect: true,
    code: `class BackNavigator(
        private val appLauncher: AppLauncher,
        private val rootProvider: () -> AccessibilityNodeInfo? = { AutoApi.rootInActiveWindow() },
        private val snapshotProvider: () -> NodeSnapshot? = {
          rootProvider()?.let(::RootNodeSnapshot)
        },
        private val backAction: () -> Boolean = {
          MyAccessibilityService.current()
                  ?.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK) == true
        },
        private val sleepAction: suspend (Long) -> Unit = { delay(it) },
) {`,
    expect: ['kt-class', 'kt-function-type', 'kt-nullable-type', 'kt-default-arg', 'kt-safe-call', 'kt-scope-fns', 'kt-callable-ref', 'kt-equality', 'kt-suspend', 'kt-delay', 'kt-it'],
  },
  {
    name: 'kotlin: 从命名参数中间截断', lang: 'kotlin', verbose: true,
    code: `        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )`,
    expect: ['kt-named-arg'],
  },
  {
    name: 'kotlin: 函数体中间几行', lang: 'kotlin', detect: true,
    code: `    val launched = appLauncher.open(targetPackageName)
    if (!launched) {
      return NavResult.LaunchFailed("failed")
    }
    val rootReady = foregroundRootAwaiter.awaitTargetAppRoot(targetPackageName)`,
    expect: ['kt-val-var', 'kt-if-expr'],
  },
  {
    name: 'kotlin: companion object', lang: 'kotlin', detect: true,
    code: `    companion object {
        private const val TAG = "MyAccessibility"

        @Volatile
        private var currentService: MyAccessibilityService? = null

        fun current(): MyAccessibilityService? {
            return currentService
        }
    }`,
    expect: ['kt-companion', 'kt-const', 'kt-annotation', 'kt-jvm-annotations', 'kt-nullable-type', 'kt-fun'],
  },
  {
    name: 'kotlin: 中文注释和 emoji 之后的偏移', lang: 'kotlin',
    code: '// 中文注释：先读页面 😀\nval x = name?.length ?: 0\nprivate val p by lazy { 1 }',
    expect: ['kt-safe-call', 'kt-elvis', 'kt-by-lazy'],
  },
];
