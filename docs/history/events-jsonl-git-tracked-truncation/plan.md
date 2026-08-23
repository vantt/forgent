# events-jsonl-git-tracked-truncation — plan

Mode: **high-risk**

Lane decided directly by this session (direct-entry: `/fgOS:pick` →
`fgos-coding-driving` never routed through `fgos-routing`'s Orient step, and
no earlier `Mode:` line exists yet — applying `fgos-routing`'s own
Mode-gate table per its direct-entry fallback). Flags counted: **audit/
security** (this item is about the integrity of fgOS's own audit/event log,
the L3 "source of truth" store) and **data loss** (the item exists because
real events were permanently lost) both apply — either alone is a
hard-gate flag per the Mode-gate table, so `high-risk` regardless of the
rest of the count. Also present: **existing covered behavior**
(`src/state/events.mjs`, `src/setup/registrations.mjs` are both tested
today) and **weak proof around the area** (this exact root cause has
already produced 5 known incidents — tsk-n4i, tsk-4vo's children, tsk-5td,
tsk-2x9k, tsk-cgg itself — across two distinct git-operation vectors).

## Approach

**Chosen path:** a new, dedicated guard module that tracks an external
high-water-mark **by content, not just by number** — `{lastSeq,
lastLineHash}` of the log's own last line, stored in a gitignored sidecar
next to `.fgos/events.jsonl`, updated only after a clean check. On each
check: read the log's current last line. If its `seq` is lower than the
stored mark → an obvious regression, break immediately. Otherwise, look up
the line in the **current** file whose `seq` equals the stored mark's
`seq`, and compare its content hash to the stored `lastLineHash`. A
stash-truncate-then-reappend always reuses that same `seq` for a
**different** event (§ CONTEXT.md's own "why nothing detected this"
finding) — so a hash mismatch at that position is the direct, structural
signature of exactly this failure class, and unlike a bare
`currentSeq >= storedSeq` comparison, it stays caught even after the log
has grown back past the old mark (closes a blind-window a seq-only design
would have — see Risk map, row 1).

**Rejected alternatives:**
- *Seq-only high-water-mark (no content hash).* Rejected during this
  planning pass: once the post-truncation log regrows past the old
  recorded `seq`, a seq-only check would go quiet again even though the
  underlying corruption (two different events sharing one `seq` value)
  is already permanent — a real blind window, not a hypothetical one.
  The content-hash version closes it for the same storage cost.
- *Full historical hash chain (verify every position, not just the
  latest).* Rejected as more than this item needs (YAGNI) — a
  single-position checkpoint, refreshed on every clean run, already
  catches the class of incident this item exists to close; a full chain
  is real added complexity for a security property nothing here asks for.
- *Untracking `events.jsonl` from git (CONTEXT.md D1).* Already locked
  and rejected in `CONTEXT.md` — cited, not re-argued here.

