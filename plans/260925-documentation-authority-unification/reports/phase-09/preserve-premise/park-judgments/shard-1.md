# Parked premise judgments — shard 1

**Pin:** `c94545de5b45873cb2eb419f10124283fd730a2e` (HEAD at turn start).
**Status:** judgments authored and mechanically checked; independent review pending.
No gate acceptance, authority flip, source edit or inherited Step 5 proof is claimed.

Read first: [task brief](../../w22-g6-park-judgments-brief.md),
[W22 review](../../reviews/w22-register-met-local-review.md),
[W8 park review](../../reviews/w8-g6-parks-review.md),
[W9 fix review](../../reviews/w9-g6-fix-review.md),
[receipt](../receipt.md), and [L13-10/L13-20](../../owner-answers.md).

## Result

| Input kind | Preserve confirmed | Repoint | Successor bound | Retire with source | Owned park | Total |
|---|---:|---:|---:|---:|---:|---:|
| Unconfirmed preserve premise | 118 | 37 | 0 | 0 | 0 | 155 |
| Source removed by cutover | 0 | 0 | 108 | 0 | 0 | 108 |
| Source absent | 0 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **118** | **37** | **108** | **0** | **0** | **263** |

**Owned parks: none. Needs flip date: none.** All 263 assigned IDs occur exactly once.
The 137 unbound-passage parks are outside this shard and remain outside this judgment.

[shard-1.json](shard-1.json) contains every individual disposition, explanation,
source-unit quotation, surrounding evidence and current file/unit SHA-256. Each row
also binds its original proof row by digest and repeats the full start pin. Successors
name actual conserved units and section paths, with their current digests and an exact
`oldPath`/move ID in `step-05-cutover-move-set.json`, itself digest-bound. A physical
move destination alone was not treated as semantic proof.

## Groups and shared causes

Exact group membership is the `group` field on each individual JSON row. These groups
partition all 263 rows; their explanations do not replace the per-row evidence.

| Group | Rows | Explanation |
|---|---:|---|
| `generic-scaffold` | 3 | f00093/f00097/f00098 are the reusable ui-spec skill's generic `generate`/`init --output docs/ui-spec` scaffold. The tool coordinate belongs to the target project being scaffolded, not fgOS's current documentation authority. The skill's actual command/structure lines are quoted. |
| `source-provenance` | 3 | f00101 cites the tsk-49r/D1 suite origin; f00446 cites the merge-standardization design; f00477 explicitly describes an **OLDER** convention. Keep those source identities, not as current reader entry points. |
| `live-authority-citations` | 37 | These really cite maintained rules, schemas, navigation or required update destinations. They get mapped successors and prepared retargets, not historical labels. See the patch table below. |
| `native-file-contract` | 13 | Native artifact/containment conventions, distillery output templates, retained generated artifacts and a built executable are filesystem operands, not authority documents. They remain live, not historicized. Details below distinguish the cases. |
| `dated-backlog-investigation` | 2 | f00577/f00579 occur in STR70b's explicitly dated 2026-07-21 investigation of rejected alternatives. The old law coordinates identify what that investigation examined. |
| `dated-learning-comparison` | 7 | f00936/f00940/f00942 have dated/source-pinned deep-dive framing; f01004/f01005/f01007/f01008 have dated scan, correction or rejection cells. Their operands identify the compared sources at that time. |
| `upstream-coordinates` | 6 | f00945 belongs to the **beehive** subsection, not fgOS's state instructions. f01096/f01097/f01100/f01103/f01104 belong to the bee inventory whose opening identifies `upstreams/bee/skills/`. The apparent commands are upstream rules being inventoried. |
| `completed-change-or-capture` | 63 | Original task scope, completed repairs, observed drift, quoted learning and captured output. Each row quotes its actual passage and local framing, including past-tense markers; no blanket explanation/history-folder rule is used. Frontmatter describing an old cleanup is distinguished from live glossary frontmatter f03205, which is repointed. |
| `retired-dispatch-door` | 15 | The shared banner explicitly dates the removal to 2026-10-14 and says the account below is kept as history. Its runner-spec operand identifies the removal decision; current execution already points to `fgos run`/Workflow in the banner. |
| `captured-proof` | 6 | f03301–f03306 identify the throwaway proof or a real test-output record. Their framing is quoted; none is treated as a current route into the retired coordination engine. |
| `carried-portal` | 7 | `docs/README.md` claims survive in `docs/platform/documentation/operations/portals/docs-portal.md`, including rebased navigation and explicitly fenced source metadata. |
| `carried-architecture` | 38 | `docs/architecture-map.md` claims survive in `docs/platform/architecture-map.md`: registries, version changes, ID boundaries and retired-decision narratives. Changed relative links are bound to the actual carried paragraphs, not assumed byte-identical. |
| `carried-coexistence` | 2 | The mapped coexistence spec retains the external-workshop canary provenance and backlog pointer. The absent workshop canary is not invented as an in-repository file. |
| `carried-gateway-contract` | 8 | The mapped CTR010 YAML retains the exact OpenAPI claims. Sections are named as YAML key paths, not misread comment headings. This does not certify runtime reader parity or settle every embedded legacy citation. |
| `carried-distribution-history` | 13 | The old vision and its comparison with the old distribution spec survive in the mapped packaging-distribution **History** holder, not as newly promoted setup behavior. |
| `carried-governance` | 8 | Placement, source provenance and navigation survive in `docs/platform/governance.md`, with changed relative URLs explicitly bound. Source metadata does not confer candidate authority. |
| `carried-lifecycle-learning` | 2 | The knowledge successor retains the dated learning-source block, including original workshop coordinates. |
| `carried-rollup-capture` | 3 | The knowledge successor retains the original capture and its old `docPath` identity. Moving the document does not rewrite what the historical capture said. |
| `carried-id-audit` | 26 | The mapped documentation **History** holder retains the audit claims, original coordinates and dates. Deleting the old filename does not delete that evidence. |
| `carried-cli-contract` | 1 | The mapped CLI I/O contract retains the reference-list claim. Its current unit is bound independently of the removed source location. |

