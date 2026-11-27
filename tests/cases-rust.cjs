// Rust 验收用例：完整片段、函数体中间、从 match 中间截断、迭代器链。
module.exports = [
  {
    name: 'rust: struct + impl + trait（自动识别）', lang: 'rust', detect: true, verbose: true,
    code: `#[derive(Debug, Clone)]
pub struct Counter {
    name: String,
    n: u32,
}

pub trait Describe {
    fn describe(&self) -> String;
    fn tag(&self) -> &str { "counter" }
}

impl Counter {
    pub fn new(name: &str) -> Self {
        Self { name: name.to_string(), n: 0 }
    }
    fn inc(&mut self) { self.n += 1; }
}

impl Describe for Counter {
    fn describe(&self) -> String {
        format!("{}={}", self.name, self.n)
    }
}`,
    expect: ['rs-derive', 'rs-attribute', 'rs-struct', 'rs-pub', 'rs-trait', 'rs-default-method', 'rs-self-param', 'rs-str', 'rs-impl', 'rs-impl-trait-for', 'rs-Self', 'rs-struct-expr', 'rs-api-convert', 'rs-api-print', 'rs-tail-expr', 'rs-method-call'],
  },
  {
    name: 'rust: 函数体中间几行（不完整）', lang: 'rust', detect: true,
    code: `    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    let total = counts.len();`,
    expect: ['rs-let', 'rs-let-mut', 'rs-assoc-call', 'rs-for', 'rs-deref', 'rs-api-hashmap', 'rs-api-string', 'rs-api-vec'],
  },
  {
    name: 'rust: 从 match 中间截断', lang: 'rust', verbose: true,
    code: `        Some(x) if x > 0 => println!("pos {}", x),
        Msg::Move { x, .. } => {}
        n @ 1..=5 => {}
        _ => {}
    }`,
    expect: ['rs-match-guard', 'rs-rest-pattern', 'rs-at-binding', 'rs-wildcard', 'rs-api-print'],
  },
  {
    name: 'rust: ? + Option + 闭包 + 迭代器链', lang: 'rust', detect: true,
    code: `fn top_names(path: &str, min: u32) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let text = std::fs::read_to_string(path)?;
    let names: Vec<String> = text
        .lines()
        .filter_map(|line| line.split_once(','))
        .filter(|(_, score)| score.parse::<u32>().unwrap_or(0) >= min)
        .map(|(name, _)| name.trim().to_owned())
        .collect();
    let first = names.first().cloned().unwrap_or_default();
    if let Some(n) = names.get(0) {
        println!("{n} {first}");
    }
    Ok(names)
}`,
    expect: ['rs-fn', 'rs-try-op', 'rs-closure', 'rs-api-iter', 'rs-api-option', 'rs-api-result', 'rs-if-let', 'rs-dyn', 'rs-api-error', 'rs-api-fs', 'rs-turbofish', 'rs-destructure', 'rs-api-format', 'rs-tail-expr'],
  },
  {
    name: 'rust: 线程 + Arc<Mutex>', lang: 'rust', detect: true,
    code: `let counter = Arc::new(Mutex::new(0));
let handles: Vec<_> = (0..4).map(|_| {
    let c = Arc::clone(&counter);
    thread::spawn(move || {
        *c.lock().unwrap() += 1;
    })
}).collect();`,
    expect: ['rs-api-rc-arc', 'rs-api-mutex', 'rs-api-thread', 'rs-move-closure', 'rs-range', 'rs-borrow'],
  },
];
