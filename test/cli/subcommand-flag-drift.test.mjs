// Every flag a sub-verb's handler really reads must be declared in that
// sub-verb's schema (COMMAND_REGISTRY `subcommands.<sub>.parameters`), and
// every flag a sub-verb's schema declares must really be read by it -- an
// agent that only has `fgos <verb> <sub> --help --json` must neither miss a
// flag nor be offered one that is silently ignored.
//
// How (a static source read, no handler is run -- several sub-verbs spawn
// providers or start processes):
//   - the verb's `case '<verb>': {` block in runVerb (bin/fgos.mjs) is cut out
//     by brace matching (string- and comment-aware);
//   - inside it, each `if (sub === '<name>') {` block is that sub-verb's own
//     region; whatever is outside every such block is shared prelude/tail;
//   - flag reads are `flags.x`, `flags['x']`, and, in delegated parsers,
//     `flagValue('--x')`, `positiveIntFlag('--x')`, `rest.includes('--x')`;
//   - a bare `flags` handed to a function defined in bin/fgos.mjs is followed
//     into that function's body (recursively); a bare `flags` or `rawArgv`
//     handed anywhere else fails the test until DELEGATES below names the
//     region that function reads.
// Rules:
//   - a flag read in a sub-verb's region (or in what it delegates to) is in
//     that sub-verb's schema;
//   - a flag read in the shared region is in at least one sub-verb's schema
//     (it cannot tell which sub-verb reaches it); for a verb whose code
//     after the last sub-verb block is a sub-verb's body (FALLTHROUGH), that
//     tail is that sub-verb's own region;
//   - a flag in a sub-verb's schema is read in its region or the shared one;
//   - GLOBAL flags (read by main() for every verb) are exempt both ways.
// Limits: a flag read through a computed key (`flags[name]`), or by code that
// only receives an object already built from flags, is invisible to this
// scan; regex literals containing braces would confuse the brace matcher.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const BIN = fs.readFileSync(path.join(REPO_ROOT, 'bin/fgos.mjs'), 'utf8');
const DISPATCH_CLI = fs.readFileSync(path.join(REPO_ROOT, 'src/runner/dispatch/cli.mjs'), 'utf8');

const GLOBAL = new Set(['dir', 'json', 'help']);

// Sub-verbs whose handler hands the raw argv to another parser: the region of
// that parser which handles the sub-verb.
const DELEGATES = {
  'dispatch decide': () => caseBlock(functionBody(DISPATCH_CLI, 'runDispatchCli'), 'decide'),
  'dispatch probe-account': () => caseBlock(functionBody(DISPATCH_CLI, 'runDispatchCli'), 'probe-account'),
};

// Verbs whose shared tail is itself one sub-verb's handler.
const FALLTHROUGH = { workflow: 'operations' };

// Verbs with a single sub-verb guard (`if (sub !== 'x') throw`): the whole case is that sub-verb.
const SINGLE = { agents: 'list' };

