# Shard 3 — premise judgments

Pin at turn start: `c94545de5b45873cb2eb419f10124283fd730a2e`.

Status: **row judgments prepared; independent review still required**. No gate acceptance, authority promotion, flip readiness or applied patch is claimed. The 36 owned parks below remain real pre-flip decisions, not work silently moved into the lease window. All rows have `needsFlipDate: false`.

Read first: [the brief](../../w22-g6-park-judgments-brief.md), the W22 G6 finding, W8 parks and W9 fixes reviews, [receipt](../receipt.md), and L13-10/L13-20 in [owner answers](../../owner-answers.md). Exact per-row evidence and prepared patches: [shard-3.json](shard-3.json).

## Counts

| Disposition | Rows |
|---|---:|
| `preserve-confirmed` | 98 |
| `repoint` | 77 |
| `successor-bound` | 50 |
| `retire-with-source` | 0 |
| `owned-park` | 36 |
| **Total** | **261** |

The input kinds are 211 unconfirmed-premise, 48 removed-by-cutover and 2 absent-source rows. The 50 latter rows all have a successor claim; none is silently retired. There are **39 unique composed-per-file prepared patches**, linked by the 77 repoint rows; forward plus reverse replay is **78 patch executions**. Source-coordinate labeling accounts for 23 repoints; the other 54 correct live routes or qualify the retired CLI paragraph.

## Method and scope

- Read each assigned bound passage and its surrounding header/section at the start pin, not just the old park reason. No row outside `shard-3-ids.json` is judged.
- Reused the existing prepared-patch fields (`file`, `patch`, `sourceSha256`, `proposedSha256`, `replacements`, `rowIds`, `status`) and frozen area maps. Source labels are explicit non-navigation, never self-links. Related metadata is not excused merely because its file is a candidate.
- Evidence stores exact physical line spans, full blob SHA-256 and span SHA-256. A span hashes UTF-8 lines joined with LF, without a trailing LF; file digests hash the original blob bytes. Every row has its own current binding, even when explanations or composed patches are shared.
- Source absence is checked against the pin. The two Session Identity rows are bound to Identity’s explicit rename/merge header and writer-contract relationship, not to a fictitious recreated source.
- The checker validates exact ID coverage, kinds, source occurrence lines, all quoted bytes/digests, successor sections, owner/actions and patch linkage. Every unique patch replays with `patch --batch --fuzz=0 -p1 --forward` and `patch --batch --fuzz=0 -p1 -R` against a tempfile copy; proposed bytes and exact original restoration are checked. It does **not** independently approve semantic judgments.
- Patches are **shard-local proposals only**. A later composition turn must merge them with the other shards and existing F patches; they are not claimed to be a complete file-wide cutover chain. In particular, successor-bound navigation can still contain a separately owned pointer-composition duty.
- Impact-analysis: degraded/unqueried. The brief forbids the fgOS CLI and exposes no GitNexus tool. Only a documentation-evidence checker is added; product symbols are not edited. No lifecycle verbs, git writes, native addons, test suites, service or Markdown-preview process was run. Required output paths came verbatim from the assignment, not a new naming convention.

## Shared-cause groups

### historical-package-record (23)

Dated distribution source, closed-track inventory, audit errata and redirect inventories record the original source coordinates; they do not prescribe those coordinates as current authority.

Rows: `f07230`, `f07231`, `f07233`, `f07282`, `f07283`, `f07284`, `f07285`, `f07286`, `f07287`, `f07288`, `f07289`, `f07290`, `f07325`, `f07326`, `f07355`, `f07356`, `f07369`, `f07370`, `f07371`, `f07372`, `f07373`, `f07374`, `f07377`.

### literal-example (9)

Hypothetical paths, migration payload examples, traversal-rejection examples and wireframe data are literals, not documentation destinations. Preserve the example exactly.

Rows: `f07406`, `f07574`, `f07575`, `f07576`, `f07577`, `f07975`, `f08074`, `f08778`, `f08779`.

### source-carriage-note (21)

The candidate correction note names the frozen source or stale runner line locator as provenance, expressly retaining text rather than certifying current authority.

Rows: `f07656`, `f07660`, `f07671`, `f07672`, `f07686`, `f07690`, `f07693`, `f07782`, `f07786`, `f07789`, `f07790`, `f07802`, `f07805`, `f07813`, `f07816`, `f07833`, `f07836`, `f07839`, `f07842`, `f07935`, `f08105`.

### historical-decision-or-proof (45)

The cited path identifies the decision, corpus survey, incident, benchmark or implementation rationale being recorded. The quoted date, decision heading or observation frames the operand; it is not a new current-authority route.

