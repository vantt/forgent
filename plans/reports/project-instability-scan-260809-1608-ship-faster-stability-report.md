# Project instability scan — ship-faster and stability

Item: `tsk-36i`. Plan: `docs/history/project-instability-scan/plan.md`.
Scanned at `main` = `806ac1a`, 2026-08-09. Six area agents in parallel,
report-only, no code changed.

**Method note.** Every entry below carries `file:LINE` or a command that
actually ran. Anything without that evidence is in **Unproven suspicions**,
never in the ranked list — read that section as "not yet real". All six
areas reported (the sixth, `src/state/`, landed after the first draft was
committed; its findings are Tier 1.5 and it closed the coverage gap that
draft declared).

## Headline

Four things are true right now that a person would want to know before
starting any work today:

1. **`main` is red** — by exactly one test, and it is none of the four the
   backlog blames.
2. **Every `git commit` on the main checkout blocks every claim for up to
   180 seconds.** Reproduced live during this scan.
3. **The `fgos` command does not work in any agent shell** — and `doctor`
   structurally cannot notice.
4. **A session working in a worktree sees an empty backlog** and is told by
   its own skill file that this is a valid answer.

None of the four were in the backlog. Meanwhile **6 of 7** open items
claiming "tests are red on main" are stale and describe a suite state that
no longer exists.

## Ranked findings

Ranked by real pain. Ties broken by the item's own priority order:
ship-faster above instability.

### Tier 1 — blocking work right now

---

**1. [SHIP-FASTER] Every `git commit` on the main checkout blocks every
`fgos take`/`pick` for up to 180 seconds**

Severity: **high** · Dedupe: **NEW**

`.githooks/pre-commit:107` acquires the shared main-checkout lock:

```js
const { id } = resolveWriterIdentity(fgosDir);   // a STRING
const result = acquireMainCheckoutLock(fgosDir, { identity: id, ttlMs });
```

`grep -cE "release|unlink" .githooks/pre-commit` → **0**. The hook never
releases, and unlike `claimWork` (`src/runner/claim-port.mjs:103`) it does
not pass `releaseOnExit`. Because the identity is a string, it cannot be
liveness-probed — `src/runner/main-checkout-lock.mjs:206-217` judges it by
TTL alone (`DEFAULT_TTL_MS = 3 * 60 * 1000`). `withLockRetry`'s default
budget is `remainingTtlMs` (`src/runner/lock-wait.mjs:53-60`), so a claim
does not fail fast — it blocks.

Reproduced live by this scan's own session:

| time | event |
|---|---|
| 09:37 | `git commit` of `plan.md` (806ac1a) → hook takes lock, never releases |
| 09:38 | `fgos pick tsk-36i` → blocks |
| 09:40 | killed at the 2-minute mark; `lock-status` → `live`, holder `66aeb07d-…` (a **string**), `remainingTtl: 36s` |
| 09:40:10 | TTL lapses → `free` |
| 09:40:25 | identical `pick` succeeds in **1.1s** |

The holder being a string is the proof it was the hook, not the claim —
`claimWork` writes `identity: process.pid`, a number.

**It was never hung — it was waiting silently, and the "still waiting" line
is structurally unreachable on that path.** `src/runner/lock-wait.mjs:76`
guards the progress print with `delayMs > 0 && elapsedMs >=
originalRemainingTtlMs`. With no `--wait`, `budgetMs ===
originalRemainingTtlMs` (`:56`), so `elapsedMs >= originalRemainingTtlMs`
implies `budgetMs - elapsedMs <= 0` implies `delayMs <= 0` (`:67`) — the two
conjuncts are **mutually exclusive**. Measured:

```
no --wait, ttl=3000  : attempts=233 elapsed=3251ms progressLines=0*
no --wait, ttl=10000 : attempts=234 elapsed=10250ms progressLines=0
explicit waitMs=6000 : attempts=235 elapsed=6250ms progressLines=2
   > "still waiting on main-checkout lock (holder pid 4242, 4s elapsed)"
   * the one line on the default path is a Node TimeoutNegativeWarning
     from sleep(negative) — not a message anyone wrote
```

Secondary: the backoff (500/1000/2000) exhausts the budget in 3 sleeps then
**busy-spins** — 233 full `claimWork` attempts for a 3-second wait.

**And `fgos unlock` cannot clear it.** `bin/fgos.mjs:4062-4079` — a dead
*numeric* pid is stale-reclaimed fine, but a **string identity within TTL
returns HELD and `unlock` refuses with exit 7**. That is exactly the case
the hook creates. Worse, `bin/fgos.mjs:4070` refuses with *"held by a LIVE
session"* — for a string identity, liveness was never checked
(`main-checkout-lock.mjs:206-217` documents it as undecidable). The verb
asserts a fact it did not establish, and tells the operator to wait on a
session that may have exited hours ago.

*Cost:* commit-then-claim is the single most common sequence in this repo's
own workflow (every skill commits an artifact, then the next stage claims).
Measured commit cadence over the last 60 commits: median gap **95s**, and
**68% of gaps are under the 180s TTL** — each commit *refreshes* the lock
(self-recognition, `:195-198`), so during active work the main checkout is
locked roughly two-thirds of the time under one session's identity. Any
other session's `pick`/`take`/`approve` blocks on it, silently, with no
progress line and no working escape hatch.

