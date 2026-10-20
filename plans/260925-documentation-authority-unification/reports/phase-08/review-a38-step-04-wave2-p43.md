# Review a38 Step 4 wave 2 part 43 (set step04-032)

Pin dc24ce645. Method: whole pinned source read (40 lines through EOF), both renders read at the pin (header line, line 7 span, body identical), runner.md passage and candidate holders searched. No checker or script run.

## Files

### core/skills/_shared/ak-cook-worker-contract.md (set step04-032, mandatory new main source) - verdict ok
Slots reviewed 3 of 3 (supplemental keys, no Step 2 ids, L12-60 ruling 7):
- Source line 6 `docs/specs/runner.md` ("Skills reach `bind()`") parked, Phase 9 carry: ok. `docs/specs/runner.md` line 1145 holds the bold rule "Skills reach `bind()`"; a pinned search of `docs/platform` and `docs/knowledge` finds no live holder of it (`supports.skills`, `skills-unavailable`). `executor-skills-installed` appears only in `setup-doctor-registry.md`, which covers the doctor check but not the bind() rule or worker brief. A path-only patch to the candidate runner spec would point at a document lacking the claim, so parking is right. Alias table and doc-registry have no alias.
- `.agents/skills/_shared/ak-cook-worker-contract.md` line 7 and `plugins/fgOS/skills/_shared/ak-cook-worker-contract.md` line 7: render-join with `sourceDisposition: parked`, `renderOnly: true`, no patch/null-target form: ok (ruling 8). Both renders carry the generated header at line 1 naming the core source and `npm run build:skills`, and body equals source after the header. No `.claude/skills/_shared` exists, so no thin wrapper is missed. The plugin copy is headered, so it is a render and not its own source owner.
- Missed-reference scan: the source has exactly one `docs/` occurrence; no other repo paths.

## Record-text notes (not rework)
- Parked reason is a little loose ("worker writes/skills/bind() contract references runner.md, named Skills reach bind() rule") but is derived from its own passage.
- The supplemental keys carry `inputCommit` 3732d245d (the merge-time census commit), not the author pin; consistent with the census admission note.

## Lead-judgment questions
- None.

## Counts
- step04-032 (mandatory, A51 selection 1): 1 reviewed, 0 rework.
- Slots reviewed: 3 (1 parked, 2 render-join).

Status: DONE
