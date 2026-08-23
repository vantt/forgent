# Backlog ↔ execution reconciliation

Item: `tsk-3vv`. Reconciles every PBI row still marked `proposed` in
`docs/backlog.md` against the execution layer (`.fgos/state.json`) **and
against real code**, read in this worktree on 2026-08-08.

No PBI status is changed here. `docs/backlog.md` is a generated file
(`bee backlog render` from `.bee/backlog.jsonl`) and `.bee/` does not exist
in this repo, so flipping a row is not merely out of scope — it is not
possible from here. What to do with the `resolved` rows below is a decision
for whoever reviews this.

## How to read a verdict

| Verdict | Means | Evidence required |
|---|---|---|
| `resolved` | Real code/state already satisfies the row's CoS | ≥1 fgOS item id **and** ≥1 `path:line` |
| `partial` | Some claims satisfied, some not | Same, plus what remains |
| `open` | Nothing in the execution layer addresses it | none — an honest "still proposed" |
| `stale` | The mechanism the row complains about no longer exists | a `path:line` or a commit sha |

Every `resolved`/`partial` citation below was read in this worktree. A state
field or a prior report was never accepted as proof — that is the failure
mode this item exists to end.

## Result

30 proposed rows: **7 resolved**, **2 partial**, **2 stale**, **19 open**.

Nine rows (7 resolved + 2 stale) describe work the execution layer has
already finished or made moot, while the backlog still presents them as
available work. One of them is labelled `[NGHIÊM TRỌNG — rủi ro mất dữ liệu
thật]`, so a reader picking by severity would pick it first.

`node scripts/check-backlog-reconciliation.mjs` re-derives the proposed set
from `docs/backlog.md` on every run, so a newly added `proposed` row starts
failing until it is reconciled here.

---

### p-09351985 — verdict: partial

Tách core verb-logic thành lib gọi được độc lập CLI.

Half satisfied. Verb-logic **is** callable from Node without spawning the
CLI: this session's own gate-bypass check imported `listWork`
(`src/state/store.mjs:954`) and `canAutoApprove` directly, and the Iron Law
check imports `changedFiles`/`classifyIronLaw` the same way. `bin/fgos.mjs`
imports its logic from `../src/` (`bin/fgos.mjs:66` among many).

Not satisfied: "CLI trở thành client mỏng". `bin/fgos.mjs` is 4439 lines
with verb bodies inline in the switch — `case 'compound'` alone runs from
`bin/fgos.mjs:1319` with its validation and write logic in place, not
delegated to a lib function. No fgOS item claims this refactor.

Remaining: extract the inline verb bodies so the CLI is genuinely a thin
client. Related item `tsk-1ri` touched adjacent ground but does not claim
this CoS.

### p-28dd950c — verdict: open

Multi-focus: 2+ simultaneously active goals.

`fgos goal set` takes exactly one id and stores a singular `view.focus`
(`bin/fgos.mjs:3808`). No multi-focus concept exists in the state layer.

### p-2a39f940 — verdict: partial

Neither fgOS trigger path reaches an MVP2-equivalent outcome.

**(a) resolved.** `fgos return`'s branch-aware path exists:
`bin/fgos.mjs:2406` reads `item.branchHeadAtTake` as "the ONLY signal that
discriminates" and `bin/fgos.mjs:2414` counts commits on the item's own
`fgw/<id>` branch rather than the original checkout's HEAD.
`branchHeadAtTake` is written at claim time for every pick
(`src/runner/claim-port.mjs:139` region) — confirmed live in this session's
own claim, which recorded `branchHeadAtTake: e567cfb`. Items: `tsk-53f`
(claim choke-point), `tsk-k8u`.

**(b) not resolved.** `fgos-runner` still has no root override.
`bin/fgos-runner.mjs:98` calls `resolveRepoRoot(process.cwd())` and
`src/runner/paths.mjs:30` shells out to `git rev-parse --show-toplevel`
with no `--root`/`FGOS_ROOT` flag anywhere. Pointing the headless trigger
at a testbed still requires that testbed to be its own git repo.

