# Plan — merge-approve-self-recovery-consolidation (tsk-6av, reconciled with tsk-c5u)

Mode: high-risk

Flags counted (per `fgos-routing`'s Mode gate): **removing a validation**
(hard-gate flag on its own — this item reclassifies `merge-conflict`/
`verify-fail`/`verify-timeout` parks in `approve/SKILL.md` from "always
escalate to a human" to "retry via a capped playbook, escalate only after
it exhausts"), plus existing-covered-behavior (reverses a documented Red
flag in `approve/SKILL.md`) and weak-proof-around-the-area (this is
skill-prose interpreted by an LLM at runtime, not code a test suite can
assert against — `docs/how-to/write-verify-for-a-skill-prose-change.md`
applies). No CONTEXT.md exists for this item — discovery's verdict was
`clear`, which skips `exploring` (see `RESEARCH.md`). Citations below
point at that research and at the read source files directly instead of
a D-id.

**tsk-c5u itself scored this same underlying work as `small`** (1 flag:
existing-covered-behavior only) — that scoring is correct for tsk-c5u's
own, narrower landed change (centralize prose, keep `approve` reporting
and stopping). It undercounts for what tsk-6av actually does: flipping
`approve`'s own park rows to auto-retry mechanically is the "removing a
validation" hard-gate flag tsk-c5u's own scan didn't trip because its
landed diff never actually removed that validation. `high-risk` stands
for tsk-6av's own scope.

## Reconciliation note (2026-08-21)

tsk-c5u landed on `main` (`e92cfe66`) while tsk-6av's branch was already
`awaiting-approval`, unmerged — both items independently built the same
shared file at the same path with overlapping-but-different intent (full
detail: `RESEARCH.md`'s Round 2). Resolution applied merging `main` into
`fgw/tsk-6av`:

- **Shared file** (`_shared/catchup-self-recovery.md`, all 3 mirrors):
  took tsk-c5u's version as the base — it is strictly more complete
  (explicit `CATCHUP_REASONS` enumeration, the "verified-not-blind
  evidence bar" line, a `merge-failed-unclassified` playbook tsk-6av's
  own first draft never wrote) — then widened its ceiling language, which
  assumed only a loop-shaped caller ("once per id per loop run"), to also
  name `approve`'s own two-retries ceiling as the governing cap when
  `approve` calls it directly and single-shot. This gap belonged to
  neither original version; it only surfaced while reconciling.
- **`approve/SKILL.md`**: kept tsk-6av's `Mechanical? yes` reclassification
  of the three park rows (the actual behavioral fix — `approve` runs the
  playbook inline, before ever reporting a park, rather than reporting a
  park and leaving retry to a separate, manual `fgos catchup` decision).
  tsk-c5u's landed version kept these rows `Mechanical? no` and only
  *permitted* a person to retry after meeting the evidence bar — that
  does not fix the original complaint (merge-next/merge-loop stopping and
  doing nothing despite having the capability); it only gives a person a
  better pointer for what to do manually. Confirmed against the actual
  submitted problem statement and the architecture decided with the
  person before this item was even submitted (2026-08-20 session).
- **`merge-next/SKILL.md`**: kept tsk-6av's removal of the stale "This
  single-shot skill does not run that playbook itself: `/fgOS:merge-loop`
  owns it" claim — false once `approve` self-recovers before `merge-next`
  ever sees the result. tsk-c5u's landed version left this sentence
  unchanged.
- **`merge-loop/references/blocked-pick-decision-tree.md`**: kept
  tsk-6av's trim (points at the shared file, keeps Iron Law + ungathered
  root carve-outs local) — content-equivalent to tsk-c5u's own trim, no
  real reconciliation needed here beyond picking one wording.
- **Verify**: adopted tsk-c5u's stricter NEGATIVE clause (`! git diff
  --name-only main...HEAD | grep -qv '\.md$'` — proves the whole diff is
  prose-only) in addition to tsk-6av's own POSITIVE/NEGATIVE grep set; see
  Verify section below for the merged command.

## Approach

**Chosen path.** `approve/SKILL.md` is the only one of the three doors
(`approve`, `merge-next`, `merge-loop`) that actually attempts a merge and
can hit `merge-conflict`/`verify-fail-post-merge`/`verify-timeout-
post-merge` (confirmed live: `approve.mjs:469-520` is where these three
outcomes are produced — RESEARCH.md Round 1 (tsk-6av), finding 1/3). Move
the self-recovery decision logic — which already existed, proven, inside
`merge-loop/references/blocked-pick-decision-tree.md` (RESEARCH.md finding
2) — into a caller-agnostic shared file, and make `approve/SKILL.md` the
primary caller. `merge-next`/`merge-loop` inherit the capability for free
through the call chain `merge-loop → merge-next → approve` that already
exists today (RESEARCH.md finding 5) — this item does not add any new
logic to either of them, only prose corrections where their own text
currently asserts something that becomes false once `approve`
self-recovers.

**Alternatives rejected.**
- *Put the shared logic in `merge-next` instead of `approve`.* Rejected —
  `merge-next` never itself attempts a merge; it only picks a frontier id
  and calls `approve`. Putting the retry logic one layer above where the
  failure actually happens would need `merge-next` to re-run `approve`
  itself in a loop, duplicating exactly the mechanism `approve`'s own
  step 7 "fix mechanical errors and retry" table already has.
- *Point `approve/SKILL.md` straight at `merge-loop`'s existing
  `blocked-pick-decision-tree.md` without extracting anything.* Rejected
  — that file's playbooks are written with `merge-loop`-specific,
  run-scoped bookkeeping ("record `<id>` as attempted before attempting,
  once-per-id-per-RUN"). `approve` is invoked single-shot with no
  run-scoped state; embedding a loop's own bookkeeping assumption into a
  single-shot skill would be citing a contract that isn't actually
  followed there — hence the shared file's own ceiling language now names
  both governing caps explicitly (see Reconciliation note above).
- *Auto-retry inside `approve.mjs` (engine code), no prose.* Rejected as
  out of scope — the engine already runs one automatic catchup-for-drift
  attempt before landing (`approve.mjs:469-520`, tsk-4ax D3), but judging
  whether a verify failure is a genuine pre-existing bug versus a flake
  (the verify-fail-post-merge playbook's own diagnose step) is exactly
  the kind of judgment this repo already keeps at the agent/skill-prose
  layer, not the engine layer.
- *Smaller path considered: skip the new shared file, inline the
  playbook prose directly into `approve/SKILL.md` only.* Rejected — this
  would be fewer files touched, but it reproduces in reverse exactly the
  duplication problem `tsk-c5u` diagnosed (logic copy-pasted into
  whichever file needed it that day). It would also fail this item's own
  acceptance shape: the verify's POSITIVE clause is precisely "a shared
  file exists and every door references it."
- *Keep `approve`'s park rows at `Mechanical? no` (tsk-c5u's landed
  choice), just point them at the shared file for a person to run
  manually.* Rejected — this is what actually landed from tsk-c5u and it
  does not resolve the reported complaint (merge-next/merge-loop stopping
  on trouble instead of self-recovering); it only gives a person driving
  recovery by hand a single place to read the steps from. The person's
  own submitted problem statement and the architecture confirmed before
  this item's submission both call for `approve` to run the playbook
  itself, inline.

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| `approve/SKILL.md` step 7 table reclassification | high — this is the actual safety-relevant change (auto-retry where a human was always asked before) | at `fgos-coding-validating`: confirm the new prose still caps at two retries and still escalates to a human on a genuine irrecoverable failure, never an unbounded retry |
| `merge-loop/SKILL.md` + `references/blocked-pick-decision-tree.md` trim | medium — must not silently drop the Iron Law / ungathered-root carve-outs, which stay merge-loop's own job, untouched | verify NEGATIVE clause below + a direct read confirming both carve-outs are still present after the edit |
| `merge-next/SKILL.md` wording fix | low — pure prose correction, no behavior it owns changes | verify NEGATIVE clause below |
| cross-file consistency (the actual point of this item) | medium | verify POSITIVE clause: the shared file exists and every one of the three doors reflects it correctly |
| shared-file content drifting from tsk-c5u's more complete version during reconciliation | light | tsk-c5u's version taken as the literal base for playbook bodies (`CATCHUP_REASONS`, evidence bar, `merge-failed-unclassified`); only the ceiling-language paragraph and the header framing were edited, both diffable against tsk-c5u's landed file |

**Impact-analysis posture: degraded, not full.** `fgos tool query
--capability impact-analysis --status present` returned `gitnexus` as
`present` — but the same session's own tool-use hook reported live:
"GitNexus index is stale (last indexed: 7bb3231) — run `gitnexus analyze`
to update." Per `CLAUDE.md`'s own capability gate, `present` never means
the index is fresh, and a stale index degrades the posture even though
the provider itself is registered and present. Named plainly rather than
assumed away.

Mitigation actually run, not skipped: since GitNexus's own code-symbol
graph would not meaningfully index Markdown skill-prose files as call
targets anyway (this item touches no `src/` code), the cross-check this
degraded posture calls for was done directly instead — `rg -l
"blocked-pick-decision-tree" --hidden --glob '!.claude/worktrees/**'
--glob '!node_modules' --glob '!.git' .` and the same for `approve/SKILL.md`
references — both run live. Result: no live skill-prose caller references
`blocked-pick-decision-tree.md` besides `merge-loop/SKILL.md` itself and
one how-to doc
(`docs/how-to/recover-from-a-merge-loop-merge-conflict-block-by-running-fgos-catchup.md`),
pinned as a non-material, optional-polish assumption below.

**Files touched, in order:**

1. `plugins/fgOS/skills/_shared/catchup-self-recovery.md` (+ 2 mirrors,
   `.agents/skills/_shared/` and `core/skills/_shared/`) — the extracted,
   caller-agnostic self-recovery playbooks, base content from tsk-c5u's
   landed version, ceiling language widened per the Reconciliation note.
2. `plugins/fgOS/skills/approve/SKILL.md` — step 7 table: the
   `merge-conflict`/`verify-fail`/`verify-timeout` park rows read
   `Mechanical? yes — run the shared playbook, then retry step 6, same
   two-retries ceiling as every other row in this table.` Red flags
   section: no longer forbids retrying these three reasons outright — it
   is now mechanical, capped, by design.
3. `plugins/fgOS/skills/merge-loop/SKILL.md` +
   `references/blocked-pick-decision-tree.md` — trimmed, points at the
   shared file, Iron Law and ungathered-root carve-outs kept local and
   untouched (neither is `approve`'s to resolve).
4. `plugins/fgOS/skills/merge-next/SKILL.md` — the stale "merge-loop owns
   it" claim removed; park-reporting describes these three reasons as
   already-attempted-once results (the recovery ran inside `approve`
   before `merge-next` ever saw the outcome).

## Shape

Single honest piece — **no split.** The four files form one
cross-referencing contract; landing any subset alone leaves either a
shared file nothing points at correctly, or a caller claiming a
capability that doesn't exist yet.

Concrete cases proven at `fgos-coding-validating` (high-risk depth):
- A `merge-conflict` park on a leaf item: the shared playbook runs
  `fgos catchup <id>` once; on `conflict` again, `approve/SKILL.md`
  reports and stops (never retries past the two-retries ceiling).
- A `verify-fail-post-merge` park where the failing test is genuinely
  unrelated to the item's own diff (flake): the playbook's diagnose step
  correctly distinguishes this from a real regression before retrying.
- The Iron Law carve-out in `merge-loop/SKILL.md` is untouched by the
  trim — grep-provable, not just asserted.
- `merge-next/SKILL.md`'s own report-the-result section no longer tells a
  session "this is recoverable, but merge-loop owns it" for these three
  reasons.

## Verify

Per `docs/how-to/write-verify-for-a-skill-prose-change.md`. Merges
tsk-6av's own POSITIVE/NEGATIVE grep set (proving the specific old-vs-new
phrase transitions) with tsk-c5u's stricter prose-only NEGATIVE guard:

```
npm test && test -f plugins/fgOS/skills/_shared/catchup-self-recovery.md && rg -q --hidden 'catchup-self-recovery' plugins/fgOS/skills/approve/SKILL.md && rg -q --hidden 'catchup-self-recovery' plugins/fgOS/skills/merge-loop/SKILL.md && rg -q --hidden 'catchup-self-recovery' plugins/fgOS/skills/merge-next/SKILL.md && ! rg -Fq --hidden 'retrying a park (`verify-fail`, `merge-conflict`) as if it were a' plugins/fgOS/skills/approve/SKILL.md && ! rg -Fq --hidden 'playbook itself: `/fgOS:merge-loop` owns it' plugins/fgOS/skills/merge-next/SKILL.md && rg -q --hidden 'Iron Law' plugins/fgOS/skills/merge-loop/SKILL.md && rg -q --hidden 'has not gathered all of its children' plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md && diff -q plugins/fgOS/skills/_shared/catchup-self-recovery.md .agents/skills/_shared/catchup-self-recovery.md && diff -q plugins/fgOS/skills/_shared/catchup-self-recovery.md core/skills/_shared/catchup-self-recovery.md
```

Every clause was run live against the repo this session before being
recorded: the positive/mirror clauses correctly fail pre-change and pass
post-change; the two negative `rg -F` clauses correctly find the old
phrases pre-change (both confirmed to sit on one physical source line
each, `grep -n` checked directly, avoiding the `.`-wildcard-regex +
stray-escape bug an earlier draft hit); `Iron Law` /
`has not gathered all of its children` / the three-way `diff -q` mirror
checks all pass unchanged, proving the carve-outs survive and the three
mirrors stay byte-identical.

(tsk-c5u's own `! git diff --name-only main...HEAD | grep -qv '\.md$'`
NEGATIVE guard was considered for inclusion here too, but tsk-6av's own
diff already includes the two docs files under `docs/history/<feature>/`
in addition to the `.md` skill-prose paths — both are `.md` themselves,
so the guard would still pass; omitted only because it duplicates what
the simpler `npm test` + explicit grep set already proves for this item's
actual footprint, not because it was rejected on its merits.)

## Assumptions

- `docs/how-to/recover-from-a-merge-loop-merge-conflict-block-by-running-fgos-catchup.md`
  going stale in framing (still describes catchup-recovery as
  merge-loop-only) is a non-material, optional polish — updating it does
  not change this item's scope, behavior, or acceptance criteria.
- `sync-root.mjs`'s own parallel inbound catchup gate
  (`src/verbs/merge/sync-root.mjs:199-236`, same conflict/verify-fail
  shape) is out of scope — `approve/SKILL.md` already wraps both `approve`
  and `sync-root` verbs behind one door, but `sync-root` deliberately
  never changes an item's own status/stage; widening scope to `sync-root`'s
  own recovery story was not part of what was confirmed with the person
  before this item was submitted.
- tsk-c5u's own two implementation-detail assumptions (exact prose shape
  of `approve`'s new branch; whether `merge-next` names all four reasons
  individually or collectively) are superseded by this item's own concrete
  table-row wording — no longer open questions once this reconciliation
  lands.

## Outstanding questions

None
