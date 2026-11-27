// 汇总各语言的验收用例。
const fs = require('fs');
const path = require('path');
module.exports = ['kotlin', 'java', 'rust']
  .map((l) => path.join(__dirname, `cases-${l}.cjs`))
  .filter((f) => fs.existsSync(f))
  .flatMap((f) => require(f));
