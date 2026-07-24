const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'bangumi-anison-helper.user.js');
const source = fs.readFileSync(scriptPath, 'utf8');

function extractFunction(name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `Expected ${name} to exist`);

  const open = source.indexOf('{', start);
  assert.notEqual(open, -1, `Expected ${name} to have a body`);

  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  throw new Error(`Could not extract ${name}`);
}

function loadHelpers(names) {
  const sandbox = {
    module: { exports: {} },
    console
  };
  const code = `${names.map(extractFunction).join('\n')}
module.exports = { ${names.join(', ')} };`;
  vm.runInNewContext(code, sandbox, { filename: 'bangumi-anison-helper.helpers.js' });
  return sandbox.module.exports;
}

module.exports = {
  loadHelpers,
  source
};
