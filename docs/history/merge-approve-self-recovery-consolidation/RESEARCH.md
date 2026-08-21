# Research — merge-approve-self-recovery-consolidation

Two items independently researched and implemented overlapping scope in
this same feature directory (coincidental — both picked the same feature
slug for the same underlying problem): **tsk-6av** ("consolidate merge
self-recovery into approve; make merge-next/merge-loop thin callers") and
**tsk-c5u** ("consolidate merge/approve catchup self-recovery logic into
shared reference"). Both rounds below are kept, in the order they
happened; tsk-6av's branch is the one that reconciles the two into a
single landed result — see `plan.md`'s own reconciliation note.

## Round 1 (tsk-6av) — 2026-08-20 — discovery stage

**Asked:** does `plugins/fgOS/skills/approve/SKILL.md` already have any
self-recovery hooks for a merge-conflict/verify-fail/verify-timeout park,
what's the cleanest insertion point, and is `fgos catchup <id>`'s CLI
contract stable enough to build a shared reference around?

**Checked:**
- `plugins/fgOS/skills/approve/SKILL.md` (read in full, 225 lines).
- `plugins/fgOS/skills/merge-loop/SKILL.md` + `references/blocked-pick-decision-tree.md`.
- `plugins/fgOS/skills/merge-next/SKILL.md`.
- `src/verbs/merge/approve.mjs:469-520` (engine layer).
- `src/verbs/merge/catchup.mjs` (the `fgos catchup <id>` use case).
- `fgos show tsk-c5u` — the open dependency item.

**Found:**

1. `approve/SKILL.md`'s own step 7 table explicitly marks the exact three
   park reasons this item cares about as non-mechanical, i.e. "report and
   stop, let a human decide" (lines 163-164):
   - `merge-conflict` park → "no | report; `fgos catchup <id>` is the
     recovery verb a person can choose next"
   - `verify-fail` / `verify-timeout` park → "no | report the verb's own
     `output` field; a red verify is evidence, not an obstacle to retry
     past"
   Its own Red flags section (line 221) reinforces this: "retrying a park
   (`verify-fail`, `merge-conflict`) as if it were a mechanical error" is
   listed as a thing NOT to do. This is the literal opposite of
   `merge-loop`'s own stance for the identical three reasons.

2. `merge-loop/SKILL.md` + `references/blocked-pick-decision-tree.md`
   already contain a complete, working self-recovery decision tree for
   exactly these reasons — named playbooks `verify-fail-post-merge`,
   `verify-timeout-post-merge`, `integration-drift` (which covers
   merge-conflict for a root with children), each ending in one
   `fgos catchup <id>` call (or a diagnose-then-retry-once sequence for
   verify-fail), capped once-per-id-per-run, logged via `fgos decision`
   first. This logic is real and already proven — it's just unreachable
   from `approve/SKILL.md`, and only reachable from `merge-next` when a
   session is manually driving `/fgOS:merge-loop`'s own prose correctly
   turn by turn.

3. The engine (`approve.mjs:469-520`, tsk-4ax D3) already runs ONE
   `performCatchUp` attempt automatically, but only to catch the item's
   branch up to a drifted TARGET before landing — never as a retry after a
   failure. On conflict or verify-fail, it parks `blocked` immediately with
   no further automatic attempt. So today's actual self-recovery gap is
   entirely at the skill-prose (agent) layer, not the engine layer — the
   engine already exposes the exact primitive (`fgos catchup <id>`) the
   prose-level playbooks need.

4. `fgos catchup <id>` (`src/verbs/merge/catchup.mjs:52`) contract is
   stable and already documented precisely by
   `merge-loop/references/blocked-pick-decision-tree.md`'s own "Reading
   `fgos catchup <id>`'s outcome" section: requires `status: "blocked"`,
   only resolves a merge-related park reason
   (`merge-conflict`/`verify-fail-post-merge`/`verify-timeout-post-merge`/
   `integration-drift`/`merge-failed-unclassified`, or a cleanup-harness
   merge-ancestry park), returns
   `outcome: "merged"|"already-caught-up"|"conflict"|"verify-fail"` (the
   last with `timedOut`, `exitStatus`, `output`, `conflictedFiles` as
   applicable). Good primitive to build a shared reference around —
   nothing new needed there.

5. `merge-next/SKILL.md` already delegates the actual attempt to `approve`
   ("merges it via the existing approve/CTR005 gate") and explicitly
   defers self-recovery to `merge-loop` ("This single-shot skill does not
   run that playbook itself"). Once the playbook lives inside `approve`
   instead, `merge-next` needs zero changes to inherit it — it already
   calls `approve` for every attempt.

6. `tsk-c5u` (open dependency at the time) names this exact propagation
   gap in its own description and proposes the same fix shape this item
   scoped: extract the self-recovery decision logic into one new shared
   file (e.g. `plugins/fgOS/skills/_shared/catchup-self-recovery.md`,
   mirroring the existing `_shared/fgos-cli-fallback.md` /
   `_shared/executor-dispatch-fallback.md` pattern), then point
   `approve/SKILL.md`, `merge-loop/SKILL.md`, and `merge-next/SKILL.md` at
   it. tsk-6av refines *where the ownership lives*: `approve` is the
   primary caller (it's the layer that actually attempts a merge and can
   hit these three park reasons), `merge-next`/`merge-loop` inherit for
   free through their existing call chain rather than needing their own
   copy or their own explicit reference to the shared file.

**Still open (for planning, not discovery):** exact wording/structure of
the new shared reference file; whether `merge-loop/SKILL.md`'s own Step 4
decision tree and `references/blocked-pick-decision-tree.md` get retired
entirely or trimmed down to only the "no playbook, no-progress" and
Iron-Law/ungathered-root carve-outs once `approve` returns an
already-self-recovered final result; whether `sync-root`'s own inbound
catchup gate (`src/verbs/merge/sync-root.mjs:199-236`, same conflict/
verify-fail shape) needs the same skill-prose treatment as `approve`'s.

**Verdict:** clear. The scope, insertion point, and primitive are all
concretely grounded in evidence above; nothing here is a product/scope
gray area that needs a person before planning can start.

## Round 1 (tsk-c5u) — 2026-08-21

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

## Round 2 (tsk-6av) — 2026-08-21 — reconciling with tsk-c5u after both landed independently

**What happened:** tsk-c5u implemented and merged to `main`
(`e92cfe66`) while tsk-6av's own branch was already sitting at
`awaiting-approval`, unmerged. Both created
`plugins/fgOS/skills/_shared/catchup-self-recovery.md` (and its two
mirrors) and edited the same three consuming files, but with a real
architectural difference, not just wording drift:

- **tsk-c5u's landed version** kept `approve/SKILL.md` step 7's
  `merge-conflict`/`verify-fail`/`verify-timeout` rows as `Mechanical? no`
  — it only centralized the playbook *prose* into one shared file, so a
  person or `merge-loop` driving recovery manually has one place to read
  instead of three. `merge-next/SKILL.md`'s landed text still says "This
  single-shot skill does not run that playbook itself:
  `/fgOS:merge-loop` owns it" — unchanged from before tsk-6av ever
  touched it.
- **tsk-6av's own branch** flips those same rows to `Mechanical? yes`
  — `approve` runs the shared playbook itself, inline, before ever
  reporting a park — which is the actual behavior change the original
  submission asked for (merge-next/merge-loop being passive when they
  have the capability to self-recover) and the architecture confirmed
  with the person before this item was even submitted (see `plan.md`'s
  own Approach section, decided 2026-08-20).

**Reconciliation applied** (see `plan.md`'s own reconciliation note for
the file-by-file resolution): keep tsk-c5u's more detailed shared-file
prose (the `CATCHUP_REASONS` enumeration, the "verified-not-blind
evidence bar" line, `merge-failed-unclassified` playbook it added) as the
base — it is strictly more complete than tsk-6av's own first draft — but
apply tsk-6av's own behavioral fix on top: `approve/SKILL.md`'s three
rows go back to `Mechanical? yes`, `merge-next/SKILL.md`'s stale
"merge-loop owns it" claim is removed again, and the shared file's own
"once per id per loop run" ceiling language (written assuming only a
loop-shaped caller) is widened to name `approve`'s own two-retries
ceiling as the governing cap when `approve` is the one calling it
directly — a caller-shape gap neither original version had actually
covered, found and fixed only while reconciling.