---

**2. [SHIP-FASTER] The `fgos` shell wrapper is dead in every agent shell;
`doctor` cannot detect it by construction**

Severity: **high** · Dedupe: **NEW** · *Found independently by two agents*

```
$ fgos list
fgos:2: command not found: _fgos_repo_root
```

The harness shell snapshot captures both public functions (`fgos` at :630,
`fgos-runner` at :646) but drops the `_`-prefixed helper they both call on
their **second line**. Defined at
`scripts/fgos-shell-integration.sh:19` as `_fgos_repo_root()` — the leading
underscore is what gets it filtered.

The designed fallback cannot save it: a real PATH install exists
(`command -v fgos` → `~/.local/share/pnpm/bin/fgos`), but death occurs at
line 2, before line 37's `real_bin=$(unset -f fgos; command -v fgos)`
recovery branch is ever reached.

`doctor` tests the wrong thing — `src/setup/shell-rc.mjs:41-47`
(`hasSourceLine`) regexes the rc **file text** for a source line. The check
id is literally `shell-integration-sourced`. The line is present and
correct; the command is dead. `plugin-skill-cli-reachable` separately
reports green ("local bin/fgos.mjs found") — true of the file, false of the
command.

*Cost:* every skill, doc, and `README.md` tells the operator to type bare
`fgos <verb>`. Every agent session hits an error naming a symbol it will
not find in any file it greps. This session included — every `fgos` call in
this scan was `node bin/fgos.mjs`, rediscovered by hand.

---

**3. [INSTABILITY] A worktree session sees an empty backlog, and its skill
file calls that valid**

Severity: **high** · Dedupe: **NEW**

Verified directly, from the worktree this item was implemented in:

```
items seen from worktree: 0     exit=0
items seen with --dir:   86
```

Worktrees never carry `.fgos/` by design (ADR0020). The CLI does warn — on
**stderr**, exit **0**. But every read-verb plugin skill pipes stdout only
and passes no `--dir`:

```
$ grep -c -- "--dir" plugins/fgOS/skills/{list,ready,triage,show,stale,rollup,graph,check,conflicts,merge-list}/SKILL.md
list:0 ready:0 triage:0 show:0 stale:0 rollup:0 graph:0 check:0 conflicts:0 merge-list:0
```

All 13 skills that *do* pass `--dir` are write verbs. The split is exactly
read vs write. `plugins/fgOS/skills/list/SKILL.md` then closes with:
*"If `data.work` is empty, say so plainly — an empty result is valid, not a
failure."*

*Cost:* `/fgOS:list`, `/fgOS:ready`, `/fgOS:triage` run from a worktree —
this repo's standard workflow — confidently report "no open work" against
86 open items, and are instructed to trust it. Compounds with finding 2:
the shell wrapper was the layer that resolved this correctly.

---

**4. [INSTABILITY] `main` is red on one stale assertion, and the fix cannot
travel through the merge gate**

Severity: **high** · Dedupe: **NEW**

```
ℹ tests 2685   ℹ pass 2679   ℹ fail 1   ℹ skipped 5
ℹ duration_ms 193815    EXIT=1
```

The single failure, deterministic across 3/3 isolated re-runs:

```
✖ test at test/runner/dispatch.test.mjs:643:1
  AssertionError: capacities.submit-assist-classify must exist
```

Cause: `a61651d chore: rename submit-assist-classify capacity to
coding-classify-intake` changed `.fgos/config.json`, 1 file, 1 line — and
no test. The item that owned this work (`tsk-3fj`) had a plan naming
`test/runner/dispatch.test.mjs:643-653` explicitly as part of the change.

It cannot be fixed through the normal gate: `src/runner/worktree.mjs:409-416`
deletes `.fgos/` from every worktree, and `src/runner/merge.mjs:880-891`
returns `fgos-write-rejected` for any staged `.fgos/` path. The config half
must be hand-committed to `main`.

*Cost:* **79 of 191 items** carry `npm test` as their verify. Every one of
them now fails `fgos return` and every post-merge verify, parking `blocked`
with a friction record. The repo's stated definition of done is unmeetable
on `main`.

*Do not fix by renaming the assertion alone:* `grep -rn
"coding-classify-intake" src bin docs .claude/skills test` returns zero hits
outside `.fgos/config.json` itself. The capacity may be genuinely dead, not
merely mis-tested. Turning the suite green would hide that question.

---

**5. [INSTABILITY] The main-checkout lock TTL (180s) is shorter than the
verify it must cover (measured 184.9s) — a *living* holder's lock is stolen**

Severity: **high** · Dedupe: **matches `tsk-4l8`** (supplies the mechanism
that item was missing)

`src/runner/main-checkout-lock.mjs:80` — `DEFAULT_TTL_MS = 3 * 60 * 1000`.
At `:201-205`, `held = pidLive && withinTtl` — so `held === false` for a
**living** holder once age exceeds TTL, and the lock file is unlinked at
`:236`. `mergeRunnerItem` acquires once (`src/runner/merge.mjs:660`) and
holds across `runGoalCheck` (`:893`) with no heartbeat — none exists in
`main-checkout-lock.mjs`.

