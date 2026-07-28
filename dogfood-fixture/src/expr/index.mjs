import { tokenize } from './tokenize.mjs';
import { evaluate } from './evaluate.mjs';

export function evaluateExpr(exprString) {
  return evaluate(tokenize(exprString));
}
