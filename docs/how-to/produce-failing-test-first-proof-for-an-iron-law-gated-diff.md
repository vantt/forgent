# Produce failing-test-first proof for an Iron Law-gated diff

`tsk-62v` touched `src/runner/dispatch.mjs` and `src/runner/loop.mjs` —
both on the Iron Law's self-modifying-capable module list
(`src/evolve/iron-law.mjs`'s `MODULE_RULES`) — so `fgos approve` refused
to merge it without `--acknowledge-iron-law`, and that flag only means
something if the failing-test-first proof behind it is real. Here is the
concrete recipe this item actually used to produce that proof, from its
own committed `docs/history/tsk-62v/iron-law-evidence.md`.

## The recipe

1. Identify exactly which test files the item's own diff touches or adds:
   ```
   test/runner/dispatch.test.mjs test/runner/loop.test.mjs test/e2e/runner-loop.test.mjs
   ```
   This is the same command run before and after — not two different
   scopes.

2. **Get to red honestly** — stash only the implementation files, keep the
   new/modified test files exactly as they'll ship:
   ```
   git stash push -- src/runner/dispatch.mjs src/runner/loop.mjs src/state/tool-registry.mjs
   ```
   Running the test command now against pre-implementation code produces
   real failures — not invented ones. In this item's case: one test file
   failed to even load (`SyntaxError: ... does not provide an export
   named 'EXECUTOR_KINDS'`) because the test imports a symbol the
   implementation hasn't created yet; two other test files had real
   assertion mismatches (`actual` vs `expected` event sequences missing
   the new `executor.dispatch` event). Paste the real stderr/assertion
   output into the evidence file — never a paraphrase or a "would have
   failed because...".

3. **Get back to green** — restore the exact same stash:
   ```
   git stash apply
   ```
   (`apply`, not `pop`, so the stash isn't dropped until the green run is
   actually confirmed — a safety margin against a broken restore).
   Running the identical test command now should pass in full:
   `143/143` in this item's case.

4. Also run the full suite (`npm test`) once more and record the pass
   count — proof the fix didn't regress anything the scoped test command
   wouldn't have caught (`1996/2001`, 5 pre-existing skips, matching the
   pre-implementation baseline).

5. If GitNexus is available, run `detect_changes()` against the real diff
   (`base_ref: main`) and record its risk level and affected-process list
   — a second, independent confirmation that the blast radius matches
   what the plan actually described, not a symbol or process nobody
   scoped for.

