# Step 3 pilot round 2 — full per-file re-review request

AUTHOR records only; independent semantic approval pending. L12-30 supersedes conflicting round-1 review suggestions. Source author pin remains `ae141550c2e022310de7a0efea757580c0b2479f`; inventory pin `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. No consumer file changed. This replaces the round-1 streamed packet as the acceptance request; those packets and reviews remain historical evidence.

Read the latest [owner rulings](owner-answers.md#l12-30--step-3-pilot-rejected-target-resolution-procedure-and-authoring-rulings-lead-a42a51-2026-10-20), A51 and L12-21..L12-30, then [authoring request](step-03-authoring-request.md), [round-2 manifest](step-03-pilot-manifest.json), and the assigned JSONL records **directly**. Read the complete consumer source with `git show <pin>:<path>` and target content at the same pin. Do not use the eight old streamed packets or accept a resolver hit as a semantic verdict. One verdict per file, covering all its edges and its one complete diff, including preserve/park/row-flip records. All 21 files are in this re-review; every changed record must be reviewed. Round-1 records and manifest are in [step-03-records-r1/](step-03-records-r1/).

No reviewer is launched by this request. Lead owns dispatch, budget, elapsed-cost accounting and acceptance. Reports are the six explicitly assigned names below; no batch/sample membership is changed. Each set already breached 3%, so full review continues; do not pool set numerators. Publish reviewed-file denominator and rework numerator separately for batch-001, -002, -040, -041, counting any semantic rework once per file. Mechanical pass is not semantic acceptance, and this request authorizes no consumer edit or Phase 9 flip.

## Checks to repeat

- Resolve every non-preserve edge using [step-03-resolve.py](step-03-resolve.py), e.g. `env -u CLAUDE_CODE_SESSION_ID python3 <absolute-script-path> --pin ae141550c2e022310de7a0efea757580c0b2479f --file docs/specs/runner.md --edge-id maps-j-08223`. It searches Phase 6 and registry aliases plus every locator in the complete physical source passage with pinned `git grep -n -I -F` over platform (all subdirectories), knowledge, reference and tutorials. Output gives file:line, extractor anchor, GitHub slug and carriage status; choose the actual claim holder, not an incidental mention.
- Check exact passage correspondence, ordinary diff applicability, source/target carriage, Phase 9 timing, source-relative coordinates, complete labels/backticks/slashes, source-state facts, and all neighboring descriptions. Keep the whole source file in context; an edge's advisory census locator list can contain a sibling's locator. `sourceLocatorTokens` and its scope explanation bind only the actual target citation, and translated headings have explicit correspondence proof. Challenge any incorrect scope exclusion.
- All 53 parks have `searchWitness`: exact pin/roots/queries, alias matches, hit/live counts, hit-set SHA-256, and live/carriage hit groups with the per-edge reason each group cannot execute. The checker reproduces counts and hit sets; reviewers still assess whether a live hit is the full passage or only a citation/partial holder. Every semantic/parity park has a witness too, even though a live target can exist and a smaller description/parity blocker prevents a path-only edit.
- Run `step-03-check.py --author-commit <full-pin>` (all files, manifest included), `--select`, and `step-03-probes.py --author-commit <full-pin>`, always with `env -u CLAUDE_CODE_SESSION_ID`. Scripts infer their checkout from their own path and support a different caller cwd. Only disposable source files in `/tmp/fgos-work/` are used by `git apply --check`; no Git index/ref/commit is written.
- Candidate decision records under platform/**/decisions are live. “Implementation: Carriage only / Canonical: No” alone is candidate status. Headers declaring “Source snapshot retained”, “Full source retained”, and the paired architecture-intent/domainization whole-source carriage are excluded. Placeholder examples preserve; default-root behavior parks on Step 5; bare area pointers patch to area spec. Workflow links park on carry, while workflow's own links are Phase 9 source-coordinate specs that the carry must re-resolve.

## Totals and immutable source binding

Disposition order throughout is **patch / parked / row-flip / preserve**. Whole pilot: **58/97/8/274 → 104/53/12/268**, 437 edges, 21 files. **69 edge dispositions changed.** The 14 rework files were rebuilt from pinned spans, explicit per-edge destination/blocker decisions and freshly assessed source roles; the seven ok files receive only applicable rule notes/search receipts. [Exact delta](step-03-r2-changes.json) lists every changed edge and non-edge field. [Whole-file traversal receipt](step-03-r2-whole-file-reads.json) hashes every ordered 80-line chunk of all complete files; it is source-accounting evidence, not proof of semantic review. [Resolution receipts](step-03-r2-resolution-witnesses.jsonl) cover every non-preserve edge.

## g01 — file group

Report: `review-a38-step-03-pilot-r2-g01.md`. Round-1 defects: [review g01](review-a38-step-03-pilot-g01.md).

| File | Record set | Before → after (P/K/R/S) |
|---|---|---|
| `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` | [ batch-001 ](step-03-records/batch-001.jsonl) | 0/1/0/1 → 1/0/0/1 |
| `README.md` | [ batch-002 ](step-03-records/batch-002.jsonl) | 0/0/0/3 → 0/0/0/3 |
| `docs/doc-governance.md` | [ batch-002 ](step-03-records/batch-002.jsonl) | 0/0/2/6 → 0/0/2/6 |
| `docs/platform-foundations.md` | [ batch-002 ](step-03-records/batch-002.jsonl) | 0/0/0/6 → 0/0/0/6 |
| `docs/reading-map.md` | [ batch-002 ](step-03-records/batch-002.jsonl) | 21/28/3/37 → 34/16/7/32 |
| `docs/routing-handoff-contract.md` | [ batch-002 ](step-03-records/batch-002.jsonl) | 2/1/0/2 → 3/0/0/2 |

Round-1 defects and binding ruling resolutions to confirm: Confirm 07239: RUL102 is live in packaging-distribution §9; drop unrelated GAP-01 and permit the contract-to-area mutual pointer (not self-reference). Confirm 08056 maps ADR-0005 to the live runner decision file while source D3/D4 labels remain intact. For root reading-map confirm 08010/08033 bare runner, 08008/08009 RUL53/93, 08016/08017 RUL89/84, 07994/08031 RUL60/45, 07992/07993 envelope/verb registry, 07995 guidance, 07996 plugin, 07985 drift, 07998 registry alias; 07981/08028/08029 carry GAP-02; 08013/08015 name exact carriage blockers. L12-30 additionally parks 08014 with 08015, parks the misleading 08019 “5 tệp” bullet, and aligns 08018 with its specs-map twin 08193. 07977 maps to live §3.3 with explicit translated-heading correspondence; 07979 has a real **description needs rewrite** blocker because its gloss says “legacy spec”, with live §6 and setup/doctor contract named. 07958..07961 are status-only row flips with all four retained paths unchanged. Confirm factual 05091 absent-target history reason and 01904/01909 retained-path/carriage notes; README remains byte-identical.

- `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` — disposition-changed edge ids: `maps-j-07239`. Changed edge records: `maps-j-07239`, `maps-j-07240`. Other changed record fields: diff, checks, authoringRules.
- `README.md` — disposition-changed edge ids: none. Changed edge records: none. Other changed record fields: none.
- `docs/doc-governance.md` — disposition-changed edge ids: none. Changed edge records: `maps-j-01904`, `maps-j-01909`. Other changed record fields: none.
- `docs/platform-foundations.md` — disposition-changed edge ids: none. Changed edge records: `maps-j-05091`. Other changed record fields: none.
- `docs/reading-map.md` — disposition-changed edge ids: `maps-j-07958`, `maps-j-07959`, `maps-j-07960`, `maps-j-07961`, `maps-j-07977`, `maps-j-07985`, `maps-j-07992`, `maps-j-07993`, `maps-j-07994`, `maps-j-07995`, `maps-j-07996`, `maps-j-07998`, `maps-j-08008`, `maps-j-08009`, `maps-j-08010`, `maps-j-08014`, `maps-j-08016`, `maps-j-08017`, `maps-j-08018`, `maps-j-08019`, `maps-j-08031`, `maps-j-08033`. Changed edge records: `maps-j-07952`, `maps-j-07953`, `maps-j-07954`, `maps-j-07955`, `maps-j-07956`, `maps-j-07957`, `maps-j-07958`, `maps-j-07959`, `maps-j-07960`, `maps-j-07961`, `maps-j-07962`, `maps-j-07963`, `maps-j-07964`, `maps-j-07965`, `maps-j-07966`, `maps-j-07967`, `maps-j-07968`, `maps-j-07969`, `maps-j-07970`, `maps-j-07971`, `maps-j-07972`, `maps-j-07973`, `maps-j-07974`, `maps-j-07975`, `maps-j-07976`, `maps-j-07977`, `maps-j-07978`, `maps-j-07979`, `maps-j-07980`, `maps-j-07981`, `maps-j-07982`, `maps-j-07983`, `maps-j-07984`, `maps-j-07985`, `maps-j-07986`, `maps-j-07987`, `maps-j-07988`, `maps-j-07989`, `maps-j-07990`, `maps-j-07991`, `maps-j-07992`, `maps-j-07993`, `maps-j-07994`, `maps-j-07995`, `maps-j-07996`, `maps-j-07997`, `maps-j-07998`, `maps-j-07999`, `maps-j-08000`, `maps-j-08001`, `maps-j-08002`, `maps-j-08003`, `maps-j-08004`, `maps-j-08005`, `maps-j-08006`, `maps-j-08007`, `maps-j-08008`, `maps-j-08009`, `maps-j-08010`, `maps-j-08011`, `maps-j-08012`, `maps-j-08013`, `maps-j-08014`, `maps-j-08015`, `maps-j-08016`, `maps-j-08017`, `maps-j-08018`, `maps-j-08019`, `maps-j-08020`, `maps-j-08021`, `maps-j-08022`, `maps-j-08023`, `maps-j-08024`, `maps-j-08025`, `maps-j-08026`, `maps-j-08027`, `maps-j-08028`, `maps-j-08029`, `maps-j-08030`, `maps-j-08031`, `maps-j-08032`, `maps-j-08033`, `maps-j-08034`, `maps-j-08035`, `maps-j-08036`, `maps-j-08037`, `maps-j-08038`, `maps-j-08039`, `maps-j-08040`. Other changed record fields: diff, checks, authoringRules.
- `docs/routing-handoff-contract.md` — disposition-changed edge ids: `maps-j-08056`. Changed edge records: `maps-j-08052`, `maps-j-08053`, `maps-j-08054`, `maps-j-08055`, `maps-j-08056`. Other changed record fields: diff, checks, authoringRules.

## g02 — file group

Report: `review-a38-step-03-pilot-r2-g02.md`. Round-1 defects: [review g02](review-a38-step-03-pilot-g02.md).

| File | Record set | Before → after (P/K/R/S) |
|---|---|---|
| `docs/specs/reading-map.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 24/30/3/25 → 37/17/3/25 |