### Live native paths are not being called history

- f00166: `<root>/docs/history/` is the gateway's containment boundary.
- f00430/f00433: native Iron-Law/research artifacts described by the CLI comments.
- f00475/f00479: feature-local `CONTEXT.md` identity in the citation convention.
- f00507/f00511: the research skill/task-spec's accumulating output contract.
- f00497: parameterized native distillery output, not a reader-authority target.
- f03300: generated UI output; the UI portal expressly retains the five generated
  files with `regenerate-from-source`. It does **not** certify a candidate compiler root.
- f03361–f03364: `./target/release/fgctl` is produced by the adjacent `cargo build`
  and runs from the repository cwd. It is not `docs/how-to/target/...`.

The move-set inspection found **zero** source paths under `docs/history/`,
`docs/distillery/` or `docs/ui-spec/generated/`. This corroborates the literal-path
judgments; mere reachability was not used as historical evidence. No runtime or
writer-parity proof is inherited from these semantic judgments. L13-10's warning
against historicizing live conventions is preserved.

### Why no retire-with-source rows?

Every one of this shard's 108 removed-source claims has an actual conserved unit in
its mapped holder. Even historical metadata and captures survive there. Retiring
them merely because their old source filenames disappear would discard demonstrable
carriage. `successor-bound` here is a conservation judgment, not a claim that all
embedded navigation has already been composed or that a candidate is authoritative.

## Prepared retargets — not applied

The existing `prepared-patches.json` format is reused: `file`, `rowIds`,
`status: prepared-not-applied`, source/proposed SHA-256, exact line replacements and
unified diff. Each row embeds its file's same co-composed patch. The checker rejects
inconsistent sibling patches. There are **19 distinct file patches / 37 rows**.

| Consumer | Rows | Successor |
|---|---|---|
| `AGENTS.md` | f00102/f00106/f00117/f00118 | Platform foundations and runner handoff contract |
| `apps/fgos-gateway/Cargo.toml` | f00148 | Mapped CTR010 YAML |
| `apps/fgos-gateway/src/gateway.rs` | f00156/f00158/f00161/f00162/f00163 | CTR010 API, default port and error sections |
| `apps/fgos-gateway/src/mcp.rs` | f00175 | CTR010 `/contract` |
| `apps/fgos-gateway/web/src/App.tsx` | f00177 | Mapped S01 |
| `apps/fgos-gateway/web/src/api/client.ts` | f00178 | CTR010 paths |
| `apps/fgos-gateway/web/src/api/types.ts` | f00181 | CTR010 schemas |
| `apps/fgos-gateway/web/src/lib/network.ts` | f00183 | CTR010 document; preserve the no-`bind` observation |
| `apps/fgos-gateway/web/src/screens/NeedsAnswer.tsx` | f00185 | Mapped S04 |
| `apps/fgos-gateway/web/src/screens/TaskDetail.tsx` | f00187/f00189 | Mapped S03/M03 |
| `apps/fgos-gateway/web/src/screens/Taskboard.tsx` | f00191/f00193 | Mapped S02/M03 |
| `core/skills/_shared/citation-format.md` | f00478 | Mapped audit §5 (locked D-local citation rule); the **OLDER** example f00477 stays literal |
| `docs/architecture-manifest.json` | f00527 | Mapped architecture holder |
| `docs/backlog.md` | f00582/f00583/f00592 | Mapped coexistence doctrine/Known Gaps and mission-boundary narrative |
| `docs/explanation/herdr-orchestrator-terminology-boundary.md` | f03205 | Full mapped coordination proposal §5.1, not the old `docs/architect` alias |
| `docs/generated/README.md` | f03297 | Mapped governance principles |
| `docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md` | f03573/f03576/f03577/f03579/f03580/f03582 | CLI I/O purpose, version tokens, write door, identity and reasoned exceptions |
| `docs/knowledge/herdr-web-dashboard-layout-userflow-and-visual-language/herdr-web-dashboard-layout.md` | f03619/f03621/f03622 | Mapped UI overview, **both** explicit F01/F02 operation holders, and states/errors catalogue |
| `docs/knowledge/how-to-label-a-herdr-pane-with-the-claimed-task-from-a-chrom/fgos-terminal-pane-rename.md` | f03716 | Mapped operator-runbook Hard rule |

