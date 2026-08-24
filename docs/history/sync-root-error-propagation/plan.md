# Plan: sync-root's generic fallback guard drops the real git error (tsk-3tv)

Mode: small

Flags counted against the routing gate's checklist (auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, existing covered behavior, weak proof around
the area, multi-domain): only **existing covered behavior** applies — the
touched guard already has two passing tests
(`test/cli/fgos-merge.test.mjs`, `tsk-12o` and `tsk-3df`) that must stay
green with an added assertion. No auth/data-model/security/external/
public-contract/cross-platform/multi-domain concern — the change is one
additive, optional field on an internal CLI response and a richer
friction detail string, no removed validation, no schema migration. 0-1
flags -> small: a few files, no gray areas (the design question was
already resolved during discovery — see RESEARCH.md).

## Approach

**Chosen path:** extend the existing generic fallback guard in
`src/verbs/merge/sync-root.mjs`'s `runAndReport` (the `if (result.outcome
!== 'merged')` block, today lines 147-166) to read `result.error` when
present and fold it into both the friction `detail` string and the
returned CLI response object, guarded by presence (`result.error ?  ... :
...`) since two of the outcomes this same guard also catches
(`lock-lost-mid-merge`, `merge-blocked-other-item`) never carry an
`error` field (`src/runner/merge.mjs` lines 1296 and 1495 — confirmed in
`RESEARCH.md` Round 1).

**Alternative rejected:** mirror `approve.mjs`'s dedicated
`if (result.outcome === 'merge-failed-unclassified')` branch (lines
567-583 / 744-762), with its own `errorClass: 'merge-failed-unclassified'`.
Rejected because it would fork sync-root's single uniform "unrecognized
outcome" guard into two paths for no behavioral gain, AND it would change
the `errorClass` the existing `tsk-12o` test already asserts
(`'sync-root-unhandled-outcome'`) — turning a pure bug fix into an
unforced breaking change to a passing test's contract. The item's own
suggested direction ("thread `result.error` through **in the generic
fallback branch**") already named the right shape; RESEARCH.md Round 1
confirms it against the two error-less sibling outcomes.

**Files touched, in order:**
1. `src/verbs/merge/sync-root.mjs` — the fix itself (the guard block only;
   no other function in this file changes).
2. `test/cli/fgos-merge.test.mjs` — extend the existing `tsk-12o` test
   (`merge-failed-unclassified`, ~line 1160) with an assertion that the
   friction detail and/or CLI response now carries the real git
   stderr/message; the existing `tsk-3df` test (`lock-lost-mid-merge`,
   ~line 1218) needs no change but must stay green (no `error` field on
   that outcome — proves the presence-guard, not just the happy path).

No dependency ordering concern — `fgos graph tsk-3tv --json` shows the
item has no deps and sits in its own single-item component; nothing else
in the graph blocks or is blocked by this change.

**Impact-analysis posture:** `impact-analysis: degraded` — GitNexus is
`present` (`fgos tool query --capability impact-analysis --status
present`), but no index exists for this item's own worktree, and the
nearest sibling index (`/home/vantt/projects/forgentX`, the main
checkout) is 1761 commits behind HEAD — too stale to trust for blast
radius here. Cross-checked directly instead (`grep -rln "runAndReport"`):
the only other consumer is `src/verbs/merge/merge.mjs` line 134
(`mergeNext`), which forwards the *entire* `syncResult` object through
untouched (`syncRoot: syncResult`) — an added `error` field passes
through transparently, no destructuring or shape validation anywhere
along that path to break. This matches the `light`/`bug`/`light`
classification: additive-only, single-guard, no touched consumer assumes
a fixed field set.

## Shape

The fix is a single guard block. Sketch of the concrete cases already
proven by the two existing tests (no new case class introduced):

- **`merge-failed-unclassified`** (has `result.error`): friction `detail`
  gains the real `stderr || message` (and `status` when present, mirroring
  `approve.mjs`'s own `(exit ${status}): ${stderr || message}` phrasing
  for consistency across the codebase); CLI response gains `error:
  result.error`.
- **`lock-lost-mid-merge` / `merge-blocked-other-item`** (no
  `result.error`): unchanged — same `detail` string as today, no `error`
  key on the response object (never `error: undefined` either — the key
  itself must be absent, not present-with-undefined, so a caller doing
  `'error' in response` reads correctly).

No split — this is one honest piece.

## Outstanding questions

None