Rows: `f07407`, `f07785`, `f07810`, `f07811`, `f07819`, `f07848`, `f07851`, `f08050`, `f08051`, `f08057`, `f08058`, `f08080`, `f08179`, `f08180`, `f08509`, `f08510`, `f08624`, `f08625`, `f08640`, `f08643`, `f08645`, `f08648`, `f08663`, `f08669`, `f08670`, `f08681`, `f08685`, `f08692`, `f08693`, `f08695`, `f08721`, `f08731`, `f08740`, `f08748`, `f08755`, `f08769`, `f08783`, `f08786`, `f08787`, `f08788`, `f08810`, `f08817`, `f08822`, `f08824`, `f08827`.

### live-navigation (54)

Related metadata, read-first routes, present contract references and active-stream primary-doc cells are reader navigation. Prepare exact retargets to mapped holders; do not infer preservation merely from a candidate header.

Rows: `f07293`, `f07376`, `f07398`, `f07532`, `f07667`, `f07698`, `f07701`, `f07849`, `f07871`, `f07872`, `f07873`, `f07874`, `f07875`, `f07876`, `f07877`, `f07878`, `f07879`, `f07880`, `f07881`, `f07886`, `f07889`, `f07950`, `f07976`, `f07982`, `f07985`, `f07993`, `f08008`, `f08012`, `f08013`, `f08021`, `f08024`, `f08027`, `f08044`, `f08069`, `f08076`, `f08084`, `f08094`, `f08096`, `f08098`, `f08099`, `f08104`, `f08106`, `f08110`, `f08115`, `f08116`, `f08117`, `f08128`, `f08446`, `f08447`, `f08496`, `f08634`, `f08665`, `f08668`, `f08694`.

### source-coordinate-label (23)

A legacy source pointer maps back to its own carrier or is explicitly a legacy-source footer. Label it non-navigational provenance instead of proposing a self-link or substituting a different claim.

Rows: `f07229`, `f07380`, `f07697`, `f07953`, `f07957`, `f07960`, `f07963`, `f07966`, `f07969`, `f07973`, `f07978`, `f07984`, `f07987`, `f07990`, `f07995`, `f07997`, `f07999`, `f08007`, `f08031`, `f08033`, `f08046`, `f08047`, `f08067`.

### successor-navigation-merge (40)

The removed source has a concrete retained clause in its successor, including the detailed reading-map merge. Bind the successor unit, not just its filename. This does not certify other pending pointer composition in that unit.

Rows: `f08194`, `f08197`, `f08209`, `f08211`, `f08212`, `f08213`, `f08216`, `f08218`, `f08219`, `f08220`, `f08223`, `f08225`, `f08227`, `f08228`, `f08231`, `f08232`, `f08244`, `f08245`, `f08246`, `f08247`, `f08250`, `f08251`, `f08283`, `f08285`, `f08286`, `f08288`, `f08305`, `f08335`, `f08344`, `f08345`, `f08411`, `f08412`, `f08415`, `f08416`, `f08417`, `f08418`, `f08419`, `f08440`, `f08442`, `f08443`.

### historical-template-carriage (8)

The removed authoring template survives in an explicitly historical carrier. Its relative paths are preserved template placeholders, not current authoring navigation.

Rows: `f08336`, `f08337`, `f08338`, `f08339`, `f08340`, `f08341`, `f08342`, `f08343`.

### identity-rename (2)

The absent Session Identity source was merged into Identity by 9fdaac9ba, explicitly recorded in the successor header. Its writer/CLI-contract relationship survives; absence is not grounds to retire it.

Rows: `f07852`, `f07854`.

### unresolved-live-artifact-convention (36)

These are live coding-artifact read/write conventions, not historical examples. L13-10 explicitly leaves these parked; neither the frozen source maps nor a concrete member binding chooses a replacement for future feature/id paths. Do not historicize or mass-rewrite the templates. Lead must obtain the coding-domain placement decision before flip.

Rows: `f08458`, `f08460`, `f08461`, `f08462`, `f08463`, `f08464`, `f08466`, `f08467`, `f08468`, `f08469`, `f08470`, `f08472`, `f08474`, `f08475`, `f08476`, `f08477`, `f08478`, `f08481`, `f08482`, `f08483`, `f08484`, `f08485`, `f08487`, `f08488`, `f08489`, `f08490`, `f08491`, `f08492`, `f08495`, `f08548`, `f08557`, `f08618`, `f08720`, `f08724`, `f08727`, `f08803`.

## Decisions worth checking closely

