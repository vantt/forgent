# Avoid a vacuous pass from `node --test --test-name-pattern`

Use this when a `verify` command (or any other check) relies on
`node --test --test-name-pattern="<pattern>" <file>` and judges success by
the aggregate `pass`/`fail` counts Node's default reporter prints — those
counts can report a pass even when the pattern matched **zero** real tests.

## The trap

`node --test --test-name-pattern="<pattern>" <file>` filters which named
`test(...)` blocks actually run. When the pattern matches nothing inside
the file, Node's default ("spec") reporter still prints:

```
✔ /path/to/file.mjs (70.9ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
```

The single "✔" line is the **file itself** counted as a synthetic
wrapper test — not a real named test that actually ran. A verify command
written as `grep -qE "^# pass [1-9]"` (TAP-style) or even a looser
`pass >= 1` check will happily report success here, even though the code
path it was supposed to exercise was never touched.

Two additional, related gotchas confirmed the same way:

- Node's **default reporter** does not use the TAP `#`-prefixed summary
  lines (`# pass N`, `# fail N`) at all — it prints `ℹ pass N`/`ℹ fail N`
  instead. A verify grepping for `^# pass` against the default reporter's
  output will never match anything, regardless of what actually ran.
- The vacuous "1 pass" count is identical whether the pattern matched
  zero real tests or exactly one — comparing counts alone cannot tell the
  two apart.

## How to avoid it

Grep for the specific test's own **description line** (the `✔`/`ok` line
Node prints per test), not the aggregate counts:

```
out=$(node --test --test-name-pattern="<pattern>" <file> 2>&1)
echo "$out" | grep -qE "^. .*<exact test description substring>"
```

(`^. ` matches the checkmark/fail-mark character generically instead of
embedding the literal unicode symbol, which is easy to mistype or lose
through shell/encoding layers.) Combine this with a real fail-count check
so a genuinely failing named test still fails the verify:

```
fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$")
test "$fail" = "0" && echo "$out" | grep -qE "^. .*<test description>"
```

Before trusting a verify command built this way, run it by hand against
the **current, unfixed** state and confirm it actually fails (exit
non-zero) — a verify that passes before the fix exists is proof the check
itself is broken, not that the work is done.

## Real example

`tsk-580` (adding `fgos edit --verify-from-children`/`--verify-from-targets`)
hit this exact trap while shaping its own item verify:

- First attempt: `grep -qE "^# pass [1-9]"` — wrong reporter format
  entirely (Node v24.18.0's default reporter never prints a `#`-prefixed
  line), so this would never match regardless of test outcome.
- Second attempt: `--test-name-pattern="verify-from"` with a plain
  `pass >= 1` check — ran by hand against the pre-implementation code
  (0 real tests matching that pattern existed yet) and it still reported
  `tests 1 / pass 1 / fail 0`, confirmed to be the file-wrapper count, not
  a real test.
