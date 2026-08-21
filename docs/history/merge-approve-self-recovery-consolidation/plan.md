# Plan — merge-approve-self-recovery-consolidation (tsk-c5u)

Mode: small

**Lane derivation (fgos-routing Mode gate, applied directly — this session
entered via `/fgOS:pick`, never through `fgos-routing`'s own Orient, so no
lane was handed off in prose; no prior `plan.md` round exists either):**
flags checked — auth (no), authorization (no), data model (no), audit/
security (no — this consolidates existing audit-trail *prose*, it adds no
new audit/security behavior), external systems (no), public contracts (no
— skill files are agent-read prose, not a schema/CLI/FSM contract; no
engine verb, flag, or event shape changes), cross-platform (no), existing
covered behavior (**yes** — changes how `approve`/`merge-next` handle a
live park in the real merge flow), weak proof around the area (no — the
target logic, `blocked-pick-decision-tree.md`'s playbooks, is already a
mature, precedent-tested pattern being relocated, not invented), multi-domain
(no — everything touched lives under `plugins/fgOS/skills/**` / mirrored
`.agents/skills/**`, one governance area). 1 flag → **small**: a few files
(4: 1 new shared file + 3 consumer skill files), no gray areas remaining —
`RESEARCH.md`'s Round 1 already resolved every open question discovery
found.

CONTEXT.md: none — discovery verdict was `clear` (see `fgos decision`
entries on the item, 2026-08-21T02:55:57Z), which skips `exploring` and
therefore never produces a CONTEXT.md. Every claim below traces to
`RESEARCH.md`'s Round 1 or to a direct read cited inline.

## Approach

**Chosen path.** Extract the self-recovery decision logic that already
lives in `plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md`
(RESEARCH.md point 1 — NOT `merge-loop/SKILL.md` itself, which only
Step-4-dispatches into that reference file) into one new shared file,
`plugins/fgOS/skills/_shared/catchup-self-recovery.md`, mirrored
byte-identical at `.agents/skills/_shared/catchup-self-recovery.md` — the
same two-location convention `executor-dispatch-fallback.md` and
`fgos-cli-fallback.md` already use (RESEARCH.md point 3). Then point three
consumers at it:

1. `plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md`
   — replace the playbook bodies it currently owns inline with a pointer to
   the shared file (keep the two escalate-only carve-outs and the
   same-id-twice rule local to this file, since they are `merge-loop`'s own
   sequencing behavior, not shared park-recovery content per RESEARCH.md
   point 1).
2. `plugins/fgOS/skills/approve/SKILL.md` — the real gap this item exists
   to close (RESEARCH.md point 5): today its park-recovery table
   (`:163-164`) flatly reports `merge-conflict` and `verify-fail`/
   `verify-timeout` parks as "not an obstacle to retry past," and its Red
   Flags (`:221`) forbid retrying either. Add a row (or short branch) that
   points at the shared file's `verify-fail-post-merge` recovery for a
   *verified* flake, and update the Red Flag so it forbids retrying
   *without* meeting the shared file's evidence bar rather than forbidding
   retry outright — matching the item's own acceptance criterion.
3. `plugins/fgOS/skills/merge-next/SKILL.md` — extend its existing
   "`merge-conflict` is recoverable, here's the verb" messaging (`:69-71`,
   RESEARCH.md point 6) to name the shared file for the other four
   reasons too, so a person reading a single-item `merge-next` block sees
   the same recovery options a `merge-loop` run already applies.

**Alternatives rejected.** (a) Also folding tsk-38w's worktree-isolation
guard fallback (`.agents/skills/_shared/executor-dispatch-fallback.md`
Step B) into the same shared file — rejected: RESEARCH.md point 4 confirms
that is a different topic (dispatch-guard fallback, not merge/approve park
recovery); merging it would make the new file's scope incoherent against
the item's own acceptance test. (b) Chasing down "tsk-2y1" as a literal
citation to extract the evidence bar from — rejected: RESEARCH.md point 7
confirms that id does not exist anywhere in this repo; the evidence bar it
names is already fully specified in the existing `verify-fail-post-merge`
playbook (isolate-rerun the failing test, check diff-overlap, full-suite
rerun, fix-on-main only if reproducible, retry once) — write that content
directly rather than search further for a source that isn't there.

**Risk map.**

| Component | How risky | Proof point |
|---|---|---|
| New shared file drifts from what `merge-loop` actually does today | light | POSITIVE verify greps confirm the shared file exists and every consumer references it; the file is a relocation of already-working prose, not new logic |
| `approve/SKILL.md`'s new self-recovery branch retries a real (non-flake) failure instead of reporting it | standard | the shared file's own evidence bar (isolate-rerun + diff-overlap + full-suite-rerun, lifted verbatim from `verify-fail-post-merge`) is the existing, already-battle-tested gate `merge-loop` uses today — no new gate logic invented, so this is a proof-by-precedent, not a proof-by-new-test |
| Losing the two escalate-only carve-outs (Iron Law, ungathered root) when trimming `blocked-pick-decision-tree.md` | standard | Approach above explicitly keeps them local, not moved — `fgos-coding-validating`'s reality check re-reads the trimmed file to confirm both carve-outs are still intact verbatim |

