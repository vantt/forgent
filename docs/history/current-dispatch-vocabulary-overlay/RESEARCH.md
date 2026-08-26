# RESEARCH — current-dispatch-vocabulary-overlay (tsk-4he)

## Round 1 — 2026-08-26T08:03:07Z

**Asked:** Are the listed current terms (work, child work, executor,
capability, launcher, driver, orchestrator, DispatchPlan,
DispatchAssignment) actually the real, currently-used dispatch vocabulary
in this repo's docs/code today? Where does each live, what old term (if
any) does it supersede, and is there already a "current vocabulary"
structure this task should extend instead of duplicating?

**Checked (repo search, `rg`):**

- `child work` / `childWork` — hits: `docs/specs/runner.md`,
  `docs/architect/dispatch-control-plane-redesign.md`,
  `src/state/cleanup-harness.mjs`, `src/state/work.mjs`.
- `\bexecutor\b` — hits across `docs/specs/runner.md`,
  `docs/architect/dispatch-control-plane-redesign.md`, and 10+ files under
  `src/runner/dispatch/*.mjs`, `src/runner/loop.mjs`,
  `src/state/tool-registry.mjs`, `src/state/worker-slots.mjs`,
  `src/runner/attestation-guard.mjs`, `src/runner/goal-check.mjs`,
  `src/runner/recovery.mjs`, `src/state/work.mjs`.
- `\bcapability\b` — hits in both target docs plus `src/state/store.mjs`,
  `src/state/tool-registry.mjs`, `src/runner/dispatch/{plan,resolve,
  mechanism,cli,config}.mjs`.
- `\blauncher\b` — hits in both target docs plus `src/runner/worker-log.mjs`,
  `src/runner/loop.mjs`, `src/state/worker-slots.mjs`,
  `src/runner/dispatch/{plan,transport}.mjs`.
- `\bdriver\b` — hits in both target docs plus `src/runner/session.mjs`,
  `src/runner/merge.mjs`, `src/state/frontier.mjs`, `src/runner/loop.mjs`,
  `src/state/replay.mjs`, `src/state/cleanup-harness.mjs`,
  `src/runner/dispatch/plan.mjs`.
- `\borchestrator\b` — hits in `docs/specs/runner.md`,
  `src/runner/loop.mjs`, `src/runner/dispatch/mechanism.mjs`,
  `src/state/worker-slots.mjs`. NOT present in
  `docs/architect/dispatch-control-plane-redesign.md`'s own vocabulary
  section (§5.1) — a real gap in that doc's list.
- `DispatchPlan` / `DispatchAssignment` — hits in
  `src/runner/dispatch.mjs`, `src/runner/dispatch/{cli,plan,resolve}.mjs`,
  and `docs/architect/dispatch-control-plane-redesign.md` (§6, §8). **Not
  present anywhere in `docs/specs/runner.md`** (`rg` exit 1, zero hits) —
  these are architecture-doc/code concepts runner.md's own vocabulary
  section does not yet reference at all.