Remaining: the (b) half — a cwd-rooted override for the runner.

### p-51f4eb7e — verdict: open

Bù version token cho CTR006 (routing-handoff).

`docs/routing-handoff-contract.md` still carries no version field of any
kind. The row's own condition ("làm khi CTR006 có code thật") has not been
triggered.

### p-782e25aa — verdict: open

STR46 buộc merge: viết lại kho fgos-test-drive.

Measured directly against the store the row names
(`/home/vantt/projects/fgos-test-drive/.fgos/events.jsonl`, which still
exists): 26 lines, **12 still carrying the legacy `payload.actor`**, 0
carrying `payload.role`, 0 declaring version 2, seq contiguous 1–26.

That matches the row's own stated scope ("26 dong, 12 dong mang ten cu")
exactly — the migration described has never run. `scripts/migrate-actor-to-role.mjs:1`
still exists, with its test at `test/scripts/migrate-actor-to-role.test.mjs:1`.

### p-88b4ae1e — verdict: open

Audit reservations release / releaseHolds call sites.

Targets the `bee` codebase (`.bee/bin` tree), which is not present in this
repo — `reservations`/`releaseHolds`/`resolveHoldTopology` appear nowhere
under `src/` or `bin/`. Nothing in fgOS addresses it and nothing here can.
It needs re-homing to wherever `bee` now lives, or dropping.

### p-99592f2a — verdict: open

anti-loop suy ra có-người-can-thiệp từ sự-kiện-mang-vai-người.

The proxy is unchanged and still exactly as described:
`src/runner/anti-loop.mjs:142` tests `event.payload.role === 'human'` AND
`src/runner/anti-loop.mjs:143` tests `answer !== undefined || reason !==
undefined`. No explicit human-intervention flag on the event exists.

The surrounding comment now documents the trigger-set as CLOSED
(`src/runner/anti-loop.mjs:114`), which bounds the decay the row warned
about but does not remove the proxy the row asked to replace.

### p-b822cf9f — verdict: open

STR46 buộc merge: viết lại kho `.fgos` sống từ checkout chính.

Measured against this repo's live store
(`/home/vantt/projects/forgentX/.fgos/events.jsonl`): 9820 lines, of which
**76 `work.move` events still carry the legacy `payload.actor`** with no
`payload.role`, all in seq range 4–337. 2079 moves carry the current
`role`. 0 lines declare version 2.

(The 553 raw `"actor"` matches in that file are mostly the *current*,
legitimate `actor` field on `work.gate-approve` (371), `work.stage` (44)
and `work.edit` (40) — counting them as legacy would have overstated the
gap nearly sevenfold. The 76 above are the real unmigrated ones.)

The row's stated scope ("111 dòng, 54 mang tên cũ") describes a different,
much earlier store than this one, but the underlying condition persists.

### p-bb89e653 — verdict: open

`resolveHoldTopology` ignores its own root argument.

Same as `p-88b4ae1e`: `resolveHoldTopology` exists nowhere under `src/` or
`bin/`. It targets the `bee` codebase, absent from this repo.

### p-dc785743 — verdict: open

bee write-guard's control-root resolution races against concurrent sessions.

Same as above — the `bee` write-guard is not in this repo. fgOS has its own
main-checkout lock (`.fgos/main-checkout.lock`), a different mechanism; no
fgOS item claims this row.

### STR27 — verdict: open

Orchestrator service tầng fleet.

No registry/heartbeat/lease/capacity service exists. The row's own gate
("chỉ mở khi có nhu cầu fleet thật") has not been triggered.

### STR36 — verdict: open

Metric riêng cho từng fix của vòng evolving.

No per-fix metric exists alongside `src/evolve/`'s entropy trend. The row's
own gate ("chỉ mở khi entropy-trend chứng minh không đủ nhạy") has not been
triggered.

### STR38 — verdict: open

Human-UI listener (web/chat) trên đất Host Adapter.

No HTTP/chat translator exists; there is no daemon or consumer layer under
`src/` at all. Stands on STR37/STR48, themselves unbuilt.