Round-1 defects and binding ruling resolutions to confirm: Confirm 08158 drift; 08165/08166 envelope/registry; 08167/08207 RUL60/45; 08168 guidance; 08181/08182 RUL53/93; 08183/08210 bare runner; 08189/08192 RUL89/84; 08171 registry alias. Confirm 08194 “5 tệp” and 08193 tree descriptions park with exact description blockers. 08187/08188 both park as whole-source carriage under L12-30(3), overruling the old one-sided patch. 08186 names the missing live architect index; 08190 names workflow carry; 08215 states true absent-target history. 08150 maps to live §3.3; 08152 stays parked solely for the false “legacy spec” gloss, naming live §6/contract. 08191's 0048/0049 citation maps to the common live runner decision-history section containing both, while separate 08190 remains blocked on carry. Verify that the shared line is not misrepresented as workflow already carried.

- `docs/specs/reading-map.md` — disposition-changed edge ids: `maps-j-08150`, `maps-j-08158`, `maps-j-08165`, `maps-j-08166`, `maps-j-08167`, `maps-j-08168`, `maps-j-08171`, `maps-j-08181`, `maps-j-08182`, `maps-j-08183`, `maps-j-08187`, `maps-j-08189`, `maps-j-08191`, `maps-j-08192`, `maps-j-08194`, `maps-j-08207`, `maps-j-08210`. Changed edge records: `maps-j-08136`, `maps-j-08137`, `maps-j-08138`, `maps-j-08139`, `maps-j-08140`, `maps-j-08141`, `maps-j-08142`, `maps-j-08143`, `maps-j-08144`, `maps-j-08145`, `maps-j-08146`, `maps-j-08147`, `maps-j-08148`, `maps-j-08149`, `maps-j-08150`, `maps-j-08151`, `maps-j-08152`, `maps-j-08153`, `maps-j-08154`, `maps-j-08155`, `maps-j-08156`, `maps-j-08157`, `maps-j-08158`, `maps-j-08159`, `maps-j-08160`, `maps-j-08161`, `maps-j-08162`, `maps-j-08163`, `maps-j-08164`, `maps-j-08165`, `maps-j-08166`, `maps-j-08167`, `maps-j-08168`, `maps-j-08169`, `maps-j-08170`, `maps-j-08171`, `maps-j-08172`, `maps-j-08173`, `maps-j-08174`, `maps-j-08175`, `maps-j-08176`, `maps-j-08177`, `maps-j-08178`, `maps-j-08179`, `maps-j-08180`, `maps-j-08181`, `maps-j-08182`, `maps-j-08183`, `maps-j-08184`, `maps-j-08185`, `maps-j-08186`, `maps-j-08187`, `maps-j-08188`, `maps-j-08189`, `maps-j-08190`, `maps-j-08191`, `maps-j-08192`, `maps-j-08193`, `maps-j-08194`, `maps-j-08195`, `maps-j-08196`, `maps-j-08197`, `maps-j-08198`, `maps-j-08199`, `maps-j-08200`, `maps-j-08201`, `maps-j-08202`, `maps-j-08203`, `maps-j-08204`, `maps-j-08205`, `maps-j-08206`, `maps-j-08207`, `maps-j-08208`, `maps-j-08209`, `maps-j-08210`, `maps-j-08211`, `maps-j-08212`, `maps-j-08213`, `maps-j-08214`, `maps-j-08215`, `maps-j-08216`, `maps-j-08217`. Other changed record fields: diff, checks, authoringRules.

