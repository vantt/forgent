import { tokenize } from './tokenize.mjs';
import { evaluate } from './evaluate.mjs';

export function evaluateExpr(exprString) {
  const tokens = tokenize(exprString);
  return evaluate(tokens);
}

export { tokenize, evaluate };
export default evaluateExpr;
