# capacity cross-provider governance — plan

Item: `tsk-32n`. Decisions: `docs/history/capacity-cross-provider-governance/CONTEXT.md` (D1-D4).

## Mode gate

Flags counted:

- **authorization** — yes. `allowCrossProvider` is literally a permission
  gate deciding whether a capacity may reach a non-Claude backend.
- **data model** — yes. New field on the `capacities.<id>` config schema
  (`.fgos-runner.json`), plus its shape validation.
- **audit/security** — yes (hard-gate flag on its own). The entire point of
  the item is preventing prompt content from silently leaving the Claude
  ecosystem.
- **external systems** — yes. Governs routing to third-party CLI providers
  (`agy`/`gemini`).
- **existing covered behavior** — yes. `resolveExecutorConfig` already has
  an extensive test suite (`test/runner/dispatch.test.mjs`, capacity
  precedence tests from `tsk-62v`) that must keep passing byte-identical
  when `capacities.<id>.allowCrossProvider` is absent (mirrors D1/tsk-62v's
  own byte-identical-when-absent invariant).

5 flags including a hard-gate flag (audit/security) → **high-risk**. No
smaller mode honestly covers a change whose entire purpose is a security
control on an already-covered, already-shared resolver function.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → one
provider, `gitnexus`, `status: "present"` → **full** per `CLAUDE.md`'s
capability gate. `impact({target: "resolveExecutorConfig", direction:
"upstream"})` MUST run (and its risk level reported) before
`fgos-coding-implement` edits `resolveExecutorConfig`/`validateCapacityShape`.
Note: GitNexus's own index was stale twice this session (last indexed
`1ac5a85`, then `6a7d210`, both predating this session's `fgw/tsk-64p`
merge) — `fgos-coding-implement` must re-run `gitnexus analyze` before trusting
impact output for the post-merge code, not just run `impact()` against a
stale graph.

Minimal actual blast-radius risk in practice: `resolveExecutorConfig` has
exactly one caller inside `dispatch.mjs` (`resolveExecutorCommand`,
line 495) plus direct test-only calls — a small, already-enumerable
surface — but the MUST-run-impact rule applies regardless of how small the
surface looks from a grep.

## Approach

**Chosen:** add the D2 detection + D3 refusal check inside
`resolveExecutorConfig` itself (`src/runner/dispatch.mjs:453-478`), right
after the existing precedence resolution (`byCapacity ?? perTier ?? cfg.executor`,
line 473) computes the winning `executor` block, before it is returned.

**Rejected:** checking only at `spawnWorker` (`resolveExecutorConfig`'s
one runtime caller via `resolveExecutorCommand`). `resolveExecutorConfig`
is itself exported and called directly by tests today (D1/tsk-62v's own
precedence tests) — guarding the shared resolver is the single choke
point every caller (current and future) gets for free, matching this
codebase's own repeated "one door" precedent (`claim-port.mjs`,
`store.mjs`). Scattering the check at each call site would let a future
caller of `resolveExecutorConfig` bypass governance by construction.

**Rejected:** checking at capacity-declaration/validation time
(`validateCapacityShape`, line 353) instead of resolve time. Whether a
specific capacity resolution actually reaches a non-Claude command depends
on precedence (D2) — a `kind: "cli"` capacity with no `command`/`adapter`
override resolves to whatever wins at `executors.<tier>`/global, which can
change across config edits without touching the capacity entry itself.
Validation-time can only ever check the capacity's own declared shape
(boolean type-check for `allowCrossProvider`, see below) — it cannot know
the final resolved command, so it cannot be the place the D3 refusal
happens.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| D2 detection + D3 refusal inside `resolveExecutorConfig` | High — false negative is a real data leak (item's entire purpose defeated); false positive blocks legitimate dispatch | New tests: (a) `kind:"cli"` + unrecognized `command` + no `allowCrossProvider` → throws `RunnerConfigError`, no dispatch attempted; (b) same capacity + `allowCrossProvider: true` → resolves normally; (c) `kind:"cli"` capacity with **no** `command`/`adapter` override (falls through to global `executor`, which is `'claude'`) → resolves WITHOUT requiring `allowCrossProvider` — this is the exact false-positive scenario D2 was written to rule out, must be a real regression-guard test, not just a design note; (d) capacity `kind` other than `"cli"` (e.g. `"task"`) → governance never triggers regardless of `allowCrossProvider` (D4 scope floor); (e) `cfg.capacities` absent entirely → byte-identical to pre-this-item behavior (existing suite must pass unchanged, per item's own acceptance text). |
| `validateCapacityShape` boolean-type check for `allowCrossProvider` (`dispatch.mjs:353-364`) | Low | New test: `allowCrossProvider` present but non-boolean → `RunnerConfigError` at config-load time, same style as the existing `kind` shape check immediately above it in the same function. |
| `RunnerConfigError` message wording | Low | Message names the capacity id and the resolved (rejected) command, and states how to fix it (`allowCrossProvider: true`) — same instructive style as the existing D6 `fgos tool register` hint at line 460. |
| `tsk-5l2`'s own config (companion consumer named in the item's point 4) | Out of scope for this item | Explicitly deferred per `CONTEXT.md`'s "Deferred to planning" note — the item's acceptance criteria requires the mechanism to exist, not that `tsk-5l2`'s own capacity entry be edited in this same diff. Not listed as a file this item touches. |