## g03 — file group

Report: `review-a38-step-03-pilot-r2-g03.md`. Round-1 defects: [review g03](review-a38-step-03-pilot-g03.md).

| File | Record set | Before → after (P/K/R/S) |
|---|---|---|
| `docs/specs/runner.md` | [ batch-041 ](step-03-records/batch-041.jsonl) | 2/15/0/96 → 10/8/0/95 |

Round-1 defects and binding ruling resolutions to confirm: Confirm wrong-target 08232 now goes to contracts/confinement-authority-v1.md for the direct-call capability anchor claim. Confirm registry successors 08223/08224/08231, restored live ADR-011 08227, dispatch-control-plane 08248/08256, confinement §9.2 08255, work-integration 08260. Confirm 08258 glob and 08259 retained how-to preserve. **L12-30 overrides review defect 6:** 08228 remains parked because the proposal header declares Source snapshot retained; name §3.3/§4/§14 H1 carry rather than invent a live target. Justified 08230/08257/08261 parks name exact history-only recipe/contract/ADR holders. 08254 plus decision-provenance links 08329/08330 park on workflow carry consistently; source historical spelling remains. Additional L12-30(5) correction: 08241 live evidence navigation is parked as never-existing, while past-action/external-workshop evidence remains preserved with factual path state. Recheck all 113 edges, especially every absent-target source-state reason.

