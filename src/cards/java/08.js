// java · 并发（2 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'java', cat, ...c }));

  add('并发', [
    {
      id: 'java-synchronized', title: 'synchronized 同步锁', syntax: 'synchronized void f()    synchronized (lock) { }',
      why: '多个线程同时修改同一个变量时，`count++` 这种"读、改、写"会互相覆盖，结果比预期少。`synchronized` 让同一时刻只有一个线程能进这段代码，大家排队执行，结果就对了。',
      example: 'class Counter {\n    private int count = 0;\n\n    public synchronized void inc() {   // 同一时刻只有一个线程能进来\n        count++;\n    }\n\n    public int get() { return count; }\n\n    public static void main(String[] args) throws InterruptedException {\n        Counter c = new Counter();\n        Runnable task = () -> { for (int i = 0; i < 10000; i++) c.inc(); };\n        Thread t1 = new Thread(task);\n        Thread t2 = new Thread(task);\n        t1.start(); t2.start();\n        t1.join(); t2.join();              // 等两个线程都跑完\n        System.out.println(c.get());       // 输出：20000\n    }\n}',
      vs: ['不加锁 vs 加锁', 'private int count = 0;\npublic void inc() { count++; }\n// 不加锁：两个线程各加 10000 次，结果经常小于 20000（比如 13786），每次都不一样\n\npublic synchronized void inc2() { count++; }   // 加锁：结果总是 20000\n\nprivate final Object lock = new Object();\npublic void inc3() {\n    synchronized (lock) { count++; }           // 同步块：只锁住需要保护的几行\n}'],
      ts: '// TS 没有对应写法：JS 是单线程的，一段同步代码执行时不会被别的线程打断，\n// 所以 count++ 不会出现上面的问题。\n// 异步任务之间要互斥时，用锁库，比如 async-mutex：\nawait mutex.runExclusive(async () => { count++; });',
      desc: '- 修饰实例方法：锁住 `this`；修饰静态方法：锁住类对象（`Counter.class`）\n- 同步块 `synchronized (obj) { }` 可以指定锁对象，锁住的范围更小\n- 已经持有锁的线程可以再次进入同一把锁（可重入）\n- 只是计数的话，可以用 `AtomicInteger.incrementAndGet()`，不用加锁',
      cmp: ['Kotlin', 'synchronized(lock) { count++ }\n@Synchronized fun inc() { count++ }'],
      q: '[(modifiers "synchronized" @hit) (synchronized_statement "synchronized" @hit)]', tags: ['synchronized', '锁', '线程安全', '多线程'],
    },
    {
      id: 'java-volatile', title: 'volatile 可见性', syntax: 'private volatile boolean running;',
      why: '一个线程改了变量，另一个线程可能一直读到旧值。比如把"停止标志"改成了 false，工作线程却一直不停。`volatile` 保证修改马上对其他线程可见。',
      example: 'class Worker {\n    private volatile boolean running = true;   // 去掉 volatile，下面的循环可能永远停不下来\n\n    void work() {\n        while (running) {\n            // 干活……\n        }\n        System.out.println("已停止");\n    }\n\n    void stop() { running = false; }           // 由另一个线程调用\n\n    public static void main(String[] args) throws InterruptedException {\n        Worker w = new Worker();\n        Thread t = new Thread(w::work);\n        t.start();\n        Thread.sleep(100);\n        w.stop();\n        t.join();                               // 输出：已停止\n    }\n}',
      vs: ['volatile 管可见性，不管原子性', 'private volatile int count = 0;\npublic void inc() { count++; }\n// 两个线程各加 10000 次，结果仍可能小于 20000：\n// count++ 是"读、加一、写回"三步，volatile 不能让这三步一次完成\n\nprivate final AtomicInteger safe = new AtomicInteger();\npublic void inc2() { safe.incrementAndGet(); }   // 原子操作，结果总是 20000'],
      ts: '// TS 没有对应写法：JS 单线程，不存在"别的线程看不到修改"的问题。\nlet running = true;\nsetTimeout(() => { running = false; }, 100); // 普通变量就行\n// 只有 Worker 之间共享内存时才需要 SharedArrayBuffer + Atomics',
      desc: '- 适合"一个线程写、其他线程读"的场景：停止标志、单例引用\n- 复合操作（`count++`、先判断再赋值）要用 `synchronized` 或 `AtomicXxx`\n- Kotlin 里写成 `@Volatile`',
      cmp: ['Kotlin', '@Volatile private var running = true'],
      q: '(modifiers "volatile" @hit)', tags: ['volatile', '可见性', '线程', '多线程'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
