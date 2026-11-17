# Decisions index writer lead report

Branch yaml-write-door/p04, head 0e07c634b, base 09e22e726 (integration head). Pushed; not landed (waiting for OPC MERGE).

## Changed
- src/report/decision-index.mjs: five frontmatter literal lines gone, `writeFrontmatter({type:'explanation',title:'Decisions index',generated:true}, lines.join('\n'), 'docs/decisions/index.md')` returned; import added. No `'---'` left.
- packages/git/contracts/mutation-census.v1.json: regenerated with `--write-census` (4 lines).
- docs/decisions/index.md untouched; `decision-index --check` exit 0, changed:false.

## Gates (one file per run, shared ywd-node-target, all exit 0)
doc-health, git-mutation-census, decision-index, enduser-index, instruction-registry, instruction-composition, architecture, check-decision-citation-drift, decisions-corpus-retired, unknown-flag-rejection, knowledge-lints. One-door scan: 0 undeclared sites.

## Notes
- No red-first test: phase file owns no test change; the existing doc-health fixpoint is the byte-identity proof and passed unchanged.
- No Rust change; no CHANGELOG line needed (output byte-identical).
- Processes: none left running.

## Lessons
- `--write-census` takes about 2 min when the shared cargo target is busy with other lanes; run it in the background.
- For a pure byte-identical refactor a committed fixpoint test replaces a red test; say so in the report.