- `docs/specs/runner.md` — disposition-changed edge ids: `maps-j-08223`, `maps-j-08224`, `maps-j-08227`, `maps-j-08231`, `maps-j-08241`, `maps-j-08248`, `maps-j-08255`, `maps-j-08256`, `maps-j-08258`, `maps-j-08259`, `maps-j-08260`, `maps-j-08329`, `maps-j-08330`. Changed edge records: `maps-j-08218`, `maps-j-08219`, `maps-j-08220`, `maps-j-08221`, `maps-j-08222`, `maps-j-08223`, `maps-j-08224`, `maps-j-08225`, `maps-j-08226`, `maps-j-08227`, `maps-j-08228`, `maps-j-08229`, `maps-j-08230`, `maps-j-08231`, `maps-j-08232`, `maps-j-08233`, `maps-j-08234`, `maps-j-08235`, `maps-j-08236`, `maps-j-08237`, `maps-j-08238`, `maps-j-08239`, `maps-j-08240`, `maps-j-08241`, `maps-j-08242`, `maps-j-08243`, `maps-j-08244`, `maps-j-08245`, `maps-j-08246`, `maps-j-08247`, `maps-j-08248`, `maps-j-08249`, `maps-j-08250`, `maps-j-08251`, `maps-j-08252`, `maps-j-08253`, `maps-j-08254`, `maps-j-08255`, `maps-j-08256`, `maps-j-08257`, `maps-j-08258`, `maps-j-08259`, `maps-j-08260`, `maps-j-08261`, `maps-j-08262`, `maps-j-08263`, `maps-j-08264`, `maps-j-08265`, `maps-j-08266`, `maps-j-08267`, `maps-j-08268`, `maps-j-08269`, `maps-j-08270`, `maps-j-08271`, `maps-j-08272`, `maps-j-08273`, `maps-j-08274`, `maps-j-08275`, `maps-j-08276`, `maps-j-08277`, `maps-j-08278`, `maps-j-08279`, `maps-j-08280`, `maps-j-08281`, `maps-j-08282`, `maps-j-08283`, `maps-j-08284`, `maps-j-08285`, `maps-j-08286`, `maps-j-08287`, `maps-j-08288`, `maps-j-08289`, `maps-j-08290`, `maps-j-08291`, `maps-j-08292`, `maps-j-08293`, `maps-j-08294`, `maps-j-08295`, `maps-j-08296`, `maps-j-08297`, `maps-j-08298`, `maps-j-08299`, `maps-j-08300`, `maps-j-08301`, `maps-j-08302`, `maps-j-08303`, `maps-j-08304`, `maps-j-08305`, `maps-j-08306`, `maps-j-08307`, `maps-j-08308`, `maps-j-08309`, `maps-j-08310`, `maps-j-08311`, `maps-j-08312`, `maps-j-08313`, `maps-j-08314`, `maps-j-08315`, `maps-j-08316`, `maps-j-08317`, `maps-j-08318`, `maps-j-08319`, `maps-j-08320`, `maps-j-08321`, `maps-j-08322`, `maps-j-08323`, `maps-j-08324`, `maps-j-08325`, `maps-j-08326`, `maps-j-08327`, `maps-j-08328`, `maps-j-08329`, `maps-j-08330`. Other changed record fields: diff, checks, authoringRules.

