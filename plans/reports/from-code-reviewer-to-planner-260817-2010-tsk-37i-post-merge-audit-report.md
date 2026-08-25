# tsk-37i post-merge audit — self-contained citation format

Auditor: `code-reviewer` (Opus), 2026-08-17. Read-only audit of `main` at
`22ed5a95` (merge of `fgw/tsk-37i`). No files edited, no `fgos` write verb run.

**Verdict: the tests are genuinely green and the flagship fix is real, but the
enforcement mechanism as landed will go red on the next unrelated commit, and
the shared convention it shipped has zero consumers.** Four findings are
blocking-grade. One of the lead's suspicions (the `tsk-1lv` handshake) checks
out better than expected; a different, subtler mismatch sits underneath it.

---

## F1 — CRITICAL: the baseline is keyed by LINE NUMBER, so any line shift in a baselined file fails `npm test`

`scripts/check-decision-citation-drift.mjs:152` builds each baseline key as:

```js
const key = `${f.kind}:${f.line}:${f.id}`;
```

`f.line` is in the key. Insert or delete a single line anywhere in a baselined
file and every finding below it shifts, stops matching the baseline, and is
reported as new — exit 1, `npm test` red.

**Proven empirically, not inferred.** Copied `docs/backlog.md` + the
checked-in baseline into a scratch tree and ran the real script:

```
--- baseline run (unmodified backlog) ---
check-decision-citation-drift: no new findings (75 baselined).
--- after inserting ONE comment line at the top of docs/backlog.md ---
check-decision-citation-drift: 64 finding(s):
  - docs/backlog.md:97: cites 0002 (superseded by 0012) without acknowledging...
  - docs/backlog.md:6: cites D-local id D1 outside its own CONTEXT.md ...
  [62 more]
```

**Why this is not a theoretical concern.** Churn on exactly the baselined
surface, measured over the last 200 commits (which span only 2026-08-15 →
2026-08-17, i.e. two days):

| Path | Commits touching it, of the last 200 |
|---|---|
| `docs/backlog.md` | **152** |
| `docs/specs/*.md` | **200** |
| `.agents/skills/**` | **172** |

`docs/backlog.md` gains a row on essentially every work item. The next session
that adds one breaks `npm test` for the whole repo, with 64 findings it did not
cause and cannot act on.

**D4's cited precedent is wrong in the load-bearing detail.** CONTEXT.md D4 says
the baseline is the "same shape as `scripts/check-decision-codes.baseline.json`,
this repo's own prior art for exactly this situation." It is not. That file keys
by the **matched line's text content**:

```json
"test/cli/fgos-manifest.test.mjs": [
  "test('docs-index registry flags reflect what the verb actually does (tsk-1wn D2/D4)', () => {"
]
```

No line number anywhere. That is precisely what makes the precedent survive line
shifts, and it is the one property the new implementation dropped.

**Fix.** Change `findNewFindings`/`baselineFromFindings` to key on
`${kind}:${id}:${normalizedLineText}` (mirroring `check-decision-codes.mjs`), or
at minimum drop `f.line` from the key and count occurrences per `(file, kind,
id)`. Regenerate the baseline with `--write-baseline` after the change. Add a
test that inserts a line into a fixture file and asserts the baselined findings
still do not report — the current suite has no such case.

---

## F2 — CRITICAL: F1 makes D8's ratchet hollow *mechanically*, not just by incentive

The lead asked directly (Q4) whether D8's completion bar creates an exploitable
loophole. My honest answer: **yes, and worse than the framing suggests — the
loophole is forced, not merely tempting.**

The abstract version of the worry (a future session lands a huge day-one
baseline and never shrinks it) is bounded and matches `check-decision-codes.mjs`'s
real precedent. I would not block on that alone. The concrete version is
different, and it is created by F1:

1. F1 guarantees the check goes red on commits that introduce no violations.
2. The only documented unblock is `--write-baseline`
   (`citation-format.md`: "run it after a cleanup batch to shrink the baseline,
   never by hand-editing the JSON").
3. `--write-baseline` snapshots **every current finding of every kind**
   (`runCli`, line 316) — including genuine new violations introduced in the
   same commit.
4. Nothing asserts the baseline may not grow. The real-repo test only asserts
   `status === 0`; there is no assertion on finding count, and no committed
   previous-count to compare against.

So the routine, expected response to a red check — regenerate the baseline — is
also a silent amnesty for every real violation present at that moment. With 1645
findings across 73 files, nobody will read that JSON diff line by line. "The
mechanism blocks any NEW bare citation from this point forward" (D8) is not a
claim the landed code supports once F1 is in play.

**Fix.** F1 first. Then add a monotonicity guard: a test that loads the baseline
from `git show HEAD:scripts/check-decision-citation-drift.baseline.json` and
fails if the total finding count increased. That makes the ratchet a ratchet.
Without it, D8's bar is enforced only by a human reading a 1782-line JSON diff.

---

## F3 — HIGH: the shared convention fragment is orphaned — zero consumers

`.agents/skills/_shared/citation-format.md` states its own contract:

> Point at this file from a consuming `SKILL.md`/spec (relative path, e.g.
> `../_shared/citation-format.md`) instead of restating this convention in
> each file's own prose.

Nothing does. `git grep -l citation-format` outside `plans/` and
`docs/history/` returns exactly three hits: the two byte-identical copies of the
fragment itself, and one mention in `docs/distillery/sources/bee.md`. No
`SKILL.md`, no spec, not `AGENTS.md` — **not even
`.agents/skills/fgos-coding-shaping/SKILL.md`, the file this item cleaned up as
its flagship example.**

Contrast the sibling fragment in the same directory,
`executor-dispatch-fallback.md`: 7 `SKILL.md` citers, `AGENTS.md`, two ADRs, and
two dedicated how-tos including
`docs/how-to/verify-every-citer-before-retiring-a-shared-skill-fragment.md`. The
repo has an explicit, documented practice for wiring these fragments in. This
item did not follow it.

Deliverable (a) of D2 was "citation-format convention + a machine check." The
check landed. The convention landed as a file no agent will ever be routed to.

**The plan's verify leg for this is a phantom check.** From `plan.md`:

```
&& test -f .agents/skills/_shared/citation-format.md \
&& grep -qE '<ID>.*one-line gloss' .agents/skills/_shared/citation-format.md \
```

That proves the file exists and contains its own text. It cannot fail as long as
the file is committed, and it proves nothing about adoption. `plan.md` labels
this leg "POSITIVE" — it is closer to a tautology.

**Fix.** Add the `../_shared/citation-format.md` pointer to the skills that
actually mint or cite ids (`fgos-coding-shaping`, `fgos-coding-exploring`,
`fgos-coding-planning`, `fgos-coding-compounding`) and/or a line in `AGENTS.md`,
mirroring how `executor-dispatch-fallback.md` is wired. Then make the verify leg
assert at least one citer exists, not that the file exists.

---

## F4 — HIGH: the 1645-finding baseline has no owner, no follow-up item, and the peer item believes it was already cleaned

The lead asked (Q3) whether a follow-up exists. It does not.

- `fgos list --json` → 102 work items; **zero** match
  `citation|gloss|self-contained|ratchet` anywhere in their JSON.
- `docs/backlog.md` → **zero** rows mentioning `tsk-37i`, `citation`,
  `self-contained`, or `gloss`.
- Baseline contents: **1645 findings / 73 files** — 1291 `d-local-outside-home`,
  351 `bare-citation`, 3 `dead-framing`.

Worse, the peer item's record disagrees about what happened.
`fgw/tsk-1lv:docs/history/canonical-decision-projection/CONTEXT.md` D9 reads:

> tsk-37i giữ mảnh 1 (khuôn citation `<ID> (<gloss>)`) + **mảnh 3 (dọn ~36-69
> file vi phạm)**.

`tsk-1lv` recorded the handshake on the understanding that tsk-37i would clean
those files. One file was cleaned. So the debt is simultaneously (a) unowned by
any open item, and (b) recorded on a live peer item's locked decision as
tsk-37i's delivered scope.

`plan.md`'s own §Shape still carries the pre-D8 stricter promise, never updated:

> shrinking the checked-in baseline file as each batch of fixes lands ... **until
> it is empty except for the 3 D6-deferred `dead-framing` lines** plus any other
> explicitly-waived residual named with a reason.

D8 later relaxed this, but §Shape was left contradicting D8 in the same
document.

**Fix.** File a real follow-up work item for the bulk cleanup with the baseline
count as its acceptance metric, and either reconcile `tsk-1lv`'s D9 wording or
note the deferral where that item's session will see it. Reconcile `plan.md`
§Shape with D8 so the record has one story.

---

## F5 — MEDIUM: `plan.md` "corrects" a right filename into a wrong one, citing evidence that does not support it

`docs/history/self-contained-id-references/plan.md:99-101`:

> same family as the existing `.agents/skills/_shared/capacity-dispatch-fallback.md`
> (corrected: an earlier draft of this plan cited a non-existent
> `executor-dispatch-fallback.md` — that name was reverted by `tsk-34n`, `3d5b8d44`).

Every factual claim in that parenthetical is false:

- `git ls-files | grep dispatch-fallback` → only
  `.agents/skills/_shared/executor-dispatch-fallback.md` and
  `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`.
  `capacity-dispatch-fallback.md` does not exist and, per `tsk-34n`'s
  capacity→executor rename, is the *old* name.
- `git show --stat 3d5b8d44 -- .agents/skills/_shared/` → **empty**. The cited
  commit touched nothing in that directory.
- `AGENTS.md:148` names `executor-dispatch-fallback.md`.

An earlier draft had the correct name; the "correction" pass replaced it with a
non-existent path and attached a fabricated commit citation to justify the
change. This is the same defect class the prior plan review caught (stale paths,
misstated precedent) — it recurred inside the fix for it. Low blast radius (a
prose reference in a history doc), but it is a directly checkable false claim in
the item's own record.

**Fix.** Correct `plan.md:99-101` back to `executor-dispatch-fallback.md` and
drop the `3d5b8d44` citation.

---

## F6 — MEDIUM: the `tsk-1lv` handshake is real, but what was handed over is not what was accepted

The lead flagged this as possibly one-sided. **It is not** — the acceptance is
genuinely two-sided and independently verifiable on the peer branch:

- `fgw/tsk-1lv:.../CONTEXT.md` D9 (locked, in the decisions table).
- `fgw/tsk-1lv:.../DISCUSSION.md` round 12 (2026-08-17), recording the user's
  own decision to narrow tsk-37i and split mảnh 2 + mảnh 4 to tsk-1lv.
- `fgos list` shows `tsk-1lv` alive: `status: doing`, `stage: executing`,
  `parkReason: human-question`, `childProgress 0/6`.

So that suspicion is cleared. The real problem is one level down: **tsk-37i
handed over a mechanism that tsk-1lv has explicitly declared out of scope.**

tsk-37i CONTEXT.md D2 / feature boundary:

> the **routing close-gate on `fgos approve`/`return`** ... `tsk-1lv` owns both

tsk-1lv CONTEXT.md, "Ngoài phạm vi feature này" and D7:

> gate `fgos approve` bằng bất kỳ check nào (D7 — dùng `retrospective` đã có)
>
> D7 | 4-door check ... chạy BÊN TRONG lần gọi batch hiện có của
> `retrospective` ... **`fgos approve` KHÔNG bị gate.**

tsk-1lv is building a batch-time, non-blocking routing door inside
`retrospective`. tsk-37i deferred a **hard close-gate on the item-close path**.
`docs/distillery/sources/bee.md:486` describes the upstream mechanism as exactly
the strong form:

> beegog's answer is not a citation-format rule but a **structural close gate**:
> a feature is refused as done while any of its locked decisions sits unrouted —
> turning "someone should route this eventually" into "the feature cannot close
> until it is."

Nobody owns that. tsk-37i thinks tsk-1lv has it; tsk-1lv has explicitly written
it out of scope. Both items are individually coherent; the seam between them
loses the mechanism.

**Fix.** Decide explicitly whether the hard approve-time gate is wanted. If yes,
it needs an owner (a new item, or a scope change on tsk-1lv that supersedes its
D7). If no, correct tsk-37i's CONTEXT.md D2 wording so the record does not claim
a handoff that was declined.

---

## F7 — MEDIUM: `tsk-1lv`'s D5 would silently gut this check

`tsk-1lv` CONTEXT.md D5:

> Retire `docs/decisions/*.md` corpus (35 file ...) — narrative dài dồn vào
> `docs/specs/<area>.md`

The new check's `loadSupersededById()` (line 166) reads `docs/decisions` and
builds the supersession map from those files' frontmatter. If that corpus is
retired:

- The `dead-framing` leg degrades to **zero findings with no error** — an empty
  directory yields an empty map, every citation is "not superseded", the check
  passes silently. It does not throw; `readdirSync` on an empty dir returns `[]`.
- 351 baselined `bare-citation` findings are `ADR<n>` ids pointing into that
  corpus; the gloss rule loses its referent.

Neither item's record notes this coupling, and `tsk-1lv`'s declared `footprint`
includes `docs/decisions` and `docs/specs` but not `scripts/`.

**Fix.** Add `scripts/check-decision-citation-drift.mjs` to `tsk-1lv`'s
footprint so `fgos conflicts` catches it, or record the dependency in one of the
two items.

---

## F8 — MEDIUM: the wrapper generator hardcodes a bare D-local citation into every generated skill file

`src/setup/skill-wrappers.mjs:45`:

```js
'This is a generated thin wrapper (tsk-1qi D5/D7) -- do not edit directly, edit the source instead.\n' +
```

`(tsk-1qi D5/D7)` is a bare D-local citation outside its home `CONTEXT.md` —
exactly the pattern the new rule forbids — stamped into every
`.claude/skills/*/SKILL.md` the generator produces (confirmed live in
`.claude/skills/fgos-coding-shaping/SKILL.md`).

It is invisible to the check twice over: `.mjs` files are not scanned (the walker
filters `.md` only), and `.claude/skills` is not in the scan surface. So the rule
is systematically violated by a code generator that the enforcement mechanism
structurally cannot see.

Note this is not a `.claude/skills` coverage bug per se — that root correctly
holds 19-line pointer stubs, not content copies, so excluding it from the scan is
right. The defect is the string literal in the generator.

**Fix.** Cheap: change the boilerplate to `"This is a generated thin wrapper --
do not edit directly, edit the source instead."` The ids add nothing a reader can
act on.

---

## F9 — LOW: `isGlossed`'s 15-character cliff is arbitrary and undocumented

`isGlossed` (line 90) rejects any parenthetical matching
`/^[A-Za-z0-9,/\-\s]{0,15}$/`. Probed against the live function:

| Parenthetical | Inner length | `isGlossed` | Correct? |
|---|---|---|---|
| `(priority order)` | 14 | `false` | **false positive** — a real gloss, flagged |
| `(the product priority order)` | 26 | `true` | ok |
| `(see D2, D4 and D6 above ok)` | 26 | `true` | **false negative** — pure id list, passes |
| `(runner)` | 6 | `false` | ok (this is the intended catch) |

The threshold works for the case it was built for, but an author cannot predict
it: `citation-format.md` says only "long enough to be prose rather than a bare
list of other ids" and never states the number. Someone writing a correct,
concise 14-character gloss gets flagged and has no way to know why.

**Fix.** State the rule in `citation-format.md` ("more than 15 characters, or
containing punctuation beyond commas/slashes/hyphens"). Not worth changing the
heuristic itself.

---

## F10 — LOW: fence detection misses `~~~` and 4-backtick fences; inline code spans are not excluded

`findCitationFormatFindings` toggles `inFence` on `/^\s*```/` only. A `~~~`
fence, a 4-backtick fence, or a citation inside an inline `` `D2` `` span will be
scanned as prose. Bounded by the ratchet (existing cases are baselined) and by
`.md` convention in this repo, which uses triple backticks throughout — recording
it only so a future reader does not assume full CommonMark fence handling.

---

## Checks out

Verified fresh from `main`, not taken from the prior session's report:

- **Tests genuinely green.** `node --test test/scripts/check-decision-citation-drift.test.mjs`
  → 26/26 pass. `node --test 'test/scripts/*.test.mjs'` → **175/175 pass**, zero
  failures.
- **The real-repo CLI test is genuinely wired into `npm test`**, not a separate
  script nobody runs — `cwd: repoRoot`, both `--skills-dir` roots, default
  checked-in baseline, asserts exit 0. This was plan-review finding H1's fix and
  it landed correctly.
- **Prior plan-review CRITICALs actually fixed:** C2 (a glossed `D2` that would
  itself violate `0017`) — `.agents/skills/fgos-coding-shaping/SKILL.md` now has
  **zero** matches for `\b(ADR|RUL|D)[0-9]{1,4}\b`, the id is gone, not glossed.
  C3 (stale pre-cleanup baseline) — regenerated in `ef1b78ff`, after the `main`
  merge. H2 (dead-framing absent from baseline) — all 3 present.
- **Merge integrity (lead's Q5).** `.agents/skills/fgos-coding-shaping/SKILL.md`
  and `plugins/fgOS/skills/fgos-coding-shaping/SKILL.md` are byte-identical
  (`md5 99ca2f0f84aacf39b62dbc38298df0fb`), and both are free of bare citations.
  `.agents/skills/_shared/citation-format.md` and its `plugins/` mirror are
  byte-identical (`md5 5d620e43...`). The `main` merge at `d9308bc0` did not
  revert or corrupt the flagship fix.
- **`.claude/skills` correctly excluded** from the scan surface — its
  `fgos-coding-shaping/SKILL.md` is a 19-line generated pointer stub, not a
  content copy (see F8 for the one real problem there).
- **Porting-log entries are recorded sanely.** All three
  (`decision-citation-and-reversal-sweep`, `one-line-cite-plus-local-delta`,
  `doc-rot-close-gate-bundle`) are `candidate` rows in
  `docs/distillery/porting-log.md:128-130` with R/E/F scores, dated provenance,
  and specific evidence. No conflicting or duplicate rows. `bee.md` §400/§483/§530
  back them.
- **D6's 3 deferred `dead-framing` findings** are in the baseline as claimed, not
  silently dropped.

---

## Recommended actions, in order

1. **Fix F1** — re-key the baseline on matched line content, matching
   `check-decision-codes.baseline.json`. Without this, `npm test` breaks on the
   next backlog row. This is the one finding that needs to land before more work
   flows through `main`.
2. **Fix F2** — add a baseline-monotonicity test so `--write-baseline` cannot
   silently amnesty new violations. F1 without F2 leaves the ratchet unguarded.
3. **Fix F3** — wire `citation-format.md` into real citers; the convention half
   of this item is currently undelivered.
4. **Fix F4** — file the cleanup follow-up item, and reconcile `tsk-1lv`'s D9 and
   `plan.md` §Shape with what actually shipped.
5. **Resolve F6** — decide whether the hard approve-time routing gate is wanted,
   and give it an owner or strike it from tsk-37i's record.
6. F5, F7, F8 — small, independent corrections.
7. F9, F10 — documentation only, no code change needed.

## Unresolved questions

- Was the 1645-finding baseline size actually reviewed at approve time, or was
  the JSON diff too large to read? F2's severity depends on the answer — if the
  human bar is "read the baseline diff," 1782 lines makes that bar nominal.
- Does anyone want the strong close-gate from F6, or was the batch-time version
  in `tsk-1lv` D7 always the real intent? The two items' records disagree and I
  cannot tell which reflects the user's decision.
