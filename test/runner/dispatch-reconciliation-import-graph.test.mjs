import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Real transitive static-import graph walk: parse each visited file's own
// `import .. from '...'` / `export .. from '...'` statements and recurse into
// whatever they resolve to. This is NOT a name/regex text-scan of arbitrary
// repo files -- a shallow scan limited to reconciliation-planner.mjs's own
// source alone would have missed a two-hop static
// re-export (visibility-session.mjs used to re-export reconcileHerdrSpawnRun
// from herdr-round.mjs at its top level) that pulled the whole cli-spawn
// process-control adapter chain into this graph transitively, even though
// reconciliation-planner.mjs's own file never names any of those symbols.
// That re-export was dead code (verified: nothing in the repo imports
// reconcileHerdrSpawnRun from visibility-session.mjs's own path, only
// directly from herdr-round.mjs) and is removed as part of this same fix --
// this test is what proves the removal actually closed the gap, and what
// catches any future re-introduction.
const IMPORT_RE = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;

// run-result.mjs is a proven, already-tested leaf boundary: the identical
// carve-out exists in test/runner/dispatch-runtime-inspect.test.mjs's own
// static import-graph test, which already proves its own further imports
// (agent-result-claim-contract.mjs) are safe. Reusing that proof here avoids
// re-deriving a second walk into the same subtree.
//
// provider-capacity.mjs (Provider Capacity Rotator slice 1) is a proven leaf
// for a different reason: `reconcile.mjs`'s own `provider-capacity
// clear-quarantine` action imports `clearProviderAccountQuarantine` from it
// (a real, legitimate import this graph must now include), but the file's
// source also contains an UNRELATED `process.kill(pid, 0)` liveness check
// (`isPidAlive`, used only by `reclaimDeadLeases`/`rankProviderAccounts` --
// never by `clearProviderAccountQuarantine`, which only ever touches
// `withFileLock`/`fs.readFileSync`/`fs.writeFileSync` on its own state file).
// A whole-file text scan cannot distinguish "this export is safe" from "some
// other export in the same file is not" -- verified by direct reading
// (confirmed here, not assumed) that the reachable export never calls
// `process.kill`, so this file is proven safe by the same standard every
// other entry in this test relies on. It imports only `node:crypto`,
// `node:fs`, `node:os`, `node:path` (no further relative imports to walk).
const isProvenLeaf = (file) => {
  const f = file.replaceAll('\\', '/');
  return f.endsWith('/run-result.mjs') || f.endsWith('/provider-capacity.mjs');
};

// Concrete modules -- named explicitly, each confirmed by direct reading, not
// by guessing at names -- that implement process-control, retry/relaunch,
// admission, resume/reattach, reassignment, cancellation, or takeover. This
// list documents exactly what the walk below must never reach; the walk's
// own exact-set assertion further down is the load-bearing proof, this is
// the human-readable cross-check for it.
const BANNED_FILES = [
  'src/runner/dispatch/detached-run-supervisor.mjs', // process-control adapter: child_process.spawn, worker PGID signalling, receipt publication
  'src/runner/dispatch/herdr-round.mjs', // process-control: prepares/briefs/signals one interactive herdr round
  'src/runner/dispatch/herdr-agent.mjs', // herdr client: spawns/queries live herdr panes
  'src/runner/dispatch/worker-home.mjs', // creates/removes a spawned worker's confined home directory
  'src/runner/dispatch/trust-store.mjs', // seeds trust for a spawned worker
  'src/runner/dispatch/worker-session-boot.mjs', // resume/reattach: ensures a live worker session exists
  'src/runner/dispatch/liveness.mjs', // process-control signal ladder / pane-fate escalation
  'src/runner/dispatch/assignment-runner.mjs', // launch/execution and Run-lifecycle driving
  'src/runner/dispatch/plan.mjs', // admission: DispatchPlan compiler, Run generation admission
  'src/runner/dispatch/recovery-planner.mjs', // resume/reassign/retry recommendation planning
  'src/runner/recovery.mjs', // retry decision matrix
  'src/verbs/dispatch/recover.mjs', // recovery verb: observes/applies resume/reassign for a standalone Run
  'src/runner/claim-port.mjs', // work-item claim admission gate
  'src/runner/dispatch/run-lock.mjs', // run-lock ledger writer
  'src/runner/dispatch/confinement/policies.mjs', // worker confinement policy for a spawned process
  'src/runner/dispatch/confinement/bypass-pairing.mjs', // confinement bypass pairing for a spawned process
].map((p) => path.join(root, p));