6. Write all of the above into `docs/history/<id>/iron-law-evidence.md`
   and commit it in the same commit as the implementation
   (`fgos-coding-implement`'s "one commit per item" rule) — before `fgos return`.

## Why the stash-and-restore shape, not two separate branches or commits

Stashing only the implementation files (never the test files) is what
makes the before/after comparison honest: the exact same test code runs
both times, so a real behavior difference — not a difference in what's
being tested — is what produces the red-then-green result. Reverting via
a full `git checkout <parent-commit>` would also revert the test files
themselves, and then "red" would just mean "the old tests still pass
against old code," which proves nothing about whether the new
implementation is what makes the new tests pass.

## Watch out for: running `classifyIronLaw` before committing gives a false "not required" negative

`tsk-2l0` found a real timing bug in `fgos-coding-implement`'s own Execute-
stage step 4: the skill instructed running the Iron Law check, but never
said this had to happen *after* `git add`/`git commit` — and
`classifyIronLaw`'s own `changedFiles()` reads the real committed diff.
Reproduced live on `tsk-5cf`: running the check right after writing code
but *before* committing returned `{"required": false, "matchedFlags":
[], "matchedModules": []}`, because `changedFiles` came back empty —
nothing had been committed yet on the branch beyond the parent's own
`plan.md`-only commit. `fgos return` then proceeded with no Iron Law
evidence doc at all.

The false negative didn't stay hidden — `approve`'s own separate gate in
`bin/fgos.mjs` re-runs `classifyIronLaw` against the real committed diff
at merge time, and correctly reported `{"required": true,
"matchedModules": [...]}`, refusing to merge without
`--acknowledge-iron-law`. But by then the evidence-production window
(step 2 above, get honestly to red before implementing) had already
closed — the implementation was already committed and green, so
producing real failing-test-first evidence meant a retroactive scramble:
stashing the already-committed implementation to reconstruct the "red"
state after the fact, exactly what happened on `tsk-5cf`. Worse, in a
less careful session, this gap could tempt passing
`--acknowledge-iron-law` with no real evidence backing it at all — a
bare, unverified assertion silently defeating the whole failing-test-
first proof requirement this gate exists to enforce.

**The fix**: `fgos-coding-implement`'s step 4 now says explicitly to run
`classifyIronLaw` *after* `git add`/`git commit` (or otherwise ensure
`changedFiles()` reflects the real diff), never right after writing code
and before it's committed. Run the check too early in your own session
and you'll get the same silent, plausible-looking false negative — worth
double-checking `matchedModules`/`matchedFlags` are non-empty against
your own knowledge of which files you touched, not just trusting an
empty result at face value if you touched a module on
`src/evolve/iron-law.mjs`'s `MODULE_RULES` list.

## Watch out for: a guard test scoped by `git ls-files` silently skips its own uncommitted files

`tsk-2cw` (renaming the pinned term "orchestrator" to "launcher") hit a
different false-pass shape, this time in the guard test itself rather than
in `classifyIronLaw`. `test/docs/launcher-vocabulary-guard.test.mjs`
enumerates the files it scans via `git ls-files` — deliberately, so it only
checks tracked prose, not scratch/build output. But `git ls-files` only
sees what's already committed. On the first local run, two files the item
itself had just created were still uncommitted: the new decision record
(`docs/decisions/0028-doi-ten-orchestrator-thanh-launcher.md`) and the
guard test file itself — and the guard test's own filename and prose
*contain* the word "orchestrator" (it's a test *about* that word), so
neither file had been added to the test's allowlist yet. `git ls-files`
skipped both silently, so the NEGATIVE check passed — a false green, not a
real one.

The gap surfaced the moment those files were committed: `fgos return`'s
goal-check failed on the branch (`"goal-check failed on branch
\"fgw/tsk-2cw\" (exit 1)"`), and a retry later failed again on the staged
merge (`"goal-check failed on staged merge (exit 1); merge aborted, main
unchanged"`) — both real friction entries on the item's own capture,
`errorClass: "verify-miss"`. Once committed, `git ls-files` now saw both
files, the guard test correctly flagged "orchestrator" appearing in
content it hadn't allowlisted, and the fix
(`1538a6e`) was two lines: add both paths to the guard test's own
allowlist, with the real reason recorded in the commit message ("git
ls-files only sees tracked files, so the first, uncommitted test run
silently skipped both").

**The lesson**: any guard/vocabulary test that scopes itself via
`git ls-files` (or an equivalent tracked-files-only listing) will not see
files the current diff just created until they're committed — including,
easy to miss, the guard test's own file if its own name or prose contains
the very term it's checking for. Run the guard test *after* `git add`/
`git commit`, the same ordering `classifyIronLaw`'s own false-negative
lesson above already establishes, and treat a fully-green first local run
as suspect (not proof) if the diff added any new tracked-prose files.

## Watch out for: a comment-only, behavior-neutral diff has no red state to honestly produce

`tsk-bc7` (a post-hoc audit of the `tsk-1y6-1` → `tsk-49i` Iron Law port)
tripped the gate on `matchedFlags: ["audit"]` — a description-keyword match
(`src/intake/risk-keywords.mjs`'s `HEAVY_KEYWORDS` includes the literal
word "audit"), with `matchedModules` empty: nothing the item touched was
actually on `src/evolve/iron-law.mjs`'s `MODULE_RULES` list. The gate
fired because of the item's *subject matter* (auditing the Iron Law gate
itself), not because the diff was self-modifying capability code.

The item's real committed code change was a 3-line comment-only edit in
`src/setup/registrations.mjs`, updating a stale reference from
`bin/fgos.mjs's readIronLawLevel` to the function's real post-port
location (`src/verbs/merge/iron-law-level.mjs`) — zero identifier, control
flow, or runtime string changed.

The stash-and-restore recipe above assumes the diff changes *behavior* a
test can observe differently before and after. A comment-only edit has no
such behavior — there is no red state to honestly get to, and inventing
one (temporarily breaking something unrelated just to have a "before"
failure) would be exactly the fabrication this whole proof requirement
exists to prevent.

**The correct proof for a behavior-neutral diff is identical test results
before and after**, confirming the change didn't regress anything: `npm
test` run once on the pre-edit tree, once on the post-edit tree, both
showing the same pass/fail/skip counts (3364/0/5 out of 3369, both times,
for `tsk-bc7`). Reach for this shape only when the diff genuinely has no
observable behavior to flip red — a real logic change still owes the
stash-and-restore recipe above, not this shortcut.

## Why this survives review even without re-running it

A reviewer (human or a later session) reading `iron-law-evidence.md` gets
the real stderr/assertion text, not a claim — the SyntaxError naming the
exact missing export, the exact expected-vs-actual event-sequence diffs.
That specificity is itself evidence the failure was really observed, not
guessed at: a fabricated "before" transcript is expensive to fake
convincingly at that level of detail, and cheap to write once you've
actually run the command.
