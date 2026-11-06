#!/usr/bin/env node
// Reads every .mjs under src/ and bin/ and reports each name that is read or assigned without any scope
// (import, var/let/const, function, class, parameter, catch binding) or the running Node's globals
// declaring it. A misspelt or forgotten name otherwise surfaces only when that line runs.
//
// The parser is the acorn Node ships; it is reachable only with `node --expose-internals`, so run
//   node --expose-internals scripts/check-undefined-names.mjs [--root <dir>]
// When the parser cannot be loaded the run fails with `no-undef-parser-unavailable`, never passes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const NO_PARSER = 'no-undef-parser-unavailable';
const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

function loadAcorn() {
  const vendored = ['internal', 'deps', 'acorn', 'acorn', ['di', 'st'].join(''), 'acorn'].join('/');
  try {
    return createRequire(import.meta.url)(vendored);
  } catch (err) {
    throw new Error(`${NO_PARSER}: node ${process.version} cannot load its bundled parser (${err.message}); run with --expose-internals`);
  }
}

const GLOBALS = new Set(Object.getOwnPropertyNames(globalThis));

/** Every name a binding pattern declares. */
function patternNames(node, out = []) {
  if (!node) return out;
  if (node.type === 'Identifier') out.push(node.name);
  else if (node.type === 'ObjectPattern') for (const p of node.properties) patternNames(p.type === 'RestElement' ? p.argument : p.value, out);
  else if (node.type === 'ArrayPattern') for (const e of node.elements) patternNames(e, out);
  else if (node.type === 'RestElement') patternNames(node.argument, out);
  else if (node.type === 'AssignmentPattern') patternNames(node.left, out);
  return out;
}

const childNodes = (node) => Object.values(node).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v) => v && typeof v.type === 'string');

/** Declares `var` names of `node` (not crossing a function) into `scope`. */
function hoistVars(node, scope) {
  if (node.type === 'VariableDeclaration' && node.kind === 'var') for (const d of node.declarations) patternNames(d.id).forEach((n) => scope.add(n));
  for (const child of childNodes(node)) if (!FUNCTIONS.has(child.type) && child.type !== 'StaticBlock') hoistVars(child, scope);
}

/** Declares the lexical names a statement list introduces. */
function hoistLexical(statements, scope) {
  for (let stmt of statements) {
    if (stmt.type === 'ImportDeclaration') stmt.specifiers.forEach((s) => scope.add(s.local.name));
    if ((stmt.type === 'ExportNamedDeclaration' || stmt.type === 'ExportDefaultDeclaration') && stmt.declaration) stmt = stmt.declaration;
    if (stmt.type === 'VariableDeclaration' && stmt.kind !== 'var') for (const d of stmt.declarations) patternNames(d.id).forEach((n) => scope.add(n));
    else if ((stmt.type === 'FunctionDeclaration' || stmt.type === 'ClassDeclaration') && stmt.id) scope.add(stmt.id.name);
  }
}