## Files touched

- `src/runner/dispatch.mjs` — `resolveExecutorConfig` (D2/D3 check),
  `validateCapacityShape` (boolean-type validation for
  `allowCrossProvider`).
- `test/runner/dispatch.test.mjs` — the 5 scenarios in the risk map above,
  plus the config-load-time boolean-type test.
- `docs/specs/runner.md` — one new RUL entry documenting the governance
  behavior (capacity-keyed, `kind: "cli"` scope floor, restrictive
  default, resolve-time refusal), matching how `tsk-62v`'s own D1-D9
  precedent is written up there today. This is the "what learning gets
  left behind" step from `AGENTS.md`'s definition-of-done — a settled spec
  fact, not changelog noise.

No change needed to `.fgos-runner.json` itself (no capacity in this repo's
own tracked config declares `kind: "cli"` today) and no change to
`tsk-5l2`'s config (out of scope, see risk map).

## Order

1. `validateCapacityShape` boolean-type check for `allowCrossProvider`
   (small, self-contained, unblocks nothing else but is the simplest
   correct starting point).
2. D2/D3 detection + refusal inside `resolveExecutorConfig`.
3. Tests for all 5 risk-map scenarios plus the shape-validation test.
4. `docs/specs/runner.md` RUL entry.

`fgos graph tsk-32n --json` was run: `topUnblock` and `criticalPath` are
whole-backlog signals (this item currently unblocks nothing directly —
nothing else lists it as a `dep`) and don't materially change the order
above, since this item is not splitting (see below) — there is no
multi-piece ordering choice for that data to inform. `topUnblock` does
show `tsk-5l2-1` (`newlyUnblocks: 4`) as high-value elsewhere in the
backlog, supporting context for why the cluster matters but not an input
to this item's own internal step order.

## Split decision

No split. One honest, cohesive piece of work centered on a single
function (`resolveExecutorConfig`) and its immediate shape-validation
neighbor, both in one file, both already covered by one test file. Item
proceeds as itself.

## Verify

`npm test` — matches the item's own acceptance criteria ("existing
dispatch.mjs test suite passes unchanged; new tests cover...") and the
`fgos discover` verdict already recorded for this item (`verify: "npm
test"`, `impactScore: 58`).

## Assumptions

- The known-Claude-CLI allowlist (D2) starts as exactly `['claude']`,
  mirroring `DEFAULT_RUNNER_CONFIG.executor.command`. Not asked as a
  separate question — not material (extending the list later is additive
  and doesn't change this item's own acceptance criteria), pinned here per
  this skill's own material/grounded/answerable filter for mid-planning
  gaps.
- The RUL entry number in `docs/specs/runner.md` is assigned at execution
  time (next available number in that doc) — an implementation detail, not
  decided here.

## Validating findings (fgos-coding-validating, READY WITH CONSTRAINTS)

Reality gate: all PASS (mode fit, repo fit, assumptions, smaller path, proof
surface, impact-analysis posture — live `fgos tool query
--capability impact-analysis --status present` re-run during validating:
`gitnexus`, `status: "present"`, matches plan's recorded "full").

**Constraint found — risk-map scenario (c) needs a test-fixture correction,
not a design change.** The plan's scenario (c) ("`kind:'cli'` capacity with
no `command` override, falls through to Claude's global executor, should
NOT need `allowCrossProvider`") is not reachable as originally worded when
`fgosDir` is passed: `dispatch.mjs:456-469`'s existing D6 check (`tsk-62v`)
throws for **any** `kind:'cli'` capacity that isn't registered+present,
regardless of whether it overrides `command`. Confirmed by the existing
test `test/runner/dispatch.test.mjs:850-862` (`kind:'cli', target:'agy'`,
no `command`, `fgosDir` given → throws for registration, not governance).

Fix for the new D2/D3 tests: omit `fgosDir` for tests isolating the
governance check alone — mirrors how the existing precedence tests at
`dispatch.test.mjs:797-833` already do this. Only include `fgosDir` (with
the capacityId registered+present, mirroring `dispatch.test.mjs:864-875`'s
pattern) when specifically testing the D6+D2 interaction together.

No change to D1-D4 or the chosen approach — this is a test-construction
detail, not a plan revision.

## Return blocked, then unblocked (tsk-2vd)

`fgos return`'s own re-verify initially failed for a reason unrelated to
this item's own implementation: `bin/fgos.mjs`'s disposable detached
verify worktree never provisioned `node_modules`, so `npm test` failed
with `Cannot find package 'yaml'` inside `/tmp/fgos-return-*` even though
the same suite passed cleanly in a properly-installed worktree. Root
cause, fix, and real test coverage: `tsk-2vd`
(`docs/history/tsk-2vd/`, `docs/history/worktree-dependency-provisioning/`).
Once `tsk-2vd`'s fix was committed on `fgw/tsk-2vd` (forked from this
item's own branch tip), `fgos return tsk-32n` was re-run using that
branch's own patched `bin/fgos.mjs` as the launcher (`--dir` still
pointing at the real `.fgos/` store) — a disposable, non-destructive way
to prove the fix against real state without touching the shared main
checkout or merging anything early. Verify passed cleanly.
