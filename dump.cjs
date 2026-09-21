const fs = require('fs');
let code = fs.readFileSync('src/runner/coordination/store.mjs', 'utf8');
const startIdx = code.indexOf('export function openSession(');
let endIdx = startIdx;
let bracketCount = 0;
let started = false;
for (let i = startIdx; i < code.length; i++) {
  if (code[i] === '{') {
    bracketCount++;
    started = true;
  } else if (code[i] === '}') {
    bracketCount--;
  }
  if (started && bracketCount === 0) {
    endIdx = i + 1;
    break;
  }
}
fs.writeFileSync('original.txt', code.slice(startIdx, endIdx));
