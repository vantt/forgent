# plan.md — tsk-myq: events-jsonl-truncation-guard.mjs default fileKey wrong for shard files

Mode: tiny

## Root cause (RESEARCH.md round 1)

`checkEventsJsonlTruncationGuard`/`advanceEventsJsonlTruncationGuard`
(`src/state/events-jsonl-truncation-guard.mjs:203,215`) default `fileKey`
to `path.basename(logPath)`. For a per-writer shard file under
`.fgos/events/<name>.jsonl`, the real fileKey every other caller uses —
`discoverGuardedFiles` (same file, ~line 233-249), the `fgos doctor` check
(`src/setup/registrations.mjs:1151-1198`), and
`forceRebaselineTruncationGuard` — is `` events/<name> `` (with the
`events/` prefix). Any direct `--check`/`--advance` CLI call
(`scripts/events-jsonl-truncation-guard.mjs`, which exposes no
`--file-key` flag at all) against a shard path silently reads/writes the
wrong sidecar entry.

RESEARCH.md round 1 resolved the item's own open interface question
(require an explicit `--file-key` flag vs. auto-derive): **auto-derive**,
matching `discoverGuardedFiles`'s already-established convention exactly,
because that convention is already a locked fact of this same file — not
a fresh product decision — and requiring a flag would just move the same
forgettable footgun one level up while adding new argv-parsing surface.
See RESEARCH.md for the full evidence (no `--file-key` precedent anywhere
in the repo; no "never guess" precedent covers a single-answer structural
derivation; zero real caller passes an events-parent-dir path that isn't
an actual shard file).

## Approach

Add one small shared helper in `src/state/events-jsonl-truncation-guard.mjs`:

```js
function deriveFileKeyFromLogPath(logPath) {
  const parent = path.basename(path.dirname(logPath));
  return parent === "events" ? `events/${path.basename(logPath)}` : path.basename(logPath);
}
```

- `checkEventsJsonlTruncationGuard`'s and `advanceEventsJsonlTruncationGuard`'s
  own `fileKey` default parameter switches from `path.basename(logPath)` to
  `deriveFileKeyFromLogPath(logPath)`. Behavior is unchanged for every
  existing caller that already passes `fileKey` explicitly (doctor,
  `forceRebaselineTruncationGuard`'s own internal loop) and for baseline-0
  (`.fgos/events.jsonl`, parent dir `.fgos` — falls through to the
  unchanged basename branch).
- `discoverGuardedFiles` keeps its own inline derivation as-is (already
  correct, already the reference this helper matches) — this plan does
  not touch it, to keep the diff minimal and avoid an unrelated
  refactor of working code.

**Impact-analysis gate (CLAUDE.md):** `fgos tool query --capability
impact-analysis --status present` → GitNexus registered and `present` →
posture starts `full`, but `mcp__gitnexus__list_repos` shows this repo's
own index (`/home/vantt/projects/forgentX`) is **2229 commits behind
HEAD**, and this item's own worktree isn't indexed at all → degraded in
practice, not full. Named per the gate rather than trusted blind: blast
radius was confirmed instead via direct `rg`/manual read across
`src/ scripts/ test/` for every real caller of
`checkEventsJsonlTruncationGuard`/`advanceEventsJsonlTruncationGuard`
(3 call sites: `discoverGuardedFiles`'s sibling convention,
`src/setup/registrations.mjs`'s doctor check, and
`test/state/events-jsonl-truncation-guard.test.mjs`) — a cross-check the
gate itself calls for when a tool's index posture is suspect.

## Files touched

- `src/state/events-jsonl-truncation-guard.mjs` — add
  `deriveFileKeyFromLogPath`; switch the two default-parameter expressions
  to call it.
- `test/state/events-jsonl-truncation-guard.test.mjs` — add cases: default
  `fileKey` for a `.fgos/events/<name>.jsonl`-shaped path reads/writes
  under `` events/<name> ``, not `` <name> ``; unchanged default for
  baseline-0 (`.fgos/events.jsonl`) stays `events.jsonl`.

## Risk

Light. One pure function added, two default-parameter expressions
switched to call it, in a file with existing, direct test coverage. No
schema change, no new CLI surface, no change to any caller that already
passes `fileKey` explicitly. The only observable behavior change is that
the previously-silent-wrong default becomes correct for shard paths —
strictly safer than today.

## No split

Single piece — one helper, two call-site switches, one file, plus its own
test cases. Not separable into independently workable pieces.

## Outstanding questions

None