## g04 — file group

Report: `review-a38-step-03-pilot-r2-g04.md`. Round-1 defects: [review g04](review-a38-step-03-pilot-g04.md).

| File | Record set | Before → after (P/K/R/S) |
|---|---|---|
| `docs/specs/work-state.md` | [ batch-041 ](step-03-records/batch-041.jsonl) | 0/4/0/32 → 1/3/0/32 |
| `docs/specs/workflow.md` | [ batch-041 ](step-03-records/batch-041.jsonl) | 1/4/0/1 → 2/3/0/1 |
| `docs/specs/system-overview.md` | [ batch-041 ](step-03-records/batch-041.jsonl) | 1/3/0/4 → 4/0/0/4 |

Round-1 defects and binding ruling resolutions to confirm: System-overview: confirm 08331 live approval-gate operation and its anchor, 08332 translated pull-door §7, 08333 bare runner, and existing 08334 distillery patch. Work-state: 08355 live drift spec, 08342 illustrative example preserve, 08341 illustrative docsRef example preserve, 08349 dead live evidence link parks with never-existed fact; 08351 remains preserve because the passage explicitly says “Đã đóng” and recounts a completed past action, now stating never-existing target rather than retained evidence. 08367/08368 carry the triage-table-columns successor note (126a8ae51). Workflow: 08375 now links the common live decision-history section holding 0048/0049; 08377 names missing D-ADR0070 candidate decision; 08378 names the combined decision/business-rule split plus workflow carry; 08376 names its separate physical-identifier L10 rewrite. Record-level carry obligation forbids deleting workflow and requires re-resolving source-coordinate relative links at its eventual candidate destination. Existing 08379 relative patch is a source-coordinate Phase 9 specification only.

