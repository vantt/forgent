# Plan — tsk-2jg

Mode: high-risk

**Flag count (fgos-routing Mode gate): 4** — audit/security (hard-gate:
this touches the `assertPlanEvidence` evidence gate that guards the
`delivered` transition for every heavy-risk item, a governance control),
public contracts (the pull/legacy verify-only path is a documented
behavior in `src/runner/merge.mjs`'s own module doc and exercised by
CLI-level `fgos approve` tests), existing covered behavior (`test/state/
store.test.mjs`, `test/verbs/merge/approve.test.mjs`,
`test/cli/fgos-approve*.test.mjs` all exercise this code today), weak
proof around the area (no existing test covers a heavy-risk item that
reaches `delivered` via the pull-door verify-only path with no `fgw/<id>`
branch — the exact gap this bug report found live). Any one hard-gate
flag alone (audit/security here) already forces high-risk regardless of
count.

## Approach

**Chosen path.** Teach `assertPlanEvidence` (`src/state/store.mjs:621`) a
current-tree fallback: when no `fgw/<id>` branch exists for the item,
check the same two candidate paths (`work.docsRef`-resolved `plan.md`,
`docs/history/<id>/plan.md`) via `fs.existsSync(path.join(repoRoot,
candidate))` against the CURRENT working tree instead of `git cat-file -e
<branch>:<candidate>`. When a branch DOES exist, behavior is byte-for-byte
unchanged — the fallback is only ever consulted in the no-branch case, so
a genuinely `runner`-sourced item (branch exists) keeps exactly its
current git-cat-file check, unaffected.

This mirrors an existing, established precedent in this same codebase
rather than inventing a new pattern: `src/verbs/merge/approve.mjs`'s own
pull-door verify-only path (comment at lines 888-890) already re-runs the
item's verify "against the current tree" instead of a branch, precisely
because pull/legacy-sourced code is already on `main` with no branch of
its own — same justification applies to plan.md evidence.

