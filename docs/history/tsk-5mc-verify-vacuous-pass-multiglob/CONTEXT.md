# CONTEXT: tsk-5mc — fix tsk-4sz's vacuous-pass verify + document the multi-file-glob variant

## Feature boundary

`tsk-4sz`'s merged `verify` field judges success by aggregate `pass`/`fail`
counts across a 12-file glob (`test/e2e/*.test.mjs`), not by each of the
two locked test names' own checkmark line. This item fixes that one
`verify` string and adds the multi-file-glob variant of the trap to
`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`. No
other item's `verify`, no test code, no production code is in scope.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is exactly two artifacts: (a) `tsk-4sz`'s own stored `verify` field, patched via `fgos edit tsk-4sz --verify "..."`; (b) a new section in `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` documenting the multi-file-glob variant. Both are explicit in the filed description ("Fix shape: ... same fix shape tsk-580 already applied to its own verify" / "worth adding to the doc as its own documented variant"); no third artifact is touched. |
| D2 | Fixing means editing the AFFECTED item's own `verify` field directly, not leaving `tsk-4sz`'s `delivered` record untouched. Precedent: `tsk-580` hit this exact trap and its own currently-stored `verify` field (`fgos list --id tsk-580 --json`) already shows the corrected per-test-checkmark pattern — i.e. the established resolution for this trap in this repo is to patch the affected item's `verify` field in place, not to leave it as a historical artifact. `fgos edit` has no status precondition (`src/state/store.mjs`'s `editWork`; `src/cli/command-registry.mjs:257`), so patching a `delivered` item is mechanically unrestricted. |
| D3 | New `tsk-4sz` verify text (empirically verified below): `out=$(node --test --test-name-pattern="domain-aware (decompose child addWork\|discovered-from addWork) inherits parent domain" test/e2e/*.test.mjs 2>&1); fail=$(echo "$out" \| grep -oE "^. fail [0-9]+" \| grep -oE "[0-9]+$"); test "${fail:-0}" = "0" && echo "$out" \| grep -qE "^. .*domain-aware decompose child addWork inherits parent domain\+stage" && echo "$out" \| grep -qE "^. .*domain-aware discovered-from addWork inherits parent domain\+stage"` — mirrors the how-to doc's own recommended shape (generic `^. ` checkmark-character match, per-test description substring, real fail-count check), same shape `tsk-580`'s own fixed verify already uses. |
| D4 | The doc's new section is titled `## Multi-file-glob variant`, placed after the existing `## Real example` section, and cites `tsk-4sz`'s own incident as the second real example (the same role `tsk-580`'s example plays for the single-file case) — because the description explicitly frames this as "the multi-file-glob variant... worth adding to the doc as its own documented variant," not a rewrite of the existing single-file example. |

## Pinned terms

- **"verify command" / "verify field"** — the `verify` string stored on an
  fgOS work item (`fgos list --id <id> --json`'s `data.work[id].verify`),
  the same field `fgos return`/`fgos approve` execute to gate the item.
  `tsk-4sz`'s "merged verify command" in the filed description refers to
  this field, not a file in the repo.
- **"vacuous pass"** — a verify command reporting success (exit 0 /
  `pass >= N`) when the `--test-name-pattern` it uses matched zero real
  named tests, because Node's default reporter counts the file itself as
  one synthetic wrapper pass. Defined in
  `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`.

## Scout evidence

- `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` —
  the existing doc; states the fix shape (generic `^. ` checkmark grep +
  per-test description substring + real fail-count check) and the
  single-file `tsk-580` example this item's new section sits alongside.
- `tsk-580`'s stored `verify` field (`fgos list --id tsk-580 --json`):
  `out=$(node --test --test-name-pattern="verify-from" test/cli/fgos.test.mjs 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "$fail" = "0" && echo "$out" | grep -qE "^. .*verify-from-children generates" && echo "$out" | grep -qE "^. .*verify-from-targets generates" && echo "$out" | grep -qE "^. .*verify-from-children with no children" && echo "$out" | grep -qE "^. .*verify-from-targets with empty targets"` —
  confirms the precedent fix shape (D2/D3).
- `tsk-4sz`'s stored `verify` field, current (buggy) form:
  `out=$(node --test --test-name-pattern="domain-aware (decompose child addWork|discovered-from addWork) inherits parent domain" test/e2e/*.test.mjs 2>&1); pass=$(echo "$out" | grep -oE "^ℹ pass [0-9]+" | grep -oE "[0-9]+"); fail=$(echo "$out" | grep -oE "^ℹ fail [0-9]+" | grep -oE "[0-9]+"); [ -n "$pass" ] && [ "$pass" -ge 2 ] && [ "${fail:-0}" -eq 0 ]`.
- `test/e2e/domain-aware-stage-literals.test.mjs:219,301` — the two locked
  test names exist verbatim (`domain-aware decompose child addWork
  inherits parent domain+stage`, `domain-aware discovered-from addWork
  inherits parent domain+stage`), confirming the new verify's grep
  substrings match the real `test(...)` descriptions Node's spec reporter
  prints.
- `fgos tool query --capability impact-analysis --status present`: GitNexus
  registered and `present` on this machine (`impact-analysis: full`). Not
  applicable here in practice — this item edits an item's `verify`
  metadata field and a doc file, no function/class/method symbol.

## Empirical proof (RED/GREEN on the real repo, before any edit lands)

Old check (`pass >= 2`) against a pattern matched to renamed test names
(the zero-real-tests-matched scenario the trap describes): `pass=11`,
`11 >= 2` → **reports VACUOUS PASS** — reproduces the bug exactly as
described.

New verify text (D3) against the same renamed-pattern scenario: **exit 1**
(correctly fails — no real matching test exists).

New verify text (D3) against the current, real, passing test file
(unmodified `test/e2e/domain-aware-stage-literals.test.mjs`): `fail=0`,
both per-test checkmark greps match → **exit 0** (correctly passes).

## tsk-5mc's own `verify` command (locked, two dispute rounds)

`judgeDiscovery`'s second-pass semantic check disputed two earlier drafts
of this item's own `verify`:

- Round 1 (`out=... chưa xác định — P15 bổ sung`, a placeholder): rejected
  for not proving anything.
- Round 2 (grep the STORED `tsk-4sz` verify TEXT for the per-test-checkmark
  pattern fragments, no execution): rejected — "never runs the test suite
  or confirms the fixed verify logic works correctly."

Round 3 (grep-presence structural check + `bash -c "$v"` execution, no
independent RED reproduction): rejected — "doesn't inspect output to
confirm checkmark lines are actually being extracted and matched from
individual test results. A verify command that echoes the expected
pattern before falling back to aggregate pass-counting would still pass
all checks."

Round 4, locked: executes `tsk-4sz`'s real stored `verify` for real
(GREEN case), then independently reproduces the vacuous-pass trap itself
— reruns `test/e2e/*.test.mjs` with the two locked test names renamed in
the `--test-name-pattern` argument (so the pattern matches zero real
tests, the exact trap shape), and asserts the SAME checkmark-anchored grep
used by the doc's recommended fix shape finds no match in that renamed
run's output — proving per-test-checkmark discrimination genuinely works
for these two tests, not merely that `v`'s source text contains the right
substrings:

```
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname); v=$(node bin/fgos.mjs list --id tsk-4sz --json --dir "$root" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{console.log(JSON.parse(s).data.work['tsk-4sz'].verify)})"); cd "$root" && bash -c "$v" && redout=$(node --test --test-name-pattern="domain-aware (RENAMED-decompose child addWork|RENAMED-discovered-from addWork) inherits parent domain" test/e2e/*.test.mjs 2>&1) && ! (echo "$redout" | grep -qE "^. .*domain-aware decompose child addWork inherits parent domain\+stage" || echo "$redout" | grep -qE "^. .*domain-aware discovered-from addWork inherits parent domain\+stage") && grep -q "## Multi-file-glob variant" "$root/docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md"
```

Dry-run proof against the real repo, before either real edit lands:

- **RED (both edits absent, current state)**: exit 1.
- **Dry-run GREEN (temporarily patched `tsk-4sz.verify` to the D3 fixed
  text via `fgos edit`)**: real-run of `v` exits 0; the independent
  renamed-pattern reproduction correctly found no checkmark match
  (`RED-PROBE-GOOD`). `tsk-4sz.verify` was reverted to its original text
  immediately after this check, both times it was dry-run patched
  (rounds 3 and 4), before any other write.
- Once both real edits land (fixed `tsk-4sz.verify` + the doc section),
  the final doc-section grep also passes — a trivial substring match once
  the section is written, not separately dry-run tested.

Round 4 (independently reconstructed grep probe, not running `v` itself
under the renamed condition): rejected — "chứng minh lệnh verify extract
checkmark lines từ output... không chứng minh lệnh verify gốc (từ item
tsk-4sz) được FIX" (does not prove the ORIGINAL verify command itself was
fixed, only that a separately-built probe using the same grep style
works).

Round 5, locked: runs `tsk-4sz`'s own real `verify` string TWICE — once
verbatim (must pass) and once with ONLY the `--test-name-pattern`
argument's two test names renamed via a scoped `sed` substitution, every
other character (including `v`'s own two checkmark-anchored grep checks)
left untouched (must fail). This is literally `v`'s own logic executing
under both conditions, not a reconstruction:

```
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname); v=$(node bin/fgos.mjs list --id tsk-4sz --json --dir "$root" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{console.log(JSON.parse(s).data.work['tsk-4sz'].verify)})"); cd "$root" && bash -c "$v" && vred=$(printf '%s' "$v" | sed 's/--test-name-pattern="domain-aware (decompose child addWork|discovered-from addWork) inherits parent domain"/--test-name-pattern="domain-aware (RENAMED-decompose child addWork|RENAMED-discovered-from addWork) inherits parent domain"/') && [ "$vred" != "$v" ] && ! bash -c "$vred" && grep -q "## Multi-file-glob variant" "$root/docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md"
```

Dry-run proof against the real repo (`tsk-4sz.verify` temporarily patched
to the D3 fixed text via `fgos edit`, then reverted immediately after each
check, same discipline as rounds 3-4):

- `bash -c "$v"` (verbatim, real test names): **exit 0**.
- `vred` (only the two test names renamed inside `--test-name-pattern`,
  `v`'s own grep checks untouched): differs from `v`
  (`[ "$vred" != "$v" ]` guards against a silent no-op substitution) and
  **exit 1** — `v`'s own logic, run for real, correctly detects the
  vacuous-pass trap.
- Full combined command against the current, unmodified (RED) repo state
  (neither edit landed): **exit 1**.

## Outstanding questions deferred to planning

None — scope, fix text, and doc placement are fully locked above; the
remaining work (patch the `verify` field, write the doc section) is
small and mechanical enough for the executing-stage skill to do directly.