### STR48 — verdict: open

Kênh attention/push như một subsystem có delivery-semantics.

No consumer daemon exists — no at-least-once, dedup, routing, ack or
escalation machinery anywhere under `src/`. Three fgOS items reference it
(`tsk-42i` blocked, `tsk-5dj` todo, `tsk-65i` todo); none has delivered it.

### STR52 — verdict: open

Domain thứ hai THẬT: marketing.

`src/state/workflow-stage-graphs.mjs` registers `coding` as the only domain
ever driven through the loop; no `marketing` registry entry exists. The
row's own blocking scope question (shared store vs separate install) is
still unanswered — no decision record answers it.

### STR62 — verdict: open

Sibling-aware / agent-driven on-demand cross-item context.

No `sibling` concept exists in the data model; the only match under
`src/state/` is prose in a comment (`src/state/graph-harness.mjs:49`).
The row's own gate ("chỉ mở lại nếu baseline parent-only chứng minh không
đủ") has not been triggered.

### STR69b — verdict: open

Vệt event gần nhất + diff giàu hơn khi người quay lại gate.

`MATERIAL_FIELDS` is still exactly `['title', 'status']`
(`src/state/awaiting-context.mjs:15`) — unchanged from what the row
describes. The widening decision the row asks for has not been taken.

### STR70a — verdict: resolved

Checkpoint distillate + record chốt 3-phần lên gate.

All three CoS clauses are satisfied in real code:

- **`awaitingContext` carries the distillate + the 3-part record.**
  `src/state/awaiting-context.mjs:78` projects the agent's checkpoint as of
  the latest `ask` (`askRationale`/`askAlternatives`/`askSource`) and the
  human's final word as of `answer` (`rationale`/`alternatives`/`source`),
  replacing the old one-line `reason`. Written through
  `src/state/store.mjs:591`.
- **`actor` folded into the gate record.** `src/state/replay.mjs:442`
  writes `[gate]: { actor, at, verify }` onto `gates[id]` — the exact
  precondition the row named as missing. Confirmed live: this item's own
  `gates.tsk-3vv.planApprove` carries `actor: "human"`.
- **Distillate non-authoritative, only `answer` authoritative** — recorded
  as such at `src/state/awaiting-context.mjs:81`.

Items: `tsk-19zm` (D2/D4, done), `tsk-ma4` (done), `tsk-63c` (done).

### STR70b — verdict: open

Raw backstop cho cuộc bàn ở gate — chờ Q1.

Deliberately deferred by the row itself, and the blocker still holds: O3's
consumer/daemon layer does not exist under `src/` or `bin/`, and L1 has not
been opened for O2. Nothing has changed the shape of Q1.

### STR71 — verdict: open

Chất lượng câu hỏi gate (ask self-sufficiency).

No mechanism enforces or measures self-sufficient `ask` text. Referenced by
`tsk-539` (todo) and `tsk-65i` (todo); neither has delivered it.

### STR80 — verdict: open

`index.md` mỗi ngăn + `log.md` lịch sử đổi theo ngày.

No `docs/<quadrant>/index.md` exists. The row's own gate ("chỉ đáng làm khi
số tài liệu mỗi ngăn tăng thật") has not been triggered.

### STR81 — verdict: open

Kiểm lệch giữa frontmatter và log cho `enduser-docs-index`.

The authority side exists — `fgos doc-sources` is a real verb
(`bin/fgos.mjs:2180`) — but no drift check compares a document's
frontmatter source-links against it. The repo has analogous checkers for
decisions (`scripts/check-decision-citation-drift.mjs`), none for this.

### p-4b7dd2ed — verdict: resolved

`.gitignore` excluded `/docs/history/` while `fgos-coding-exploring` required
committing `CONTEXT.md` there.

`.gitignore` carries no `docs/history` entry at all, and **541 files under
`docs/history/` are tracked in git** — including
`docs/history/context-md-enforcement-scope/CONTEXT.md:1`, a committed
`CONTEXT.md`, which is precisely the file the row said could never be
committed. The contradiction the row describes no longer exists.

