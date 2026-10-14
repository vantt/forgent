# Red-team: lane driver (phase 10), feat/rununit-driver

- Target: `e966e0057` (the lane commit). During this round `466b57ee8` landed on the branch, so every attack was re-run against HEAD `466b57ee8`. Results below are for HEAD unless marked otherwise.
- How: throwaway `test/runner/zz-redteam-driver.test.mjs`, built on the fixture from `driver-rununit.test.mjs` (bwrap registry, `makeFixtureDir` under /var/tmp, executor id `fake`). Run with `env -u CLAUDE_CODE_SESSION_ID node --test`. The file was deleted before this report was written.
- Baseline: `driver-rununit.test.mjs` 11/11 green on `e966e0057`.

## Summary

| # | Attack | Result |
|---|---|---|
| 1a | Worker edits plan.md in its cwd and rewinds the mtime | MISS (confined worker gets EROFS) |
| 1b | Same, with plan.md only in the item worktree | MISS (EROFS) |
| 1c | Same, with an unconfined executor | MISS (`unit-refused-posture-unavailable`, nothing spawned) |
| 2 | Pin outside the allowed roots, a symlinked file, a symlinked parent dir, a `..` path, a deleted listed worktree | MISS (all give `sha256: null`) |
| 2c | A listed worktree is deleted and its path replaced by a symlink to an outside dir | LOW HIT (the outside dir becomes an allowed root) |
| 2d | A forged `.git/worktrees/<x>/gitdir` makes git list an outside dir | LOW HIT (same) |
| 2e/2f | A worktree nested inside the main checkout: `rel` was relative to main, so the next pass never consumed the verdict (endless re-validation) | HIT on `e966e0057`, **fixed in `466b57ee8`** (innermost root) |
| 3 | Resume: `declared` and `pinInputs` | MISS (read from unit.json) |
| 3b | Resume: `pattern` | **HIT M2**: the caller's pattern is used and written into unit.json |
| 4 | Two operations of one item; forged nested assignment fields | MISS for the operation filter. The walker stays permissive when `operation` is missing and takes any seat (see M1 defense) |
| 5 | human-only / direct-stage-skill / stop | MISS |
| 6 | Pattern refusal bypass | **HIT M1**: `pattern: {pattern:'reviewed'}` passes the solo check, and the reviewer seat is stamped as the item's validate-plan gate verdict |
| 6 | prefer / independentOf | MISS (unit `prefer` still goes through every bind filter; independence held for the reviewer in RT3d) |
| 7 | Other flat-only walkers that read Work verdicts | MISS (only `findLatestAssignmentRunResult`; `createAssignmentId` and the others don't read verdicts) |
| F1 | Forged `inputDigests` in result.json compared with `planContentHash` | MISS (same exposure as before, see note) |
| F2 | `inputDigests: []`, a rel mismatch, or `sha256: null` falling back to a weaker path | MISS |
| F3 | A confined worker rewriting run.json, assignment.json or unit.json (the recovery settle reads `inputDigests` from run.json) | MISS (EROFS on all four) |
| F4 | Rigor lowered by `work.rigor: low` + `risk: heavy`, or by `opPolicy.rigor` | MISS (`workRigorFor` gives the same result as `resolveAssignmentPolicy`) |
| F5 | A caller-supplied `runnerConfig` (`fgos-runner --config <path>`) | **HIT H1**: ignored for execution (regression from main) |
| F6 | A `unit-run:` / `gate-answer:` ref from item data reaches the worker through `choice.contextRefs` | **HIT H2** (still open after `466b57ee8`) |
| F7 | `runner.timeoutMs` still bounds a driver operation | MISS |
| F8 | String `pattern` that disagrees with `unit.pattern` left an orphan unit dir with `execution: running` | HIT on `e966e0057`, **fixed in `466b57ee8`** |

## HITs

### H1 (high): the caller's `runnerConfig` no longer decides who runs a driver operation

**Evidence.**
- On main, `executeAssignment` uses `opts.runnerConfig ?? ensureRunnerConfigForDir(root)` (`git show main:src/runner/dispatch/assignment-runner.mjs:1231`), and the driver spread `...opts` into it.
- Now the driver uses `opts.runnerConfig` only in `workUnitFor`, for capability, prefer and the rigor sources. `runUnit` binds and dispatches with `snapshotRunnerConfig(mainRoot)`, which reads the repo's `.fgos/config.json`.
- `loop.mjs` receives `options.config` from `fgos-runner --config <path>` (`bin/fgos-runner.mjs:102-104`) and passes it as `runnerConfig`. With `--config`, driver operations now run with the on-disk config.
- This also splits one step across two configs. The prefer id comes from config A and is bound against config B; an id unknown to B is silently skipped (`bind.mjs:209`).
- The lane changed `operation-choice.test.mjs` on purpose to write the config to disk ("never from the caller's memory"). The approved design (r3 §1–8) does not mention this, and neither does any Spec or CHANGELOG delta.

**Repro.** RT-F6b: the caller's config names a NOT READY worker and the disk config names a READY worker. The result is `canAdvanceEdge: true, validate-plan-ready`.

**Failing test** (add to `driver-rununit.test.mjs`, which already has the helpers):
```js
test('a caller runnerConfig decides which executor runs the driver operation', async () => {
  const { repo, runner } = setupRepo();
  writePlan(repo);
  const notReadyDir = makeFixtureDir('fgos-driver-rununit-alt-');
  const notReady = path.join(notReadyDir, 'worker.mjs');
  fs.writeFileSync(notReady, WORKER.replace("verdict: 'READY'", "verdict: 'NOT READY'"));
  const alt = JSON.parse(JSON.stringify(runner));
  alt.executors.fake.args = [notReady, '{prompt}'];
  alt.executors.fake.invocations[0].args = [notReady, '{prompt}'];
  const work = workItem('tsk-drv-altcfg');
  const outcome = await executeDriverOperationChoice(work, { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning' }, { repoRoot: repo, cwd: repo, runnerConfig: alt });
  assert.equal(outcome.canAdvanceEdge, false, 'the caller config named a NOT READY executor');
});
```

**Fix (needs a Lead decision).** Pick one:
- (a) Add a `runnerConfig` option to `runUnit`. It feeds the snapshot (`snapshotRunnerConfig` from that object instead of the file), and the driver passes `opts.runnerConfig`.
- (b) Make the on-disk config the rule. The driver then refuses, or warns, when `opts.runnerConfig` is given and its snapshot hash differs from the disk snapshot, and it uses the same snapshot for `workUnitFor`. Write this down as a Spec delta and in the `--config` CHANGELOG.

Either way, `workUnitFor` and `runUnit` must use one config. (a) keeps `--config` working.

### H2 (medium-high): item data can name another unit run's output through `choice.contextRefs`

**Evidence.**
- `90f1cf6f3` added `isSafeRepoRelative` to `workUnitFor` so that "an item's editable refs never get to name" `unit-run:` or `gate-answer:` inputs.
- The driver then merges `choice.contextRefs` into `unitData.inputs` (`operation-choice.mjs:~2320`). The filter there refuses only `/`, `..`, `\` and `\0`. Since `466b57ee8` it still lets `unit-run:` and `gate-answer:` through.
- `choice.contextRefs` holds `work.refs`, the editable field: `deriveCandidateReviewRefs` puts `...work.refs` into `candidateRefs`, and the review-item choice returns `contextRefs: candidateRefs` (`:1031`).
- `resolveUnitInputs` resolves `unit-run:<id>/producer` to that run's `agent-report.md`.
- On main these refs only travelled as plain strings in `assignment.contextRefs` and were never resolved. So this is new: content from another item's run can reach this item's worker, which is a cross-item read.

**Repro.** RT-F7. The unit's `resolvedInputs[0]` is `<repo>/.fgos/assignments/unit-run-…/producer/1/runs/01/worker-output/outbox/agent-report.md`.

**Failing test:**
```js
test('a unit-run: ref from item data never becomes a unit input through choice.contextRefs', async () => {
  const { repo, runner } = setupRepo();
  writePlan(repo);
  const other = await executeDriverOperationChoice(workItem('tsk-drv-ref-a'), { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning' }, { repoRoot: repo, cwd: repo, runnerConfig: runner });
  // (a gate-answer:<run>/<step> ref takes the same path; left out because resolving a missing one throws)
  const evil = [`unit-run:${other.unitRunId}/producer`];
  const b = workItem('tsk-drv-ref-b', { refs: evil });
  const out = await executeDriverOperationChoice(b, { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning', contextRefs: evil }, { repoRoot: repo, cwd: repo, runnerConfig: runner });
  const rec = unitJson(repo, out.unitRunId);
  for (const ref of evil) assert.ok(!rec.unit.inputs.includes(ref), ref);
});
```

**Fix.** Use one predicate. Export `isSafeRepoRelative` from `work-dispatch.mjs` (or move it next to `workUnitFor`'s input building) and filter `callerRefs` with it. A simpler alternative: pass caller refs to `workUnitFor` and let its `addInput` decide. The symbolic `diff:` and `verify:` review refs then need an explicit allow (or a different channel), because `isSafeRepoRelative` lets them through only by accident. Check what the review-item task spec expects.

### M1 (medium): an object-form pattern bypasses the solo-only check, and a reviewer seat gets the operation stamp

**Evidence.**
- `declaredOperationOf` reads `patternName?.name` (`run.mjs`, the `const name = ...` line), but `resolvePattern` reads `.pattern || .patternName` (`presets.mjs`). So `runUnit({ pattern: { pattern: 'reviewed' }, declared })` sees `name === undefined`, treats it as `'solo'` and accepts.
- The run then executes `reviewed`. `dispatchBound` puts `operationFields` and `role: declaredOp.role` on every seat. The reviewer seat's assignment.json therefore carries `workId`, `operation: 'validate-plan'`, `resultKind: 'gate-verdict'`, `role: 'reviewer'` (RT3d). That makes it a full candidate for `findLatestAssignmentRunResult`, and its READY would count as the item's plan gate.
- The driver itself does not pass a pattern today (`workUnitFor` sets `'solo'`). The exposure is the exported `runUnit` contract the design calls the guard (r3 §1).
- A preset string such as `'consult'` (which is solo) is over-refused. That is harmless, but it shows the check does not use the resolver.

**Failing test:**
```js
test('a declared operation refuses a non-solo pattern in object form, and no other seat carries the stamp', async () => {
  const { repo } = setupRepo();
  const cfgPath = path.join(repo, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.runner.executors.fake2 = { ...cfg.runner.executors.fake, providerModel: 'node2' };
  cfg.runner.modelPolicies.node2 = { ...cfg.runner.modelPolicies.node };
  for (const cap of Object.values(cfg.runner.capabilities)) cap.prefer = [{ executor: 'fake' }, { executor: 'fake2' }];
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  writePlan(repo);
  const ops = operationsForStep(getDomain('coding'), 'planning');
  const before = fs.existsSync(path.join(repo, '.fgos', 'assignments')) ? fs.readdirSync(path.join(repo, '.fgos', 'assignments')) : [];
  for (const pattern of [{ pattern: 'reviewed' }, { patternName: 'panel' }, { pattern: 'code-change' }]) {
    await assert.rejects(
      runUnit({
        unitData: { id: 'u', objective: 'x', capability: 'review', writes: [], pattern: 'solo' },
        pattern,
        declared: { workId: 'w-obj', domain: 'coding', workflow: 'feature', stage: 'planning', operation: 'validate-plan', operations: ops },
        repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false },
      }),
      (err) => err instanceof RunnerConfigError && /runs solo/.test(err.message),
      JSON.stringify(pattern),
    );
  }
  const after = fs.existsSync(path.join(repo, '.fgos', 'assignments')) ? fs.readdirSync(path.join(repo, '.fgos', 'assignments')) : [];
  assert.deepEqual(after, before);
});
```

**Fix.**
- In `declaredOperationOf`, use `resolvePattern(patternName).patternName !== 'solo'`. This also accepts presets that resolve to solo.
- Defense in depth: in `dispatchBound`, apply `operationFields` and the operation role only when `role === 'producer'`.
- Also in the walker: skip a unit-run assignment (`provenance.kind === 'unit-run'`) whose `provenance.role !== 'producer'`, and require `asgn.operation` to be present for the nested layout. Every declared nested assignment carries it, so the "permissive on missing" stance is only needed for old flat ones.

### M2 (medium): resume takes the caller's pattern and writes it into unit.json

**Evidence.**
- On resume, the pattern line (`run.mjs`, `const callerPattern = ...; const patternName = callerPattern || unit.pattern || options.pattern || 'solo'; unitRecord.pattern = patternName; persistUnitRecord()`) uses `options.pattern` from the resuming caller.
- The `declaredOperationOf` check on resume uses the stored `unitRecord.pattern`, so it does not see the caller's pattern.
- RT3b, a resume with `pattern: {pattern:'reviewed'}`: results come back with roles `['producer','reviewer']`, and unit.json `pattern` becomes `{ pattern: 'reviewed' }`. The reviewer was refused bind only because the fixture has one provider family; with two families it dispatches with the stamp, as in M1.
- This breaks attack #3's rule ("resume reads from unit.json, never the caller") for the pattern field.

**Failing test:**
```js
test('a resumed declared unit keeps its stored pattern, never the caller pattern', async () => {
  const { repo } = setupRepo();
  writePlan(repo);
  const ops = operationsForStep(getDomain('coding'), 'planning');
  const first = await runUnit({
    unitData: { id: 'u', objective: 'x', capability: 'review', writes: [] },
    declared: { workId: 'w-resume-pat', domain: 'coding', workflow: 'feature', stage: 'planning', operation: 'validate-plan', operations: ops },
    repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false },
  });
  const resumed = await runUnit({
    resumeUnitRunId: first.unitRunId,
    pattern: { pattern: 'reviewed' },
    repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false },
  });
  assert.deepEqual(resumed.results.map((r) => r.role).filter((r) => r !== 'producer'), []);
  assert.equal(unitJson(repo, first.unitRunId).pattern, 'solo');
});
```

**Fix.** When `options.resumeUnitRunId` is set, take the pattern from `unitRecord.pattern`. Either ignore `options.pattern` or refuse it when it differs, and don't rewrite `unitRecord.pattern` on resume. Smallest change: `const patternName = options.resumeUnitRunId ? unitRecord.pattern : (callerPattern || unit.pattern || options.pattern || 'solo');`.

### L1 (low): allowed roots trust whatever `git worktree list` prints

**Evidence.**
- RT2c: a listed worktree is removed and its path replaced by a symlink to `/var/tmp/outside`. `add()` takes the realpath of the symlink, so `outside` becomes a root, and `outside/secret.md` gets a real sha256.
- RT2d: a hand-written `.git/worktrees/evil/{gitdir,HEAD,commondir}` makes git list `outside` as a worktree, with the same result.
- Impact is bounded. Only a sha256 of a regular file is recorded (`isFile` blocks devices and FIFOs), and you need write access to `.git` or to the stale worktree path. A confined worker had neither (RT-F8: EROFS on its own run metadata).
- This matches the letter of r3 §2 ("worktrees git lists"). Reported only because attack #2 asked about deleted listed worktrees.

**Failing test** (optional to adopt):
```js
test('a stale listed worktree path replaced by a symlink is not an allowed root', () => {
  const { repo } = setupRepo();
  const wt = makeFixtureDir('fgos-driver-rununit-stale-');
  fs.rmSync(wt, { recursive: true, force: true });
  git(repo, ['worktree', 'add', '-b', 'fgw/stale', wt]);
  const outside = makeFixtureDir('fgos-driver-rununit-outside2-');
  fs.writeFileSync(path.join(outside, 'secret.md'), 'secret\n');
  fs.rmSync(wt, { recursive: true, force: true });
  fs.symlinkSync(outside, wt);
  assert.equal(digestPinnedInputs([path.join(outside, 'secret.md')], repo)[0].sha256, null);
});
```

**Fix (optional).**
- In `allowedInputRoots`, skip entries the porcelain marks `prunable`.
- Skip a listed path whose `lstat` is a symlink.
- Optionally require `<path>/.git` to be a file whose `gitdir:` points back into `<mainRoot>/.git/worktrees/`.

## MISS notes (evidence)

- **#1 (worker edits plan.md and rewinds the mtime).** The worker's `appendFileSync` on plan.md fails with `EROFS` both in the main checkout (RT1a) and in the item worktree (RT1b). An unconfined executor is refused at bind with `unit-refused-posture-unavailable` (RT1c). The digest is taken in `executeAssignment` before admission and spawn.
  - Note: `interpretAssignmentRunResult` never checks the plan digest for the immediate in-pass outcome (`loop.mjs:1628` and `step.mjs:80` advance on it). This is the same as on main. Today the read-only sandbox is what makes it safe, so it is a single point of defense.
- **#2.**
  - Pinning `<repo>/linkdir/secret.md` (a symlinked parent dir) gives `pin-outside-allowed-roots`.
  - `<repo>/src/../../outside/secret.md` gives the same; `checkedPinInputs` accepts it, and the realpath normalises it.
  - A deleted listed worktree is skipped by `add()`.
  - The digest reads `real`, not `p`, and runs before spawn, so no worker can race it.
- **#3.** `declared` and `pinInputs` on resume come from unit.json (the existing test, re-checked). The pattern does not: see M2.
- **#4.** Unit run ids are `unit-run-<ms>-<8 hex>`, so they don't collide. The walker's `operation` filter blocks a sibling scout even when it carries `gate-verdict` (existing test). A forged nested assignment.json can drop `operation`, but anyone who can write assignment.json can forge every other field too.
- **#5.** The existing test passes. A forged `choice.dispatch: 'assignment'` on a human-only registry operation is still refused by `declaredOperationOf`.
- **#7.** `rg` for `.fgos/assignments` / `'assignments'` in `src/` finds:
  - `assignment.mjs:150`: id allocation, flat only, not a verdict reader;
  - `cli.mjs`, `runtime-inspection.mjs`, `recover.mjs`: point lookups;
  - `handoff-refs.mjs:117`, `workflow/runner.mjs:269,1050`, `run.mjs`: unit.json lookups;
  - `registrations.mjs:599`: doctor.
  None of these reads a Work verdict, and `findLatestAssignmentRunResult` is the only one. `consumingRunDirFor` splits the runId on `_`, and nested ids contain none, so that is fine.
- **F1.**
  - `planContentHash` was also a plain result.json field. The reader never cross-checked it against run.json, before or now, so a post-settle writer can forge either one. Moving to `inputDigests` adds no new exposure.
  - With a pinned digest the mtime pre-filter is skipped. That only changes the case where the plan was edited and then put back byte for byte. A cheap hardening for later: have the walker compare `result.inputDigests` with run.json's `inputDigests` (runner-written, and EROFS to the worker per RT-F8).
- **F2.** `normalizeRunResult` drops an empty `inputDigests`. The walker then sees no entry and no legacy hash, and `!== true` skips the result. An entry with `sha256: null` gives `false`.
  - In the caller-supplied `lastRunResult` branch, `null` (no identity at all) keeps the old behaviour, which only checked when a hash was present.
- **F4.** `workRigorFor` follows the policy's order exactly: the operation's rigor first, then `work.rigor` can only raise it, and `risk: heavy` applies only when `work.rigor` is not set. `low` + `heavy` gives `low`, and bind's floor then makes it `standard`. That is r3 §3's documented delta.
- **seatRoleOf.** It changes behaviour only when `provenance.kind === 'unit-run'`, and that object is built by the runner (`dispatchBound`). No outside party can supply it, so there is no spoof boundary.

## Other observations (not attacks on the list)

- Two `operation-choice.test.mjs` cases now assert that the sandbox refused the write, instead of asserting a correlated-mutation warning. That is justified by confinement, but correlated-mutation detection through the real driver path is now covered only by a forged result.json (the driver-rununit "correlated" test).
- Every driver operation now needs a confinement backend: an unconfined executor is refused (RT1c). Machines without bwrap lose driver validate-plan, which now stops with `unit-refused-posture-unavailable`. Worth a CHANGELOG line if that is intended.
- `466b57ee8` (concurrent) fixed RT2e/2f and F8. I did not review the rest of that commit beyond re-running these attacks against it.

Status: DONE_WITH_CONCERNS
Summary: Floor attacks 1, 2, 4, 5 and 7 hold (the read-only sandbox blocks plan edits, and pins outside the roots get a null digest). Four real hits are open: the caller runnerConfig is ignored (H1), unit-run:/gate-answer: refs from item data reach the worker through choice.contextRefs (H2), an object-form pattern bypasses the solo check and stamps reviewer seats (M1), and resume takes the caller's pattern (M2). L1 is low.
Concerns/Blockers: H1 needs a Lead decision (honour `--config` in runUnit, or make the on-disk config the rule and document it). The nested-worktree rel bug (RT2e/2f) and the pattern orphan dir (F8) were real on e966e0057 and are already fixed in 466b57ee8.