f00582/f00583 change two occurrences on the same PBI line in one replacement.
Split comment paths in f00183/f00185 remain syntactically valid comments. No
implementation statement, command argument, runtime compiler root, generated skill,
authority metadata or product behavior is changed in the checkout. Other shards'
patches and the existing F composition chain must still be composed together later;
these 19 patches are deliberately pinned preimages, not a claim of conflict-free F application.

## Checker and evidence contract

Run from the repository root:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_1.py --shard 1
```

`check_shard_1.py` is distinct because the three shards are authored concurrently.
It accepts `--shard`; a later turn can consolidate the checkers. It verifies:

1. Exact coverage, no duplicates, input-file and original proof-row digests, kinds and full pins.
2. Every evidence quotation's real line range, exact text, raw-file SHA-256 and exact
   UTF-8 unit SHA-256 against Git blobs at the pin; it additionally rejects live file drift.
3. Actual successor units/section evidence and exact move-set membership/digests,
   including both F01 and F02 for f03621.
4. One co-composed patch per file, exact preimage/replacement/postimage bytes and row coverage.
5. **Real** `patch --batch --fuzz=0 --no-backup-if-mismatch -p1 --forward`, then
   `--reverse`, in a `TemporaryDirectory` under `/tmp/fgos-work/`. Any offset, fuzz,
   reject, backup or wrong resulting bytes fails. Each temporary directory is removed.

SHA-256 conventions: file digests cover raw complete file bytes; unit digests cover
exact `text` with LF separators and **no implied trailing newline**. Original proof-row
digests use sorted-key, compact, UTF-8 JSON (`ensure_ascii=False`).

## Commands, exits and limits

All Python invocations used `python3 -B`. No product suite or native addon ran.

| Command / invocation | Exit | Result |
|---|---:|---|
| `git rev-parse HEAD`; `git status --short` at start | 0 / 0 | Full pin above; clean initial tree |
| `git log -5 --oneline -S'check_shard' -- plans/260925-documentation-authority-unification/reports/phase-09` | 0 | Prior-art search; no existing shard checker to reuse |
| `git log -3 --oneline -S'prepared-not-applied' -- plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise` | 0 | Existing prepared-patch mechanism; reused its data format, not a new product mechanism |
| Python stdin inspections of IDs/proof, row contexts, normalized operands, move-set entries and successor conservation | 0 throughout | 263 IDs; 155 unconfirmed + 108 removed; all current source units bind; every original current-line locator lies inside its quoted unit |
| Python stdin authoring and subsequent full data regeneration for whole-paragraph/section-path bindings | 0 / 0 | Only `shard-1.json` generated; no source patch applied |
| Checker, initial attempt | 1 | `/tmp/fgos-work/` did not exist on this worker; corrected checker to create the permitted scratch parent before `TemporaryDirectory` |
| Checker after correction and after binding refinement | 0 / 0 | Exact 263-row coverage; 19 patches, 38 forward/reverse applications per run |
| Python stdin negative controls using checker functions and an in-memory substituted document | 0 | **12/12 rejected:** bad evidence text/unit digest/file digest/line/path; nonexistent move ID; wrong patch postimage; genuinely nonreplaying patch; missing row; duplicate row; wrong kind; wrong pin |
| Two final checker subprocesses, stdout/stderr compared in memory | 0 / 0 | Byte-identical output; counts 118/37/108, 19 patches, 38 applications each |
| `git diff --check` | 0 | No whitespace findings |
| `git status --short` | 0 | Only the three allowed shard artifacts are authored |

The negative patch control actually substitutes a nonexistent deleted preimage line
and executes `patch`; it is not a test-only success/skip branch. Coverage controls
substitute JSON only in memory and do not edit the delivered file.

The checker is a mechanical integrity/replay proof, **not** an independent semantic
review. The 263 judgments still require the exhaustive reviewer turn L13-20 names.
Only the three authorized artifact paths are written. No pair accounting, Git write,
fgOS CLI/lifecycle, `.fgos` workspace access, service start, docs/product edit, test
suite, source deletion or cutover occurs. The required assignment acknowledgments
and completion claims are written only to the designated external outbox.

Impact-analysis: **degraded/unqueried** — the brief prohibits the fgOS CLI and this
worker exposes no GitNexus tool. No existing product symbol is edited. Markdown
preview is deferred to Lead rather than starting an additional service or writing
outside the declared scope.
