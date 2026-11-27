// rust · 错误处理（1 张）。字段说明见 README.md。
(function (C) {
  const add = (cat, list) => list.forEach((c) => C.push({ lang: 'rust', cat, ...c }));

  add('错误处理', [
    {
      id: 'rs-try-op', title: '? 错误传播', syntax: 'let v = read()?;',
      why: 'Rust 没有异常，可能失败的函数返回 `Result`。如果每一步都手写 `match` 判断成功失败，代码会很啰嗦。`?` 的意思是：成功就取出值接着往下走；失败就把错误直接 return 给调用方。效果很像 TS 里异常自动往上抛，但每个可能出错的地方都看得见。',
      example: 'use std::num::ParseIntError;\n\n// 返回 Result：成功是 i32，失败是解析错误\nfn sum(a: &str, b: &str) -> Result<i32, ParseIntError> {\n    let x = a.trim().parse::<i32>()?;   // 失败就在这里直接 return Err(..)\n    let y = b.trim().parse::<i32>()?;\n    Ok(x + y)                           // 都成功才走到这里\n}\n\nfn main() {\n    println!("{:?}", sum("1", " 2"));   // 输出：Ok(3)\n    println!("{:?}", sum("1", "x"));    // 输出：Err(ParseIntError { kind: InvalidDigit })\n\n    match sum("10", "20") {\n        Ok(n) => println!("结果 {}", n),      // 输出：结果 30\n        Err(e) => println!("出错：{}", e),\n    }\n}',
      vs: ['不用 ?：每一步都要手写 match', 'fn sum(a: &str, b: &str) -> Result<i32, ParseIntError> {\n    let x = match a.trim().parse::<i32>() {\n        Ok(v) => v,\n        Err(e) => return Err(e),     // ? 帮你省掉的就是这几行\n    };\n    let y = match b.trim().parse::<i32>() {\n        Ok(v) => v,\n        Err(e) => return Err(e),\n    };\n    Ok(x + y)\n}\n\nfn not_result() -> i32 {\n    "1".parse::<i32>()?   // 编译错误：the `?` operator can only be used in a function that returns `Result` or `Option`\n}'],
      ts: 'function parseIntStrict(s: string): number {\n  const n = Number(s.trim());\n  if (!Number.isInteger(n)) throw new Error(`不是整数：${s}`);\n  return n;\n}\nfunction sum(a: string, b: string): number {\n  const x = parseIntStrict(a);   // 失败时 throw，自动往上抛\n  const y = parseIntStrict(b);\n  return x + y;\n}\ntry { sum("1", "x"); } catch (e) { console.log("出错：", e); }\n// 差异：TS 的 throw 在签名里看不出来；Rust 的错误写在返回类型里，每个可能失败的地方都要写 ?',
      desc: '- 只能用在返回 `Result` 或 `Option` 的函数里；对 `Option` 用 `?`，遇到 `None` 就直接返回 `None`\n- 错误类型不一致时，`?` 会自动调用 `From` 转换；用 `Box<dyn Error>` 或 anyhow 当返回的错误类型，各种错误都能直接 `?`\n- `main` 也能返回 `Result`：`fn main() -> Result<(), Box<dyn std::error::Error>>`，这样 main 里也能用 `?`',
      cmp: ['Kotlin', 'fun sum(a: String, b: String): Int? {\n    val x = a.trim().toIntOrNull() ?: return null\n    val y = b.trim().toIntOrNull() ?: return null\n    return x + y\n}'],
      pit: '不想往上传，就地处理错误时，用 `match`、`unwrap_or(默认值)`、`if let Ok(v) = ...`。`unwrap()` 遇到错误会直接 panic，只适合示例代码和确定不会失败的地方。',
      q: '(try_expression "?" @hit)', kw: '\\)\\?', tags: ['?', '错误传播', 'Result', 'throws', '异常'],
    },
  ]);
})(globalThis.LANGREF_CARDS || (globalThis.LANGREF_CARDS = []));
