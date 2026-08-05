# Iron Law evidence — tsk-1ia

`classifyIronLaw` (`src/evolve/iron-law.mjs`) at `approve` time: `required:
true`, matched module `bin/fgos.mjs`.

## Command run

```
node --test --test-name-pattern="actually running it" test/cli/fgos.test.mjs
```

## Before the fix — RED (`bin/fgos.mjs` reverted to `b4bf60e`, main's tip
before this branch — the exact buggy `index(.)` version tsk-580 merged;
test file kept at its current, already-written state)

```
✔ edit --verify-from-children's generated jq expression correctly returns true when all children are resolved (actually running it, not just checking its text)
✖ edit --verify-from-children's generated jq expression correctly returns false when not all children are resolved (actually running it, not just checking its text)
ℹ tests 2
ℹ pass 1
ℹ fail 1
```

Failure detail — the buggy `index(.)` expression always evaluates true
regardless of real status, so the "should be false" case genuinely fails
against it:

```
AssertionError [ERR_ASSERTION]: expected the generated verify to FAIL when
a child is still todo (not resolved) -- a status 0 here reproduces
tsk-580's own vacuous-pass bug
    actual: 0
    expected: 0 (notStrictEqual — i.e. actual 0 should NOT have been 0)
```

The "should be true" case coincidentally still passes against the buggy
code (the bug always returns true, which happens to match that one
expectation) — this is expected and does not weaken the proof: the
"should be false" case is what actually exercises and catches the bug.

## After the fix — GREEN (`bin/fgos.mjs` restored to its real, committed
implementation, commit `22453ac`)

```
✔ edit --verify-from-children's generated jq expression correctly returns true when all children are resolved (actually running it, not just checking its text)
✔ edit --verify-from-children's generated jq expression correctly returns false when not all children are resolved (actually running it, not just checking its text)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

`git status --short bin/fgos.mjs` after restoring from the scratch copy:
empty (byte-identical to the committed version).

## Method note

Same revert-and-restore method `docs/history/tsk-580/iron-law-evidence.md`
already used: `bin/fgos.mjs` was temporarily overwritten with `git show
b4bf60e:bin/fgos.mjs` (the buggy pre-fix version already on `main`) while
keeping the fix's own test file unchanged, the mixed red/green run above
was captured, then the real fix was restored from a saved copy and the
all-green run captured. No test or assertion was altered between the two
runs.
