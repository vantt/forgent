# events-jsonl-git-tracked-truncation — CONTEXT

## Feature boundary

tsk-cgg: `.fgos/events.jsonl` is simultaneously a live append-only store
(every `fgos` verb appends to it) and a file git-tracked in the shared main
checkout. On 2026-08-10, an ordinary `git stash push` on the main checkout
reverted the working file to HEAD, silently truncating it by ~65 events
(seq 11627-11691, from multiple sessions). Because `appendEventCore`
derives `seq` purely from the log's own last line
(`src/state/events.mjs:353`), the subsequent appends renumbered from the
cut point and produced a perfectly contiguous log — invisible to every
existing seq-contiguity guard by construction, not by omission. This item
covers: (1) real detection of this specific failure class going forward,
(2) confirming how much of it has already happened, undetected, in the
past. Out of scope (locked below): reopening decision D10 (untracking
`events.jsonl` from git), and recovering the specific 65 already-lost
events (confirmed unrecoverable — no branch, stash, or reflog entry
retains them; see the item's own description).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix stays confined to real detection; `.fgos/events.jsonl` stays git-tracked (decision D10, `docs/decisions/0020`, unchanged). The detection mechanism must compare against an external high-water-mark — a gitignored sidecar file recording the highest `seq` this machine has ever observed, updated on every successful check — because both existing seq-contiguity guards (`scripts/check-events-seq-contiguity.mjs` and the newer `src/state/events-jsonl-contiguity.mjs`/`events-jsonl-contiguous` doctor check from tsk-3wq) only inspect the current file's internal self-consistency and are confirmed, by direct code read, structurally blind to a truncate-then-renumber break. Rejected: untracking `events.jsonl` from git (the item's own direction (a)/(c)) — a nearly-identical scope question was already raised and rejected in tsk-3wq D1 ("bigger behavior change, loses git history of state changes, needs a new backup/restore story"), and that reasoning still holds; the real gap is a detection blind spot, not a wrong architecture. User confirmed. |
| D2 | The historical/forensic audit the item's own closing question asked for was run during this exploring pass, not deferred to planning or execution — see `RESEARCH.md` Round 2 for the full method and result. Verdict: 0 real regressions across all 272 parent→direct-parent commit pairs touching `.fgos/events.jsonl` since 2026-07-17 (the merge-conflict class, tsk-3wq's own target, has not silently recurred). Stash-style truncation incidence before tsk-cgg's own is confirmed **unknowable** via git-history diffing at any depth — a stash-truncation corrupts the working tree between commits and gets built over before the next commit, indistinguishable from organic growth in any committed snapshot. No further backward-audit tooling is in scope for this item; the RESEARCH.md finding itself is the deliverable for this question, and is exactly why D1's external high-water-mark (continuously updated, never itself subject to a git-revert) is the only mechanism that could ever answer this question going forward. |
| D3 | Detection severity: the new high-water-mark check is wired into `npm test` (same pattern as the existing `check-events-seq-contiguity.mjs`/`events-jsonl-contiguity.mjs` checks — picked up by the `test/**/*.test.mjs` glob), so a detected break blocks CI/merge. It is never wired into `appendEvent`'s own hot write path — every `fgos` verb call must keep succeeding even mid-incident (item's own "PHẢI GIỮ ĐÚNG" invariant). Recovery path, following the existing `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` precedent: since lost events are generally unrecoverable, a `doctor --fix`/runbook step re-baselines the high-water-mark forward once a human has seen and acknowledged the break — it cannot restore data, only unblock the gate. User confirmed. |

## Pinned terms

- **Live shared store**: `.fgos/events.jsonl` at the main checkout root —
  the one store this item's detection mechanism targets. Distinct from
  this item's own worktree, which (per decision 0020) never materializes
  `.fgos/` on disk at all — confirmed directly (`ENOENT`) during Round 1.
- **High-water-mark**: a value, stored outside `.fgos/events.jsonl` itself
  (a gitignored sidecar, not the git-tracked log), recording the highest
  `seq` ever observed on this machine. The one piece of state a git
  revert of the tracked file cannot also revert, which is exactly why it
  can catch what content-only contiguity checks (old and new) cannot.