Impact-analysis posture: `full` (GitNexus present, `fgos tool query
--capability impact-analysis --status present` returned one provider).
Not load-bearing here — every file this item touches is agent-read skill
prose (`.md`), not indexed source; GitNexus's code-graph blast radius has
no symbols to walk for these paths, so no proof point above leans on it.

**Files likely touched, in order** (no `fgos graph --json` critical-path
signal applies — this item has no deps, no children, and is a single
pass-through piece, so there is nothing to sequence across items; ordering
below is intra-item only):

1. `plugins/fgOS/skills/_shared/catchup-self-recovery.md` (new) — write
   first; everything else only points at it.
2. `.agents/skills/_shared/catchup-self-recovery.md` (new, mirror) —
   byte-identical copy of (1).
3. `plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md`
   — trim to point at the shared file.
4. `plugins/fgOS/skills/approve/SKILL.md` — add the recovery branch.
5. `plugins/fgOS/skills/merge-next/SKILL.md` — extend the messaging.

## Shape

One honest piece — see "No split" below. The concrete cases the shared
file (and its consumers) need to keep covering, all already proven
individually in `blocked-pick-decision-tree.md` today and only being
relocated, not reinvented:

- the once-per-id-per-run cap (empty/repeat-boundary case: a second block
  on the same id in the same run must stop, never retry twice)
- existing covered behavior that must not regress: `merge-loop`'s own five
  named playbooks (`verify-fail-post-merge`, `verify-timeout-post-merge`,
  `integration-drift`, `merge-failed-unclassified`, `merge-conflict`) keep
  behaving identically after the trim — this is a pure extraction, not a
  behavior change to `merge-loop` itself
- partial failure: a `catchup` call that itself errors (not a reported
  outcome) still stops-and-reports verbatim, never retried
- the new case this item actually adds: `approve/SKILL.md` gains the
  ability to self-recover a `verify-fail-post-merge` park for a *verified*
  flake, where today it always reports-and-stops

## No split

This is one honest piece — a single DRY extraction plus three pointer
updates, all mechanically dependent on the shared file existing first
(step 1 above). Splitting it into "write the shared file" as one item and
"repoint the three consumers" as others would create children whose specs
could not name a real standalone verify (a consumer skill file pointing at
a shared file that does not exist yet is not independently provable) —
per `references/split-and-child-specs.md`'s own bar, this is exactly the
"one piece is honestly enough" case. Proceeds as itself.

## Verify

```
npm test && \
test -f plugins/fgOS/skills/_shared/catchup-self-recovery.md && \
test -f .agents/skills/_shared/catchup-self-recovery.md && \
diff -q plugins/fgOS/skills/_shared/catchup-self-recovery.md .agents/skills/_shared/catchup-self-recovery.md && \
grep -q '_shared/catchup-self-recovery.md' plugins/fgOS/skills/approve/SKILL.md && \
grep -q '_shared/catchup-self-recovery.md' plugins/fgOS/skills/merge-next/SKILL.md && \
grep -q '_shared/catchup-self-recovery.md' plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md && \
grep -q 'verify-fail-post-merge' plugins/fgOS/skills/approve/SKILL.md && \
! git diff --name-only main...HEAD | grep -qv '\.md$'
```

Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item
touches `.md` skill-prose paths under `plugins/fgOS/skills/**` and
`.agents/skills/**`): POSITIVE lines prove the new deliverable exists,
is mirrored byte-identical, and all three consumers actually reference it
(not just that the file exists in isolation) plus that `approve/SKILL.md`
now names the previously-absent `verify-fail-post-merge` recovery path.
NEGATIVE line (`! git diff ... | grep -qv '\.md$'`) is the doc's own
scope-guard pattern — proves this item, which is entirely prose, never
touched anything under `src/` or another non-`.md` path. Per the same doc's
"Ranh giới" section: this verify is not asked to prove "the guidance would
actually work if followed" or "content is coherent" — that judgment
belongs to merge-time review and `fgos-coding-validating`'s reality check,
never to a shell command.

`work.verify` currently reads `npm test` (set caller-supplied at discovery,
before this design existed) — sync the command above onto the item before
handing off:

```bash
fgos edit "tsk-c5u" --verify "npm test && test -f plugins/fgOS/skills/_shared/catchup-self-recovery.md && test -f .agents/skills/_shared/catchup-self-recovery.md && diff -q plugins/fgOS/skills/_shared/catchup-self-recovery.md .agents/skills/_shared/catchup-self-recovery.md && grep -q '_shared/catchup-self-recovery.md' plugins/fgOS/skills/approve/SKILL.md && grep -q '_shared/catchup-self-recovery.md' plugins/fgOS/skills/merge-next/SKILL.md && grep -q '_shared/catchup-self-recovery.md' plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md && grep -q 'verify-fail-post-merge' plugins/fgOS/skills/approve/SKILL.md && ! git diff --name-only main...HEAD | grep -qv '\.md$'"
```

## Assumptions

- **Not material, pinned here rather than asked:** the exact prose shape of
  `approve/SKILL.md`'s new recovery branch (a new table row vs. a short
  prose paragraph before the table) is an implementation-only detail — it
  does not change scope, behavior, or the acceptance criterion, which only
  asks that the recovery actually work when re-driven live.
- **Not material:** whether `merge-next/SKILL.md`'s extended messaging
  names all four remaining reasons individually or refers to "the shared
  file's playbooks" collectively — same reasoning, implementation detail.

## Outstanding questions

None