- **f07667:** the paragraph advertises a former coordination CLI, yet its local adapter is marked removed. The current mapped portal explicitly says `coordination` is not a public verb. Prepare an historical-only prefix for the entire CLI paragraph, keep the old example coordinate as a literal, and route present execution to the portal. No invented exact wildcard-collection successor and no remaining park.
- **f07398:** full law wording already lives below in the same carrier. Replace the old-root navigation with an in-document textual direction; no self-link.
- **f07871–f07881:** active-stream Primary Docs cells are live navigation despite the roadmap’s candidate carriage header. Use mapped portals/specific holders. The historical coordination contract is explicitly a retired-engine snapshot, not a restored runtime contract.
- **f07886/f07889:** route area-spec discovery through the platform registry rather than blindly converting a wildcard into a supposedly generated file tree.
- **f07950/f07982/f07993:** the overview portal’s related source goes to the actual spec; raw YAML/JSON provenance wrappers go to their raw mapped payloads, not to themselves.
- **f08021/f08024:** preserve the platform-vision ownership boundary and old source identity while replacing obsolete retained-source navigation.
- **f07852/f07854:** rename commit `9fdaac9ba` explicitly merged Session Identity into Identity §7a. The successor still contains the CLI-contract relationship. Retirement would lose a surviving claim.
- **f08209–f08288:** all 24 removed-map rows bind to the merged detailed map. Agent Protocol’s terminal wording and fast-test feedback’s archived plan locator are current qualifications, not missing successor claims.
- **f08335:** Workflow’s foundational-laws relationship survives in its related-files section with a rebased destination.
- **f08336–f08343:** the templates survive as historical templates; their relative placeholder routes do not become new maintained authoring rules.

## Every owned park

Common named owner: **Documentation Lead (A42) + coding-domain documentation owner**. The repository proves these are live readers/writers, not source-bound history. L13-10 expressly left live conventions parked; the general governance placement map is not a decision about each future coding artifact’s storage contract. No concrete replacement binding is supplied for these feature/id templates. The next action is one coordinated placement decision and caller migration, not 36 independent date questions. Each exact operand, caller and action is recorded below and in JSON.

### f08458

Caller: `domains/coding/skills/fgos-coding-discovering/SKILL.md:102–106`.

For f08458, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08460

Caller: `domains/coding/skills/fgos-coding-discovering/SKILL.md:129–135`.

For f08460, approve whether the live `docs/history/<feature>/RESEARCH.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08461

Caller: `domains/coding/skills/fgos-coding-exploring/SKILL.md:14–21`.

For f08461, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08462

Caller: `domains/coding/skills/fgos-coding-exploring/SKILL.md:105–111`.

For f08462, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08463

Caller: `domains/coding/skills/fgos-coding-exploring/SKILL.md:130–132`.

For f08463, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08464

Caller: `domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md:11–13`.

For f08464, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08466

Caller: `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md:110–114`.

For f08466, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08467

Caller: `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md:171–173`.

For f08467, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08468

Caller: `domains/coding/skills/fgos-coding-implement/SKILL.md:70–74`.

For f08468, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08469

Caller: `domains/coding/skills/fgos-coding-implement/SKILL.md:140–144`.

For f08469, approve whether the live `docs/history/<id>/iron-law-evidence.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08470

Caller: `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md:64–73`.

For f08470, approve whether the live `docs/history/<id>/iron-law-evidence.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08472

Caller: `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md:5–10`.

For f08472, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08474

Caller: `domains/coding/skills/fgos-coding-planning/SKILL.md:15–21`.

For f08474, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08475

Caller: `domains/coding/skills/fgos-coding-planning/SKILL.md:15–21`.

For f08475, approve whether the live `docs/history/<feature>/plan.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08476

Caller: `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md:7–11`.

For f08476, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08477

Caller: `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md:15–22`.

For f08477, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08478

Caller: `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md:24–26`.

For f08478, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08481

Caller: `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md:63–65`.

For f08481, approve whether the live `docs/history/<feature>/plan.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08482

Caller: `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md:67–69`.

For f08482, approve whether the live `docs/history/<feature>/plan.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08483

Caller: `domains/coding/skills/fgos-coding-shaping/SKILL.md:1–15`.

For f08483, approve whether the live `docs/history/<feature>/DISCUSSION.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08484

Caller: `domains/coding/skills/fgos-coding-shaping/SKILL.md:19–28`.

For f08484, approve whether the live `docs/history/<feature>/DISCUSSION.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08485

Caller: `domains/coding/skills/fgos-coding-shaping/SKILL.md:37–39`.

For f08485, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08487

Caller: `domains/coding/skills/fgos-coding-shaping/SKILL.md:88–88`.

For f08487, approve whether the live `docs/history/<feature>/DISCUSSION.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08488

Caller: `domains/coding/skills/fgos-coding-shaping/SKILL.md:159–168`.

For f08488, approve whether the live `docs/history/<feature>/DISCUSSION.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08489

