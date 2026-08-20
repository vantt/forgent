export function tokenize(exprString) {
  if (typeof exprString !== 'string') {
    throw new TypeError('Expression must be a string');
  }

  const tokens = [];
  let i = 0;
  const len = exprString.length;

  while (i < len) {
    const ch = exprString[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    const lastToken = tokens[tokens.length - 1];
    const isUnaryMinus = ch === '-' &&
      (tokens.length === 0 || typeof lastToken === 'string') &&
      i + 1 < len &&
      /\d|\./.test(exprString[i + 1]);

    if (isUnaryMinus) {
      let numStr = '-';
      i++;
      while (i < len && (/\d|\./.test(exprString[i]))) {
        numStr += exprString[i];
        i++;
      }
      const num = Number(numStr);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid number format: ${numStr}`);
      }
      tokens.push(num);
      continue;
    }

    if (['+', '-', '*', '/'].includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }

    if (/\d|\./.test(ch)) {
      let numStr = '';
      while (i < len && /\d|\./.test(exprString[i])) {
        numStr += exprString[i];
        i++;
      }
      const num = Number(numStr);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid number format: ${numStr}`);
      }
      tokens.push(num);
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

export default tokenize;