**Risk map:**

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| Blind-window between the seq-only and content-hash designs | Medium — the content-hash design is the chosen fix for a real gap found during this planning pass, but has not yet been proven against a synthetic repro | Write a test that: builds a synthetic log, records a mark, truncates + reappends past the old mark (simulating full recovery), and asserts the guard still flags it — must go RED against a seq-only stub and GREEN against the content-hash design, per the Iron Law |
| `appendEventCore` (`src/state/events.mjs:353`) — confirmed CRITICAL/hub by GitNexus (14 impacted symbols, 12 execution flows, `impact-analysis: degraded` — GitNexus registered and present but its index is flagged stale as of this session; qualitative finding trusted, exact counts not) | High if touched, zero if untouched | The new guard module must never be imported by or called from `appendEventCore`/`readEvents`'s own hot path — proof point is a grep/import check: the guard module has zero inbound edges from `events.mjs`'s write path, only from `registrations.mjs` (doctor) and its own CLI wrapper |
| First-run bootstrap (no sidecar exists yet) | Low but real — a naive "no mark = seq 0" would falsely flag every existing repo's real history as one giant "regression" on first run | On first run (sidecar absent), the guard must bootstrap from the CURRENT file's own last line (never from 0) and report `ok` — proof point: a fixture with a pre-existing, healthy multi-line log and no sidecar must pass on first run, not fail |
| Doctor-check wiring precision (refines `CONTEXT.md` D3's own wording) | Low — clarifying, not reversing | `CONTEXT.md` D3 says "wired into npm test... same pattern as `check-events-seq-contiguity.mjs`" — on inspection, `check-events-seq-contiguity.mjs`'s test-glob wiring is the OLDER precedent; the newer, more directly analogous sibling `events-jsonl-contiguous` (tsk-3wq) is instead a `fgos doctor` **registerCheck**, run against the real repo, never a unit test against a live file (repo convention confirmed in `RESEARCH.md` Round 1: no test in this repo reads the real `.fgos/events.jsonl`). This plan follows the doctor-check precedent, not the test-glob one — the outcome D3 actually locked (`blocks the item's own verify — "npm test && node bin/fgos.mjs doctor" — never the hot write path`) is unchanged either way, so this is a wiring-mechanism correction, not a material scope change; not sent back to `fgos-coding-exploring` per this skill's own material/grounded/answerable filter |

**Files touched** (refines the item's own originally-declared footprint —
this plan adds two new dedicated files, following the exact modularization
precedent tsk-3wq itself set with `events-jsonl-contiguity.mjs`, rather
than growing `events.mjs` itself):

1. `src/state/events-jsonl-truncation-guard.mjs` (new) — pure core
   (`checkTruncationGuard`, `updateTruncationGuardMark`) + a thin
   filesystem wrapper, mirroring `events-jsonl-contiguity.mjs`'s own
   internal shape exactly.
2. `scripts/events-jsonl-truncation-guard.mjs` (new) — thin CLI wrapper,
   mirroring `scripts/events-jsonl-contiguity.mjs`.
3. `src/setup/registrations.mjs` (modify) — register a new doctor check
   `events-jsonl-not-truncated`. **No matching `registerFix`** — unlike
   the contiguity check, a detected break here means real data is already
   gone; auto-fixing (silently re-baselining) would erase the loud signal
   before a human ever saw it, defeating the reason this item exists. The
   re-baseline-after-acknowledgment step is a documented manual command,
   not a blanket `doctor --fix` sweep.
4. `.gitignore` (modify) — add the new sidecar path, same section as the
   other `.fgos/*` exclusions already there.
5. `docs/how-to/resolve-an-events-jsonl-truncation.md` (new) — the
   runbook for the manual re-baseline step, mirroring
   `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`'s own shape
   and cross-referenced from the doctor check's own failure message
   (same pattern `check-events-seq-contiguity.mjs`'s error text already
   uses).
6. `test/state/events-jsonl-truncation-guard.test.mjs` (new) — unit tests
   for the pure core, synthetic fixtures only (repo convention, confirmed
   in Round 1 research — no test in this repo reads the live file).
7. `test/setup/checks.test.mjs` (modify) — coverage asserting the new
   check is registered and reachable via `fgos doctor`'s registry (item's
   own originally-declared footprint already named this file).

`src/state/events.mjs` itself (in the item's original footprint) is
**not** modified by this plan — the guard reads the log independently,
read-only, the same arm's-length relationship `events-jsonl-contiguity.mjs`
already has to it. Left in the footprint list above only as a citation,
not a file this plan writes to.

**Order:** no other work item depends on or is blocked by tsk-cgg (`fgos
graph --what-if tsk-cgg --json`: `unblocksTransitive: 0`, empty
`newlyReady` — a standalone item, no cross-item sequencing pressure).
Internal order: (1) the pure-core guard module + its unit tests first —
proves the content-hash design against the synthetic repro named in the
risk map before anything is wired in; (2) the doctor-check registration +
its `checks.test.mjs` coverage; (3) the `.gitignore` entry and the runbook
doc, which have no code dependency on the first two and can land alongside
either.

## Split decision

No split. One coherent, honestly-sized piece of work: a single new guard
module, its registration, and its recovery doc — all tightly coupled (the
doctor check is meaningless without the guard module; the runbook is
meaningless without the doctor check's own failure message pointing to
it). The item's own originally-declared footprint (5 files) already
signaled this was conceived as one piece; this plan grows that list to 7
(2 new dedicated files + a new runbook) for the reasons in Files touched
above, without changing that it's one deliverable.

## Concrete cases to prove (high-risk depth)

- Empty/boundary: a log with exactly one line (bootstrap case — no prior
  mark) must pass, never false-flag.
- Regression, obvious: current last `seq` strictly lower than the stored
  mark's `seq` → break, unconditionally.
- Regression, hidden by regrowth: current last `seq` **higher** than the
  stored mark's `seq`, but the line now AT the mark's own `seq` position
  has different content than what was last recorded there → break (the
  case this item exists for — tsk-cgg's own real incident, replayed as a
  synthetic fixture).
- Existing behavior that must not regress: a healthy, growing log with no
  truncation, checked repeatedly across many clean runs → always passes,
  mark always advances forward, never a false positive.
- Concurrent access: the guard's own read must never block or race
  `appendEvent`'s lock (`withEventsLock`) — read-only, unlocked, same
  precedent `checkEventsJsonlContiguity` already uses (documented
  rationale: "a report that races a concurrent append at worst reads a
  slightly stale snapshot, never a torn/corrupt one").
- Partial failure: sidecar file itself missing, corrupt, or unreadable →
  treated as first-run bootstrap (never a hard crash of `fgos doctor`
  itself), matching `checkContiguity`'s own "never throws on the expected
  finding" posture.

## Outstanding questions

None