- `docs/specs/work-state.md` — disposition-changed edge ids: `maps-j-08342`, `maps-j-08349`, `maps-j-08355`. Changed edge records: `maps-j-08339`, `maps-j-08340`, `maps-j-08341`, `maps-j-08342`, `maps-j-08343`, `maps-j-08344`, `maps-j-08345`, `maps-j-08346`, `maps-j-08347`, `maps-j-08348`, `maps-j-08349`, `maps-j-08350`, `maps-j-08351`, `maps-j-08352`, `maps-j-08353`, `maps-j-08354`, `maps-j-08355`, `maps-j-08356`, `maps-j-08357`, `maps-j-08358`, `maps-j-08359`, `maps-j-08360`, `maps-j-08361`, `maps-j-08362`, `maps-j-08363`, `maps-j-08364`, `maps-j-08365`, `maps-j-08366`, `maps-j-08367`, `maps-j-08368`, `maps-j-08369`, `maps-j-08370`, `maps-j-08371`, `maps-j-08372`, `maps-j-08373`, `maps-j-08374`. Other changed record fields: diff, checks, authoringRules.
- `docs/specs/workflow.md` — disposition-changed edge ids: `maps-j-08375`. Changed edge records: `maps-j-08375`, `maps-j-08376`, `maps-j-08377`, `maps-j-08378`, `maps-j-08379`, `maps-j-08380`. Other changed record fields: diff, checks, authoringRules.
- `docs/specs/system-overview.md` — disposition-changed edge ids: `maps-j-08331`, `maps-j-08332`, `maps-j-08333`. Changed edge records: `maps-j-08331`, `maps-j-08332`, `maps-j-08333`, `maps-j-08334`, `maps-j-08335`, `maps-j-08336`, `maps-j-08337`, `maps-j-08338`. Other changed record fields: diff, checks, authoringRules.

## g05 — file group

Report: `review-a38-step-03-pilot-r2-g05.md`. Round-1 defects: [review g05](review-a38-step-03-pilot-g05.md).

| File | Record set | Before → after (P/K/R/S) |
|---|---|---|
| `docs/specs/platform-foundations.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 0/0/0/23 → 0/0/0/23 |
| `docs/specs/herdr-web-dashboard.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 2/4/0/10 → 5/1/0/10 |
| `docs/specs/decision-citation-drift.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 0/4/0/9 → 0/5/0/8 |
| `docs/specs/distribution.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 1/1/0/6 → 2/0/0/6 |

Round-1 defects and binding ruling resolutions to confirm: Confirm layout registry successor for 08096/08102/08110. 08107 names exact decision 0014 narrative carry through GAP-02, distinguishing the live indexes from a narrative holder. 08064 is now parked on checker default-root parity consistently with 08062/08066/08068/08070. 08078 and 08082 both point to runner business-rules §Business Rules containing RUL74/75, not the bare runner spec. The previously ok platform-foundations file receives only the required record-level GAP-02 no-delete-without-carry note. Its 23 source edge dispositions stay preserve. The review's observation that --decisions-dir default has no class-3 edge is retained as a Step 5 tracing obligation, not an invented inventory edge.