Caller: `domains/coding/skills/fgos-coding-shaping/SKILL.md:226–228`.

For f08489, approve whether the live `docs/history/<feature>/DISCUSSION.md#task-<slug>` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08490

Caller: `domains/coding/skills/fgos-coding-validating/SKILL.md:15–20`.

For f08490, approve whether the live `docs/history/<feature>/plan.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08491

Caller: `domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md:7–11`.

For f08491, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08492

Caller: `domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md:13–15`.

For f08492, approve whether the live `docs/history/<feature>/plan.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08495

Caller: `domains/coding/task-specs/lock-decisions.md:10–11`.

For f08495, approve whether the live `docs/history/<feature>/CONTEXT.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08548

Caller: `plugins/fgOS/skills/approve/SKILL.md:188–190`.

For f08548, approve whether the live `docs/history/<id>/iron-law-evidence.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08557

Caller: `plugins/fgOS/skills/coding-shape/SKILL.md:29–34`.

For f08557, approve whether the live `docs/history/<feature>/DISCUSSION.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08618

Caller: `plugins/fgOS/skills/merge-loop/SKILL.md:97–99`.

For f08618, approve whether the live `docs/history/<id>/iron-law-evidence.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08720

Caller: `src/runner/paths.mjs:117–143`.

For f08720, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08724

Caller: `src/runner/prompt-templates/worker-prompt-discovery.txt:19–23`.

For f08724, approve whether the live `docs/history/<feature>/RESEARCH.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08727

Caller: `src/runner/prompt-templates/worker-prompt-skill-pointer.txt:45–59`.

For f08727, approve whether the live `docs/history/<your item id>/iron-law-evidence.md` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

### f08803

Caller: `src/state/work.mjs:605–620`.

For f08803, approve whether the live `docs/history/<feature>/` convention remains under docs/history or name its replacement via the owning coding-artifact convention; then compose this exact passage and its readers/writers together. Do not classify it as history or wait for a flip date.

## Commands and exits

All shell commands ran from `/home/vantt/projects/forgentX-p9-w1-d3`; Python was always `python3 -B`. File reads/searches through the harness did not execute product code. The following includes the exploratory failures rather than presenting only the final pass.

| Command / command family | Exit / result |
|---|---|
| `git rev-parse HEAD && git status --short` at entry | 0; the pin above; clean |
| `python3 -B - <<'PY'` read-only inspections of `proof.json`, IDs, current-unit text, source-successor matches, and patch replacements | 0 on every inspection |
| `git log -5 --oneline -S'check_shard' -- plans/260925-documentation-authority-unification && git log -3 --oneline -S'docs/history/<feature>/' -- ...` | Harness timeout at 10 s; no process exit code returned. The first search found the launch commit. |
| `git log -4 --format='%h %s' -- docs/platform/session-identity/spec.md && git log -3 --format='%h %s' -S'writer' -- docs/platform/identity/spec.md` | 0; found `9fdaac9ba` rename/merge |
| `python3 -B` scratch tempfile allocation under `/tmp/fgos-work/` | 0 |
| Scratch generation, first attempt | 1; a guessed unretired coordination-contract path did not exist; corrected to the ledger-supported retired-engine carrier before emitting an artifact |
| Scratch generation after correction, and final regeneration | 0 |
| `python3 -B .../check_shard_3.py --shard 3`, first draft | 0; 261 rows, initial draft counts |
| Checker after successor-section strengthening | 1; YAML section indentation did not equal the normalized section label; corrected the label, not the evidence or validation |
| `python3 -B .../check_shard_3.py --shard 3`, final | 0; 261 rows, 39 patches, 78 exact replays |
| Scratch checker negative controls: missing/duplicate ID, invented evidence, wrong file/span digest, nonexistent successor section, corrupt prepared patch | 0; all 7 mutations rejected |
| Two final checker subprocesses, stdout equality and artifact-byte non-mutation check | 0; byte-identical output, no artifact mutation |
| `git diff --check && git status --short` plus exact output-scope assertion | 0; only the three assigned outputs |
| Scratch cleanup (`shutil.rmtree` on this turn’s tempfile directory) | 0 |

Final reproduction (from repository root):

```bash
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_3.py --shard 3
```

Expected: exit 0; `status: passed`, 261 rows, 98 preserve-confirmed, 77 repoint, 50 successor-bound, 36 owned-park, 39 patches and 78 replays. Scratch copies are automatically removed on success and failure. The 36 placement decisions and exhaustive independent review remain owed; passing this checker is not semantic acceptance.
