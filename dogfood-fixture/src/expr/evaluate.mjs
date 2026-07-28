const OPERATORS = new Set(['+', '-', '*', '/']);

function isNumber(token) {
  return typeof token === 'number';
}

function validate(tokens) {
  if (tokens.length === 0) {
    throw new Error('evaluate: empty token list');
  }
  if (!isNumber(tokens[0])) {
    throw new Error(`evaluate: expression must start with a number, got "${tokens[0]}"`);
  }
  if (!isNumber(tokens[tokens.length - 1])) {
    throw new Error(`evaluate: expression must end with a number, got "${tokens[tokens.length - 1]}"`);
  }
  for (let i = 0; i < tokens.length; i += 1) {
    const expectNumber = i % 2 === 0;
    const token = tokens[i];
    if (expectNumber && !isNumber(token)) {
      throw new Error(`evaluate: expected a number at position ${i}, got "${token}"`);
    }
    if (!expectNumber && !OPERATORS.has(token)) {
      throw new Error(`evaluate: expected an operator (+ - * /) at position ${i}, got "${token}"`);
    }
  }
}

export function evaluate(tokens) {
  validate(tokens);

  // Pass 1: resolve * and / left to right.
  const stage1 = [tokens[0]];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const rhs = tokens[i + 1];
    if (op === '*' || op === '/') {
      const lhs = stage1.pop();
      stage1.push(op === '*' ? lhs * rhs : lhs / rhs);
    } else {
      stage1.push(op, rhs);
    }
  }

  // Pass 2: resolve + and - left to right.
  let result = stage1[0];
  for (let i = 1; i < stage1.length; i += 2) {
    const op = stage1[i];
    const rhs = stage1[i + 1];
    result = op === '+' ? result + rhs : result - rhs;
  }

  return result;
}
