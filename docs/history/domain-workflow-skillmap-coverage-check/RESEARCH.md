# RESEARCH.md — domain-workflow-skillmap-coverage-check (tsk-ogx)

Accumulating record, per fgos-researching's own contract (D5) — each round
appends a dated section, never overwrites a prior one.

## Round 1 — 2026-08-16 (discovery stage, inline — single-branch, no fan-out)

### Asked

Three points of ambiguity identified in `fgos-coding-discovering`'s step 2,
before any research:

1. What is the `registerCheck({...})` contract in
   `src/setup/registrations.mjs`, and which doctor-check-authoring doc
   applies?
2. What is the real shape of `domain.workflows[*].stages` /
   `domain.skillMap` referenced in the item's own description (tsk-2t9c
   D16/D17)? Does it exist on `main` today?
3. What is the real, runnable verify command for a new check + its test?

### Checked

- `docs/how-to/register-a-fixable-doctor-check-in-fgos.md` (full read) —
  the authoring doc for `registerCheck`/`registerConfigDefault`/
  `registerFix`. `docs/how-to/write-a-doctor-check-that-detects-real-shell-
  function-breakage.md` exists but targets a different check class (shell
  reachability probing) — not relevant to a pure in-memory registry check.
- `src/setup/registrations.mjs:81-92` — `registerCheck({id, description,
  check})`: `id` unique (throws on dup), `check` is a function returning
  `{passed, message}`. `checks.mjs` is a pure re-export shim (D1,
  `docs/history/setup-doctor-config-registry/`) — no edit needed there for
  a new registration.
- `src/setup/registrations.mjs:565-643` — two directly analogous existing
  checks: `checkWorkClassificationVocabulary` (tsk-6ax) and
  `checkWorkStageVocabulary` (tsk-64h), both walking `DOMAINS` via
  `getDomain`/`resolveDomainName` to catch drift between an item's
  literal field and its domain's declared vocabulary/stage list. Neither
  needs `cwd` for the DOMAINS-side of the check; `checkWorkStageVocabulary`
  only uses `cwd` to load the on-disk work-item store, which this new
  check does not need (it validates the registry's own definitions, not
  work items). Zero-arg check precedent already exists:
  `check: () => checkCliVersionVisible()` (line 442),
  `check: () => checkGatewayTokenConfigured()` (line 1211).
- `src/state/workflow-stage-graphs.mjs` (main, current HEAD `cbb705cd`) —
  read in full. `DOMAINS` has 4 entries today (`coding`, `synthetic`,
  `triage`, `fixture-marketing`), **none declares a `workflows` field**.
  Each domain declares `stages` (an array) and `skillMap` (an object keyed
  by stage name, `null` value legal — `synthetic`/`triage` use `null` for
  every stage on purpose, per their own header comments). `skillForStage`
  (line 566-567) deliberately treats "declared `skillMap[stage] === null`"
  and "`stage` absent from `skillMap` entirely" identically (`??`
  fallback to `null`) — by design, for the hot-path caller. This is
  exactly why a doctor-time check adds real value: it is the one place
  that needs to tell those two cases apart (missing key = real gap,
  explicit `null` = deliberate "no skill"), which `skillForStage` itself
  cannot and should not do.
- `grep -n "workflows" src/state/workflow-stage-graphs.mjs` on `main` →
  zero hits. `git merge-base --is-ancestor fgw/tsk-2t9c main` → **not
  merged**. The `domain.workflows[*].stages` shape the item's own
  description references does not exist on `main` yet — it lives only in
  the unmerged branch `fgw/tsk-2t9c`
  (`.claude/worktrees/tsk-2t9c-ZLD70T/src/state/workflow-stage-graphs.mjs`,
  lines 444-461, 643-698), which is where tsk-2t9c D16/D17 (cited in the
  item description) actually happened.
- Read that branch's real, already-implemented shape directly (not
  guessed): `domain.workflows` is an object keyed by workflow name →
  `{stages, stepMap, transitions}` (skillMap/roleGraph deliberately absent
  from each workflow entry — stay domain-level, confirming the item
  description's own framing verbatim). `resolveWorkflow(domain, kind)`
  (lines 670-674) returns `undefined` when `domain.workflows` is absent
  entirely — "every domain but `coding`" today in that branch, and (once
  merged) presumably every domain until it opts in. `codingDomain.workflows
  .feature.stages === codingDomain.stages` — same array reference, not a
  copy (line 437's own comment: "same discipline `workflows.feature.stages
  === codingDomain.stages` already uses"). This confirms the safe,
  forward-compatible design: a domain with no `workflows` field has its
  `stages` array as its own single implicit workflow's stage list.
- `test/setup/checks.test.mjs` (full read) — test pattern for a
  `registerCheck`-registered check: `checkById(id).check(dir)` from
  `test/setup/helpers/setup-checks-harness.mjs` (`checkById` defined
  there, line 52). Line 50-83 is an exhaustive `DOCTOR_CHECKS has exactly
  the ... checks` assertion listing every registered check id — **adding
  a new check requires updating this list**, or that test fails as a
  false regression signal, not a real one.
- `package.json:25` — `"test": "node --test 'test/**/*.test.mjs'"`. A
  narrower, real, runnable verify for just the touched file:
  `node --test test/setup/checks.test.mjs`.

### Found — answers

1. Contract confirmed: `registerCheck({id, description, check})`,
   `check` may be zero-arg (precedent exists) since this new check needs
   no `cwd`/filesystem access — it validates the in-memory `DOMAINS`
   registry, not on-disk work-item state. `docs/how-to/register-a-
   fixable-doctor-check-in-fgos.md` is the relevant authoring doc (no
   fix/configDefault needed for this item — check-only, per D2's
   "independent, not forced pairing" precedent already established by 4
   of 5 built-in checks).
2. `domain.workflows[*].stages` is a real, already-coded (but unmerged)
   shape. The check must not assume it exists on `main` — it must handle
   `domain.workflows === undefined` by falling back to `domain.stages`
   directly (today's implicit single workflow for every domain), and walk
   `Object.values(domain.workflows).flatMap(w => w.stages)` when present.
   This makes the check real and useful on `main` today (validates every
   domain's `stages` vs `skillMap` right now — verified by hand: all 4
   domains on `main` already have 100% coverage, so the check is expected
   to pass green immediately, not introduce a false positive) and
   automatically forward-compatible with tsk-2t9c landing later, with zero
   further change needed to this check.
3. Verify: `node --test test/setup/checks.test.mjs` (narrow, real,
   runnable — confirms this touched file's tests pass). Broader DoD
   proof: full `npm test`.

### Still open

None — every point above is resolved by direct evidence (file:line reads),
not inference. Proceeding to verdict.