- **Merge-conflict class vs. stash-truncation class**: two distinct
  failure vectors sharing one root cause (live + git-tracked). The
  merge-conflict class (tsk-n4i, tsk-3wq) corrupts `seq` values *within* a
  merge commit, leaving gaps/duplicates a content-only check can see, and
  is closed by tsk-3wq's `.gitattributes` union driver + contiguity check.
  The stash-truncation class (tsk-cgg) reverts the whole working file to
  an older HEAD state via an ordinary non-merge git operation
  (stash/checkout/reset/clean), after which normal appends renumber
  forward from the cut point, producing a log that is internally
  contiguous and therefore invisible to any check that only inspects the
  current file. This item closes the second class only; the first is
  already closed.

## Scout evidence cited

- `src/state/events.mjs:353` (`appendEventCore`) — `seq` derived from the
  log's own last line; confirmed by direct read.
- `.gitignore:4` and `git ls-files .fgos` (8 tracked paths, not just
  `events.jsonl`) — confirms git-tracking is deliberate (D10) and that the
  symlink/restore mechanisms (`session.mjs:1-6,104-127`,
  `docs/decisions/0020`) are generic across all 8 tracked `.fgos/*` paths,
  not specific to `events.jsonl` — untracking only `events.jsonl` (had D1
  gone the other way) would have left those mechanisms intact for the
  other 7.
- `docs/history/events-jsonl-merge-driver-recurring-write-loss/CONTEXT.md`
  (tsk-3wq, status `retrospective`) — D1 already rejected "stop-committing
  entirely" for the merge-conflict class; cites 3 prior recurrences
  (tsk-4vo's children, tsk-5td, tsk-2x9k) beyond the original tsk-n4i.
- `.gitattributes:12` (`.fgos/events.jsonl merge=union`) and
  `src/state/events-jsonl-contiguity.mjs` (`checkContiguity`/
  `fixContiguity`, registered in `src/setup/registrations.mjs:582-590` as
  doctor check `events-jsonl-contiguous` + a matching fix) — tsk-3wq's
  live, merged fix; read in full and confirmed structurally blind to a
  truncate-then-renumber break (compares the file only to itself, never to
  an external reference).
- Forensic audit (this item, Round 2): `git log --reverse -- .fgos/
  events.jsonl` (273 commits, 2026-07-17 to 2026-08-10), each compared to
  its own `git show <sha>^1:.fgos/events.jsonl` (272 valid parent-child
  pairs) — 0 real regressions found. An earlier, methodologically-flawed
  pass (comparing date-adjacent-but-not-ancestor commits) produced 2 false
  positives, corrected via `git merge-base --is-ancestor` before being
  trusted; full script and output preserved in `RESEARCH.md` Round 2.
- `node bin/fgos.mjs tool query --capability impact-analysis --status
  present --dir <root>` — GitNexus is registered and `present`
  (`impact-analysis: full` per `CLAUDE.md`'s three-way gate) — relevant
  once `executing` starts editing `src/state/events.mjs`/
  `src/setup/registrations.mjs`.
- `docs/how-to/resolve-an-events-jsonl-merge-conflict.md` — the existing
  runbook precedent D3's recovery path follows.

## Canonical references

- `docs/history/events-jsonl-merge-driver-recurring-write-loss/` (tsk-3wq)
  — the sibling item closing the merge-conflict class of this same root
  vulnerability; this item's D1/D2 both build directly on its evidence.
- `docs/history/live-events-seq-corruption/` (tsk-n4i) — the original
  incident tsk-3wq's own D1 traces back to.
- `docs/history/events-lock-concurrency-race/` (tsk-3ld) — ruled out as
  unrelated in Round 1 (this item's cause is confirmed git-operation
  driven, not a write race).
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — D10, the
  git-tracking decision this item's D1 leaves unchanged.
- `docs/history/events-jsonl-git-tracked-truncation/RESEARCH.md` — full
  evidence trail (Round 1 + Round 2) behind every decision above.

## Outstanding questions

None