Fixed on `fgw/tsk-1wd` (commit `ffd211a`) as the row itself records.
Tracking item `tsk-2gw` is still `todo` despite the fix having landed.

### p-af05e742 — verdict: stale

`buildDiscoveryPrompt` gives the model no cwd/layout context.

The mechanism is gone. `buildDiscoveryPrompt` no longer exists anywhere in
`src/`, `bin/` or `test/`, and neither does the judge that used it:
`src/intake/discovery.mjs:13` records "RETIRED (tsk-1x3 D1/D9) … this
module used to spawn a nested `claude -p` judge (judgeDiscovery)".
`resolveDiscovery` now requires an explicit caller-supplied verdict — a
live session supplies the `verify` itself, from full repo context, which is
exactly what this session did for `tsk-3vv`.

Items: `tsk-1x3` (done, retired the judges), `tsk-1ni` (found the waste),
`tsk-5z0` (done, the item that had reproduced this class).

No prompt exists to add layout context to. If verify-path correctness
regresses under the caller-verdict protocol, that is a new item against a
different mechanism, not this row.

### p-4c81ca74 — verdict: stale

`buildDecomposePrompt` never reads `work.description` or `docsRef`.

Same retirement. `buildDecomposePrompt` exists nowhere in `src/`, `bin/` or
`test/`; `src/intake/plan.mjs:4` records "RETIRED (tsk-1x3 D1/D9/D16)
… this module used to spawn a nested `claude -p` judge (judgeDecompose)".
The `docsRef`-reading trust signal survived the retirement as
`readLockedContext` (`src/intake/discovery.mjs:24` imports it, and
`src/intake/discovery.mjs:81` records that it reads the item's `docsRef`),
so the
locked-decision context the row wanted is read — just not by a prompt.

Note: `tsk-1d3` is still `todo` and its title is this row's text verbatim.
That item is now moot for the same reason and should be closed with this
row.

### p-810b034e — verdict: resolved

No shared input-check layer records WHERE a malformed verb call came from.

Built. `src/cli/invocation-fault-log.mjs:86` exports
`recordInvocationFault({ fgosDir, cwd, verb, faultClass, message, argv })`,
which records the writer identity, the argv and the cwd — the
session/skill/original-command provenance the row asked for — resolved via
`src/cli/invocation-fault-log.mjs:37`'s `resolveWriterIdentity`. Wired into
the single CLI door at `bin/fgos.mjs:66`.

The row also demanded a real `fgos-coding-exploring` pass before construction
rather than deciding architecture in the backlog; that happened —
`docs/history/cli-invocation-fault-provenance/CONTEXT.md:3` names item
`tsk-5z0`, with a `plan.md` alongside it.

### p-58f890f3 — verdict: resolved

Case A has no guidance when a root decomposes into children each needing
their own worktree in the same live session.

Root-caused correctly by the row (fgOS created worktrees under
`/tmp/fgos-worktrees/`, while the harness requires `.claude/worktrees/` for
a second in-session switch), and fixed at the root cause:
`bin/fgos.mjs:2352` now passes `worktreeDir: path.join(repoRoot, '.claude',
'worktrees')`, with `bin/fgos.mjs:2338` recording why ("the harness's own
EnterWorktree tool only allows a second-or-later in-session switch when the
target sits there, e.g. a root item decomposing into a child mid-session").

Item: `tsk-424` (D1/D2), with `tsk-k8u` D2 fixing the root derivation.

Proven live: this very session claimed `tsk-3vv` and entered
`.claude/worktrees/tsk-3vv-5mHrFA` through `EnterWorktree`, the chained
switch the row said was refused. The manual absolute-path workaround the
row describes is no longer needed.

### p-26c4a4fd — verdict: resolved

`pick` forks every worktree from main, with no leaf-vs-root distinction.

Fixed, using exactly the `resolveRoot`/`branchNameFor(rootId)` pattern the
row asked for. `src/runner/claim-port.mjs:135` computes `rootId =
resolveRoot(view, id)`, `:136` derives `isLeaf`, `:137` takes the root
branch, and `:139` sets `baseRef` to that root branch — so a leaf's
worktree forks from `fgw/<rootId>`, not main.

It is also hardened past what the row asked: `:138` guards on the root
branch actually existing, because a leaf claimed before its root branch
was ever created would otherwise throw *after* `moveWork` had durably
committed the claim, orphaning the item in `doing`
(`src/runner/claim-port.mjs:125-134`).

Item: `tsk-53f` D1 (the claim choke-point this logic lives in).

### p-73d99989 — verdict: resolved

**[NGHIÊM TRỌNG — rủi ro mất dữ liệu thật]** `reclaimOrphanedCheckout`
force-removes ANY existing checkout without checking for a live session.

Patched in four layers, all inside `reclaimOrphanedCheckout`
(`src/runner/worktree.mjs:201`):

1. **DATA-LOSS GUARD** (`src/runner/worktree.mjs:183`, item `tsk-1os`) — a
   genuine crash-orphan is clean; a dirty checkout is refused.
2. **REPO-ROOT GUARD** (`src/runner/worktree.mjs:212`, item `tsk-k8u` D1) —
   refuses when the orphan resolves to `repoRoot` itself.
3. **LIVE SESSION GUARD** (`src/runner/worktree.mjs:226`, item `tsk-1tm`) —
   refuses when the checkout is the calling session's own live worktree, or
   one the session's cwd is nested inside. This is precisely what the row
   asked for.
4. `isCheckoutDirty` re-checked before the removal
   (`src/runner/worktree.mjs:255`, defined at `:168`).

Beyond the row's ask, `createWorktree`'s reuse path no longer destroys at
all — it *relocates* (`relocateOrphanedCheckout`, `src/runner/worktree.mjs:312`,
called from `createWorktree` at `src/runner/worktree.mjs:461`,
item `tsk-3lx`), so the one call site that caused the original zero-destroy
incident keeps the checkout alive at a new path.

This is the worked example that motivated `tsk-3vv`: a CRITICAL-labelled
row, still `proposed`, whose complaint was answered four times over. Item
`tsk-3yl` also cites it.

### p-b91d487a — verdict: resolved

`mergeRunnerItem` has no "already merged" check before `git commit --no-edit`.

Fixed with the exact mechanism the row proposed (`git merge-base
--is-ancestor`): `src/runner/merge.mjs:691` defines `isAlreadyMerged`,
`:693` runs `merge-base --is-ancestor`, and `src/runner/merge.mjs:815`
short-circuits `mergeRunnerItemLocked` on it before any merge/commit is
attempted — making the retry idempotent instead of dying on "nothing to
commit". Item: `tsk-3yl` D1 (`src/runner/merge.mjs:809`).

Two hardenings the row did not ask for, both of which matter for its
"treat as merged" proposal:

- The goal-check still runs on the already-merged path
  (`src/runner/merge.mjs:832`), so every `merged` outcome carries a real,
  freshly-executed verify rather than a assumed one.
- Bare ancestry is not trusted as proof the content is there —
  `branchContentMismatch` (`src/runner/merge.mjs:820`, item `tsk-15k` D1)
  catches a prior `merge -s ours` that recorded the parent while discarding
  the changes, and fails the merge instead of declaring it done.

## What this leaves for a person

1. Nine rows (7 `resolved`, 2 `stale`) present finished or moot work as
   available. Flipping them needs `.bee/`, which is not in this repo.
2. Two fgOS items are still open against work that is already done or moot:
   `tsk-2gw` (`todo`, for the fixed `p-4b7dd2ed`) and `tsk-1d3` (`todo`,
   for the retired `p-4c81ca74`).
3. Four rows (`p-88b4ae1e`, `p-bb89e653`, `p-dc785743`, and the `bee` half
   of the STR46 pair) target a codebase not present here. They need
   re-homing or dropping — they cannot be worked from this repo.
4. Two `partial` rows have a clean remaining half worth filing as its own
   item: the thin-CLI refactor (`p-09351985`) and the runner root override
   (`p-2a39f940` (b)).
