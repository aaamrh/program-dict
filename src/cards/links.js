// 跨语言关联：同一组里的卡片互相出现在"其他语言"里。必须在所有卡片文件之后加载。
(function (C) {
  const GROUPS = [
    ['kt-val-var', 'java-local-var', 'java-final', 'rs-let', 'rs-let-mut'],
    ['kt-type-annotation', 'java-local-var', 'rs-type-annotation'],
    ['kt-nullable-type', 'kt-safe-call', 'kt-elvis', 'kt-not-null', 'java-null', 'java-optional', 'rs-api-option'],
    ['kt-string-template', 'java-string-concat', 'rs-api-format'],
    ['kt-raw-string', 'java-text-block'],
    ['kt-const', 'java-static', 'rs-const', 'rs-static'],
    ['kt-typealias', 'rs-type-alias'],
    ['kt-smart-cast', 'java-instanceof', 'rs-if-let'],
    ['kt-as', 'java-cast', 'rs-as'],
    ['kt-fun', 'java-method', 'rs-fn'],
    ['kt-expression-body', 'rs-tail-expr'],
    ['kt-vararg', 'java-varargs'],
    ['kt-extension-fun', 'rs-impl-trait-for'],
    ['kt-suspend', 'java-completable-future', 'rs-async'],
    ['kt-lambda', 'java-lambda', 'rs-closure'],
    ['kt-function-type', 'java-functional-types', 'rs-impl-trait-type'],
    ['kt-callable-ref', 'java-method-ref'],
    ['kt-label', 'java-label', 'rs-loop'],
    ['kt-if-expr', 'java-ternary', 'java-if', 'rs-if'],
    ['kt-when', 'java-switch-arrow', 'java-switch-case', 'rs-match'],
    ['kt-for', 'java-for', 'java-foreach', 'rs-for'],
    ['kt-while', 'java-while', 'rs-while'],
    ['kt-range', 'rs-range'],
    ['kt-try', 'kt-run-catching', 'java-try', 'rs-try-op', 'rs-api-result'],
    ['kt-equality', 'java-equality'],
    ['kt-destructuring', 'rs-destructure'],
    ['kt-indexing', 'java-array', 'rs-index'],
    ['kt-class', 'java-class', 'java-constructor', 'rs-struct'],
    ['kt-inherit', 'java-extends', 'rs-supertrait'],
    ['kt-implement', 'java-implements', 'rs-impl-trait-for'],
    ['kt-open', 'java-abstract'],
    ['kt-override', 'java-override'],
    ['kt-visibility', 'java-access', 'rs-pub'],
    ['kt-data-class', 'java-record', 'rs-derive'],
    ['kt-sealed', 'java-sealed', 'rs-enum-data'],
    ['kt-enum', 'java-enum', 'rs-enum'],
    ['kt-interface', 'java-interface', 'rs-trait'],
    ['kt-companion', 'kt-object', 'java-static', 'rs-assoc-call'],
    ['kt-object-expr', 'java-anonymous-class'],
    ['kt-init', 'java-init-block'],
    ['kt-inner', 'java-nested-class'],
    ['kt-annotation', 'java-annotation', 'rs-attribute'],
    ['kt-generics', 'java-type-params', 'rs-generics'],
    ['kt-type-args', 'java-type-args', 'rs-turbofish'],
    ['kt-variance', 'java-wildcard'],
    ['kt-package', 'java-package-import', 'rs-use', 'rs-mod'],
    ['kt-collections-create', 'java-collections', 'rs-api-vec', 'rs-api-hashmap', 'rs-api-vec-macro'],
    ['kt-collection-ops', 'java-stream', 'rs-api-iter'],
    ['kt-precondition', 'java-objects', 'rs-api-panic'],
    ['kt-print', 'java-system-out', 'rs-api-print'],
    ['kt-use', 'java-try-resources'],
    ['kt-string-fns', 'java-string-api', 'rs-api-string'],
    ['kt-jvm-annotations', 'java-volatile', 'java-synchronized'],
    ['kt-launch', 'java-thread', 'rs-api-thread', 'rs-api-tokio'],
    ['kt-android-log', 'java-android-log'],
    ['kt-android-context', 'java-android-context'],
    ['kt-android-intent', 'java-android-intent'],
  ];
  const byId = new Map(C.map((c) => [c.id, c]));
  for (const group of GROUPS) {
    for (const id of group) {
      const card = byId.get(id);
      if (!card) continue; // 不存在的 id 由自检报告
      const see = new Set(card.see || []);
      for (const other of group) if (byId.get(other) && byId.get(other).lang !== card.lang) see.add(other);
      card.see = [...see];
    }
  }
  C.LINK_IDS = GROUPS.flat();
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
