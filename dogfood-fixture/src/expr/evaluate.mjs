import { tokenize } from './tokenize.mjs';

export function evaluate(tokens) {
  if (typeof tokens === 'string') {
    tokens = tokenize(tokens);
  }

  if (!Array.isArray(tokens)) {
    throw new TypeError('Tokens must be an array');
  }

  if (tokens.length === 0) {
    return 0;
  }

  // Pass 1: Handle high-precedence operators (* and /) left-to-right
  const pass1 = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '*' || token === '/') {
      if (pass1.length === 0 || i + 1 >= tokens.length) {
        throw new Error(`Syntax error: missing operand for operator '${token}'`);
      }
      const prevNum = Number(pass1.pop());
      const nextNum = Number(tokens[i + 1]);

      if (Number.isNaN(prevNum) || Number.isNaN(nextNum)) {
        throw new Error(`Invalid operands for operator '${token}'`);
      }

      let res;
      if (token === '*') {
        res = prevNum * nextNum;
      } else {
        res = prevNum / nextNum;
      }
      pass1.push(res);
      i += 2;
    } else {
      pass1.push(token);
      i++;
    }
  }

  // Pass 2: Handle low-precedence operators (+ and -) left-to-right
  if (pass1.length === 0) {
    return 0;
  }

  let result = Number(pass1[0]);
  if (Number.isNaN(result)) {
    throw new Error(`Invalid initial token in expression: ${pass1[0]}`);
  }

  let j = 1;
  while (j < pass1.length) {
    const op = pass1[j];
    if (j + 1 >= pass1.length) {
      throw new Error(`Syntax error: missing operand for operator '${op}'`);
    }
    const nextNum = Number(pass1[j + 1]);

    if (Number.isNaN(nextNum)) {
      throw new Error(`Invalid operand for operator '${op}'`);
    }

    if (op === '+') {
      result += nextNum;
    } else if (op === '-') {
      result -= nextNum;
    } else {
      throw new Error(`Unsupported or invalid operator: '${op}'`);
    }
    j += 2;
  }

  return result;
}

export default evaluate;
