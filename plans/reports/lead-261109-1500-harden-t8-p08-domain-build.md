# T8 P08 lead report: one compiled-domain check

Landed on main: d1d5156a0..3aa200966 (code `3aa200966`).

- `scripts/build-domain-registry.mjs` exports `checkCompiledDomains`; `--check` and the doctor row `domain-registry-compiled` both call it. The row's own walk is deleted. Script 79 -> 95 lines.
- An orphan `compiled.json` (no `registry.yaml`) is a finding naming the domain. Two workflow files with the same key make the compile throw naming both.
- The check now compares `compiled.json` byte for byte with the compile output (the row compared parsed JSON before); the build always writes that form.
- Tests: three new cases in new `test/scripts/build-domain-registry.test.mjs` (orphan through function and doctor row; duplicate key; `--check` green on the real tree). WORK's test file untouched. No test retired.
- TEST: add `test/scripts/build-domain-registry.test.mjs` to `test/suite-baseline.json`.
- Gate: focused 158 pass; `--check` green; census 0 undeclared; full `npm test` 8568 pass, 1 fail = known V7n addendum, no ERROR lines (log /dev/shm/t8p08-full.log).
