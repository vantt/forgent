# Wrapper-caller declaration repair receipt

Authority: `w4-g4-fix-brief.md`, owner L13-6 (1). Input HEAD: `7a9db5cf5108d2542f4dcf83e41280a4e0f19ab4`.

## Result

**25 declarations, 0 undeclared sites; deterministic census replay and actual-tree doctor pass.** The three reported pass-through shapes now refuse added `reset --hard`, `push --force` and read callers instead of inheriting an exemption. Preceding line shifts still match. [Audit](audit.json), [census replay](census-replay.json), [machine receipt](receipt.json).

- Extended the existing scanner identity: when its argv has no literal verb, hash the comment-blanked spawn call together with the sorted **multiset** of caller-call digests. A caller digest binds its relative path and comment-blanked complete call text, including computed callees. Identical added callers change multiplicity; ordering and preceding lines do not change identity.
- Reused `callersOf`, `valueFlowCalls`, function spans, argument splitting, lexer, parameter evaluation and `hookVerb`. The existing value-flow walker now starts from anonymous callback expressions too, following the local `run` binding in the verifier; no separate call graph was added. Named and function-value callers both contribute.
- Hook declarations must match their actual literal caller verbs exactly. Unknown argv, missing/extra claimed verbs and write forms fail even after refreshing the site identity. The hook read-verb set is unchanged.
- Re-declared **nine** identities: the three reported sites, the five configured-command sites and the pinned generator's indirect-argv diff site. All 25 paths/classes/reasons/retirement conditions are unchanged. No consumer, hook, pinned generator or Git port bytes changed. [Audit](audit.json) lists every old/new identity.
- Regenerated the census through the production scanner and Inspect on the actual source worktree, twice with identical bytes: 1,108 scanned files, 287 classified rows, 0 sites, SHA-256 `bf5faa260ca12b4d5ad4b09b128004bc343253a6646e399751dec14da9accd24`. All previously scanned product-file digests except the declaration input remain unchanged. The scanner's existing self-exclusion is unchanged; its separate source digest is in the audit.
- Updated **only §12** of `docs/platform/git/spec.md` with the declaration input, `declared-tooling-exemption`, identity and verb-validation contracts; corrected the Git-owner review request's future-caller claim and added CHANGELOG. Audit confirms the spec outside §12 is byte-identical.

## Prior art and proof ownership

Read the brief, execution plan, W1 notes, owner answers, all four predecessor receipts, reviewer finding/probe, reading map and Git spec boundary/classification contracts. Read-only history searches found `2e57b8bc1` introducing spawn-only declaration identity and `10416a6b0` introducing caller resolution; the value-flow extensions already serve wrapper analysis. The missing pieces were binding that caller set into the declaration and following the anonymous callback's local binding, not a missing Git capability.

Tests were added before the scanner edit: the initial file passed the six old tests and failed all three new behavioral tests ([log](logs/tests-first.log)). Replaying **unchanged HEAD's scanner with the final tests** passes 6/10 and fails the four new tests ([baseline](logs/baseline-final-tests.log)); current source passes 10/10. The added cases own caller growth/change, read re-declaration, line-shift stability, sorted/multiplicity/computed-callee identity and truthful hook verbs. The previous positive hook fixture claimed arbitrary read verbs without literal argv; it now supplies real read argv. No surviving proof was deleted or weakened.

`test/git/one-door.test.mjs` continues to own automatic classification; `test/setup/git-mutation-census.test.mjs` remains the unchanged single doctor wiring proof. No duplicate doctor case matrix or production check bypass was added.

## Individual verification

Every test command runs one file, with `CLAUDE_CODE_SESSION_ID` unset and `FGOS_HOST_BIN=<releasePath>/bin/fgos`. The release path was read only from the brief-authorized activation file and is recorded in `receipt.json`. `TMPDIR` and native probe state are under `/tmp/fgos-work/w4-g4-fix-brief/`; the existing `FGOS_STATE_ROOT` points at a mode-0700 scratch directory where needed.

| Individual file / context | Exit | Passed / total | Evidence |
|---|---:|---:|---|
| `test/scripts/git-one-door-declarations.test.mjs`, actual source | 0 | 10/10 | [log](logs/declarations.log) |
| `test/setup/git-mutation-census.test.mjs`, actual source | 0 | 1/1 | [log](logs/doctor.log) |
| `test/git/one-door.test.mjs`, byte-equal scratch payload with release addon | 0 | 6/6 | [log](logs/one-door-payload.log) |
| `test/git/one-door.test.mjs`, direct unstaged checkout | 1 | 4/6 | [log](logs/one-door.log) |

The direct checkout's two failures are `git-addon-not-shipped` during fixture enumeration, as in the predecessor review. They are not represented as green. The 6/6 run uses physical source copies under `/tmp`, the supported `native-addon.json` descriptor and copies of the activated release's verified addon/helper; audit confirms scanner/declaration/test byte equality. No loader or test was patched, no check was disabled and no build ran. This proves current Node behavior against the installed native implementation, **not a newly built release**.

Twelve additional scratch probes use the actual product files (read-only symlink mirror, only the probe target copied locally): line shifts match for each of the real relocation wrapper, verifier callback and cold-hook callers; each of `reset --hard`, `push --force` and a new `ls-tree` caller fails stale for all three. [Audit](audit.json) records all results. No injected command is executed. These are reviewer-finding reproductions, not a second owning test suite.

The actual-tree scan uses `createGitInspect` with an explicit released-addon descriptor, `scan({root, openInspect})`, `writeMutationCensus` and `verifyCensus`. The plain CLI was not run because its automatic addon bootstrap can write outside scope. In a properly staged checkout the reproducible command remains `node scripts/git-one-door-scan.mjs --write-census --json`. Source probes likewise load the verified addon explicitly for standalone-skill YAML parsing; the first unprepared probe lacked that loader and was corrected in scratch, not by changing production code.

Both pinned generator blob identities remain `a52981ff2862cc2c553dbb3181e4e822a26b146b` and `0f1cd7e1cee308772c0b56c37f3190333039cfb3`. `git diff --check` passes. No reproduction manifest/baseline was changed.

## Boundaries and handoff

GitNexus posture: **degraded under the no-fgOS-CLI brief**; no graph-confirmed impact or detect-changes result is claimed. Source/import/history cross-checks identify release census generation, doctor and scanner tests as the affected boundaries. No new config default, environment contract, dependency, setup/doctor registry row, product feature or Git port was added.

No real-repository Git write, stage/commit, fgOS CLI/lifecycle verb, accounting/board/status update, source `.fgos` write, secret edit, full-suite launcher, `npm test` or Cargo invocation occurred. All edits are inside the brief's exact writable list; `needsWrites: []`. MDView was not started because its external registry/database writes are outside this grant.

Git-owner acceptance, overall G4 closure, full-suite/Cargo verification and a newly staged release remain Lead/owner work. This receipt claims the scoped repair and its focused evidence only, not cutover authorization.
