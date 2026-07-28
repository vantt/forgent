const OPERATORS = new Set(['+', '-', '*', '/']);

export function tokenize(exprString) {
  const tokens = [];
  let i = 0;

  while (i < exprString.length) {
    const ch = exprString[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (OPERATORS.has(ch)) {
      tokens.push(ch);
      i += 1;
      continue;
    }

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      let dotCount = 0;
      while (j < exprString.length && ((exprString[j] >= '0' && exprString[j] <= '9') || exprString[j] === '.')) {
        if (exprString[j] === '.') dotCount += 1;
        j += 1;
      }
      const numStr = exprString.slice(i, j);
      const num = Number(numStr);
      if (dotCount > 1 || numStr === '' || numStr === '.' || Number.isNaN(num)) {
        throw new Error(`tokenize: invalid number "${numStr}" at position ${i}`);
      }
      tokens.push(num);
      i = j;
      continue;
    }

    throw new Error(`tokenize: unrecognized character "${ch}" at position ${i}`);
  }

  return tokens;
}
