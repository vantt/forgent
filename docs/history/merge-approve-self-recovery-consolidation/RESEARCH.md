# Research log — merge-approve-self-recovery-consolidation (tsk-c5u)

## Round 1 — 2026-08-21

**Asked:** Extract the exact current self-recovery/catchup-park-recovery
logic already living in `plugins/fgOS/skills/merge-loop/SKILL.md` (per the
item's own text), the `_shared/` file pattern this new shared file should
follow, whether `plugins/fgOS/skills/_shared/catchup-self-recovery.md`
already exists, and where the item's cited "tsk-2y1-class flake diagnosis
verified-not-blind evidence bar" lives.

**Checked / Found:**

1. **The self-recovery playbooks do NOT live in `merge-loop/SKILL.md`
   itself.** `plugins/fgOS/skills/merge-loop/SKILL.md` (140 lines, the real
   file, not a generated wrapper) only Step-4-dispatches into a reference
   file: `plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md`
   (281 lines). That reference file is where the actual content lives:
   - The "rules every playbook obeys" section (`blocked-pick-decision-tree.md:62-105`):
     once-per-id-per-run cap (`:64-69`), the `fgos decision --id <id> --text
     ... --rationale ... --relation none` pre-action audit-trail requirement
     (`:70-79`), and the shared `fgos catchup <id>` outcome-reading rule
     (`:83-101`, four outcomes: `merged`/`already-caught-up` green,
     `conflict` fail, `verify-fail timedOut:true` fail, `verify-fail
     timedOut:false` fail).
   - Five named playbooks, one per block reason
     (`blocked-pick-decision-tree.md:107-252`): `verify-fail-post-merge`
     (`:113-148`, walks `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`:
     isolate-rerun the failing test file, check whether it's inside the
     item's own diff, full-suite rerun to tell flake from real bug, fix a
     genuine pre-existing bug on `main` as its own commit if found, retry
     once via `fgos move <id> --to awaiting-approval`), `verify-timeout-post-merge`
     (`:150-175`, one `fgos catchup <id> --timeout <2x the timed-out
     budget>`, never touches `.fgos/config.json`'s default timeout),
     `integration-drift` (`:177-202`, roots only, one `fgos catchup <id>`),
     `merge-failed-unclassified` (`:204-227`, checks stderr for a
     non-retryable condition first, else one `fgos catchup <id>`),
     `merge-conflict` (`:229-252`, one `fgos catchup <id>` per
     `docs/how-to/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md`).
   - Two escalate-only carve-outs that must run BEFORE any playbook
     (`:9-60`): Iron Law holds, and a root with an open descendant — the
     new shared file needs to preserve this ordering, not just the playbook
     table, or a consuming skill could run a playbook where the source
     never would have.
   - The same-id-twice stop rule for reasons with no playbook
     (`:254-281`) — applies today to `fgos-write-rejected` and plain
     `verify-fail` (no playbook exists for either).

2. **`plugins/fgOS/skills/_shared/catchup-self-recovery.md` does not exist
   yet** (`ls plugins/fgOS/skills/_shared/` — only `citation-format.md`,
   `coding-worker-contract.md`, `executor-dispatch-fallback.md`,
   `fgos-cli-fallback.md`). This item's own extraction has not been started.

3. **The `_shared/` pattern convention** (`_shared/fgos-cli-fallback.md`,
   `_shared/executor-dispatch-fallback.md`): a short header naming what was
   extracted from where and why (DRY rationale, cites the originating
   tsk-id), then "point at this file from a consumer SKILL.md by relative
   path (`../_shared/<file>.md`)" with named placeholder parameters
   (`<VERB-CMD>`, `<EXECUTOR_ID>`, etc.) the consumer fills in. `.agents/skills/_shared/`
   is the canonical source; `plugins/fgOS/skills/_shared/` is a
   byte-identical mirror (`diff` confirmed identical for
   `executor-dispatch-fallback.md`) — same two-location mirroring the
   project's own `CLAUDE.md` documents for `executor-dispatch-fallback.md`
   ("mirrored byte-identical at `.agents/skills/_shared/`"). The new file
   needs the same two-location write.

4. **tsk-38w's fix is a DIFFERENT topic, not the same content to
   consolidate.** Read `.agents/skills/_shared/executor-dispatch-fallback.md:118-131`
   (Step B): tsk-38w's patch is about the worktree-isolation guard refusing
   a compound out-of-process-dispatch shell line and falling back to
   `scripts/write-wrapper-script.mjs`. That is unrelated to the
   merge/approve CATCHUP_REASONS park-recovery logic this item's shared
   file is meant to hold. The item's own description groups tsk-60h,
   tsk-4xq, and tsk-38w together only as three EXAMPLES of the same *root
   cause pattern* (no shared reference for self-recovery logic → each item
   patches one file) — not as three patches that all belong in the same
   new shared file. Scoping the new `catchup-self-recovery.md` to only the
   merge/approve CATCHUP_REASONS content (found in point 1 above) matches
   the item's own acceptance criterion (re-driving a verify-fail-post-merge
   park through `/fgOS:approve`); pulling tsk-38w's unrelated worktree-guard
   fallback into the same file would not.

5. **`plugins/fgOS/skills/approve/SKILL.md` confirmed matches the item's
   description**, modulo a small line-number drift (the item cites
   157-158; current file has the same two table rows at `:163-164`,
   effectively identical content — "report; ... not an obstacle to retry
   past" for the `merge-conflict` and `verify-fail`/`verify-timeout` park
   rows). The Red Flag the item cites is at `:221` today ("retrying a park
   (`verify-fail`, `merge-conflict`) as if it were a mechanical error"),
   not 215. No park-recovery table beyond these two rows exists in
   `approve/SKILL.md` — it currently treats every park (including
   `merge-conflict`, which `merge-loop` already knows how to self-recover)
   as a flat "report and stop," confirming the gap.

6. **`plugins/fgOS/skills/merge-next/SKILL.md` (119 lines) has a narrower,
   real gap of its own**, not just an absence: it already tells the person
   that a `merge-conflict` park is "recoverable" and names `fgos catchup
   <id>` as the recovery verb (`:69-71`) — but only for `merge-conflict`.
   It never mentions this for `verify-fail`/`verify-timeout`/
   `integration-drift`/`merge-failed-unclassified`, and it never
   self-runs any playbook itself (that orchestration today only exists one
   layer up, in `merge-loop`'s reference file). Pointing `merge-next` at
   the new shared file should at minimum extend its "recoverable, here's
   the verb" messaging to the other four reasons, consistent with what
   `merge-loop` already knows.

7. **"tsk-2y1-class flake diagnosis" and the literal phrase
   "verified-not-blind" do not exist anywhere in this repo** — `grep -rn
   "tsk-2y1"` and `grep -rn "verified-not-blind"` across
   `**/*.md` (repo + git history via `git log --all --oneline`) both came
   back empty. The closest real match for what the item is pointing at is
   already-documented content, not a missing citation: the
   `verify-fail-post-merge` playbook's own steps 1-4 above (isolate-rerun
   the failing test, full-suite rerun, diff-overlap check, fix-on-main only
   if reproducible) already encode exactly the "verified, not blind" bar
   the item describes. `tsk-2y1` itself is very likely a
   miscite/mistyped id — this item description was probably assembled by
   an agent summarizing a related historical case (the same evidence bar
   shape — isolated rerun + full-suite rerun + diff-overlap check —
   appears in a private memory note about an unrelated item, `tsk-4hb`,
   not `tsk-2y1`) and no code in this repo needs to change on account of
   that citation; the shared file just needs to state the bar itself
   (already correctly captured by the existing `verify-fail-post-merge`
   playbook text), not chase a nonexistent source.

**Still open:** none for this round — every named unknown resolved to a
concrete, cited answer. The remaining unknowns for the item itself are
scope/shape decisions (how literally to split
`blocked-pick-decision-tree.md`'s content vs. write a condensed version in
the new shared file, and the exact param-substitution shape each of the
three consuming files needs) — those are for `planning`, not `discovery`.
