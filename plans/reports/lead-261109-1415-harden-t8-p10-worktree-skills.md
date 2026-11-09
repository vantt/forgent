# Lead report: worktree skill provisioning (HARDEN T8 phase 10)

Landed on main as `4c40941a1..95ed05914` (code, config line removal) plus plan, board and guide docs; push `1dd770ee9`.

- Location: default behaviour of `provisionWorktree` (`provisionSkillRoots`, `src/runner/worktree.mjs`), not a config line, so every project that uses fgOS gets it. Roots come from one list, `AGENT_SKILL_DIRS` (`src/util/agent-skill-dirs.mjs`), shared with the `executor-skills-installed` doctor row.
- Rule: under each root, copy each directory the main checkout git-ignores (read through the Inspect port, `ignored: true`, a wholly ignored parent such as `.omp/` covers its children) and the worktree lacks. No kit named; tracked/owned skills untouched; a root or skill dir that is a link is skipped; a link inside a skill is copied as a link; an existing target is skipped, so a rerun nests nothing. A failed copy throws a `WorktreeError` naming the directory (fail-loud); the provisioning record takes copies back on remove.
- Hardlink probe: unsafe. In-place write (`>>`) through a hardlink changed the source; replace-style write did not; cross-filesystem `cp -al` fails `EXDEV`. Real copy used. Seat-run probe skipped, the first result decides.
- Measured on this tree (load 29): 525 dirs, 8 802 files, 90 MB, 1.6 s per worktree (old shell line 3.7 to 4.4 s). Size unchanged by design.
- Config: the `worktreeSetup` block (6 lines, the `ak-*` glob) removed via a blob on the committed file, so the main checkout's local lines were not staged. Owner machines: `git pull --autostash`, never reset (CHANGELOG, board line, guide).
- Proof: `test/runner/worktree.test.mjs` new test, red with the call disabled: ignored dirs under `.claude` and a wholly ignored `.omp`, byte-identical; symlink kept as link; tracked owned skill keeps committed bytes; rerun no nesting; removal clean. Focused set green; full `npm test`: 8596 tests, 1 fail = the known V7n addendum.
- OPC (forgent-5f) MERGE: no raw git, census moved digests only, `repoRoot` is the main checkout on all paths. Optional (a) fail-loud kept; (b) absolute symlinks inside a skill left as is (copied as the same link, still pointing at the main checkout path).
- Not taken: fixture `test/fixtures/committed-config.yaml` is a frozen copy and keeps the old line on purpose.
