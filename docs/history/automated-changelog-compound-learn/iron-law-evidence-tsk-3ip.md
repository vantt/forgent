# Iron Law evidence — tsk-3ip

`classifyIronLaw` on this item's real committed diff (`main...fgw/tsk-3ip`,
run after committing, per the false-negative lesson in
`docs/how-to/produce-failing-test-first-proof-for-an-iron-law-gated-diff.md`)
returns:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

This is a real match, not a description-keyword false positive like
`tsk-469`'s own `iron-law-evidence.md` in this same feature dir —
`bin/fgos.mjs` is genuinely on `MODULE_RULES`
(`src/evolve/iron-law.mjs:20-38`), and this item genuinely adds code to it
(`collectChangelogNag`, wired into `collectCheckData`). A real
failing-test-first cycle follows below.

## Failing-test-first proof

The implementation and its tests landed together in one commit
(`fgos-coding-implement`'s "one commit per item" rule), so getting honestly
to red meant reverting only the two implementation files against the
parent commit while keeping the shipped test file exactly as it ships —
the same recipe `produce-failing-test-first-proof-for-an-iron-law-gated-
diff.md` names for this exact situation:

```
$ git show HEAD~1:bin/fgos.mjs > bin/fgos.mjs
$ git show HEAD~1:src/setup/registrations.mjs > src/setup/registrations.mjs
$ node --test test/setup/checks.test.mjs
```

Real failures, not invented ones — 5 of the file's 60 tests failed:

```
test at test/setup/checks.test.mjs:51:1
✖ DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md plus
  main-checkout-hook-wired, tool-registry-configured, config-awareness,
  dependencies-installed, gate-bypass-configured, root-drift,
  claude-plugin-marketplace, plugin-skill-cli-reachable, and
  changelog-unreleased-stale
  AssertionError: Expected values to be strictly deep-equal (missing
  'changelog-unreleased-stale' from the actual list)

test at test/setup/checks.test.mjs:148:1
✖ changelog-unreleased-stale fails when CHANGELOG.md exists but
  ## [Unreleased] has no pending entries
  AssertionError [ERR_ASSERTION]: DOCTOR_CHECKS is missing
  "changelog-unreleased-stale"

test at test/setup/checks.test.mjs:161:1
✖ changelog-unreleased-stale passes when ## [Unreleased] has a pending entry
  AssertionError [ERR_ASSERTION]: DOCTOR_CHECKS is missing
  "changelog-unreleased-stale"

test at test/setup/checks.test.mjs:173:1
✖ fgos check (CLI e2e) reports changelogNag and appends a checkpoint to
  changelog-nag-history.jsonl
  AssertionError [ERR_ASSERTION]: Expected values to be strictly
  deep-equal: actual: undefined, expected: {fileExists:true,
  hasEntries:false, deliveredCount:1}
```

(the fifth failing test, `changelog-unreleased-stale passes when
CHANGELOG.md does not exist`, failed the same
`DOCTOR_CHECKS is missing "changelog-unreleased-stale"` way as the two
above it)

```
ℹ tests 60
ℹ pass 55
ℹ fail 5
```

Restored the exact same two files back to `HEAD` (not a stash — `git
checkout HEAD -- <files>`, an equivalent restore since nothing else in the
working tree had touched them) and re-ran the identical command:

```
$ git checkout HEAD -- bin/fgos.mjs src/setup/registrations.mjs
$ node --test test/setup/checks.test.mjs
ℹ tests 60
ℹ pass 60
ℹ fail 0
```

Full `60/60`, in full — the same exact test code, red before the real
implementation, green after it.

## Full-suite regression check

`npm test` run directly against the real committed diff surfaced a second,
genuine gap this item's own planning missed: `test/setup/
registrations.test.mjs`'s "Data Dictionary #7" test enumerates the same
registered-check-id list a *second* time, against
`docs/specs/distribution.md`'s own prose row — a second spec/registry
agreement point `checks.test.mjs`'s own list (already updated) does not
cover.

```
✖ Data Dictionary #7 names exactly the registered doctor checks — no
  missing entry, no stale one
  AssertionError: actual list missing 'changelog-unreleased-stale'
ℹ tests 2681
ℹ pass 2673
ℹ fail 3
```

Fixed by adding `` `changelog-unreleased-stale` `` to the "Today's
registered checks" sentence in `docs/specs/distribution.md`'s Data
Dictionary #7 row (own commit, `docs/history/automated-changelog-compound-
learn/`). Re-ran the full suite after the fix:

```
ℹ tests 2681
ℹ pass 2674
ℹ fail 2
```

The remaining 2 failures are pre-existing and unrelated to this item's
diff, verified individually:

- `NEGATIVE: "orchestrator" does not appear in fgOS-owned prose outside the
  allowlist` — the exact same pinned-term guard failure `tsk-469`'s own
  `iron-law-evidence.md` (this same feature dir) already documented as
  pre-existing, now also naming this item's own `iron-law-evidence-
  tsk-3ip.md` among the leaked files (a docs-history artifact of *writing*
  evidence docs, not of this item's actual code diff) — none of the flagged
  files are ones this item's real diff touches.
- `the committed .fgos/config.json runner section declares the
  submit-assist-classify capacity...` — this worktree's own `.fgos/
  config.json` was deleted at worktree creation (`git status` showed `D
  .fgos/config.json` from the very start of this session, before any file
  this item touches was edited — ADR0020's documented "`.fgos/` is
  unconditionally wiped from every freshly-created worktree" behavior), so
  the test's own read of a committed `.fgos/config.json` fails in this
  worktree regardless of this item's diff.

Neither failure count changed between the pre-fix (3) and post-fix (2)
runs except for the one this item actually caused and fixed.

## Blast-radius cross-check (GitNexus)

`fgos tool query --capability impact-analysis --status present` returned
`gitnexus`, `status: present` (checked at `fgos-coding-planning` and again at
`fgos-coding-validating`), but this session's own `impact({target:
"collectCheckData", direction: "upstream"})` call returned `Target
'collectCheckData' not found` — a suspicious zero-result the AGENTS.md
capability gate says to cross-check rather than trust, and the repo's own
post-tool hook confirmed why: `GitNexus index is stale (last indexed:
4ce7a96)`. `detect_changes({scope: "compare", base_ref: "main"})` was also
attempted and returned `changed_files: 1` against this item's real 4-file
diff (`bin/fgos.mjs`, `src/setup/registrations.mjs`, `test/setup/
checks.test.mjs`, `docs/specs/distribution.md`) — internally inconsistent,
confirming the index is genuinely stale for this branch, not a real
zero-impact result. Per `CLAUDE.md`'s capability gate, this is **degraded**:
GitNexus is registered and `present`, but its index cannot be trusted for
this diff.

Cross-checked with grep instead: `grep -n "collectCheckData"
bin/fgos.mjs` returns exactly two lines — the function's own definition
and its one call site (`case 'check'`'s CLI dispatch). `collectCheckData`
has exactly one caller; this item's only change to it is a purely additive
new field (`changelogNag`) on its returned object, matching the RUL11
optional-additive discipline every other field on that object (
`missingOutcomeNag`, `entropy`) already follows. No other symbol this item
touches (`checkChangelogUnreleasedStale`, `unreleasedHasEntries`,
`extractUnreleasedSection`, `collectChangelogNag`,
`appendChangelogNagHistoryEntry`, `changelogNagHistoryPath`) is an edit to
an existing symbol — all five are new.

## Verification source

- `src/evolve/iron-law.mjs` — confirms `bin/fgos.mjs` is a real
  `MODULE_RULES` entry, not a description-keyword match.
- `git show HEAD~1:<file>` / `git checkout HEAD -- <file>` — the real
  before/after revert-and-restore commands run this session, transcripts
  above are the real stdout.
- `node --test test/setup/checks.test.mjs` — run three times this session
  (red, green, and the item's own final verify), all real runs.
- `npm test` — run twice this session (pre-fix 2673/2681, post-fix
  2674/2681), full logs captured to this session's scratchpad.
- `docs/history/automated-changelog-compound-learn/iron-law-evidence.md`
  (tsk-469, this same feature dir) — precedent confirming the "orchestrator"
  guard failure is pre-existing and unrelated to this feature's own diffs.
- `git status` at worktree entry (this session's own transcript, before any
  edit) — confirms `.fgos/config.json` was already deleted in this
  worktree prior to any change this item made.