- Fixed version: grepping for the checkmark line plus each specific test's
  own description substring, combined with a real fail-count check — run
  by hand against the same pre-implementation code, it correctly reported
  exit 1 (no matching test exists yet), and exit 0 once the real tests were
  written and passing. Full transcript:
  `docs/history/tsk-580/plan.md` (section "Verify cho tsk-580 — sửa lại
  tại `fgos-coding-validating`") and `docs/history/tsk-580/iron-law-evidence.md`
  (the reconstructed red/green proof required by the Iron Law gate at
  `approve`).

## Multi-file-glob variant

The trap gets worse when the same `--test-name-pattern` call runs against
a multi-file glob (e.g. `test/e2e/*.test.mjs`) instead of one file: every
file in the glob that the pattern matches nothing in still counts as its
own synthetic wrapper pass, so the vacuous count scales with the number of
files, not just the number of tests. A check comparing aggregate counts
(`pass -ge N` for some `N` picked because it's ">= the number of real
tests expected") is exactly as vacuous here as the single-file case, just
harder to notice — a healthy-looking `pass 12` can mean "0 of my 2 target
tests ran, but 12 other files in the glob still counted as file-wrapper
passes."

`tsk-4sz` (domain-aware `decompose`/`discovered-from` `addWork`
inheritance) hit this variant: its merged `verify` field judged success by
`[ "$pass" -ge 2 ]` against `test/e2e/*.test.mjs` (12 files) — if the two
locked test names it targets were ever renamed or deleted, all 12 files
would still each report one wrapper pass, satisfying `pass -ge 2` with
zero real coverage of either target test. Fixed the same way as the
single-file case — grep each test's own checkmark line and description
substring, combined with a real fail-count check, never an aggregate
comparison — confirmed by running the corrected command against a
deliberately-renamed pattern (reproducing the vacuous-pass scenario) and
confirming it correctly fails. Full evidence:
`docs/history/tsk-5mc-verify-vacuous-pass-multiglob/CONTEXT.md`.

## Update (tsk-12t): the reporter-format variant of this trap is now mechanically rejected

The specific mistake at the top of this doc — grepping for a TAP-style
`^# pass`/`^# fail` line that Node's default `node --test` reporter never
emits — no longer has to be caught by a human or an LLM reviewer noticing
it live. `judgeVerifySemanticCorrectness` (`src/intake/judge-executor.mjs`,
the shared second-pass verify judge both `resolveDiscovery`/`clarify` and
`resolveDecompose`/`decompose` call) now runs a cheap mechanical check
before ever spawning the LLM judge: any proposed verify string that
targets `node --test`/`--test-name-pattern` AND matches the wrong-reporter
grep shape (`/\^#\s*(pass|fail)\b/`) is rejected immediately, citing this
how-to doc in the rejection reason.

This was added specifically because `tsk-4sz`'s own verify authoring
proposed exactly this mistake (`grep -qE "^# pass [1-9]"`) live during
`fgos-coding-exploring` — the second-pass LLM judge disputed that same verify
three separate times over content/coverage concerns (missing call-site
coverage, testing the wrong file) but never once caught the format bug
itself; it only surfaced when `fgos return`'s real spawn ran the command
under Node v24.18.0's actual `ℹ`-prefixed reporter and it silently failed.
Relying on an LLM to notice a known, purely-syntactic anti-pattern every
single time it appears is exactly the gap a cheap mechanical pre-check
closes.

**This specific rejection cannot be bypassed with `--force`** — unlike an
ordinary LLM disagreement, it is a syntactic fact about what Node's
reporter does and does not print, not a judgement call an LLM (or
`--force`) could plausibly override. The narrower **vacuous-match**
trap this doc's other sections describe (a pattern matching zero real
tests, or the multi-file-glob variant above) is deliberately NOT covered
by this mechanical check — neither is detectable by a fixed regex, so
catching those still depends on the LLM judge, an executed-and-verified
test run, or a human reading the command closely. Full decision record:
`docs/history/tsk-12t-verify-known-bad-pattern-check/CONTEXT.md`.

## Another real example (`tsk-n2x`): locking test titles up front, before the tests exist

`tsk-n2x` (adding 2 direct `sync-root` tests for the Iron Law trip and
verify-fail outcomes, which `test/cli/fgos.test.mjs`'s existing
`sync-root` block did not cover) applied this doc's own pattern from the
start rather than discovering the trap mid-fix. Its own decision record
(`docs/history/sync-root-direct-outcome-tests/CONTEXT.md` D3/D4) locked
the two new tests' exact description strings *before* writing them:

- `'sync-root of a root whose diff touches a self-modifying-capable module REFUSES without --acknowledge-iron-law: exit 4, root status untouched, no merge'`
- `'sync-root of a root whose staged merge fails its own verify: outcome blocked reason verify-fail, root status untouched'`

then set `verify` to the same fail-count-plus-description-grep shape this
doc recommends:

```bash
out=$(node --test --test-name-pattern="sync-root of a root whose" test/cli/fgos.test.mjs 2>&1)
fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$")
[ "$fail" = "0" ] \
  && echo "$out" | grep -qE "^. .*diff touches a self-modifying-capable module REFUSES" \
  && echo "$out" | grep -qE "^. .*staged merge fails its own verify: outcome blocked reason verify-fail"
```

Checked by hand against the pre-fix file before implementation, per this
doc's own "before trusting a verify command" rule: the pattern matched
zero real tests, so `fail` was `0` (the file-wrapper synthetic pass) but
both `grep -qE` description checks failed — a real non-zero exit, not a
vacuous pass. Confirmed to flip to a real pass once both named tests
existed and passed.

## Related

- `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` — the
  failing-test-first proof contract this trap's real example satisfies.
- `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-done.md`
  and `docs/how-to/close-out-a-decomposed-root-item-after-all-children-are-done.md`
  — the sibling traps around hand-written `verify` commands (missing
  `--dir`, a wrong repo-root resolver) that this doc's own real example
  also encountered while shaping the same item's verify.
