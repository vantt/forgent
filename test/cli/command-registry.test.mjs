// Drift guards for the human/agent-readable prose in COMMAND_REGISTRY
// (tsk-2so). The manifest's `description` strings are a real user surface --
// `fgos --help` prints them, and an agent reading `fgos --help --json` picks
// a verb from them -- so a description that names a stage or a function the
// codebase has since retired misroutes a reader exactly like a stale doc.
// test/cli/fgos-manifest.test.mjs already guards the manifest's SHAPE (key
// sets, flag/positional rendering, dispatcher parity); these guards cover the
// prose instead, derived from live sources so they keep working after the
// next rename rather than encoding today's retired names by hand.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { DEFAULT_DOMAIN, DOMAINS, discoverableSteps, domainSteps } from '../../src/state/domain-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../../src');

/** Every prose string a reader of `fgos --help`/`--help --json` can see:
 * the verb's own description plus each parameter's. */
function describedStrings() {
  const out = [];
  for (const entry of COMMAND_REGISTRY) {
    out.push({ where: `${entry.name}.description`, text: entry.description });
    for (const [param, schema] of Object.entries(entry.parameters?.properties ?? {})) {
      if (typeof schema?.description === 'string') {
        out.push({ where: `${entry.name}.${param}.description`, text: schema.description });
      }
    }
  }
  return out;
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((ent) => {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) return sourceFiles(full);
    return ent.isFile() && full.endsWith('.mjs') ? [full] : [];
  });
}

// A judge* identifier is defined somewhere under src/ if any file declares it
// (function/const/let/class) -- deliberately NOT counting a mere mention, so a
// name that survives only inside a "judgeX is retired" comment reads as gone.
function definedJudgeNames() {
  const defined = new Set();
  const declaration = /(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+(judge[A-Za-z0-9_]*)\b/g;
  for (const file of sourceFiles(SRC_DIR)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(declaration)) defined.add(match[1]);
  }
  return defined;
}

test('no registry description names a judge* function that no longer exists in src/', () => {
  const defined = definedJudgeNames();
  assert.ok(defined.size > 0, 'no judge* declarations found under src/ -- this guard needs updating');
  const offenders = [];
  for (const { where, text } of describedStrings()) {
    for (const match of text.matchAll(/\bjudge[A-Z][A-Za-z0-9_]*/g)) {
      if (!defined.has(match[0])) offenders.push(`${where} names "${match[0]}"`);
    }
  }
  assert.deepEqual(offenders, [], `registry prose names retired judge function(s):\n${offenders.join('\n')}`);
});

// Same shape as definedJudgeNames/the judge* guard above, generalized to the
// gate-bypass family (tsk-blk, found reviewing tsk-224's own gate-count
// drift: command-registry.mjs used to name `canAutoApproveValidate`, deleted
// by coding-planning-validating-gate-redesign D9-D11, and no guard caught
// it -- this closes that gap the same mechanical way).
function definedCanAutoApproveNames() {
  const defined = new Set();
  const declaration = /(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+(canAutoApprove[A-Za-z0-9_]*)\b/g;
  for (const file of sourceFiles(SRC_DIR)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(declaration)) defined.add(match[1]);
  }
  return defined;
}

test('no registry description names a canAutoApprove* function that no longer exists in src/', () => {
  const defined = definedCanAutoApproveNames();
  assert.ok(defined.size > 0, 'no canAutoApprove* declarations found under src/ -- this guard needs updating');
  const offenders = [];
  for (const { where, text } of describedStrings()) {
    for (const match of text.matchAll(/\bcanAutoApprove[A-Za-z0-9_]*/g)) {
      if (!defined.has(match[0])) offenders.push(`${where} names "${match[0]}"`);
    }
  }
  assert.deepEqual(offenders, [], `registry prose names retired canAutoApprove* function(s):\n${offenders.join('\n')}`);
});

// A step the domain dropped outright (`clarify`) is retired: no new item can land on it, so
// telling a reader an item sits "at step <retired>" describes a state they cannot be in. (An
// alias such as `decompose` is not listed: it is also the name of a plan verdict, which
// descriptions legitimately use.) The test fails if `clarify` ever comes back as a live step.
test('no registry description names a step the default domain has retired', () => {
  const domain = DOMAINS[DEFAULT_DOMAIN];
  assert.equal(domainSteps(domain).includes('clarify'), false, 'clarify must stay retired for this guard to mean anything');
  const retired = new Set(['clarify']);
  assert.ok(retired.size > 0, `domain "${DEFAULT_DOMAIN}" has no retired step names -- this guard needs updating`);
  const offenders = [];
  for (const { where, text } of describedStrings()) {
    for (const step of retired) {
      if (new RegExp(`\\b${step}\\b`).test(text)) offenders.push(`${where} names retired step "${step}"`);
    }
  }
  assert.deepEqual(offenders, [], `registry prose names retired step(s):\n${offenders.join('\n')}`);
});

// The precondition `discover` actually enforces is computed by
// discoverableSteps (src/state/domain-registry.mjs) and checked in bin/fgos.mjs's
// own `case 'discover':` -- for the default domain that is discovery/exploring.
// The description must name those, since it is what a caller reads before
// choosing between `discover` and `plan`.
test('discover\'s description names the stages its precondition actually accepts', () => {
  const entry = COMMAND_REGISTRY.find((e) => e.name === 'discover');
  assert.ok(entry, 'COMMAND_REGISTRY is missing a "discover" entry');
  for (const stage of discoverableSteps(DOMAINS[DEFAULT_DOMAIN])) {
    // Excludes a hyphenated compound (`context-discovery`, the skill name
    // `fgos-coding-exploring`) so an incidental substring cannot satisfy the
    // guard -- the stage has to be named as a stage.
    assert.match(
      entry.description,
      new RegExp(`(?<![\\w-])${stage}(?![\\w-])`),
      `discover's description does not name accepted stage "${stage}":\n${entry.description}`,
    );
  }
});