Measured `npm test`: **184.93s** > 180s.

*Cost:* two `git merge --no-commit` on one working tree. This is the origin
of the existing band-aids (`merge.mjs:773-806` MERGE_HEAD guards, `tsk-18a`,
`tsk-2j9`) — not a new symptom class. `tsk-4l8`'s description ("unreproduced
on retry") is still accurate and should be updated with this measurement.

### Tier 2 — silently wrong

---

**6. [INSTABILITY] Two registered stages are structurally unreachable, so
the only skill that writes `CONTEXT.md` never runs**

Severity: **high** · Dedupe: **NEW**

The registry declares five stages; `discovery` and `exploring` have **no
inbound edge from any production code**:

```
$ grep -rn "to: 'discovery'" src bin test
src/state/workflow-stage-graphs.mjs:98    (the declaration itself)
test/state/workflow-stage-graphs.test.mjs:45, :212
```

`fgos discover` jumps `clarify` → `decompose` directly
(`src/intake/discovery.mjs:181-186`, via `stageForStep(..., 'Divide')`).
The only mover into `exploring` (`src/runner/loop.mjs:1105`) requires
already being at `discovery` — dead code.

Across **all 482 items ever recorded**, `discovery` and `exploring` each
have **0** occurrences. Not "empty now" — never reached once.

Compounding it, `.claude/skills/fgos-routing/SKILL.md:137-143` — the table a
session reads first — insists on registry lookup and then hardcodes it
wrong: it names `fgos-coding-exploring` for `clarify`, where the registry says
`fgos-clarifying`.

*Cost, demonstrated by this very item:* `tsk-36i` went `clarify` →
`decompose` and arrived at `fgos-coding-planning`, whose Bootstrap step opens
*"read that feature's `CONTEXT.md` — the locked decisions are the only
source of truth."* No `CONTEXT.md` existed, because the only skill that
writes one sits on an unreachable stage. A paragraph was written into
`plan.md` rationalizing its absence. That paragraph is the defect's cost.
71 open items are at `clarify` behind this.

---

**7. [INSTABILITY] `sync-root` merges into the main checkout with no
clean-tree gate — and `merge-loop` calls it unattended**

Severity: **high** · Dedupe: **NEW**

`approve`'s local-merge path has the gate (`bin/fgos.mjs:2930`,
`isMainTreeClean`). `grep -n "isMainTreeClean" bin/fgos.mjs` → `127, 132,
2874, 2930, 4096, 4127` — **no hit inside `case 'sync-root'`**
(`bin/fgos.mjs:3256`). For a parentless root it runs `git merge --no-commit
--no-ff` on the shared working tree, then `git commit --no-edit`
(`src/runner/merge.mjs:904`), which commits the **whole index**.

*Cost:* another session's pre-staged changes get swept into the merge commit
silently; or the merge fails and is reported `merge-failed-unclassified`,
which is misleading — nothing conflicted. Not `tsk-n2x` (that is about
missing tests, not a missing gate).

---

**8. [INSTABILITY] Root-drift picks its merge target from `parent` without
checking the parent is finished — one item would merge into a dead branch**

Severity: **high** · Dedupe: **NEW**

`src/state/drift-status.mjs:65`:

```js
const targetBranch = rootItem?.parent ? `fgw/${rootItem.parent}` : trunk;
```

No check that the parent is resolved or its branch still live. `doctor`
currently reports `tsk-4n7 (fgw/tsk-4n7 is 335 commits ahead of
fgw/tsk-19y)`. That is not drift:

```
tsk-19y  status DONE          main...fgw/tsk-19y  →  340   0   (fully merged, frozen 08-07)
tsk-4n7  awaiting-approval    main...fgw/tsk-4n7  →    9   4   (current with main)
```

Diagnostic signature: `behind: 0, ahead: N-large`. Ordinary drift always has
`behind > 0`. The other two drifted roots (`tsk-2ie5`, `tsk-5wz`) are
ordinary.

*Cost:* `needsSync` is true, so `tsk-4n7` lands in `blockedOnSync` and
`fgos merge next` will `sync-root` it **into a done item's dead branch**.
`approve tsk-4n7` resolves `rootId = tsk-19y` and merges there too
(`bin/fgos.mjs:2984`). The work would be reported merged and never reach
`main`.

---

**9. [INSTABILITY] An item sits at `awaiting-approval` with a verify that
fails right now**

Severity: **high** · Dedupe: **partially `tsk-280`** — see below