for (const banned of BANNED_FILES) {
  test(`banned-module sanity: ${path.relative(root, banned)} exists on disk (keeps the banned list honest, not fictional)`, () => {
    assert.equal(fs.existsSync(banned), true, `expected ${banned} to exist -- update BANNED_FILES if this module moved`);
  });
}

// Defense in depth: even a file legitimately in the graph must never itself
// perform a process-control call. Patterns require an actual call/import
// form (trailing `(` or the `node:` protocol prefix), never a bare English
// word -- reconciliation-planner.mjs's own comments discuss the cli-spawn
// adapter and process-control concepts in prose (e.g. "child_process.spawn,
// worker PGID signalling"), and a bare-word ban would false-positive on that
// legitimate prose instead of on an actual call.
const BANNED_CALL_PATTERN = /node:child_process|\bspawn\(|\bexecFile\(|\bfork\(|process\.kill\(|\.kill\(|\.signal\(/;

function walk(file, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  if (isProvenLeaf(file)) return;
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, BANNED_CALL_PATTERN, `${path.relative(root, file)} matched a banned process-control call pattern`);
  for (const m of source.matchAll(IMPORT_RE)) {
    let target = path.resolve(path.dirname(file), m[1]);
    if (!path.extname(target)) target += '.mjs';
    walk(target, seen);
  }
}

test('reconcile use-case + reconciliation-planner transitive import graph excludes process-control/retry/admission/resume/reassignment/cancellation/takeover modules', () => {
  const seen = new Set();
  walk(path.join(root, 'src/verbs/dispatch/reconcile.mjs'), seen);
  walk(path.join(root, 'src/runner/dispatch/reconciliation-planner.mjs'), seen);

  for (const banned of BANNED_FILES) {
    assert.equal(seen.has(banned), false, `reconcile's real import graph must never reach ${path.relative(root, banned)}`);
  }

  // Strongest proof: the whole real transitive closure is EXACTLY this known,
  // hand-verified set -- not merely "does not contain a banned name". Any
  // future import added anywhere in this graph must show up here as a
  // deliberate, reviewed addition to `expected`, never silently.
  const expected = [
    'src/verbs/dispatch/reconcile.mjs',
    'src/runner/dispatch/reconciliation-planner.mjs',
    'src/runner/dispatch/runtime-inspection.mjs',
    'src/runner/dispatch/run-result.mjs',
    'src/runner/dispatch/visibility-session.mjs',
    'src/runner/dispatch/worker-artifacts.mjs',
    'src/runner/dispatch/provider-capacity.mjs',
    'src/config/global-config.mjs',
    'src/config/shared-config-file.mjs',
    'src/setup/config-merge.mjs',
    // Pure leaf (node:crypto + worker_threads' threadId): unique temp-file
    // names for the planner's and visibility-session's write-then-rename.
    'src/util/unique-tmp-tag.mjs',
  ].map((p) => path.join(root, p)).sort();
  assert.deepEqual([...seen].sort(), expected);
});

test('boundary test: src/runner/dispatch/** does not reference pick/return verbs or appendEvent (R1 / M10)', () => {
  const dispatchDir = path.join(root, 'src/runner/dispatch');
  const forbiddenPattern = /['"]pick['"]|['"]return['"]|\bappendEvent\b/;

  function getFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = getFiles(dispatchDir);
  assert.ok(files.length > 5, `expected at least 5 dispatch files, found ${files.length}`);

  const violations = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (forbiddenPattern.test(line)) {
        violations.push(`${path.relative(root, file)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(violations, [], `src/runner/dispatch/** must not reference 'pick', 'return', or appendEvent:\n${violations.join('\n')}`);
});

test('boundary test: dispatch core does not import operation-choice, fanout-batch, or dispatch-log (F4 / R1 / R2)', () => {
  const dispatchCoreFiles = [
    'src/runner/dispatch/config.mjs',
    'src/runner/dispatch/resolve.mjs',
    'src/runner/dispatch/mechanism.mjs',
    'src/runner/dispatch/transport.mjs',
    'src/runner/dispatch/prepare.mjs',
    'src/runner/dispatch/cli.mjs',
    'src/runner/dispatch/plan.mjs',
  ];

  const bannedUpward = ['operation-choice', 'fanout-batch', 'dispatch-log'];
  for (const rel of dispatchCoreFiles) {
    const filePath = path.join(root, rel);
    const content = fs.readFileSync(filePath, 'utf8');
    for (const banned of bannedUpward) {
      assert.equal(
        content.includes(banned),
        false,
        `${rel} must not import or reference upward module ${banned}`,
      );
    }
  }
});

test('boundary test: src/runner/dispatch/** contains no lifecycle verb imports or dynamic return/pick spawns (M1b, M1c)', () => {
  const dispatchDir = path.join(root, 'src/runner/dispatch');
  const forbiddenImports = ['settleClaim', 'claimWork', 'appendEvent', 'pickWork', 'returnWork'];
  const forbiddenModulePatterns = [/\/state\/claim\.mjs$/, /\/state\/settle\.mjs$/, /\/verbs\/work\//];

  function getFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = getFiles(dispatchDir);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);

    // M1b: Check AST / static import clauses
    const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const named = m[1] ? m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]) : [];
      const defaultImport = m[2];
      const source = m[3];

      for (const sym of forbiddenImports) {
        assert.equal(named.includes(sym), false, `${rel} statically imports lifecycle symbol '${sym}' (M1b violation)`);
        assert.notEqual(defaultImport, sym, `${rel} default-imports lifecycle symbol '${sym}' (M1b violation)`);
      }
      for (const pat of forbiddenModulePatterns) {
        assert.equal(pat.test(source), false, `${rel} imports forbidden lifecycle module '${source}' (M1b violation)`);
      }
    }

    // Direct named symbol checks in source
    for (const sym of forbiddenImports) {
      assert.equal(
        new RegExp(`\\b${sym}\\b`).test(content),
        false,
        `${rel} references lifecycle function '${sym}' (M1b violation)`,
      );
    }

    // M1c: Check dynamic concatenation / spawning of 'return' or 'pick'
    const dynamicReturnPick = /['"]\s*\+\s*['"]turn['"]|['"]\s*\+\s*['"]ick['"]|['"]re['"]\s*\+|['"]pi['"]\s*\+|\[\s*['"]re['"]\s*,\s*['"]turn['"]\s*\]|\[\s*['"]pi['"]\s*,\s*['"]ck['"]\s*\]/;
    assert.equal(
      dynamicReturnPick.test(content),
      false,
      `${rel} dynamically constructs 'return' or 'pick' verb string (M1c violation)`,
    );

    // M1d: Check dynamic property construction for lifecycle operations (e.g. ['settle' + 'Claim'])
    const dynamicLifecycleProps = /['"]\s*\+\s*['"](?:Claim|Work|Event)['"]|['"](?:settle|claim|pick|append)['"]\s*\+/;
    assert.equal(
      dynamicLifecycleProps.test(content),
      false,
      `${rel} dynamically accesses lifecycle properties (M1d violation)`,
    );
  }
});

test('boundary test: dispatch core modules do not import workflow-stage-graphs, work-compat, or unauthorized Work lookups (R2 / ME)', () => {
  const strictDispatchCoreFiles = [
    'src/runner/dispatch/config.mjs',
    'src/runner/dispatch/mechanism.mjs',
    'src/runner/dispatch/transport.mjs',
    'src/runner/dispatch/plan.mjs',
    'src/runner/dispatch/resolve.mjs',
    'src/runner/dispatch/prepare.mjs',
    'src/runner/dispatch/settlement.mjs',
    'src/runner/dispatch/run-result.mjs',
    'src/runner/dispatch/runtime-inspection.mjs',
    'src/runner/dispatch/brief.mjs',
    'src/runner/dispatch/proof-helpers.mjs',
    'src/runner/dispatch/herdr-reconcile.mjs',
    'src/runner/dispatch/recovery-planner.mjs',
  ];

  const WORK_LOOKUP_SYMBOLS = [
    'executorIdForWork',
    'resolveCapabilityIdentityDetails',
    'resolveCapabilityIdentity',
    'buildPrompt',
  ];

  const IMPORT_OR_EXPORT_RE = /(?:import|export)\s+(?:\{([^}]+)\}|(\*\s+as\s+\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;

  for (const rel of strictDispatchCoreFiles) {
    const filePath = path.join(root, rel);
    const content = fs.readFileSync(filePath, 'utf8');

    // Rule 1: Zero direct workflow-stage-graphs imports or references across all strict dispatch core
    assert.equal(
      content.includes('workflow-stage-graphs'),
      false,
      `${rel} must not import or reference workflow-stage-graphs`,
    );

    // Rule 2: Zero direct imports from work-compat.mjs, except documented compatibility re-exporters
    const importsWorkCompat = /from\s+['"][^'"]*work-compat(?:\.mjs)?['"]/.test(content);
    if (importsWorkCompat) {
      assert.ok(
        rel === 'src/runner/dispatch/resolve.mjs' || rel === 'src/runner/dispatch/prepare.mjs',
        `${rel} must not import from work-compat.mjs (only resolve.mjs/prepare.mjs are authorized compatibility re-exporters)`,
      );
    }

    // Rule 3: Strict enforcement of Work lookup symbols (R2 / mutation ME lock)
    // Core modules must not import or re-export Work lookups except authorized allowlist
    let m;
    const re = new RegExp(IMPORT_OR_EXPORT_RE.source, 'g');
    while ((m = re.exec(content)) !== null) {
      const namedClause = m[1];
      const defaultImport = m[3];
      const sourceModule = m[4];

      const names = [];
      if (namedClause) {
        names.push(...namedClause.split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean));
      }
      if (defaultImport) names.push(defaultImport);

      for (const sym of WORK_LOOKUP_SYMBOLS) {
        if (names.includes(sym)) {
          // Allowlist verification:
          // 1. plan.mjs is permitted to import executorIdForWork from ./resolve.mjs for compileDispatchPlan({work}) compatibility
          if (rel === 'src/runner/dispatch/plan.mjs' && sym === 'executorIdForWork') {
            continue;
          }
          // 2. resolve.mjs is permitted to re-export executorIdForWork, resolveCapabilityIdentityDetails, resolveCapabilityIdentity from work-compat.mjs
          if (rel === 'src/runner/dispatch/resolve.mjs' && sym !== 'buildPrompt') {
            continue;
          }
          // 3. prepare.mjs is permitted to re-export buildPrompt from work-compat.mjs
          if (rel === 'src/runner/dispatch/prepare.mjs' && sym === 'buildPrompt') {
            continue;
          }
          assert.fail(
            `${rel} statically imports/exports forbidden Work lookup symbol '${sym}' from '${sourceModule}' (R2 boundary violation / ME)`
          );
        }
      }
    }

    // Rule 4: For the 10 completely decoupled core modules, forbid all identifier references to Work lookups
    const completelyDecoupled = (
      rel !== 'src/runner/dispatch/plan.mjs' &&
      rel !== 'src/runner/dispatch/resolve.mjs' &&
      rel !== 'src/runner/dispatch/prepare.mjs'
    );
    if (completelyDecoupled) {
      for (const sym of WORK_LOOKUP_SYMBOLS) {
        assert.equal(
          new RegExp(`\\b${sym}\\b`).test(content),
          false,
          `${rel} contains forbidden reference to Work lookup symbol '${sym}' (R2 boundary violation / ME)`,
        );
      }
    }
  }

  // Work Driver compatibility lookups (executorIdForWork, resolveCapabilityIdentityDetails, buildPrompt)
  // are relocated to leaf module src/runner/work-compat.mjs, avoiding cyclic dependencies.
  const resolveSource = fs.readFileSync(path.join(root, 'src/runner/dispatch/resolve.mjs'), 'utf8');
  const prepareSource = fs.readFileSync(path.join(root, 'src/runner/dispatch/prepare.mjs'), 'utf8');
  assert.equal(resolveSource.includes('operation-choice'), false, 'resolve.mjs must not import operation-choice');
  assert.equal(prepareSource.includes('operation-choice'), false, 'prepare.mjs must not import operation-choice');

  const workCompatSource = fs.readFileSync(path.join(root, 'src/runner/work-compat.mjs'), 'utf8');
  assert.equal(/(?:import|export)\s+.*from\s+['"]\.\/dispatch\//.test(workCompatSource), false, 'work-compat.mjs must not import dispatch core');

  // Verify cli.mjs (dispatch CLI surface) uses documented allowlist and does not import work-compat directly
  const cliSource = fs.readFileSync(path.join(root, 'src/runner/dispatch/cli.mjs'), 'utf8');
  assert.equal(/from\s+['"][^'"]*work-compat(?:\.mjs)?['"]/.test(cliSource), false, 'cli.mjs must not import work-compat directly');
});


test('boundary test: dispatch core has no cyclic dependencies > 2 (SCC analysis, F4)', () => {
  const IMPORT_RE = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
  function getImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    let m;
    while ((m = IMPORT_RE.exec(content)) !== null) {
      let resolved = path.resolve(path.dirname(filePath), m[1]);
      if (!path.extname(resolved)) {
        if (fs.existsSync(resolved + '.mjs')) resolved += '.mjs';
        else if (fs.existsSync(resolved + '.js')) resolved += '.js';
      }
      imports.push(resolved);
    }
    return imports;
  }

  const graph = new Map();
  function scan(file) {
    if (graph.has(file)) return;
    graph.set(file, []);
    if (!fs.existsSync(file)) return;
    try {
      const imps = getImports(file);
      graph.set(file, imps);
      for (const imp of imps) {
        if (imp.startsWith(root) && !imp.includes('node_modules')) {
          scan(imp);
        }
      }
    } catch {}
  }

  const dispatchDir = path.join(root, 'src/runner/dispatch');
  for (const f of fs.readdirSync(dispatchDir)) {
    if (f.endsWith('.mjs')) scan(path.join(dispatchDir, f));
  }

  let index = 0;
  const indices = new Map();
  const lowlinks = new Map();
  const onStack = new Map();
  const stack = [];
  const sccs = [];

  function strongConnect(v) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.set(v, true);

    for (const w of graph.get(v) || []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
      } else if (onStack.get(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 2 && scc.some((p) => p.includes('src/runner/dispatch/'))) {
        sccs.push(scc.map((p) => path.relative(root, p)));
      }
      if (scc.length > 1) {
        const rels = scc.map((p) => path.relative(root, p));
        const bannedInCycle = [
          'src/runner/dispatch/resolve.mjs',
          'src/runner/dispatch/prepare.mjs',
          'src/runner/dispatch/operation-choice.mjs',
          'src/runner/fanout-batch.mjs',
        ];
        for (const b of bannedInCycle) {
          assert.equal(
            rels.includes(b),
            false,
            `${b} must not participate in any import cycle (found in SCC: ${JSON.stringify(rels)})`,
          );
        }
      }
    }
  }

  for (const node of graph.keys()) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  assert.deepEqual(sccs, [], `dispatch modules must have no SCC cycle > 2 (found: ${JSON.stringify(sccs)})`);
});