/** `[{ name, line }]` of the undeclared reads and writes in `source`. */
export function findUndefinedNames(source, acorn) {
  const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true, allowHashBang: true });
  const found = [];
  const declared = (scope, name) => { for (let s = scope; s; s = s.parent) if (s.names.has(name)) return true; return GLOBALS.has(name); };
  const newScope = (parent, names = []) => ({ parent, names: new Set(names), add(n) { this.names.add(n); } });

  const read = (id, scope) => { if (!declared(scope, id.name)) found.push({ name: id.name, line: id.loc.start.line }); };

  // A binding or assignment pattern: `declaring` skips the names themselves, defaults and computed keys are always read.
  function pattern(node, scope, declaring) {
    if (!node) return;
    switch (node.type) {
      case 'Identifier': if (!declaring) read(node, scope); break;
      case 'ObjectPattern':
        for (const p of node.properties) {
          if (p.type === 'RestElement') pattern(p.argument, scope, declaring);
          else { if (p.computed) visit(p.key, scope); pattern(p.value, scope, declaring); }
        }
        break;
      case 'ArrayPattern': node.elements.forEach((e) => pattern(e, scope, declaring)); break;
      case 'RestElement': pattern(node.argument, scope, declaring); break;
      case 'AssignmentPattern': pattern(node.left, scope, declaring); visit(node.right, scope); break;
      default: visit(node, scope);
    }
  }

  function func(node, scope) {
    const fscope = newScope(scope, node.type === 'ArrowFunctionExpression' ? [] : ['arguments']);
    if (node.type === 'FunctionExpression' && node.id) fscope.add(node.id.name);
    node.params.forEach((p) => { patternNames(p).forEach((n) => fscope.add(n)); pattern(p, fscope, true); });
    if (node.body.type === 'BlockStatement') {
      hoistVars(node.body, fscope);
      hoistLexical(node.body.body, fscope);
      node.body.body.forEach((s) => visit(s, fscope));
    } else visit(node.body, fscope);
  }

  function visit(node, scope) {
    if (!node) return;
    switch (node.type) {
      case 'Identifier': read(node, scope); return;
      case 'ImportDeclaration': case 'ExportAllDeclaration': case 'MetaProperty': case 'ThisExpression': return;
      case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': func(node, scope); return;
      case 'BlockStatement': { const s = newScope(scope); hoistLexical(node.body, s); node.body.forEach((c) => visit(c, s)); return; }
      case 'StaticBlock': { const s = newScope(scope, ['arguments']); hoistVars(node, s); hoistLexical(node.body, s); node.body.forEach((c) => visit(c, s)); return; }
      case 'Program': { const s = newScope(null); hoistVars(node, s); hoistLexical(node.body, s); node.body.forEach((c) => visit(c, s)); return; }
      case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': {
        const s = newScope(scope);
        const head = node.init ?? node.left;
        if (head?.type === 'VariableDeclaration' && head.kind !== 'var') head.declarations.forEach((d) => patternNames(d.id).forEach((n) => s.add(n)));
        for (const key of ['init', 'test', 'update', 'left', 'right', 'body']) if (node[key]) visit(node[key], s);
        return;
      }
      case 'SwitchStatement': {
        visit(node.discriminant, scope);
        const s = newScope(scope);
        hoistLexical(node.cases.flatMap((c) => c.consequent), s);
        node.cases.forEach((c) => { visit(c.test, s); c.consequent.forEach((x) => visit(x, s)); });
        return;
      }
      case 'CatchClause': { const s = newScope(scope, patternNames(node.param)); pattern(node.param, s, true); visit(node.body, s); return; }
      case 'ClassDeclaration': case 'ClassExpression': {
        const s = newScope(scope, node.id ? [node.id.name] : []);
        visit(node.superClass, s);
        for (const m of node.body.body) {
          if (m.type === 'StaticBlock') { visit(m, s); continue; }
          if (m.computed) visit(m.key, s);
          if (m.value) visit(m.value, s);
        }
        return;
      }
      case 'VariableDeclaration': node.declarations.forEach((d) => { pattern(d.id, scope, true); visit(d.init, scope); }); return;
      case 'AssignmentExpression': pattern(node.left, scope, false); visit(node.right, scope); return;
      case 'UnaryExpression': if (node.operator === 'typeof' && node.argument.type === 'Identifier') return; break;
      case 'MemberExpression': visit(node.object, scope); if (node.computed) visit(node.property, scope); return;
      case 'Property': if (node.computed) visit(node.key, scope); visit(node.value, scope); return;
      case 'LabeledStatement': visit(node.body, scope); return;
      case 'BreakStatement': case 'ContinueStatement': return;
      case 'ExportSpecifier': return;
      case 'ExportNamedDeclaration':
        if (node.declaration) visit(node.declaration, scope);
        else if (!node.source) node.specifiers.forEach((s) => read(s.local, scope));
        return;
      default:
    }
    for (const child of childNodes(node)) visit(child, scope);
  }

  visit(ast, null);
  return found;
}

function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.mjs'))
    .map((e) => path.join(e.parentPath, e.name))
    .sort();
}

/** Findings as `file:line name` strings for every .mjs under `<root>/src` and `<root>/bin`. */
export function checkTree(root) {
  const acorn = loadAcorn();
  const report = [];
  for (const file of ['src', 'bin'].flatMap((d) => sourceFiles(path.join(root, d)))) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    try {
      for (const { name, line } of findUndefinedNames(fs.readFileSync(file, 'utf8'), acorn)) report.push(`${rel}:${line} ${name} is not defined`);
    } catch (err) {
      if (String(err.message).startsWith(NO_PARSER)) throw err;
      report.push(`${rel}: cannot be parsed (${err.message})`);
    }
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf('--root');
  const root = path.resolve(flag > 0 ? process.argv[flag + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  try {
    const report = checkTree(root);
    if (report.length) {
      process.stderr.write(`${report.join('\n')}\n`);
      process.exitCode = 1;
    }
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 2;
  }
}