`tsk-3fj`: `status: awaiting-approval`, `verify: node --test
test/runner/dispatch.test.mjs`. Ran it during this scan — **it fails**
(it is finding 4's failure). `awaiting-approval` is a status `fgos return`
grants only after re-running that exact command.

Event trail: a **human** rewrote the verify at 09:17:34; the item moved to
`awaiting-approval` at 09:18:02 — **28 seconds later**.

**Undetermined, deliberately:** whether it passed through `return` (a new
hole in the guard) or `fgos move` (`tsk-280`'s already-filed bypass,
reproducing 11 days later). `headAtReturn` is null on this item *and* on a
known-returned item, so that field does not discriminate. Both readings are
serious; picking the more dramatic one without evidence would be guessing.

The item's own event log names the underlying cause: *"a command reading
`.fgos/` cannot pass in `fgos return`'s detached-worktree re-verify
(ADR0020)"*. The verify was hand-rewritten **three times in 24 minutes**
chasing that constraint. A verify that cannot be expressed honestly is a
verify that gets edited until it passes.

---

**10. [SHIP-FASTER] `fgos list` returns 3.1 MB; the flag that fixes it is
undocumented and the documented one saves 6%**

Severity: **high** · Dedupe: **NEW**

```
$ node bin/fgos.mjs list            | wc -c   →  3141243
$ node bin/fgos.mjs list --limit 1  | wc -c   →  2935287   (6.5% saved)
$ node bin/fgos.mjs list --id tsk-5ui | wc -c →     2356   (1300x — undocumented)
```

`--help` states the limit plainly: `--cursor/--limit` paginate *the "work"
map* — so the `decisions` log (**1771 rows**) rides along unconditionally,
with `settlements` 386, `outcomes` 399, `discovery` 258, `learnings` 225.
`--id` appears in neither `--help` nor `--help --json`; its only mention
anywhere is inside a *different* verb's description.

*Cost:* roughly 800K tokens for the canonical "what work exists" read —
larger than most agents' entire context window. `fgos check` with no id is
the same shape at 216KB with **no** filter flag at all.

---

**11. [SHIP-FASTER] Gate-bypass matches heavy-risk keywords as substrings,
falsely blocking 12 real items**

Severity: **high** · Dedupe: **NEW**

`src/state/gate-bypass.mjs:130-133` uses `haystack.includes(keyword)`.
`src/intake/risk-keywords.mjs:43-52` exists specifically to prevent this
(`tsk-2as` D1: *"never merely as a substring inside a longer word"*), and
both other consumers already migrated (`src/intake/classify.mjs:63`,
`src/evolve/iron-law.mjs:87`). Gate-bypass is the sole holdout.

Real matches on the live backlog:

```
tsk-12t [auth]   -> "...verify authoring during fgos-coding-exploring..."
tsk-5ma [audit]  -> "...already done -- audited every other remaining caller..."
tsk-1tm [delete] -> "...shows these 6 as \" D\" (deleted) in git status."
```

Two agents counted this independently, on different denominators and both
agree: **21 of all 482 items** fire the substring floor but not
`matchesKeyword`; **12** of those are items whose tier `standard` already
covers, so tier is not what refuses them. `canAutoApprove:133` checks
`hardGateHit` **first** and returns false unconditionally, so they can never
auto-approve at any tier.

*Cost:* three gates each (`contextApprove`, `planApprove`, `validateApprove`)
→ up to **63** unnecessary human interrupts across the 21 (~36 across the 12
tier-covered ones). `fgos-fanout` inherits the same floor, so those leaves
fall out of fan-out auto-approval too.

---

**12. [SHIP-FASTER] `cook` and all three gate skills give a session opposite
instructions**

Severity: **high** · Dedupe: **NEW** (one bug, three sites)

`plugins/fgOS/skills/cook/SKILL.md:27-31` — *"**Never auto-approve a gate.**"*
`.claude/skills/fgos-coding-planning/SKILL.md:282-284, 313-314` — check
`canAutoApprove`, and on `true` *"skip the question."* Identical conflict in
`fgos-coding-exploring` (`:269-271`, `:313-321`) and `fgos-coding-validating` (`:177`,
`:210-213`).

Live on this repo: bypass level `standard`, and the check returned `true`
for this very item.

*Which is right:* the **skills**. `cook`'s rule ships in `94f314e`
(2026-07-28); gate-bypass lands the next day in `8aaacee` (2026-07-29) with
its own decision record, a fail-closed implementation, and a structured
audit trail. `cook`'s line is stale prose with no code behind it — but it is
the rule a reader reaches **first**.

*Encountered live:* this scan hit the gate, got `true`, and followed `cook`
— presenting both gates to the user. Two questions asked that the repo's own
configured policy says were not needed.

### Tier 1.5 — the state layer (reported late; nobody else could see these)

---

**12b. [INSTABILITY] `priority` — the frontier's primary sort key — is
degenerate on 69% of every item it has ever scored, and the "refined" pass
is strictly less informed than the rough one**

Severity: **high** · Dedupe: **NEW** (supersedes `tsk-sq9`'s framing)

`src/state/priority-formula.mjs:80` returns `Math.round(PRIORITY_SCALE /
(raw + 1))` with `PRIORITY_SCALE = 10000`. At `impact === 0` that is exactly
**10000** — the worst possible value under the ASC-absent-last contract,
ranked behind every scored item.

The two automated writers disagree on their inputs:

- `src/intake/discovery.mjs:218-221` (rough, at `clarify`) passes **both**
  axes: `blocks` *and* `semanticRelatedness`.
- `src/intake/plan.mjs:609` (documented at `:600-606` as *"the REFINED
  pass"*) passes `blocks` and `blastRadius` — **no `semanticRelatedness`**.

So the pass that runs second silently discards a component the first one
supplied. For a leaf with no blockers and no recorded blast radius, impact
collapses to 0 and priority becomes 10000. The live log shows exactly that:

```
items whose priority was rewritten : 162   (438 overwrite events)
  tsk-4y8: 449  --> 10000
  tsk-62d: 278 --> 323 --> 10000
  tsk-2ta: 192 --> 209 --> 10000

current distribution: {(absent): 293, 10000 (worst possible): 131, other: 58}
```

**131 of the 189 items ever scored (69%) now sit at the single worst
value.** `src/state/replay.mjs:308` folds with unconditional
`Object.assign(item, patch)` — latest wins, prior value never read.

---

**12c. [INSTABILITY] Two of the three priority axes are dead in practice**

Severity: **high** · Dedupe: **NEW**

```
work.urgent : {(absent): 476, low: 1, critical: 3, high: 2}
   -> weightForUrgency(undefined) = 1 for 476/482. The axis is a constant.

work.risk   : standard 210 | light 140 | heavy 65   (recognized: 415/482)
              medium 32, low 18, high 17 -> silently fold to standard (0.85)
```

Data Dictionary #6 declares `risk` as **free text**, so 67 items carry
values the formula cannot read, folded with a silent `??` (`:32`, `:36`).
With `urgent` constant and `risk` near-constant, priority reduces to roughly
`10000/(blocks + semanticRelatedness + 1)` — and per 12b the second pass
drops the second term.

The formula's own header calls its inversion *"the single highest-consequence
correctness risk in this feature"*. The inversion is correct. **The inputs
collapsed.** Live frontier right now: 5 items, all with `priority` absent —
so dispatch order currently falls through to declaration order entirely.

---

**12d. [INSTABILITY] Both automated priority writes swallow every error
with a bare `catch {}`**

Severity: medium · Dedupe: **NEW**

`src/intake/discovery.mjs:227-229` and `src/intake/plan.mjs:616-619`.
A `lock-timeout` (finding 1) or any write-door rejection drops the priority
write with zero signal. A run where every priority write failed looks
identical to one where they all succeeded — which is why 12b and 12c were
invisible in operation.

---

**12e. [SHIP-FASTER] Every read and every mutation replays the entire
10,539-event log; nothing is cached even within one call**

Severity: **high** for velocity · Dedupe: **NEW**

`src/state/replay.mjs:523-526` — `rebuildView` = `foldEvents(readEvents())`,
no snapshot, no incremental fold. `src/state/events.mjs:351` re-reads the
whole log **again** just to derive `seq`. Instrumented against a copy:

```
ONE moveWork (todo->doing) : 166ms,  3 full log reads (13.1MB parsed)
claimWork's state-layer seq: 274ms,  7 full log reads (30.6MB parsed)
```

`events.jsonl` is 4.5MB / 10,539 events and grows unboundedly.

---

**12f. [SHIP-FASTER] `.fgos/state.json` is write-only, costs ~86ms per
mutation, and is serialized twice**

Severity: medium · Dedupe: **NEW**

`src/state/store.mjs:100-101` writes `{...view, revision: viewRevision(view)}`
— and `viewRevision` (`replay.mjs:542-544`) does its **own**
`JSON.stringify` of the same 3.66MB object. Measured: 25.2ms + 17.7ms +
11.8ms write + 31ms rebuild. No production code reads the file (grep across
`src/` and `bin/` finds only comments; only `test/` reads it). It is also
written **outside** the lock (`:673` closes the lock scope, `:674` calls
`refreshView`) with a bare `writeFileSync`, no tmp+rename — so it can both
regress and be observed half-written, meaning it is not a usable recovery
artifact either.

---

**12g. [INSTABILITY] `events.lock`'s critical section is 65-88ms against a
2s timeout explicitly sized for "sub-millisecond to low-ms"**

Severity: medium · Dedupe: **matches `tsk-r87`** — which understates the cause

`src/state/events.mjs:41-51` states that assumption verbatim.
`src/state/store.mjs:457-673` then widened the section to include a full
`rebuildView` (`:458`) and `resolveWriterIdentity` (`:509`). Timed on the
live log: **65ms** with a session env var, **88ms / 78ms** in a bare
terminal or the git hook — so the 2s budget covers only ~22-35 serialized
holders, against configured parallelism of 4×4 = 16 workers. `tsk-r87` frames
this as "the timeout doesn't fit all operation types"; the real cause is
that the **one** operation the number was sized for now takes 60-90× its
documented estimate, and degrades as the log grows.

---

**12h. [INSTABILITY] `moveWork` spawns up to 3 `ps` subprocesses inside the
held global write lock**

Severity: medium · Dedupe: **NEW**

`src/state/store.mjs:509` calls `resolveWriterIdentity(dir)` inside the
`withEventsLock` closure opened at `:457`;
`src/runner/session-identity.mjs:136-143` walks `MAX_HOPS = 3` via
`execFileSync('ps', …)` **with no timeout**. Measured 0.2ms with a session
env var, **31.7ms** without (bare terminal, git hook, CI). A slow or hanging
`ps` stalls the single global write door for every `fgos` process.

---

**12i. [INSTABILITY] `porting-store.mjs` does read-check-append outside the
lock while its own comment claims parity with `store.mjs`**

Severity: medium · Dedupe: **NEW**

`src/state/porting-store.mjs:112-118` (dup-id) and `:130-140` (`movePorting`
CAS) call `rebuildViewFromLog` → check → bare `appendEvent`, which locks
only the append. `store.mjs:142-228` wraps read-check-append in **one**
`withEventsLock` scope precisely so the precondition cannot go stale. Two
concurrent `addPorting` on one id can both pass line 113. Low-traffic, small
blast radius — but the comment at `:103-104` asserts a guarantee that isn't
there, which is how the next reader gets it wrong.

---

**12j. [SHIP-FASTER] FSM refusals name only the illegal edge; `wontfix` is
unreachable from 7 of 10 statuses**

Severity: medium · Dedupe: **matches `tsk-2lc`**, whose description is wrong
in one respect and narrow in another

`src/state/status-fsm.mjs:213-218` builds the refusal from `from`/`to` only,
with the full `TRANSITIONS` table at `:99-152` in scope. Probed:

```
todo / doing / blocked            -> wontfix : OK
awaiting-approval                 -> wontfix : precondition
awaiting-human                    -> wontfix : precondition
delivered / retrospective / cleanup / done -> wontfix : precondition
```

`tsk-2lc` names a status `proposed` — **no such status exists**, it is
`awaiting-approval`. And the gap covers `awaiting-human` (7 live items) plus
the whole delivered→cleanup tail. Closing a parked item that turned out moot
requires inventing an `answer` string (`:245-253`) to reach `todo`, then a
second write — a fabricated entry in the permanent log.

*(`src/state/cursor.mjs:24,27` is the one place in the state layer whose
error messages state a remedy — use it as the template for the fix.)*

### Tier 3 — rot and waste

| # | Finding | Evidence | Dedupe |
|---|---|---|---|
| 13 | **Backlog premises rot silently.** 6 of 7 "red on main" items refuted; `tsk-1lg` stale by hours (claims 434 commits behind; actually re-indexed this morning, **39** behind). Nothing re-validates an item's premise before it is worked. | `.gitnexus/meta.json` `lastCommit 4ce7a96`, `indexedAt 08:20Z`; suite run refutes 6 | NEW |
| 14 | **`doctor` exits 0 with 4 of 11 checks failing** — cannot gate a hook, CI step, or predicate. Red for **8 days** on the machine that builds it, including one failure with a registered auto-fix nobody ran. | `doctor; echo $?` → 0; `docs/specs/distribution.md:151-152` spec'd | NEW |
| 15 | **`tool-registry-configured` can never fail** — all three return paths are `passed: true`, including `degraded`. Nothing anywhere reads index freshness. | `src/setup/registrations.mjs:326-345` | NEW |
| 16 | **122 dead rc source lines** error on every bash shell open; idempotency keyed on absolute path, so every worktree adds one. No fix path — removal is policy-manual. | `bash -i -c true 2>&1 \| wc -l` → 124; `src/setup/shell-rc.mjs:36-46, 56-58` | NEW |
| 17 | **Spec drift.** `fgos-plugin.md:146` "exactly 12 verbs" vs **32** shipping, `coverage: full`, edited today. `reading-map.md` — the mandated first read — points at a deleted file (`src/intake/judge-executor.mjs`), a deleted directory, and says "625 test" vs **2576**. **No spec's `updated:` matches its last edit (6/6 wrong).** | `ls plugins/fgOS/skills \| wc -l` → 32 | NEW |
| 18 | **`cleanup` closes an item to `done` even when teardown failed** — warnings swallowed. 3 items proven `done` while still holding branch + worktree. `tsk-u9k` is permanent: its `node_modules` **symlink** is not matched by `.gitignore`'s `node_modules/` (trailing slash = directories), so it reports `??` forever. | `bin/fgos.mjs:1285-1294`; `src/runner/merge.mjs:940-953` | NEW |
| 19 | **Claim worktrees are never torn down** at return/reject despite the contract saying they are; `wontfix` has no teardown path at all. **4.3 GB**, ~95 of 111 belong to items already past merge. | `src/runner/worktree.mjs:672-674` vs `grep -rn removeWorktree` | NEW |
| 20 | **`listLeftovers` spawns 2 git processes per `fgw/*` branch every runner cycle** — 1.28s at today's 117 branches, every poll, growing monotonically. | `src/runner/worktree.mjs:877-889` ← `loop.mjs:425, 1024, 1288` | NEW |
| 21 | **The CHANGELOG gate was never wired**, and the bootstrap commit's message claims it was. `grep -rn -i changelog src/ bin/ .githooks/ scripts/` → **no output**. 66 commits since, many user-visible, zero entries. | `CHANGELOG.md:8-17`; commit `5bbcbba` | missing automation = `tsk-12m`/`tsk-3ip`; **the false claim is NEW** |
| 22 | **`gh` is shelled out with zero doctor coverage** — a clean `AGENTS.md` gate violation. Sibling binary `claude` got both a check and a fix. | `bin/fgos.mjs:214-215, 2608, 2898`; `src/runner/github-adapter.mjs:41` | NEW |
| 23 | **One test file is 56% of suite wall time** — `test/setup/checks.test.mjs` = 108s of 194s, 13 tests at 10-14s each. | measured alone: `duration_ms 107778` | NEW |
| 24 | **~140 KB of skill prose loads per `/fgOS:cook` run** before the first repo file is read (~35k tokens). The `root=$(git rev-parse …)` block is restated in full in 4 skills — already drifted once, as finding 12 shows. | `wc -c` across the 9 skills in the chain | NEW |
| 25 | **Unknown and typo'd CLI flags are silently ignored** — `--limt 1` returns the full 3.1 MB dump, exit 0, no warning. Every *other* error path classifies correctly. | `list --limt 1` → `exit=0 size=3141243` | NEW |
| 26 | **`--help --json` has no globals section** — `--dir`, `--json`, `--pretty` accepted by every verb, documented nowhere machine-readable. This is exactly how finding 3 stays invisible. | `--help --json` top keys = `[schema_version, commands]` | NEW |
| 27 | **`discover`/`decompose --help` tell callers to omit `--verdict` to get a judge that was deleted** — the real path now throws. | `src/cli/command-registry.mjs:147, 165-173` vs `src/intake/discovery.mjs:191-201` | NEW |
| 28 | **`cook` forbids `fgos approve`, then routes into `fgos-fanout`, which calls it.** Fanout's reason is sound (leaf merges into `fgw/<root>`, never main) but neither `cook` nor `coding-driving` records the leaf-vs-root distinction; both say "always". | `cook:32-35` vs `fgos-fanout:90-95, 152` | NEW |
| 29 | **`fgos-routing` and `fgos-coding-driving` give opposite claim-timing rules.** On the cook path the item is unclaimed through `decompose`, so `fgos-coding-planning`'s "commit `plan.md` to `fgw/<id>` before calling `fgos discover`" is unexecutable as written — no such branch exists yet. | `fgos-routing:88-101` vs `fgos-coding-driving:113-115`; `fgos-coding-planning:86-89` | adjacent to `tsk-2gw`; contradiction is NEW |

## Unproven suspicions

Not findings. Each names what would settle it.

- **Iron Law may fire on a whole root subtree at root-approve.** A leaf's
  diff is correctly scoped to `fgw/<root>` (`bin/fgos.mjs:2843-2855`), but a
  root falls through to `detectTrunk`, covering every already-approved leaf.
  Could be deliberate. *Settle it:* find a root approve whose
  `matchedModules` are entirely attributable to acknowledged leaves.
- **The leaf→root merge may not need the global lock at all** — those merges
  run in detached worktrees landing on distinct refs, yet serialize behind
  one ~185s verify each. *Settle it:* confirm they share no write door.
- **`coding-classify-intake` may be genuinely dead in production**, not just
  mis-tested (zero textual references proven; runtime path not traced).
- **Why `test/setup/checks.test.mjs` costs 10-14s per test is unexplained.**
  The obvious hypothesis is refuted — `claude --version` is 75ms.
- **`fgos-coding-exploring`'s gate has no rejection path** — the `false` branch only
  covers "once the person approves". *Settle it:* decline at that gate and
  check whether `stage` advanced.
- **`distillery.md` may describe an area with no implementation here.**
- **`fgos doctor --fix` behavior unverified** — it writes; the read-only
  mandate held.
- **`.fgos/state.json` may regress under concurrency.** The window is real
  at code level (`store.mjs:673` ends the lock, `:674` rebuilds-then-writes,
  ~31ms between). **Could not reproduce** — 12, 40 and 60 concurrent
  `addWork` processes against a *fresh* store all matched the log exactly;
  on a fresh store the rebuild is sub-ms so the window barely exists.
  *Settle it:* same driver seeded with the real 4.5MB log and ≥4 writers.
  Likely no user-visible effect given 12f.
- **138 of 482 items (29%) are parked at `status: cleanup` behind a 7-day
  TTL** (oldest entry 6.8d; `.fgos/config.json` carries no `cleanup` key so
  the default applies; all 138 resolve as roots so `leafTtlDays: 0` never
  applies, and `pickNextCleanupItem` returns null). All 138 are re-serialized
  into the 3.66MB `state.json` on every mutation. Whether a 7-day park on
  29% of the backlog is intended design or accumulation nobody chose is a
  **product call**, not a defect anyone can assert.
- **`cleanup-harness.mjs:205`** computes `ttlMs = ttlDays * 86400000` with
  no numeric guard — `undefined` yields `NaN`, and `ageMs >= NaN` is always
  false, so it fails silently as "never ready" rather than erroring. Every
  in-repo caller supplies a real value (`bin/fgos.mjs:1260-1263`), so there
  is **no reachable path** today.

## Refuted — open items whose premise no longer holds

Do **not** work these as written. Re-read them first.

| Item | Claim | Verdict |
|---|---|---|
| `tsk-11t` | `architecture.test.mjs` invariant fails on main | **REFUTED** — passes (2.7ms) |
| `tsk-4jk` | `fgos-mirror` byte-identical check fails on main | **REFUTED** — passes (3.3ms) |
| `tsk-18g` | same mirror assertion | **REFUTED** — and a duplicate of `tsk-4jk` |
| `tsk-1u77` | install-packaging e2e fails | **REFUTED** — passes (4.27s) |
| `tsk-3at` | `npm test` in a worktree overwrites the real docs index | **REFUTED as reproducing** — fixed by `tsk-2ce`'s snapshot/restore |
| `tsk-5yz` | doc-index writes to main checkout from a worktree | **REFUTED** — experiment shows main untouched |
| `tsk-2dq` | `synthetic-domain` helper missing `--description` | **REFUTED** — already fixed at `:70` |
| `tsk-1lg` | code index 434 commits behind | **STALE** — re-indexed today, **39** behind |

`tsk-11f` (skills mirror drift) also appears resolved: `diff -rq` is
byte-identical except a `.claude`-only `gitnexus` directory.

## Checked and clean

Worth not regressing, and worth knowing nobody needs to look here:

- **Tests do not mutate the repo.** A SHA-1 manifest of all 20,296 files
  before/after the suite: 0 added, 0 removed, 2 changed — both attributed to
  *other* scan agents' CLI probes, not the suite. The `tsk-2ce` mitigation
  holds in both main checkout and worktree.
- **No flakiness anywhere.** The one failure is deterministic 3/3.
- **Worktree *count* costs nothing in time** — `git worktree list
  --porcelain` is 7ms at 134 entries; zero stale registrations. The cost is
  disk (4.3 GB) and branch count, not enumeration.
- `src/runner/write-queue.mjs` FIFO, `withMergeEphemeralWorktree`'s CAS
  guard, `abortMergeIfPossible`'s MERGE_HEAD handling, `lock-wait.mjs`
  backoff, `src/intake/classify.mjs`, `src/intake/risk-keywords.mjs` — all
  read, nothing found.
- **Exit-code contract is centralized and honored** (`src/state/store.mjs:66-74`,
  one consumer); **result envelope is consistent** on every read verb.
- **Config defaults do register** — all three added in the last 8 days went
  through `registerConfigDefault`. The `AGENTS.md` gate holds for config
  keys; it leaks only on shelled-out binaries (finding 22).
- **`compound-learn`, a retired stage, still sits on 158 items — all
  `status: done`.** Pure historical residue, nothing live. Cosmetic only.
- **Event-log integrity is clean, verified empirically rather than by
  reading:** `events=10539 dupSeq=0 nonMonotonic=0 seqGaps=0 missingSeq=0`,
  seq 1→10539 contiguous. Across 3,205 `work.move` + 1,777 `work.edit` +
  1,489 `work.outcome` events written by many concurrent sessions, not one
  duplicate or out-of-order seq. The lock primitive itself
  (`events.mjs:226-242` link-atomic create, re-read-before-unlink
  `:263-273`) is correct — findings 12g/12h are about the timeout constant
  and what callers do *inside* the lock, never the primitive.
- **Store CAS is correct where it is used** — `status-fsm.mjs:204-218`
  checks `expectedStatus` before the transition-table lookup, so a stale
  caller gets `conflict`, not a coincidental `precondition`.
  `addWork`/`editWork`/`moveWork`/`moveStage`/`registerTool`/`removeTool`
  all hold the lock across read-check-append. Only `porting-store.mjs`
  (12i) deviates.
- **Frontier and lineage are clean** — the FIFO/priority/intent ordering
  contract (`frontier.mjs:175-187`), `hasOpenDescendant`'s cycle guard
  (`:260-272`), `isResolvedStatus`'s hybrid read (`:247-252`). Also
  `cursor.mjs`, `retro-pool.mjs`, `cleanup-pool.mjs` (whose apparently
  unguarded `entered.ts` at `:54` is genuinely unreachable —
  `checkCleanupTTLElapsed:201-203` already returns `ok:false`; **not** a
  bug).

## Coverage

All six areas reported. Remaining **uncovered** inside the state layer —
read but not exhaustively audited, so treat as neither clean nor
implicated: `graph-metrics.mjs` (768 lines), `replay.mjs`'s remaining
per-event fold cases, `dep-graph.mjs`, `impact.mjs`, `drift-status.mjs`
(beyond finding 8), `tool-registry.mjs`, `awaiting-context.mjs`,
`discover-pool.mjs`.

## Suggested filing

Tier 1 and Tier 2 are ready to file as items. Two carry a caution:

- **Finding 4** — decide whether `coding-classify-intake` is dead *before*
  fixing the assertion, or the suite goes green over an open question.
- **Finding 9** — determine which door the item came through before
  choosing a fix; the two readings need different ones.

Findings 13 and 17 are the same shape as each other and as this whole
report: **the project's written state drifts from its real state, and
nothing detects the drift.** Eight refuted items, six wrong `updated:`
stamps, a spec off by 20 verbs, and a commit message claiming a gate that
was never wired — all found in a single afternoon's read. That pattern is
worth an item of its own, above any individual instance of it.
