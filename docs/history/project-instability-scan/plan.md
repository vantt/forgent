# project-instability-scan — plan

Item: `tsk-36i`. No `CONTEXT.md`: intent was already plain at stage
`clarify` (`fgos-clarifying` returned understood with no question earned,
only a truncated-title rewrite), so `fgos discover --verdict clear`
carried it straight to `decompose`. The item's own description already
fixes the two things a `CONTEXT.md` would have had to lock — the priority
order (ship-faster first, instability second) and the method (split by
AREA, parallel independent scan agents, report-only, no code changes).
Nothing material was left unaddressed, so there was no gap to hand back
to `fgos-coding-exploring` for.

## Mode

**standard** (1 flag counted, plus story-sized behavior):

- **multi-domain** — the scan spans every area in
  `docs/specs/system-overview.md`'s own Area Map (work-state, runner,
  fgos-plugin, distribution, enduser-docs-*, plus the skill-prose layer
  that drives all of them). This is the one flag that genuinely applies.

No hard-gate flag applies: nothing touches auth, no data can be lost
(the item is read-only by its own scope constraint), no audit/security
surface changes, no external provider, no validation is removed.

Not **tiny/small** despite the 1-flag count — the rule's own second
clause ("or story-sized behavior") is what puts this at `standard`. A
`small` lane would honestly mean one pass skimming the repo, and that
produces exactly what this item's own description forbids: unranked
guesses ("không suy đoán"). It would also risk filing duplicates into an
86-item open backlog that already carries items for several of the most
findable problems (see Dedupe below). The ceremony `standard` buys here
is the aggregation discipline — evidence per finding, dedupe against the
live backlog — not extra gates.

