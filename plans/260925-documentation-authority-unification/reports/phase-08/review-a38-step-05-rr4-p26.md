# Review p26 (Step 5 seams 1-4 records)

Payload: s4-src-p26.json (3 source files, 117 items, all dynamic tuples, all REJECT/preserve, no diffs, no parks, no admitted items).

## scripts/run-tests.mjs: verdict ok (89 items)
Pinned source read in full for document paths. None of the tuples builds or reads a docs path. The file has no docs/, plans/, README or .md literal.
- REPO_ROOT, DEFAULT_TEST_ROOT, discoverTestFiles(root), `root = DEFAULT_TEST_ROOT` (L31-32, 137, 554): root plumbing over `test/`.
- gitAddonSourceDigest (L38-48): hashes Cargo.toml, Cargo.lock and rs/toml/json files under packages/<component>. These are source and build inputs, not documents.
- Cargo target dirs, git-addon dir, native-addon manifest and tmp renames (L52-72, 115-121): build outputs and `.fgos/runtime` state.
- Temp, fixture and watchdog paths (L184-260, 433-461): temp and fixture roots, `fgos-test-*` dirs.
- `.fgos` snapshot diff (L334-358, 517-526): `.fgos` state-store walk and its emitted `.fgos/<f>` lines. The only fixed-root print is `.fgos/`, which is not a document.
- L570 message prints the caller-supplied `root` with no fixed document root, so it is formatting (R6).
- All remaining items are caller-data log formatting, label joins, or guards.

Outcome defects: none.

Record-text notes (labels only, outcome unchanged):
- dynamic-008788 and 008791 (L434, 448): sub-labels `scalar-pass-through` are acceptable. The real use is assignment of a temp or fixture root into the child env.
- Pairs on the same line carry different NDU labels, for example 008738/39/40 (L115) and 008752/53 (L193). The admission and disposition agree on every such line (R7 holds).

## scripts/stress-test-files.mjs: verdict ok (20 items)
Nothing in the file touches a document. It only does CLI usage and error text, os.tmpdir mkdtemp burner dirs, `/var/tmp` fixture dirs, spawn env, and round log files under a caller-supplied `--log-dir`.
- L112-114 (008830-008833): the caller-supplied `--log-dir` is joined with round-N-verdict.log. This is a caller-data path with no fixed document root, so it is a reject under R6.
- 008827 (L10): the comment usage line is not a document path.

Outcome defects: none.

Record-text note: 008827 carries role `comment` with NDU `scalar-pass-through`. A more accurate NDU would be a usage-text label.

## scripts/test-ownership-lint.mjs: verdict ok (8 items)
- L11 `validateManifest(manifest, { repoRoot: cwd })` is a root pass-through (R5).
- L30 and L34 build `test/direct`, a test directory and not a document. `test/direct/*.test.mjs` files are code. The orphan-file warning at L36 prints a caller-derived relPath.
- L14 and L36 are formatting. L19 is an accumulator.
- Same-line items (008850/51, 008852/53) agree.

Outcome defects: none.

Record-text note: 008852 and 008853 label the fixed `test/direct/` prefix as `caller-data-formatting`. The true non-document use is a test directory path.

## Counts
- Items reviewed: 117 (89 + 20 + 8).
- Admit: 0. Reject: 117. Parks: 0. Diffs: 0. Successor-note cases: 0.
- OUTCOME defects: 0.
- Lead-judgment questions: none.

Status: DONE
Summary: All 117 dynamic tuples across the three files are correctly rejected with preserve. None reads or constructs a document path, and same-line items agree on admission and disposition. Only minor non-outcome label notes.