- `rootTask|subTask` in scope paths (`docs/specs`, `docs/architect`,
  `src/runner`, `src/state`) — 33 hits total, files:
  `docs/specs/runner.md`, `docs/architect/dispatch-control-plane-
  redesign.md`, `src/state/worker-slots.mjs`,
  `src/runner/dispatch/mechanism.mjs`. The two code-file hits
  (`src/state/worker-slots.mjs:7-8`, `src/runner/dispatch/
  mechanism.mjs:19,24`) are **comment-only prose**, not identifiers —
  confirmed by direct read, e.g. `mechanism.mjs:19: * executor, or a live
  session's own direct subTask/Task-tool call`. No live `rootTask`/
  `subTask` identifier exists in code — the acceptance criterion
  ("rootTask/subTask/capacity còn lại chỉ ở historical/quoted/superseded
  context") is achievable without any code-behavior change, matching the
  item's own "docs only" scope even though the verify `rg` also scans
  `src/runner`/`src/state`.
- `capacity`/`capacities.<id>` in `docs/specs/runner.md` — **not purely
  historical today**: lines 1734/1738/1750/1766/1768/1791/1802/1820/1822/
  1844/1859/1864-1865 use `capacity`/`capacities.<id>` in live prose
  (§0029's own redefinition — "capacity KHÁC bản chất với subTask", a
  distinct, still-current concept, not a retired one). Cross-checked the
  actual current code field name: `src/runner/dispatch/{resolve,
  config}.mjs` use `capabilities.<name>` (e.g. `resolve.mjs:231`,
  `config.mjs:818`), **not** `capacities.<id>`. So `docs/specs/runner.md`'s
  own prose is stale against the literal config key it describes — a real
  drift the vocabulary overlay should fix (rename the config-key mentions
  to `capabilities.<id>`, while keeping `capacity` as the still-valid
  concept-word if the overlay chooses to keep using it, or note that the
  concept-word itself has effectively become `capability` to match
  `dispatch-control-plane-redesign.md`'s §5.1 vocabulary — this exact
  concept-word choice is the one open call for the driving/planning stage
  to make, not a research gap).
- Existing "current vocabulary" structures already in the repo (so this
  task extends rather than duplicates):
  - `docs/specs/runner.md:2172-2180` — a 2×2 grid (`launcher`/`driver`/
    `orchestrator`) titled "Từ vựng sau record này", but it sits **inside**
    the historical `### 0031` record (which itself lives inside `##
    Lịch sử quyết định retired từ docs/decisions/` starting line 1117) —
    i.e. buried in the historical section, not near the front, and missing
    `work`/`child work`/`executor`/`capability`/`DispatchPlan`/
    `DispatchAssignment` entirely.
  - `docs/architect/dispatch-control-plane-redesign.md:117-141` — `## 5.
    Vocabulary` already lists `launcher`, `driver`, `work`, `child work`,
    `capability`, `executor`, `ad-hoc task`/`exec packet`, and explicitly
    states "The old `rootTask`/`subTask` vocabulary is not part of the
    current dispatch model" (line 129). This section is already close to
    what the task description asks for, but omits `orchestrator` entirely
    and does not cross-reference the ADR chain (0026/0028/0029/0031) that
    `runner.md`'s historical section carries.
  - `docs/specs/runner.md:1117` — `## Lịch sử quyết định retired từ
    docs/decisions/ (tsk-1lv-4)` is the historical section start; a new
    "current vocabulary" section placed anywhere before line 1117 (e.g.
    right after `## Data Dictionary`, or as its own new `##` section just
    before the historical one) satisfies the task's own instruction to put
    "supersede/current terms trước phần historical".

**Findings not yet a person-decision, all mechanically resolvable:**
1. `docs/specs/runner.md` needs a NEW top-level vocabulary section (before
   line 1117) covering the full current set: `work`, `child work`,
   `executor`, `capability`(/`capacity` — see drift note above),
   `launcher`, `driver`, `orchestrator` (T0 layer, per the existing 2×2
   grid at 2172-2180, which this new section can absorb/point back to
   rather than duplicate), `DispatchPlan`, `DispatchAssignment` — each
   with a column for the old/superseded term (`rootTask`→removed,
   `subTask`→removed, old `orchestrator` meaning→renamed `launcher` by
   ADR0028).
2. `docs/architect/dispatch-control-plane-redesign.md`'s §5.1 should gain
   an `orchestrator` row (T0/N-unit/stays) and, if useful, a one-line
   cross-reference to the ADR chain runner.md's historical section already
   carries, so a reader lands on one consistent story from either doc.
3. `docs/specs/runner.md`'s stale `capacities.<id>` prose (vs. the real
   `capabilities.<name>` code field) should be corrected as part of this
   same pass — it is a factual drift, not a design choice.

**Still open (for `fgos-coding-planning`, not a discovery blocker):**
concept-word choice between keeping `capacity` (item's own concept, "a
functional/helper unit") as a distinct row vs. treating it as fully
superseded by `capability` — evidence above supports either; picking one
is an ordinary planning-stage shape decision, not a fact this research can
settle, and does not block a `clear` verdict here.

**Verdict:** `clear`. Verify (real, runnable, matches the item's own
acceptance-check intent):

```bash
rg -n "rootTask|subTask|capacity|orchestrator" docs/specs docs/architect src/runner src/state
```