- `docs/specs/platform-foundations.md` — disposition-changed edge ids: none. Changed edge records: none. Other changed record fields: checks.
- `docs/specs/herdr-web-dashboard.md` — disposition-changed edge ids: `maps-j-08096`, `maps-j-08102`, `maps-j-08110`. Changed edge records: `maps-j-08095`, `maps-j-08096`, `maps-j-08097`, `maps-j-08098`, `maps-j-08099`, `maps-j-08100`, `maps-j-08101`, `maps-j-08102`, `maps-j-08103`, `maps-j-08104`, `maps-j-08105`, `maps-j-08106`, `maps-j-08107`, `maps-j-08108`, `maps-j-08109`, `maps-j-08110`. Other changed record fields: diff, checks, authoringRules.
- `docs/specs/decision-citation-drift.md` — disposition-changed edge ids: `maps-j-08064`. Changed edge records: `maps-j-08061`, `maps-j-08062`, `maps-j-08063`, `maps-j-08064`, `maps-j-08065`, `maps-j-08066`, `maps-j-08067`, `maps-j-08068`, `maps-j-08069`, `maps-j-08070`, `maps-j-08071`, `maps-j-08072`, `maps-j-08073`. Other changed record fields: checks, authoringRules.
- `docs/specs/distribution.md` — disposition-changed edge ids: `maps-j-08082`. Changed edge records: `maps-j-08077`, `maps-j-08078`, `maps-j-08079`, `maps-j-08080`, `maps-j-08081`, `maps-j-08082`, `maps-j-08083`, `maps-j-08084`. Other changed record fields: diff, checks, authoringRules.

## g06 — file group

Report: `review-a38-step-03-pilot-r2-g06.md`. Round-1 defects: [review g06](review-a38-step-03-pilot-g06.md).

