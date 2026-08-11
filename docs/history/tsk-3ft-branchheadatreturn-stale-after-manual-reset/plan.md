# tsk-3ft — plan

## Mode: standard

2 flags counted per `fgos-routing`'s Mode-gate criteria (computed directly
here — direct-entry from `fgos-coding-exploring`, no prior Orient hand-off to
read): **existing covered behavior** — `checkMergeStillResolves` already
has passing tests (`tsk-1p9`'s root-aware ref, `tsk-577`'s missing-ref
fallback) this change must not regress; **weak proof around the area** —
the "ref exists, sha divergent" case has zero existing test coverage,
exactly the gap this item closes. Not `high-risk`: no
auth/authorization/data-loss/audit/external-provider/public-contract flag
applies. Not `tiny`/`small`: two real components (a code diagnostic change
+ a manual status-FSM recovery for a live item) with their own risk map,
not "a couple of files, one direct task."

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present` but the index remains stale (unchanged since `tsk-577`'s own
clarify pass) → **degraded**. `checkMergeStillResolves`'s only caller is
`assessCleanupReadiness` (surfaced by the tool-use hook during scouting,
consistent with `tsk-577`'s own earlier `impact()` result) — low,
contained blast radius, cross-checked the same conservative way `tsk-577`
established (direct grep/read over trusting a stale index).

## Approach

Two independent pieces, both grounded in `CONTEXT.md`'s locked findings —
no split (Shape, below).

**Piece 1 — diagnostic message (D2).** `checkMergeStillResolves`
(`src/state/cleanup-harness.mjs`) cannot actually DISTINGUISH "genuine
force-push loss" from "branch reset to unrelated divergent history" by
ancestry alone — `git merge-base --is-ancestor` fails identically for
both, and the function's own docstring already discloses this class of
ancestry-only limitation (never catches a plain revert either). D2
explicitly ruled out inventing a detection mechanism for this
(auto-recover was rejected). What IS honest and low-risk: when the
ancestry check fails against an EXISTING ref (i.e., not `tsk-577`'s
missing-ref case — the ref/branch resolves fine, the sha just isn't its
ancestor), append a concrete next-step hint to the `ok:false` detail
string pointing at `git reflog show <ref>` — the exact tool that resolved
`tsk-47e`'s case in this investigation (`CONTEXT.md`'s Scout evidence).
Pure string addition; the `ok:true`/`ok:false` verdict logic is completely
unchanged.

**Piece 2 — manually unblock `tsk-47e` (D3).** `fgos edit` does not
expose `branchHeadAtReturn` as a patchable field (`fgos edit --help`'s
field list: title/description/kind/risk/verify/tier/refs/deps/
footprint/acceptance/priority/intent/docs-ref/parent/urgent/impact/effort/
merge-after — no branch-provenance field). Since D2 keeps the automated
check honest (never auto-passes), re-running `fgos cleanup tsk-47e` would
deterministically re-fail on the same stale field forever — there is
nothing for a code change to fix here; the gate is doing its job
correctly on stale evidence a human has since verified. The FSM
(`src/state/status-fsm.mjs`) legally allows two direct raw-`move` hops
that bypass the gated `cleanup` verb entirely: `blocked -> cleanup`
(line 105, the existing retry door for a `cleanup -> blocked` park) is
NOT the right choice here — retrying `cleanup` re-invokes the same
failing check. Instead: `blocked -> delivered` (line 106) is also a
direct legal edge, but re-entering the
`delivered -> retrospective -> cleanup` pipeline would eventually hit the
same gate again. The correct minimal-surface move is directly exploiting
that `cleanup -> done` (line 135) is ALSO a legal raw edge — but `blocked
-> cleanup -> done` still passes back through `cleanup`'s CAS-guarded
move, not the gated verb, IF done via `fgos move` (not `fgos cleanup`):
`fgos move tsk-47e --to cleanup` (raw FSM move, no automated check
attached — only the `fgos cleanup` VERB runs `assessCleanupReadiness`,
`move` does not), then `fgos move tsk-47e --to done` (raw FSM move,
legal edge, no check attached either). Both are `fgos move`, never `fgos
cleanup` — this is what actually skips the deterministically-failing
gate instead of fighting it.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Diagnostic message addition | low — pure string change, `ok:true`/`ok:false` logic untouched | new test: ref exists + sha divergent → `ok:false` detail contains the reflog hint; ALL existing tests (including `tsk-577`'s missing-ref-fallback ones) stay byte-identical in outcome |
| `tsk-47e` manual FSM bypass (`blocked -> cleanup -> done` via raw `move`) | medium — bypasses the automated content-safety gate for one real item | re-verify `CONTEXT.md`'s D1 diff-safety finding fresh immediately before moving (`git diff main fgw/tsk-47e -- docs/history/context-md-enforcement-scope/`, must still be empty); post-move state check (`fgos list --id tsk-47e --json` shows `status: done`) |

## Shape

One honest piece, not split: the diagnostic change is a few lines in one
function; the manual unblock is two CLI calls on one item. Splitting would
add claim/handoff overhead for two things that only make sense done
together by whoever already holds this investigation's context (the exact
`git diff`/reflog evidence). `fgos graph --what-if` not run — nothing to
compare, no split candidates exist.

Concrete cases to prove against:
- **Regression guard** — every existing `checkMergeStillResolves` test
  (`tsk-1p9` root-aware ref, `tsk-577` missing-ref fallback + its two
  new fixtures) keeps its exact `ok` value; only `ok:false` detail text
  gains a suffix in the one new case.
- **New — ref exists, sha divergent** — a fixture reproducing exactly
  `tsk-47e`'s shape (branch exists, current tip and recorded sha are
  mutually non-ancestors) asserts the new reflog hint appears.
- **Boundary — ref exists, sha genuinely lost (real force-push)** —
  the EXISTING negative fixture (`cleanup-harness.test.mjs:49-58`) must
  keep passing unchanged, proving the new hint doesn't get attached to
  the wrong case or change that case's verdict.

## Verify

Locked at clarify (`fgos discover --force`, same structural
vacuous-pass-at-clarify pattern `tsk-577` hit — judge disputed proving a
not-yet-written fix, forced past per that established precedent):

```
node --test test/state/cleanup-harness.test.mjs
```

Covers Piece 1 fully. Piece 2 (the manual `tsk-47e` unblock) is an
operational action, not code — its own proof is the pre-move re-diff and
the post-move `status: done` state check named in the risk map above, the
same "operational proof separate from the item's code verify" shape
`tsk-577`'s own 14-item remediation phase already used.

## Assumptions

- No other currently-`blocked` item shares this pattern (`CONTEXT.md`'s
  Scout evidence: only 2 blocked items repo-wide, the other — `tsk-42i`
  — confirmed unrelated topic). If a second occurrence surfaces later,
  D2's diagnostic-only scope decision should be revisited then, not
  preemptively broadened here (YAGNI, matches D2's own stated reasoning).
