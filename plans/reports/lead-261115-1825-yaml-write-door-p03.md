# Lead report: knowledge projection writer through the YAML door

Branch `yaml-write-door/p03`, base `origin/yaml-write-door/integration` 09e22e726. Not landed; waiting for OPC MERGE.

## Change
- `src/report/knowledge-projection.mjs`: the hand-written `---\ngenerated: true\n---\n` template is now `writeFrontmatter({ generated: true }, <body>, 'docs/doc-registry.md')`. Fence literal gone (`rg '`---'` finds nothing). Body text unchanged.
- `packages/git/contracts/mutation-census.v1.json`: regenerated with `--write-census` (2 lines).
- No test change (per phase file: writeFrontmatter's read-back is the owning proof).

## Evidence
- `docs/doc-registry.md` and `.json` byte-identical (`git diff --exit-code`); `npm run fgos:dev -- doc-registry --check` exit 0.
- Green: knowledge-lints (13), knowledge-canary (2), git-mutation-census (after regenerate), architecture (60), doc-health (8), check-decision-citation-drift (33). Scan: 0 undeclared sites.
- Other `rg` hits (test-ownership.mjs, rust-host vector json) only name the file; not run.
- Shared target ywd-node-target; no Rust changes.

## User-visible
None; no CHANGELOG line.

## Lessons
- Census test goes red on any touch of a judged file; regenerate before running the gate to skip a wasted run.
- Red-first does not fit a byte-identical refactor with no test change; `--check` is the proof.