**Why this call site and not `approve.mjs`'s pre-flight.** RESEARCH.md
round 1 (finding 3) traced the actual failure trigger: `approve.mjs`'s
own local pre-flight call to `assertPlanEvidence` (line 406) is scoped
inside `if (source === 'runner')` and never runs for a pull/legacy item at
all. The real gate that fires for a pull-door heavy item is
`store.mjs`'s own unconditional backstop in `moveWork` (`store.mjs:
881-884`, `if (to === 'delivered') { ...; assertPlanEvidence(...); }`),
which runs on every transition to `delivered` regardless of source. So
the fix has to live in `assertPlanEvidence` itself (or its unconditional
call site) — patching only `approve.mjs`'s runner-scoped pre-flight would
never touch this bug.

**Alternative rejected: reorder `classifySource`** (report's option 2 —
check `headAtTake`/`headAtReturn` before `branchExists`). Rejected for
this item, not because it is wrong in principle, but because:
1. It does not actually fix the reported failure — `assertPlanEvidence`
   never consults `classifySource` (RESEARCH.md finding 3), so reordering
   `classifySource` alone leaves a genuine pull-door heavy item exactly as
   stuck as before.
2. It carries its own untested regression risk this item's evidence does
   not cover: an item first attempted via `take`/`return` (so it carries
   `headAtTake`/`headAtReturn`), later abandoned, then genuinely
   dispatched via a real `fgw/<id>` runner branch — reordering could
   misclassify that as `'pull'` off stale markers instead of `'runner'`.
   That needs its own proof, out of scope here.
3. Fixing the chosen path removes the ONLY known trigger for this
   problem (report's "creating a compensating branch purely to satisfy
   assertPlanEvidence") — once the current-tree fallback exists, nothing
   in the documented pull-door flow ever needs to fabricate a branch, so
   `classifySource`'s ordering hazard stops being reachable from this
   bug's own reproduction path.

**Deferred, explicitly out of scope (Assumption, not a gap):**
`classifySource`'s `branchExists`-first ordering (`src/runner/merge.mjs:
236-245`) is left unchanged. It remains a latent hazard for a different,
narrower scenario (a stray/leftover branch under a pull-door item's own
`fgw/<id>` name for any unrelated reason) that this item's evidence does
not need to resolve, per point 3 above. Worth its own separately-scoped
item if it is ever observed live; not created here (this skill creates no
work items).

**Files touched, in order:**
1. `src/state/store.mjs` — `assertPlanEvidence` (the fix) AND its own
   doc comment at lines ~604-608, which currently asserts the function
   "checks the item's own `fgw/<id>` branch via `git cat-file -e`, never
   a plain `fs.existsSync`" — that sentence becomes false the moment this
   fix lands and must be corrected in the same change, or the comment
   actively misdocuments the function it sits on.
2. `test/state/store.test.mjs` — regression coverage (see Shape below).
3. `docs/history/tsk-2jg/plan.md` (this file).

No dependency ordering issue across these — a single self-contained
change, so `fgos graph --json`'s `criticalPath`/`topUnblock` (checked,
`--dir "/home/vantt/projects/forgentX"`) has nothing item-specific to
contribute for a one-piece item with no children/deps; not re-run
per-file since there is only one order that makes sense (fix, then test).

**Impact-analysis posture: degraded.** Per CLAUDE.md's capability gate,
checked before writing this proof point: `fgos tool query --capability
impact-analysis --status present` returns GitNexus, `status: present`.
But `mcp__gitnexus__list_repos` shows this repo's own index
(`/home/vantt/projects/forgentX`) is **2095 commits behind HEAD** —
stale, not fresh. Cross-check confirmed the staleness is load-bearing
here: `mcp__gitnexus__impact` on `assertPlanEvidence` (upstream, this
repo path) returned `impactedCount: 0`, contradicted directly by the
grep/read evidence in RESEARCH.md round 1 (real callers at
`store.mjs:883`, `approve.mjs:349`, `approve.mjs:406`). The blast-radius
proof point for this change rests on that direct grep/read evidence, not
on GitNexus's own impact query, which is unreliable at this staleness
level for this symbol.

## Shape

A **pass-through** item — one honest piece, no split. The fix is a
scoped, well-understood change to one function plus its doc comment, with
regression tests; nothing here calls for independently workable pieces.

**Concrete cases to prove** (`fgos-coding-validating`'s reality check, and
`test/state/store.test.mjs`):
- Heavy-risk item, no `fgw/<id>` branch, `docsRef`-resolved `plan.md`
  exists on the current working tree → `assertPlanEvidence` now passes
  (the reported bug, fixed).
- Heavy-risk item, no `fgw/<id>` branch, no `plan.md` at either candidate
  path on the current tree → still throws the same `StoreError`
  (`'precondition', ...)` — the fallback must not silently widen the gate
  for a genuinely undocumented item.
- Heavy-risk item WITH a live `fgw/<id>` branch, plan.md only on the
  branch (not on the current tree) → still passes via the existing
  git-cat-file path, unaffected by the new fallback (regression guard on
  the untouched `runner` behavior).
- Heavy-risk item WITH a live branch but NO plan.md anywhere (branch or
  current tree) → still throws (fallback never masks a genuinely missing
  plan on the runner path either, since the branch-exists case never
  reaches the new fs fallback at all).

No split, no auth/data-loss/external-provider surface beyond the
audit/security flag already named above, no concurrency concern (this is
a pure read-path check, no new write).

## Outstanding questions

None

## Reality gate (fgos-coding-validating)

- **Mode fit — PASS.** High-risk lane matches the 4-flag count above
  (one hard-gate flag, audit/security, already forces it regardless of
  count) — not over- or under-built for a change to the `delivered`
  evidence gate.
- **Repo fit — PASS.** Every file/function/line cited in RESEARCH.md
  round 1 was read directly, not assumed: `store.mjs:621-643`
  (`assertPlanEvidence`), `store.mjs:881-884` (`moveWork` backstop),
  `approve.mjs:383-406` (runner pre-flight), `approve.mjs:888-923`
  (pull/legacy path), `approve.mjs:76-101` (`moveDeliveredOrRecordFault`),
  `merge.mjs:236-245` (`classifySource`), `worktree.mjs:259-270`
  (`branchExists`, the pattern to mirror inline in `store.mjs` without a
  layering-violating import).
- **Assumptions — PASS.** Every assumption the Approach section leans on
  traces to a specific read cited above (the current-tree-verify
  precedent at `approve.mjs:888-890`; `store.mjs`'s own import list
  confirmed it imports nothing from `src/runner/*`, so the fix must
  duplicate a small `branchExists`-style check inline rather than import
  `worktree.mjs`).
- **Smaller path — PASS, none found.** Deleting the check outright for
  pull/legacy items would be smaller but dishonestly so — it removes the
  evidence requirement instead of correctly locating it; not considered a
  real alternative.
- **Proof surface — PASS.** `work.verify` (set at discovery) is a real,
  runnable command scoped to the touched modules: `node --test
  test/state/store.test.mjs test/verbs/merge/approve.test.mjs
  test/cli/fgos-approve.test.mjs`. Not a placeholder.
- **Impact-analysis posture — PASS (degraded, matches).** `fgos tool
  query --capability impact-analysis --status present` (re-checked at
  this Gate, same session) still returns GitNexus `present`;
  `mcp__gitnexus__list_repos` still shows this repo's index 2095 commits
  behind. Matches the `degraded` posture the Approach section already
  recorded — no drift between planning-time and gate-time.

No FAIL on any dimension.

## Feasibility matrix

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| `fgw/<id>` branch existence is the correct discriminator for when the current-tree fallback applies | medium (behavior change on an audit/security gate) | Confirm the fallback can only ever fire in the intended no-branch case across every real call site | `store.mjs:881-884`'s backstop always runs `assertPlanEvidence` regardless of source (this is exactly the gap being fixed); `approve.mjs:383/406`'s own pre-flight is scoped inside `if (source === 'runner')`, so a branch always exists there — the fallback path is never reachable from that call site either way | PASS |
| No third, unaccounted-for caller of `assertPlanEvidence` exists | medium (an unknown caller could hit the new fallback in an unintended context) | Exhaustive search for every call site | `rg -n "assertPlanEvidence" src/state/store.mjs` (definition + 1 call, `moveWork`) and `rg -n "assertPlanEvidence" src/verbs/merge/approve.mjs` (import + 2 calls, lines 349/406) — 3 real call sites total, all accounted for above; GitNexus's own auto-hook on the first `rg` call independently reported the same caller set | PASS |
| GitNexus's `impactedCount: 0` on `assertPlanEvidence` (upstream) is a stale-index artifact, not evidence of zero real callers | medium (if inverted, the row above's evidence base would be wrong) | Cross-check the tool's zero-result against direct source reads, per CLAUDE.md's impact-analysis gate | `mcp__gitnexus__list_repos` shows this index 2095 commits behind; direct `Read`/`rg` against the current checked-out source shows the real call sites named above — ground truth is the live source, not a stale graph | PASS |

Every row has accepted evidence (a command actually run, a file actually
read) — no plausibility language. No row is unresolved.

## Decide

**READY.**