| File | Record set | Before → after (P/K/R/S) |
|---|---|---|
| `docs/specs/confinement-authority.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 2/0/0/2 → 2/0/0/2 |
| `docs/specs/distillery.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 0/0/0/3 → 1/0/0/2 |
| `docs/specs/enduser-docs-authoring.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 0/1/0/2 → 0/0/0/3 |
| `docs/specs/enduser-docs-index.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 0/1/0/3 → 0/0/0/4 |
| `docs/specs/fgos-plugin.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 2/0/0/1 → 2/0/0/1 |
| `docs/specs/observe.md` | [ batch-040 ](step-03-records/batch-040.jsonl) | 0/0/0/2 → 0/0/0/2 |

Round-1 defects and binding ruling resolutions to confirm: Confirm 08074 patches live system-overview area-map entry rather than preserving a present-tense Open Gaps pointer. 08085 and 08088 preserve as illustrative examples, with no invented missing-link dependency. Both enduser-docs records carry GAP-02 at file level, without inventing a destination. Confinement's previously ok RUL65b/RUL75 patches, fgos-plugin's work-state patches and observe's retained relative links keep their original accepted diffs/dispositions; non-preserve resolver receipts are added where applicable. Confirm the seven ok-file changes stay limited to ruling-specific notes/search receipts.

- `docs/specs/confinement-authority.md` — disposition-changed edge ids: none. Changed edge records: none. Other changed record fields: checks.
- `docs/specs/distillery.md` — disposition-changed edge ids: `maps-j-08074`. Changed edge records: `maps-j-08074`, `maps-j-08075`, `maps-j-08076`. Other changed record fields: diff, checks, authoringRules.
- `docs/specs/enduser-docs-authoring.md` — disposition-changed edge ids: `maps-j-08085`. Changed edge records: `maps-j-08085`, `maps-j-08086`, `maps-j-08087`. Other changed record fields: checks, authoringRules.
- `docs/specs/enduser-docs-index.md` — disposition-changed edge ids: `maps-j-08088`. Changed edge records: `maps-j-08088`, `maps-j-08089`, `maps-j-08090`, `maps-j-08091`. Other changed record fields: checks, authoringRules.
- `docs/specs/fgos-plugin.md` — disposition-changed edge ids: none. Changed edge records: none. Other changed record fields: checks.
- `docs/specs/observe.md` — disposition-changed edge ids: none. Changed edge records: none. Other changed record fields: none.

## Locator flags requiring explicit reviewer confirmation

The checker reports **0 mechanical failures** and separately flags 13 physical-passage locator mismatches. These flags are not semantic acceptance. For each assigned flag, confirm or reject the recorded scope/translation against the full source and exact target; report an incorrect explanation as file rework. [Machine flag list](step-03-r2-review-flags.json).

- `maps-j-07977`: Old shell-helper heading maps to live §3.3 Dev Checkout Channel, which documents sourcing the same helper; literal old title remains only in carriage.
- `maps-j-07998`: The same source line cites gateway product decision 0014 before the separate UI/wireframe layout pointer; 0014 is not a locator on this layout reference. Registry alias binds the exact layout document.
- `maps-j-08011`: This is the initial whole-file confinement spec pointer; §13.1 belongs to the later private-home recipe citation (08012), which remains parked separately.
- `maps-j-08056`: ADR-0005 is headed 0005 in the live decision file. The source D3/D4 clause labels remain verbatim; this pointer targets the complete Runner isolation decision, not an area portal.
- `maps-j-08150`: Old shell-helper heading maps to live §3.3 Dev Checkout Channel, which documents sourcing the same helper; literal old title remains only in carriage.
- `maps-j-08171`: The same source line cites gateway product decision 0014 before the separate UI/wireframe layout pointer; 0014 is not a locator on this layout reference. Registry alias binds the exact layout document.
- `maps-j-08184`: This is the initial whole-file confinement spec pointer; §13.1 belongs to the later private-home recipe citation (08185), which remains parked separately.
- `maps-j-08224`: RUL64 and decision 0032 identify the enclosing runner rule; the cited gate-bypass explanation moved via the registry alias and retains its own complete design content, without adopting those rule ids as target headings.
- `maps-j-08231`: RUL11 and curated capability catalog describe the enclosing policy gloss. Registry aliases identify the exact moved configuration reference; no target heading with those policy labels is asserted.
- `maps-j-08232`: The enclosing RUL77 paragraph includes RUL76/88/90 and decisions 0061/0062. This citation specifically asserts direct executor calls require a capability anchor and must not infer it from executor.for, held in confinement-authority-v1.md:148-149; it does not cite a target RUL77 heading.
- `maps-j-08256`: The quoted Từ vựng dispatch hiện hành is an internal runner-section cross-reference before the separate bare dispatch-control-plane pointer; it is not a heading locator on the latter.
- `maps-j-08332`: The quoted Cửa pull giao–nhận việc title is translated to live §7 Pull Door Take And Return, which contains the take/return contract.
- `maps-j-08379`: The source labels this as Lifecycle Work and universal tail, a whole-file current lifecycle pointer. The dated 0027 decision number is kept; its narrative remains in retired decision history, not an executable target.

## Remaining dependencies and handback

The 53 witness-backed parks block only their exact later rewrites: GAP-02 carry, workflow carry/D-ADR0070, exact history-only content, legacy-tree or legacy-authority description rewrite, Step 5 scan/default parity, and pre-existing dead live evidence links. No new rule question prevents this AUTHOR handback; semantic correspondence and factual reasons still require independent review. GAP-03 remains the separately recorded backlog/switchboard claim correction for Step 5, not a blanket reason attached to unrelated edges. No consumer patch, deletion, alias activation, authority flip, native sync, full-suite acceptance or committed-byte accounting is claimed. Lead separately records the actual runner commit in the two protected reproduction manifests.
