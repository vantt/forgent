# Step 3 pilot round 3 — full per-file review request

AUTHOR records only; independent semantic acceptance pending. Same 21 consumer files, author pin `ae141550c2e022310de7a0efea757580c0b2479f`, inventory pin `1a0f61ac53433292e08fb378ebbb6c1c72fd3b74`. No consumer edit or authority flip is applied. Round 2's exact JSONL records and manifest are archived in [step-03-records-r2/](step-03-records-r2/); earlier requests/reviews remain historical evidence.

Read A51 and L12-21..L12-31 in [owner-answers.md](owner-answers.md), including all eight L12-31 rulings; the [authoring rules digest](progress.md#authoring-rules-digest--give-scaled-batches-this-checklist-verbatim) is the verbatim checklist for later batches. Then read the [manifest](step-03-pilot-manifest.json), [complete round-3 delta](step-03-r3-changes.json) and your assigned JSONL records **directly**. Read complete pinned consumer files and the actual target passages. Review every original edge, added edge, exact complete diff, preserved region and parked/row-flip record; do not infer semantics from resolver hits or automated whole-file traversal receipts.

All four original sets already crossed 3%; full-file review remains mandatory. Keep denominator/rework numerator separate for batch-001, -002, -040, -041; count semantic rework once per file, never pool sets. Lead owns reviewer dispatch, budget, elapsed cost, acceptance and actual runner-commit accounting. This request launches no reviewer and authorizes no consumer change or Phase 9 flip.

## Round-3 checklist

- Anchor precision: every patch has `checks.anchors[edgeId].enclosingHeadingProof`, including whole-file/directory non-anchor explanations. For anchored patches check the real listAnchors API slug, enclosing heading coordinates, locator lines, translations and absence of a narrower common holder. Decision 0048/0049 anchors now use the H2; runner rule locators use Business Rules. Candidate status is not carriage.
- Read every `authorAddedEdge` as an ordinary disposition. `checks.coverage.legacyScan` records full-root and retiring-basename search candidates, contextual exclusions and one-to-one source-span joins; `authorAddedEdgeIds` must equal the actual added dispositions. Challenge exclusions and owner resolution, including generic README/layout names. The census is unchanged.
- RUL105 has no candidate-root hit at this pin: its two added confinement citations park on exact rule carry. RUL78/80 added citations patch to Business Rules. System-overview's added plugin pointer parks because “12 verb wrapper” conflicts with the candidate's explicit unshipped check. Vocabulary line-coordinate parks name the old pinned line text (or out-of-file coordinate), alongside a non-executable candidate successor note; independently assess that exact blocker rather than assuming a bare filename is always a locator-free area pointer.
- All retiring-tree preserve reasons state existence at pin and Phase 9 retirement, with a real successor note where one exists; history preserves quote the framing sentence/marker. 08271/08287 identify deletion at 4722361ae and the proper D-ADR narrative. 08124 is different: source says the mission-boundary record was intended for 0035 only after that corpus retired; do not confuse it with runner's unrelated decision 0035.
- 08215/08218/08244 park as never-existing live evidence links. Both host-routing list reasons (08019/08194) and added basename siblings state two architecture/ files, two renames and one absent file. Check all adjacent glosses, not just these named edges.
- Every park replays exact alias/query/hit-set evidence; every query hit group has its own assessment tied to actual locations/counts/excerpts. A mechanical receipt is not a verdict that every live mention is unusable. Inspect exact missing-claim, description, carry and Step 5 parity blockers.
- L12-31(8) remains: 08379 -> work-state spec; 08101 preserve (runtime trace separate); 08349 dead-link park vs 08351 explicit “Đã đóng” history preserve. GAP-02 and workflow full-content carry obligations remain; workflow links must be re-resolved at the eventual carry destination.

## Mechanical replay

From the repository root (or use absolute script paths from any caller cwd), always with session env unset:

```sh
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-check.py --author-commit ae141550c2e022310de7a0efea757580c0b2479f
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-check.py --author-commit ae141550c2e022310de7a0efea757580c0b2479f --select
env -u CLAUDE_CODE_SESSION_ID python3 plans/260925-documentation-authority-unification/reports/phase-08/step-03-probes.py --author-commit ae141550c2e022310de7a0efea757580c0b2479f
```

The existing resolver is `step-03-resolve.py --pin <full-pin> --file <consumer> --edge-id <inventory-id>`; added-edge equivalent inputs are the record's `authorAddedEdge.normalizedReference` and complete physical source passage, replayed by the checker. `git apply --check` uses only pinned scratch copies in `/tmp/fgos-work/`, no index/ref writes. See round-3 check/probe/selector/verification receipts. Independent review remains the acceptance gate.

## Groups and exact changed-edge scope

All ids below are full ids. “Changed” includes edge-object **or per-edge companion proof** changes; metadata-only file changes are stated separately. All files still receive one complete verdict, even where an original edge is unchanged.

### g01

Report: `review-a38-step-03-pilot-r3-g01.md`. Prior evidence: [round-2 g01](review-a38-step-03-pilot-r2-g01.md).

- `docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md` — batch-001; changed existing edges (1): `maps-j-07239`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `README.md` — batch-002; changed existing edges (0): **none**.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/doc-governance.md` — batch-002; changed existing edges (5): `maps-j-01902`, `maps-j-01904`, `maps-j-01905`, `maps-j-01906`, `maps-j-01909`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/platform-foundations.md` — batch-002; changed existing edges (6): `maps-j-05086`, `maps-j-05087`, `maps-j-05088`, `maps-j-05089`, `maps-j-05090`, `maps-j-05091`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/reading-map.md` — batch-002; changed existing edges (61): `maps-j-07953`, `maps-j-07955`, `maps-j-07958`, `maps-j-07959`, `maps-j-07960`, `maps-j-07961`, `maps-j-07963`, `maps-j-07965`, `maps-j-07969`, `maps-j-07970`, `maps-j-07972`, `maps-j-07976`, `maps-j-07977`, `maps-j-07979`, `maps-j-07981`, `maps-j-07984`, `maps-j-07985`, `maps-j-07988`, `maps-j-07989`, `maps-j-07990`, `maps-j-07991`, `maps-j-07992`, `maps-j-07993`, `maps-j-07994`, `maps-j-07995`, `maps-j-07996`, `maps-j-07997`, `maps-j-07998`, `maps-j-08003`, `maps-j-08004`, `maps-j-08007`, `maps-j-08008`, `maps-j-08009`, `maps-j-08010`, `maps-j-08011`, `maps-j-08012`, `maps-j-08013`, `maps-j-08014`, `maps-j-08015`, `maps-j-08016`, `maps-j-08017`, `maps-j-08018`, `maps-j-08019`, `maps-j-08020`, `maps-j-08021`, `maps-j-08022`, `maps-j-08023`, `maps-j-08024`, `maps-j-08025`, `maps-j-08026`, `maps-j-08027`, `maps-j-08028`, `maps-j-08029`, `maps-j-08030`, `maps-j-08031`, `maps-j-08032`, `maps-j-08033`, `maps-j-08034`, `maps-j-08037`, `maps-j-08038`, `maps-j-08040`.
  Added edges (8): `author-r3-docs-reading-map-L163C154`, `author-r3-docs-reading-map-L163C237`, `author-r3-docs-reading-map-L163C264`, `author-r3-docs-reading-map-L164C98`, `author-r3-docs-reading-map-L164C230`, `author-r3-docs-reading-map-L164C337`, `author-r3-docs-reading-map-L164C403`, `author-r3-docs-reading-map-L164C493`. Record metadata: diff, checks, authoringRules.
- `docs/routing-handoff-contract.md` — batch-002; changed existing edges (3): `maps-j-08053`, `maps-j-08054`, `maps-j-08056`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.

### g02

Report: `review-a38-step-03-pilot-r3-g02.md`. Prior evidence: [round-2 g02](review-a38-step-03-pilot-r2-g02.md).

- `docs/specs/reading-map.md` — batch-040; changed existing edges (58): `maps-j-08136`, `maps-j-08138`, `maps-j-08142`, `maps-j-08143`, `maps-j-08145`, `maps-j-08149`, `maps-j-08150`, `maps-j-08152`, `maps-j-08154`, `maps-j-08157`, `maps-j-08158`, `maps-j-08161`, `maps-j-08162`, `maps-j-08163`, `maps-j-08164`, `maps-j-08165`, `maps-j-08166`, `maps-j-08167`, `maps-j-08168`, `maps-j-08169`, `maps-j-08170`, `maps-j-08171`, `maps-j-08176`, `maps-j-08177`, `maps-j-08180`, `maps-j-08181`, `maps-j-08182`, `maps-j-08183`, `maps-j-08184`, `maps-j-08185`, `maps-j-08186`, `maps-j-08187`, `maps-j-08188`, `maps-j-08189`, `maps-j-08190`, `maps-j-08191`, `maps-j-08192`, `maps-j-08193`, `maps-j-08194`, `maps-j-08195`, `maps-j-08196`, `maps-j-08197`, `maps-j-08198`, `maps-j-08199`, `maps-j-08200`, `maps-j-08201`, `maps-j-08202`, `maps-j-08203`, `maps-j-08204`, `maps-j-08205`, `maps-j-08206`, `maps-j-08207`, `maps-j-08208`, `maps-j-08209`, `maps-j-08210`, `maps-j-08212`, `maps-j-08215`, `maps-j-08217`.
  Added edges (8): `author-r3-docs-specs-reading-map-L44C154`, `author-r3-docs-specs-reading-map-L44C237`, `author-r3-docs-specs-reading-map-L44C264`, `author-r3-docs-specs-reading-map-L45C98`, `author-r3-docs-specs-reading-map-L45C230`, `author-r3-docs-specs-reading-map-L45C337`, `author-r3-docs-specs-reading-map-L45C403`, `author-r3-docs-specs-reading-map-L45C493`. Record metadata: diff, checks, authoringRules.

### g03

Report: `review-a38-step-03-pilot-r3-g03.md`. Prior evidence: [round-2 g03](review-a38-step-03-pilot-r2-g03.md).

- `docs/specs/runner.md` — batch-041; changed existing edges (94): `maps-j-08218`, `maps-j-08219`, `maps-j-08223`, `maps-j-08224`, `maps-j-08227`, `maps-j-08228`, `maps-j-08230`, `maps-j-08231`, `maps-j-08232`, `maps-j-08235`, `maps-j-08236`, `maps-j-08241`, `maps-j-08243`, `maps-j-08244`, `maps-j-08248`, `maps-j-08249`, `maps-j-08250`, `maps-j-08251`, `maps-j-08252`, `maps-j-08254`, `maps-j-08255`, `maps-j-08256`, `maps-j-08257`, `maps-j-08260`, `maps-j-08261`, `maps-j-08262`, `maps-j-08263`, `maps-j-08264`, `maps-j-08265`, `maps-j-08266`, `maps-j-08267`, `maps-j-08268`, `maps-j-08269`, `maps-j-08270`, `maps-j-08271`, `maps-j-08272`, `maps-j-08273`, `maps-j-08274`, `maps-j-08275`, `maps-j-08276`, `maps-j-08277`, `maps-j-08278`, `maps-j-08279`, `maps-j-08280`, `maps-j-08281`, `maps-j-08282`, `maps-j-08283`, `maps-j-08284`, `maps-j-08285`, `maps-j-08286`, `maps-j-08287`, `maps-j-08288`, `maps-j-08289`, `maps-j-08290`, `maps-j-08291`, `maps-j-08292`, `maps-j-08293`, `maps-j-08294`, `maps-j-08295`, `maps-j-08296`, `maps-j-08297`, `maps-j-08298`, `maps-j-08299`, `maps-j-08300`, `maps-j-08301`, `maps-j-08302`, `maps-j-08303`, `maps-j-08304`, `maps-j-08305`, `maps-j-08306`, `maps-j-08307`, `maps-j-08308`, `maps-j-08309`, `maps-j-08310`, `maps-j-08311`, `maps-j-08312`, `maps-j-08313`, `maps-j-08314`, `maps-j-08315`, `maps-j-08316`, `maps-j-08317`, `maps-j-08318`, `maps-j-08319`, `maps-j-08320`, `maps-j-08321`, `maps-j-08322`, `maps-j-08323`, `maps-j-08324`, `maps-j-08325`, `maps-j-08326`, `maps-j-08327`, `maps-j-08328`, `maps-j-08329`, `maps-j-08330`.
  Added edges (17): `author-r3-docs-specs-runner-L1298C98`, `author-r3-docs-specs-runner-L1299C76`, `author-r3-docs-specs-runner-L1300C129`, `author-r3-docs-specs-runner-L1301C128`, `author-r3-docs-specs-runner-L1301C157`, `author-r3-docs-specs-runner-L1302C132`, `author-r3-docs-specs-runner-L1303C92`, `author-r3-docs-specs-runner-L1303C121`, `author-r3-docs-specs-runner-L1304C96`, `author-r3-docs-specs-runner-L1304C125`, `author-r3-docs-specs-runner-L1305C141`, `author-r3-docs-specs-runner-L1306C129`, `author-r3-docs-specs-runner-L1314C80`, `author-r3-docs-specs-runner-L1315C103`, `author-r3-docs-specs-runner-L3356C212`, `author-r3-docs-specs-runner-L3356C227`, `author-r3-docs-specs-runner-L3356C343`. Record metadata: checks, authoringRules.

### g04

Report: `review-a38-step-03-pilot-r3-g04.md`. Prior evidence: [round-2 g04](review-a38-step-03-pilot-r2-g04.md).

- `docs/specs/work-state.md` — batch-041; changed existing edges (24): `maps-j-08349`, `maps-j-08351`, `maps-j-08353`, `maps-j-08354`, `maps-j-08355`, `maps-j-08356`, `maps-j-08357`, `maps-j-08358`, `maps-j-08359`, `maps-j-08360`, `maps-j-08361`, `maps-j-08362`, `maps-j-08363`, `maps-j-08364`, `maps-j-08365`, `maps-j-08366`, `maps-j-08367`, `maps-j-08368`, `maps-j-08369`, `maps-j-08370`, `maps-j-08371`, `maps-j-08372`, `maps-j-08373`, `maps-j-08374`.
  Added edges (3): `author-r3-docs-specs-work-state-L1642C58`, `author-r3-docs-specs-work-state-L1891C21`, `author-r3-docs-specs-work-state-L1894C28`. Record metadata: checks, authoringRules.
- `docs/specs/workflow.md` — batch-041; changed existing edges (5): `maps-j-08375`, `maps-j-08376`, `maps-j-08377`, `maps-j-08378`, `maps-j-08379`.
  Added edges (1): `author-r3-docs-specs-workflow-L639C102`. Record metadata: diff, checks, authoringRules.
- `docs/specs/system-overview.md` — batch-041; changed existing edges (8): `maps-j-08331`, `maps-j-08332`, `maps-j-08333`, `maps-j-08334`, `maps-j-08335`, `maps-j-08336`, `maps-j-08337`, `maps-j-08338`.
  Added edges (11): `author-r3-docs-specs-system-overview-L14C95`, `author-r3-docs-specs-system-overview-L15C129`, `author-r3-docs-specs-system-overview-L16C254`, `author-r3-docs-specs-system-overview-L17C254`, `author-r3-docs-specs-system-overview-L18C122`, `author-r3-docs-specs-system-overview-L19C240`, `author-r3-docs-specs-system-overview-L20C129`, `author-r3-docs-specs-system-overview-L21C82`, `author-r3-docs-specs-system-overview-L22C168`, `author-r3-docs-specs-system-overview-L23C106`, `author-r3-docs-specs-system-overview-L83C151`. Record metadata: diff, checks, authoringRules.

### g05

Report: `review-a38-step-03-pilot-r3-g05.md`. Prior evidence: [round-2 g05](review-a38-step-03-pilot-r2-g05.md).

- `docs/specs/platform-foundations.md` — batch-040; changed existing edges (20): `maps-j-08116`, `maps-j-08117`, `maps-j-08118`, `maps-j-08119`, `maps-j-08120`, `maps-j-08121`, `maps-j-08122`, `maps-j-08123`, `maps-j-08124`, `maps-j-08125`, `maps-j-08126`, `maps-j-08127`, `maps-j-08128`, `maps-j-08129`, `maps-j-08130`, `maps-j-08131`, `maps-j-08132`, `maps-j-08133`, `maps-j-08134`, `maps-j-08135`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/specs/herdr-web-dashboard.md` — batch-040; changed existing edges (6): `maps-j-08096`, `maps-j-08098`, `maps-j-08102`, `maps-j-08107`, `maps-j-08109`, `maps-j-08110`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/specs/decision-citation-drift.md` — batch-040; changed existing edges (5): `maps-j-08062`, `maps-j-08064`, `maps-j-08066`, `maps-j-08068`, `maps-j-08070`.
  Added edges (1): `author-r3-docs-specs-decision-citation-drift-L26C13`. Record metadata: checks, authoringRules.
- `docs/specs/distribution.md` — batch-040; changed existing edges (2): `maps-j-08078`, `maps-j-08082`.
  Added edges (2): `author-r3-docs-specs-distribution-L61C267`, `author-r3-docs-specs-distribution-L61C282`. Record metadata: diff, checks, authoringRules.

### g06

Report: `review-a38-step-03-pilot-r3-g06.md`. Prior evidence: [round-2 g06](review-a38-step-03-pilot-r2-g06.md).

- `docs/specs/confinement-authority.md` — batch-040; changed existing edges (3): `maps-j-08057`, `maps-j-08058`, `maps-j-08059`.
  Added edges (6): `author-r3-docs-specs-confinement-authority-L13C53`, `author-r3-docs-specs-confinement-authority-L582C69`, `author-r3-docs-specs-confinement-authority-L1255C211`, `author-r3-docs-specs-confinement-authority-L1359C157`, `author-r3-docs-specs-confinement-authority-L1360C1158`, `author-r3-docs-specs-confinement-authority-L1361C297`. Record metadata: diff, checks, authoringRules.
- `docs/specs/distillery.md` — batch-040; changed existing edges (1): `maps-j-08074`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/specs/enduser-docs-authoring.md` — batch-040; changed existing edges (0): **none**.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/specs/enduser-docs-index.md` — batch-040; changed existing edges (0): **none**.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/specs/fgos-plugin.md` — batch-040; changed existing edges (2): `maps-j-08092`, `maps-j-08094`.
  Added edges (0): **none**. Record metadata: checks, authoringRules.
- `docs/specs/observe.md` — batch-040; changed existing edges (0): **none**.
  Added edges (0): **none**. Record metadata: checks, authoringRules.

## Handback boundaries

These are authored patch records, never semantic self-acceptance. Carry/description/parity/dead-link dependencies stay scoped to their own edges; a pending question must not block independent work. Lead follows the actual author commit with separate two-manifest accounting and committed-byte proof. Scaling waits for clean independent round-3 acceptance; Phase 9 remains separately gated. No new owner question or extra write scope is requested.
