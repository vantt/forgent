# tsk-2l0 — fgos-coding-implement's Iron Law check must run after commit, not before

## Feature boundary

`fgos-coding-implement`'s step 4 (`.claude/skills/fgos-coding-implement/SKILL.md`)
computes `classifyIronLaw({filesChanged, description})` using
`changedFiles()` (`src/runner/merge.mjs`), which diffs `trunk...branch` —
committed history only. The skill's own numbered flow (1 Orient, 2
Implement, 3 Verify, 4 Iron Law check, 5 Return) never states where a
`git add`/`git commit` must happen relative to step 4, and nothing in step
2/3's own text says "commit now" either — so a session naturally reading
straight down the numbered list runs step 4 immediately after step 3
(Verify), before ever committing the real diff. `changedFiles` then sees
only whatever was already committed on the branch (typically just
`plan.md`/`CONTEXT.md` from earlier `decompose`-stage commits), returns an
empty or wrong file set, and `classifyIronLaw` comes back
`{required:false}` even when the real diff would trip the gate.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix is doc-only: reorder `fgos-coding-implement`'s step 4 text so it explicitly instructs committing the implementation (and the verify-passing test) FIRST, then running `classifyIronLaw` against the real committed diff. No change to `src/runner/merge.mjs`'s `changedFiles` (a pure `trunk...branch` git-ref diff is correct and DELIBERATE — see D2) and no change to `bin/fgos.mjs`'s `approve`/`sync-root` gates. |
| D2 | Rejected alternative: making `changedFiles`/the skill's check working-tree-inclusive (so ordering wouldn't matter) is wrong, not just unnecessary — `docs/explanation/iron-law-evidence-contract-stays-human-gated.md` (tsk-5t3 D2) already locked that the evidence-collection trigger MUST reuse the exact same classifier/diff shape `approve` itself checks at merge time ("the trigger can never drift out of sync with what approve actually checks"), specifically rejecting an "early-prediction heuristic." `approve`/`sync-root` only ever see committed refs (confirmed below) — so the skill's own check must match that, not diverge from it by including uncommitted content. |
| D3 | Rejected alternative (the item's own "and/or" second option — approve-time gate mechanically verifying `iron-law-evidence.md` exists, not just trusting the bare `--acknowledge-iron-law` flag): out of scope for this item. `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`'s own D1/D4 (tsk-5t3, already merged) explicitly locked that `approve`'s refusal/gate logic stays byte-for-byte unchanged — "the hard gate's own behavior can't be weakened OR strengthened by an 'improvement' aimed at ergonomics"; evidence display/gathering is the skill/chat layer's job, never the engine's. Reopening that boundary would need new evidence this item doesn't have, not a restatement of the same ergonomics concern tsk-5t3 already weighed. |
| D4 | No engine-side redundancy exists to fall back on: `classifyIronLaw`'s only 2 real call sites in `bin/fgos.mjs` are inside `approve` (line 2689) and `sync-root` (line 3087) — never inside `return`. So a session that runs the skill's own step-4 check too early doesn't corrupt anything permanently (the real `approve`/`sync-root` gate still re-derives the correct answer from the real committed diff later), but it DOES silently skip writing `iron-law-evidence.md` at the right time — exactly the "scramble to retroactively produce evidence" cost this item's description names, independently reproduced by this session on `tsk-1ne` (see Scout evidence). |

## Pinned terms

None beyond what's already established (`classifyIronLaw`, `changedFiles`,
`iron-law-evidence.md` are all existing, correctly-named concepts this item
does not redefine).

## Scout evidence

- `.claude/skills/fgos-coding-implement/SKILL.md` steps 1-5: confirmed no
  step instructs a commit between step 2 (Implement) and step 4 (Iron Law
  check); step 4's own example snippet runs `classifyIronLaw` immediately,
  with no preceding `git add`/`git commit`.
- `src/runner/merge.mjs:316-330` (`changedFiles`) — `git diff --name-only
  ${trunk}...${branch}`, a pure committed-ref diff; returns `[]` outright
  when `classifySource` doesn't resolve to `'runner'` (i.e., no
  `fgw/<id>` branch exists yet — not this item's failure mode, since a
  worktree-backed session's branch always exists by the time step 4 runs).
- `bin/fgos.mjs`: `grep -rn "classifyIronLaw"` found exactly 2 real call
  sites (lines 2689, 3087), both inside `approve`/`sync-root` case blocks
  — GitNexus's own MCP `impact` tool initially reported only 1 hit (the
  test file), missing both real call sites; cross-checked via direct grep
  per `CLAUDE.md`'s impact-analysis gate note ("a suspicious... answer...
  is worth a quick grep/rg cross-check"), confirming the index is stale
  (also independently flagged by this session's own tool-use hooks: "last
  indexed 251d0b5"). `impact-analysis: degraded` for this reason.
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
  (tsk-5t3 D1-D4, already merged) — read in full; D2 and D4 directly
  resolve this item's own "and/or" fix-direction fork (see D2/D3 above).
- **Directly reproduced live**, not just cited from the item's own
  description: this session ran `fgos-coding-implement` on `tsk-1ne`
  immediately prior to claiming this item, hit the exact false negative
  (`classifyIronLaw` returned `{"required":false}` before commit, `{"required":true,"matchedModules":["src/state/store.mjs"]}` after — same
  session, same repo, same day), and had to reconstruct
  failing-before/passing-after evidence retroactively — the exact cost
  this item's description predicts (`docs/history/
  tsk-1ne-editwork-scoped-validation/iron-law-evidence.md`).

## Canonical references

- `.claude/skills/fgos-coding-implement/SKILL.md`
- `src/runner/merge.mjs` (`changedFiles`, `classifySource`)
- `src/evolve/iron-law.mjs` (`classifyIronLaw`)
- `bin/fgos.mjs` (`approve`, `sync-root` cases)
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md`
  (tsk-5t3)
- `docs/history/tsk-1ne-editwork-scoped-validation/iron-law-evidence.md`
  (this session's own live reproduction)

## Outstanding questions deferred to planning

- Exact wording/step-numbering of the reordered instruction (whether step
  4 grows a leading "commit first" clause, or a new step is inserted
  between 3 and 4, renumbering the rest) — a documentation-editing detail,
  `fgos-coding-planning`'s call, not a product decision.