/** Index just past the `}` matching the `{` at `open`, skipping strings, templates and comments. */
function matchBrace(src, open) {
  assert.equal(src[open], '{');
  let depth = 0;
  const templateDepths = [];
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (ch === '/' && next === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (ch === '\'' || ch === '"') {
      for (i += 1; i < src.length && src[i] !== ch; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (ch === '`') {
      for (i += 1; i < src.length && src[i] !== '`'; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '$' && src[i + 1] === '{') { templateDepths.push(depth); depth++; i++; break; }
      }
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (templateDepths.length && depth === templateDepths[templateDepths.length - 1]) {
        templateDepths.pop();
        // back inside the template literal: skip to its end or next `${`
        for (i += 1; i < src.length && src[i] !== '`'; i++) {
          if (src[i] === '\\') { i++; continue; }
          if (src[i] === '$' && src[i + 1] === '{') { templateDepths.push(depth); depth++; i++; break; }
        }
        continue;
      }
      if (depth === 0) return i + 1;
    }
  }
  throw new Error(`unbalanced block at ${open}`);
}

function blockAt(src, headerIndex) {
  const open = src.indexOf('{', headerIndex);
  return src.slice(open, matchBrace(src, open));
}

function functionBody(src, name) {
  const at = src.search(new RegExp(`(?:^|\\n)(?:export\\s+)?(?:async\\s+)?function\\s+${name}\\s*\\(`));
  if (at < 0) return null;
  // skip the parameter list, whose defaults may hold braces
  let i = src.indexOf('(', at);
  for (let depth = 0; i < src.length; i++) {
    if (src[i] === '(') depth++;
    if (src[i] === ')' && --depth === 0) break;
  }
  return blockAt(src, i);
}

function caseBlock(src, label) {
  const at = src.indexOf(`case '${label}': {`);
  assert.ok(at >= 0, `case '${label}' not found`);
  return blockAt(src, at);
}

function verbCase(verb) {
  const runVerb = functionBody(BIN, 'runVerb');
  assert.ok(runVerb, 'runVerb not found in bin/fgos.mjs');
  return caseBlock(runVerb, verb);
}

function flagReads(text) {
  const names = new Set();
  const patterns = [
    /(?<![\w$.])flags\.([A-Za-z_$][\w$]*)/g,
    /(?<![\w$.])flags\[\s*['"]([^'"]+)['"]\s*\]/g,
    /\b(?:flagValue|positiveIntFlag)\(\s*['"]--([^'"]+)['"]/g,
    /\brest\.includes\(\s*['"]--([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) for (const m of text.matchAll(pattern)) names.add(m[1]);
  return names;
}

/** Functions a bare `flags`/`rawArgv` argument is handed to. */
function handoffs(text, identifier) {
  const callees = new Set();
  for (const m of text.matchAll(new RegExp(`(?<![\\w$.'"])${identifier}(?![\\w$.\\[])`, 'g'))) {
    let depth = 0;
    for (let i = m.index - 1; i >= 0; i--) {
      const ch = text[i];
      if (ch === ')' || ch === ']' || ch === '}') depth++;
      else if (ch === '(' || ch === '[' || ch === '{') {
        if (depth > 0) { depth--; continue; }
        // an unmatched `{`/`[` means `flags` sits in a literal, not a call argument
        if (ch === '(') {
          const name = /([A-Za-z_$][\w$]*)\s*$/.exec(text.slice(Math.max(0, i - 80), i));
          if (name && !['if', 'for', 'while', 'switch', 'catch', 'return'].includes(name[1])) callees.add(name[1]);
        }
        break;
      } else if (ch === ';') break;
    }
  }
  return callees;
}

/** Flags read by a region, following bare `flags` into functions defined in bin/fgos.mjs. */
function regionReads(text, where, seen = new Set()) {
  const reads = flagReads(text);
  for (const callee of handoffs(text, 'flags')) {
    if (seen.has(callee)) continue;
    seen.add(callee);
    const body = functionBody(BIN, callee);
    assert.ok(body, `${where} hands \`flags\` to ${callee}(), which is not a function in bin/fgos.mjs -- add it to DELEGATES`);
    for (const name of regionReads(body, `${where} -> ${callee}`, seen)) reads.add(name);
  }
  return reads;
}

function subRegions(verb, caseText, subs) {
  if (SINGLE[verb]) return { regions: { [SINGLE[verb]]: caseText }, shared: '' };
  const regions = {};
  let shared = caseText;
  let tailStart = 0;
  for (const m of caseText.matchAll(/if \(sub === '([a-z-]+)'\) \{/g)) {
    const block = blockAt(caseText, m.index);
    regions[m[1]] = block;
    shared = shared.replace(block, '{}');
    tailStart = caseText.indexOf(block, m.index) + block.length;
  }
  // What follows the last sub-verb block runs only when no block matched.
  if (FALLTHROUGH[verb]) regions[FALLTHROUGH[verb]] = caseText.slice(tailStart);
  for (const sub of Object.keys(regions)) {
    assert.ok(subs.includes(sub), `${verb}: handler branches on sub-verb "${sub}" that the registry does not list`);
  }
  return { regions, shared };
}

const MULTI = COMMAND_REGISTRY.filter((entry) => entry.subcommands && !entry.nativeOnly);
const NATIVE = COMMAND_REGISTRY.filter((entry) => entry.subcommands && entry.nativeOnly);

test('the drift scan covers the verbs that branch on a positional sub-verb', () => {
  assert.deepEqual(MULTI.map((e) => e.name).sort(), ['agents', 'dispatch', 'gateway', 'goal', 'merge', 'session', 'tool', 'workflow']);
  assert.deepEqual(NATIVE.map((e) => e.name).sort(), ['convention', 'friction', 'metrics']);
});

for (const entry of MULTI) {
  test(`${entry.name}: flags read by each sub-verb's handler match that sub-verb's schema`, () => {
    const subs = Object.keys(entry.subcommands);
    const caseText = verbCase(entry.name);
    const { regions, shared } = subRegions(entry.name, caseText, subs);
    const sharedReads = regionReads(shared, `${entry.name} (shared)`);
    const problems = [];
    const declaredAnywhere = new Set();
    for (const sub of subs) {
      const schema = entry.subcommands[sub].parameters;
      const declared = new Set(Object.keys(schema.properties));
      for (const name of declared) declaredAnywhere.add(name);
      const positional = new Set(schema.positional ?? []);
      const own = regions[sub] !== undefined ? regionReads(regions[sub], `${entry.name} ${sub}`) : new Set();
      const delegate = DELEGATES[`${entry.name} ${sub}`];
      if (delegate) {
        for (const name of flagReads(delegate())) own.add(name);
      } else if (regions[sub] !== undefined) {
        assert.equal(handoffs(regions[sub], 'rawArgv').size, 0, `${entry.name} ${sub} hands rawArgv to a parser -- add it to DELEGATES`);
      }
      for (const name of own) {
        if (!GLOBAL.has(name) && !declared.has(name)) problems.push(`${entry.name} ${sub} reads --${name}, not in its schema`);
      }
      for (const name of declared) {
        if (GLOBAL.has(name) || own.has(name) || sharedReads.has(name)) continue;
        if (positional.has(name)) continue; // read as positional[n], not as a flag
        problems.push(`${entry.name} ${sub} declares --${name}, which its handler never reads`);
      }
    }
    for (const name of sharedReads) {
      if (!GLOBAL.has(name) && !declaredAnywhere.has(name)) problems.push(`${entry.name} reads --${name} outside any sub-verb, not in any sub-verb's schema`);
    }
    assert.deepEqual(problems, []);
  });
}

test('the scanner sees what it claims to: known reads in known regions', () => {
  const dispatch = subRegions('dispatch', verbCase('dispatch'), Object.keys(MULTI.find((e) => e.name === 'dispatch').subcommands));
  assert.ok(regionReads(dispatch.regions.inspect, 'probe').has('provider-capacity'));
  assert.ok(flagReads(DELEGATES['dispatch decide']()).has('has-live-task-access'));
  const merge = subRegions('merge', verbCase('merge'), ['list', 'next']);
  const nextReads = regionReads(merge.regions.next, 'probe');
  for (const name of ['acknowledge-iron-law', 'timeout', 'no-timeout', 'wait', 'no-wait']) assert.ok(nextReads.has(name), name);
  assert.ok(regionReads(subRegions('tool', verbCase('tool'), ['check', 'query']).shared, 'probe').has('config'));
});

// Native verbs (the Rust host runs them; `--help` is answered from this
// registry). Same rule, read from the Rust sources: the sub-verb list equals
// the crate's AVAILABLE_SUBCOMMANDS, and the `"--flag"` literals in a
// sub-verb's own Rust region equal its schema's flags. Regions: metrics -> its
// metrics_cli/<sub>.rs file; friction -> its match arm in friction_cli.rs;
// convention -> one parser shared by every sub-verb (cli_projector.rs), so
// its flags must equal the union of the sub-verbs' schemas.
const RUST = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
const NATIVE_SOURCES = {
  metrics: {
    subs: RUST('packages/observe/rust/src/metrics_cli/mod.rs'),
    region: (sub) => {
      const file = path.join(REPO_ROOT, `packages/observe/rust/src/metrics_cli/${sub}.rs`);
      return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    },
  },
  friction: {
    subs: RUST('packages/observe/rust/src/friction_cli.rs'),
    region: (sub, subs) => {
      const src = RUST('packages/observe/rust/src/friction_cli.rs');
      const start = src.indexOf(`"${sub}" =>`);
      assert.ok(start >= 0, `friction_cli.rs has no "${sub}" arm`);
      const ends = subs.map((other) => src.indexOf(`"${other}" =>`, start + 1)).filter((i) => i > start);
      return src.slice(start, Math.min(...ends, src.indexOf('"--help" |', start)));
    },
  },
  convention: {
    subs: RUST('packages/convention/rust/src/lib.rs'),
    shared: () => {
      const src = RUST('apps/fgos/src/cli_projector.rs');
      const start = src.indexOf('fn project_convention_request');
      return src.slice(start, src.indexOf('#[cfg(test)]', start));
    },
  },
};

function rustSubcommands(src) {
  const m = /AVAILABLE_SUBCOMMANDS: &\[&str\] = &\[([^\]]*)\]/.exec(src);
  assert.ok(m, 'AVAILABLE_SUBCOMMANDS not found');
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const rustFlags = (text) => new Set([...text.matchAll(/"--([a-z][a-z-]*)"/g)].map((m) => m[1]).filter((n) => !GLOBAL.has(n)));
const schemaFlags = (spec) => Object.keys(spec.parameters.properties).filter((n) => !(spec.parameters.positional ?? []).includes(n));

for (const entry of NATIVE) {
  test(`${entry.name} (native): sub-verbs and their flags match the Rust sources`, () => {
    const source = NATIVE_SOURCES[entry.name];
    const subs = rustSubcommands(source.subs);
    assert.deepEqual(Object.keys(entry.subcommands).sort(), [...subs].sort(), `${entry.name}: registry sub-verbs != AVAILABLE_SUBCOMMANDS`);
    const problems = [];
    if (source.shared) {
      const declared = new Set(Object.values(entry.subcommands).flatMap(schemaFlags));
      assert.deepEqual([...declared].sort(), [...rustFlags(source.shared())].sort(), `${entry.name}: schema flags != the shared Rust parser's flags`);
      return;
    }
    for (const sub of subs) {
      const read = rustFlags(source.region(sub, subs));
      const declared = new Set(schemaFlags(entry.subcommands[sub]));
      // a positional parameter may also be accepted as a flag (friction show --subject)
      const accepted = new Set(Object.keys(entry.subcommands[sub].parameters.properties));
      for (const name of read) if (!accepted.has(name)) problems.push(`${entry.name} ${sub} reads --${name}, not in its schema`);
      for (const name of declared) if (!read.has(name)) problems.push(`${entry.name} ${sub} declares --${name}, which its Rust handler never reads`);
    }
    assert.deepEqual(problems, []);
  });
}