Not **spike** — no single yes/no question decides whether the work is
real; the scan is the work.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` →
`gitnexus` registered and `present`.

Posture: **degraded**, not full. `present` only means installed, never
that the index is fresh (`CLAUDE.md`'s own gate, tsk-j7y).

Corrected during execution: an earlier draft of this section said the
index was 805 commits behind, taken from item `tsk-1lg`'s claim that
`251d0b5` was the indexed commit. That was never checked against the real
`.gitnexus/meta.json`, and it is wrong. Live: `lastCommit
4ce7a967862bb14ad1d71a00589d26459a73727a`, `indexedAt
2026-08-09T08:20:39.545Z` — re-indexed this morning, **39** commits
behind `main`. `tsk-1lg`'s premise is stale; that item should be re-read
before anyone works it.

The posture verdict is unchanged — 39 commits behind is still `degraded`,
and the harness itself reports "GitNexus index is stale" — but the
durable problem `tsk-1lg` points at is not the number. It is that nothing
reports the number: `fgos tool query` returns `status: present` with no
freshness field, and doctor's `tool-registry-configured` check cannot
return `passed: false` at all (`src/setup/registrations.mjs:326-345` —
all three return paths are `passed: true`).

This costs this item nothing: no proof point below leans on blast-radius
evidence, because the item changes no symbols. Scan agents that consult
GitNexus must cross-check any zero-result or "not found" answer with
grep/rg before reporting it, per the same gate.

## Approach

One pass, fanned out by area, aggregated into one ranked report.

**Chosen path.** Run N independent scan agents concurrently, one per
area, each reading its own area spec under `docs/specs/` before it reads
code (`AGENTS.md`'s own "Before touching code" rule). Each returns
findings in a fixed shape. This session aggregates, dedupes against the
live backlog, ranks by real pain, and writes one report.

**Rejected: split into N fgOS child items, one per area.** This is the
alternative the phrase "chia team" most obviously suggests, and it is
wrong here for a reason that is itself the item's own top priority:

- Every child would carry a full lifecycle (clarify → decompose →
  executing → return) plus its own worktree and its own human merge
  approval — 6 merge gates for one read-only investigation that changes
  no code. That is ceremony bought with no isolation gained.
- Worse, it would not even be legal as shaped: every child writes into
  the same single report file, so `footprintOverlapAmong` would flag the
  siblings as a real collision before any of them started.
- The parallelism the item actually asks for ("chạy song song nhiều
  agent scan độc lập") is agent-level fan-out inside stage `executing`,
  which the Agent tool provides directly. It gets the same wall-clock
  speed at 1/6 the gate count.

The decomposition that genuinely belongs in the backlog comes out the
**other** end of this item: each mature finding is filed as its own new
item via `fgos submit`. That split is data-driven from evidence rather
than guessed from an area list up front.

**Areas (one agent each, 6 total).** Divided by the Area Map plus the two
cross-cutting layers it does not itself name:

| # | Area | Read first | Then |
|---|---|---|---|
| 1 | work-state core | `docs/specs/work-state.md` | `src/state/` — FSM, event log, locks, store, frontier, claim |
| 2 | runner + merge/approve | `docs/specs/runner.md` | `src/runner/` — dispatch, merge, capacity, loop |
| 3 | intake + lifecycle skill prose | `docs/specs/work-state.md`, `AGENTS.md` | `src/intake/`, `.claude/skills/fgos-*/SKILL.md` |
| 4 | CLI surface + plugin | `docs/specs/fgos-plugin.md` | `bin/fgos.mjs`, `plugins/fgOS/` |
| 5 | test-suite health | — | `test/` — what is red or flaky on main *right now* |
| 6 | distribution + spec/code drift | `docs/specs/distribution.md`, `docs/distribution-vision.md` | `src/setup/`, `docs/specs/` vs the code they describe |

**Risk map.**

| Component | How risky | What would prove it |
|---|---|---|
| Duplicate findings polluting an 86-item backlog | **Medium** — the most findable problems are exactly the ones already filed | Every finding is matched against the live `fgos list --json` before it is filed; a match links to the existing id instead of creating a new one |
| Speculative findings ("this looks racy") | **Medium** — the item's own text forbids them, and they are the cheapest thing for a scan agent to produce | Every finding carries `file:line` or a command that actually ran; unproven suspicions are reported as suspicions in their own section, never ranked as findings |
| Agent writes code despite the read-only scope | **Low** but the whole item's honesty depends on it | Verify's own `test -z "$(git status --porcelain -- src bin)"` clause fails if `src/` or `bin/` moved at all |
| Area 5 (test health) genuinely running the suite | **Low** | `npm test` output quoted in the report, not summarized from the backlog's existing claims |

**Dedupe — items already open that a scan will re-find.** These are named
so an agent links rather than files: red-on-main test claims `tsk-11t`,
`tsk-4jk`, `tsk-18g`, `tsk-1u77`; suspected races `tsk-3wq`, `tsk-76l`,
`tsk-4l8`, `tsk-107`; stale code index `tsk-1lg`; skill-mirror drift
`tsk-11f`; worktree `.fgos` symlink `tsk-3ra`.

**Ordering.** `fgos graph --json` puts `tsk-36i` in its own
single-item component — it blocks nothing and nothing blocks it, and it
appears nowhere on the `criticalPath` (depth 10, rooted at `tsk-4vo`) nor
in `topUnblock`. So graph metrics impose no ordering constraint here; the
six area agents are mutually independent and all start together.

## Shape

1. Dispatch 6 scan agents concurrently, one per area row above. Each is
   told: read your spec first; report-only, never edit; every finding
   needs `file:line` or a runnable reproduce command; rank your own
   findings; flag anything matching the dedupe list instead of filing it.
2. Aggregate every return into one ranked list. Rank by real pain, with
   the item's own priority order deciding ties: ship-faster friction
   above instability, instability above everything else.
3. Write `plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md`
   with the literal heading `## Ranked findings` (ASCII — the verify
   greps for it).
4. File each mature finding as a new item via `fgos submit`; link the
   rest to their existing ids.

**Cases worth proving against.** An area returning zero findings (must be
reported as zero, not padded). A finding that duplicates an open item
(must link, not file). A finding with no reproducible evidence (must land
in the suspicions section, not the ranked list). The suite being red for
a reason already filed (must link to `tsk-11t`/`tsk-4jk`/`tsk-18g`, not
re-file).

## Proof surface

```
test -f plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md \
  && grep -q '^## Ranked findings' plans/reports/project-instability-scan-260809-1608-ship-faster-stability-report.md \
  && test -z "$(git status --porcelain -- src bin)"
```

Three real clauses: the report exists, it actually carries a ranked
section, and the read-only scope constraint held (`src/` and `bin/`
untouched). This is the command recorded on the item by
`fgos discover --verdict clear --verify`.

## Outstanding questions

None
