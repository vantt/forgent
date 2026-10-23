// Records-only lexical custody, not test execution. Run with --expose-internals.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { parse } = require('internal/deps/acorn/acorn/dist/acorn');
const request = JSON.parse(fs.readFileSync(0, 'utf8'));
const out = {};
for (const file of request.files) {
  const source = execFileSync('git', ['show', `${request.pin}:${file}`], { maxBuffer: 16 * 1024 * 1024 }).toString();
  const tests = [], functions = [], calls = [];
  try {
    const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    function walk(node, parent) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'CallExpression') {
        const callee = node.callee;
        const name = callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && callee.object.type === 'Identifier' ? callee.object.name : null;
        if (name) calls.push({ name, start: node.loc.start.line, end: node.loc.end.line });
        if (['test', 'it'].includes(name) && typeof node.arguments[0]?.value === 'string') tests.push({ title: node.arguments[0].value, start: node.loc.start.line, end: node.loc.end.line });
      }
      if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) {
        const name = node.id?.name ?? (parent?.type === 'VariableDeclarator' ? parent.id.name : null);
        if (name) functions.push({ name, start: node.loc.start.line, end: node.loc.end.line });
      }
      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end'].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(child => walk(child, node));
        else if (value && typeof value === 'object') walk(value, node);
      }
    }
    walk(ast, null);
    out[file] = { parser: 'Node bundled acorn', tests, functions, calls };
  } catch (error) { out[file] = { error: String(error.message), tests: [] }; }
}
console.log(JSON.stringify(out));
