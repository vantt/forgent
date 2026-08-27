# Research: tsk-myq — events-jsonl-truncation-guard.mjs default fileKey wrong for shard files

## Round 1 — 2026-08-27 (fgos-researching, called from fgos-coding-discovering)

**Asked:** The item's own description leaves one interface question open:
should the fix (a) require an explicit `--file-key` CLI flag whenever
`scripts/events-jsonl-truncation-guard.mjs`'s `--check`/`--advance` is
invoked against a path under `.fgos/events/` (refuse to guess), or (b)
auto-derive the correct `events/<name>` key automatically whenever the
given `logPath`'s parent directory is named `events`, matching the
derivation `discoverGuardedFiles` already implements? Is this resolvable
from existing repo convention, or a genuine product-judgment gap?

**Checked:**
- `src/state/events-jsonl-truncation-guard.mjs:203,215` — the two buggy
  defaults (`fileKey = path.basename(logPath)`).
- `src/state/events-jsonl-truncation-guard.mjs:233-249` — `discoverGuardedFiles`,
  which already implements the correct derivation: baseline-0 is tagged
  `"events.jsonl"`; every `*.jsonl` file directly under
  `<fgosDir>/events/` is tagged `` `events/${name}` ``. This function lives
  in the SAME file as the two buggy defaults — no cross-module import is
  needed to reuse its derivation rule.
- `src/setup/registrations.mjs:1151-1196` — the `fgos doctor` check
  duplicates the same `events/${name}` derivation inline rather than
  calling `discoverGuardedFiles` (a separate, pre-existing duplication,
  out of this item's scope — noted, not touched).
- `scripts/events-jsonl-truncation-guard.mjs:18-37` (`parseArgs`) — the CLI
  wrapper's `--check`/`--advance` modes take exactly two positional args
  (`<log> <guard>`) today; there is no `--file-key` flag anywhere in this
  file, confirming the bug description's claim that this footgun is real
  for any direct CLI caller. Confirmed via `rg -n "file-key|fileKey"` across
  `scripts/ src/ docs/` — zero existing `--file-key`-shaped flag precedent
  anywhere in the repo.
- `docs/how-to/resolve-an-events-jsonl-truncation.md` — the current doc
  only documents `--force-rebaseline-all` (which is unaffected, since
  `forceRebaselineTruncationGuard` calls `discoverGuardedFiles` internally
  and never hits the buggy default path). No live doc currently steers a
  person toward the buggy `--check`/`--advance` single-file invocation
  pattern the bug description warns about.
- Repo-wide "never guess" convention search (`rg -n "refuse to guess|never guess"`
  across `src/ docs/`): every real hit is about genuine *ambiguity*
  requiring a person or an explicit identifier — e.g. `worktree.mjs:998`
  refuses to "guess a merge" over stray uncommitted dirt (multiple valid
  resolutions, no single correct answer derivable from state alone);
  `docs/specs/fgos-plugin.md:153` requires an empty *required* argument to
  be asked or refused, never silently defaulted; `tsk-5nz`'s GitNexus
  repo-param work refuses a bare short name when *multiple* repos are
  registered. In every one of these, "guessing" means picking among
  several structurally-plausible answers with no deterministic tiebreaker.
  None of them cover the shape here: a single, already-implemented,
  unambiguous, purely-structural derivation (`parent dir literally named
  "events"` → prefix `events/`) that a sibling function in the exact same
  file already treats as ground truth.
- No `docs/decisions/` or `docs/specs/` entry settles this exact
  require-flag-vs-auto-derive tradeoff for this file; no D-ID found.

**Found:**

1. **The derivation is not actually ambiguous — it's already a locked
   fact of this file, just not reused.** `discoverGuardedFiles` (same
   file) is the single existing source of truth for "what fileKey does a
   path under `.fgos/events/` get" — `events/<name>` whenever the
   immediate parent directory is `events`. `checkEventsJsonlTruncationGuard`/
   `advanceEventsJsonlTruncationGuard` only ever receive `logPath` (no
   `fgosDir`), but the same rule — `path.basename(path.dirname(logPath)) ===
   'events'` → fileKey `` `events/${path.basename(logPath)}` ``, else the
   existing `path.basename(logPath)` fallback for baseline-0/legacy
   callers — reproduces `discoverGuardedFiles`'s own rule exactly, without
   needing `fgosDir` at all.
2. **Auto-deriving is a strict correctness fix, not a new footgun.**
   Today, ANY direct `--check`/`--advance` call against a shard path is
   *silently wrong* (reads/writes the wrong sidecar key). Auto-deriving by
   parent-dir name makes it *correct by default* for the one shape this
   tool exists to guard (`.fgos/events/*.jsonl`), with zero behavior change
   for the existing baseline-0 caller (parent dir is `.fgos`, not
   `events` — falls through to the unchanged `path.basename(logPath)`
   default).
3. **Requiring an explicit `--file-key` flag adds a second, redundant
   convention for the same fact `discoverGuardedFiles` already encodes** —
   exactly the "re-deriving the convention a second way" the bug
   description itself flags as the thing to avoid, and it does not remove
   the footgun: a caller can still forget to pass the flag (or pass the
   wrong string), same failure mode moved one level up, now with new
   argv-parsing surface (`scripts/events-jsonl-truncation-guard.mjs`'s
   `parseArgs`) to maintain and test.
4. **No real-world caller invokes `--check`/`--advance` against a path
   whose parent directory is coincidentally named `events` for an
   unrelated reason.** This is a narrow internal diagnostic CLI scoped
   entirely to `.fgos/events.jsonl` and `.fgos/events/*.jsonl` — its own
   header and every existing call site (doctor check, this bug's own
   description, the how-to doc) only ever names paths inside `.fgos`.

**Verdict basis:** scope resolved by this session's own judgment from
direct code evidence (no product-judgment gap requiring a person) —
**auto-derive**, implemented as a small shared helper in
`src/state/events-jsonl-truncation-guard.mjs` (e.g.
`deriveFileKeyFromLogPath(logPath)`) that `discoverGuardedFiles`,
`checkEventsJsonlTruncationGuard`'s default, and
`advanceEventsJsonlTruncationGuard`'s default all call, so the rule is
defined exactly once. No new CLI flag needed — YAGNI, since the auto-
derive path already fixes every real caller (the doctor check, the CLI
wrapper, and `forceRebaselineTruncationGuard`) without adding surface
area.

**Proposed verify:** `node --test test/state/events-jsonl-truncation-guard.test.mjs`
(existing test file already covers this module; the fix adds cases for
`checkEventsJsonlTruncationGuard`/`advanceEventsJsonlTruncationGuard`
called with a `.fgos/events/<name>.jsonl`-shaped path and no explicit
`fileKey`, asserting the sidecar is read/written under `` `events/<name>` ``
not `` `<name>` ``).
