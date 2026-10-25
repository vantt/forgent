# Shard 2 — owned-park premise judgments

Pin at turn start: **`c94545de5b45873cb2eb419f10124283fd730a2e`**.
Input proof source: `4178dcc6e3445d5d9b8ffd55963cdd02a418af73`.
Scope: exactly the **263 IDs** in [shard-2-ids.json](shard-2-ids.json).

Read [the brief](../../w22-g6-park-judgments-brief.md), the W22 register review (Markdown and JSON), W8 parks review, W9 fix review, preserve-premise receipt, and owner rulings L13-10/L13-20. This settles producer judgments, **not independent approval, gate acceptance, cutover readiness or authority**. Neither the original proof nor any source document was edited.

Machine record: [shard-2.json](shard-2.json). Checker: [check_shard_2.py](check_shard_2.py). The assignment deliberately gives this checker a shard-specific filename to avoid parallel-turn collisions.

## Dispositions

| Disposition | Count |
|---|---:|
| preserve-confirmed | 229 |
| repoint | 28 |
| successor-bound | 6 |
| retire-with-source | 0 |
| owned-park | 0 |
| **Total** | **263** |

Input kinds: **257** unconfirmed-premise parks and **6** removed-by-cutover parks; no absent-source row belongs to this shard. Every row has its own source binding, evidence spans, file and unit digests, reason, group, pin and `needsFlipDate: false`. There is no flip-date dependency and no unresolved owned park requiring an owner/action.

## Shared-cause groups

The JSON `groups` partition lists every member ID explicitly, and every row names its group. Grouping does not replace per-row evidence or disposition.

| Group | Rows | Explanation |
|---|---:|---|
| completed-work | 111 | The bound passage records a completed incident, source capture, prior decision or quoted verification input. Preserve the original event identity, not a current-reader redirect. The actual sentence/section supplies the premise; the knowledge-directory location alone does not. |
| literal-input | 7 | Diagnostic output, a regex prefix, a variable filename pattern, path grammar, or a fenced implementation comment. These are literal operands, not authority documents to follow. |
| migration-inventory | 18 | f05117–f05134 are Phase 0 evidence-only inventory rows. The header limits the file to migration bookkeeping; the surrounding note says it records the earlier migration. Target-path cells are historical classifications. |
| history-wrapper | 8 | Historical templates and explicitly conservation-only source wrappers preserve their original header/source references. Their stated use excludes current canonical authority; placeholders remain placeholders. |
| audit-history | 15 | The ID audit is explicitly History, records the July audit/closure and forbids current canonical use. Its old decision/file coordinates identify that audit's evidence. |
| source-relationship | 29 | Promoted-from/preserved-from and source architecture/protocol/plan/design relationships are lineage. Current target links are separately available; a clickable source relationship does not by itself delegate current authority. |
| frozen-metadata | 3 | f06711/f06780/f06802 occur inside `Source Metadata (Added in candidate)`, the fenced original header, not the active wrapper's Related list. |
| restored-host-source | 24 | Verbatim-restoration notes pin the original commit; restored fenced excerpts and the literal old side of navigation mappings preserve source bytes. This does not approve an unassigned live mapping destination. |
| correction-evidence | 3 | f06828/f06830/f06831 record inputs to the earlier A40/A19 truth correction. The note expressly withholds carried approval and says rebindings remain pending. |
| distribution-history | 11 | The baseline expressly rejects old sources as current authority. Its old-source table, vision lineage, displaced-unit notes and the portal's Source type conserve promotion inputs. |
| law-successor | 6 | The removed root law claims have actual units in the surviving law carrier. Bind those current units instead of inheriting preserve from the deleted file. |
| live-route | 28 | Current reader/consumer instructions, cross-contract dependencies, placement prescriptions and active Related routes must use their successor holders. Prepare a co-composed patch per file; do not apply it. |

### Distinctions that mattered

- **f03773/f03775:** `NNNN-*.md` and `^docs/decisions/00[0-9]+-` are a pattern and a regex input, not literal authority files. Preserving them does **not** certify the surrounding old manual-ID-allocation recipe as current. The same file's real-incident rows preserve the original incident identities.
- **f03897 versus f03898:** a completed rename's footprint is historical; the later Related entry calling the map canonical is live navigation and is repointed.
- **f04255 versus f04271:** the former reports an already-made FSM/CONTEXT judgment; the latter presents the existing completion ladder as current authority and is repointed.
- **f06461:** only the active Related entry is repointed. The architecture map's separately labelled Provenance origin is not rewritten.
- **f06785 versus f06786/f06787:** Event Store's Supersedes entry is decision lineage. Its Related laws and operative L7 durability citation are current dependencies and are repointed.
- **f06790/f06791:** `Target platform docs` is a placement prescription, not a labelled old inventory. The two entries become docs-relative successor paths in the tree; no unrelated subtree is redesigned.
- **f06811 versus the YAML I/O references:** the Research path is inside the comment recording the original schema correction and real `fgos show` observation. The envelope/error/parity requirements and `x-specs` entries import a current contract and are repointed.
- **f06915–f06917/f06932:** imperative language inside a fenced, expressly restored source excerpt is still the original source, with a separate navigation mapping. It is not silently converted into current authority.
- **f07112:** use the carried **0035 narrative**, not just the foundations law summary. `carries/claim-carries.json` names this holder/anchor; the output separately binds its current section bytes rather than reusing the old carry digest.

## Prepared repoints

There are **16 distinct per-file patches**, containing **28 exact line replacements**. Rows sharing a file carry the same complete patch and list all affected shard repoint IDs. The existing prepared-patch format is reused: `file`, `status: prepared-not-applied`, `rowIds`, `sourceSha256`, `proposedSha256`, `replacements` and unified `patch`.

| Successor holder | Shard rows |
|---|---|
| `docs/platform/architecture-map.md` | f03898, f06461, f06550 |
| `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | f03917, f04357, f06837 |
| `docs/platform/platform-foundations.md` | f04271, f06786, f06787, f07112 |
| `docs/platform/herdr-web-dashboard/operations/operator-runbook.md` | f04427 |
| `docs/platform/governance.md` | f04443, f06791, f07111, f07121, f07134, f07135 |
| `docs/platform/runner/contracts/routing-handoff.md` | f04479 |
| `docs/platform/work-state/contracts/cli-io-contract.md` | f06551, f06805, f06808, f06817, f06821, f06833, f06835, f06843 |
| `docs/platform/documentation/operations/portals/docs-portal.md` | f06790, f07115 |

Every row names its successor **section and current unit digest** in the JSON, with quoted evidence at this pin. Placement evidence comes from `ledger/area-map-root-authorities.md`, `ledger/area-map-whole-system-architecture.md` or the explicit 0035 binding in `carries/claim-carries.json`. The f06787 patch replaces the old numeric line locator with `#l7-durability-ladder`.

The f04479 source unit has moved from the proof's old line 611 to **line 661**. Its complete unit still binds uniquely at this pin; the output uses the actual current line and digest, not the stale locator. No F bytes are needed to settle it.

These patches have **not been applied** to the repository. Composition with other shards, existing prepared patches, and later source drift remains Lead work. Do not apply duplicate copies of a shared patch; compose once per file and recheck its preimage. Nothing here authorizes changes to unassigned occurrences elsewhere in the same document.

## Removed-source claims

All six belong to removed `docs/platform-foundations.md`; their successor is **`docs/platform/platform-foundations.md`**.

| Rows | Successor unit at pin | Current unit SHA-256 |
|---|---|---|
| f04437, f04438, f04439, f04440 | opening law/provenance paragraph, lines 99–106 | `ede22a666bfbe3cdd200ebb7027f69d42d3453ff3ac727d12a1b0ffd55c6c239` |
| f04441 | L1 log/state section, lines 113–136 | `ab9580104ceee633a3fa85986cdfbe4e9c6d5c5b4ee8e060334993f868f19210` |
| f04442 | L6 maturity section, lines 239–266 | `61804494df677de20e2b98df372c2ed5f5fc39ab90d4dc36cf4b6ffe8d2b3286` |

The opening is **non-identical**: the carrier replaces the old `.bee/decisions.jsonl`/report provenance with the generated decision index and spec narratives, while retaining the deep-dive source identity. This is disclosed, not treated as verbatim conservation. L1 retains its State example. L6 retains the expressly dated **Claimed F4 — 2026-07-16** measurement and original benchmark coordinate; no fresh benchmark execution is claimed.

## Verification and commands

Run from the worktree root:

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_2.py --shard 2
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/park-judgments/check_shard_2.py --shard 2 --self-test
```

The checker reads source/evidence from **git blobs at the recorded pin**, not mutable working-tree content. It checks exact shard membership/order/no duplicates, proof and ID-file digests, kind, source-unit custody, evidence lines/text/file and span digests, successor sections/unit digests, group partition/counts, and per-file patch ownership. Every unique patch is replayed **forward and backward with `patch --batch --fuzz=0 -p1`**, without offsets, in a `TemporaryDirectory` under `/tmp/fgos-work/`; expected proposed and restored bytes must match exactly. Context-manager cleanup also runs on failed replay.

Eight negative controls reject a missing row, duplicate row, fabricated evidence text, wrong evidence digest, invalid line, wrong source-unit digest, per-row pin drift and a malformed patch. Mechanical success proves custody/replay, **not independent semantic approval**.

### Command ledger

Inline Python commands below were `python3 -B - <<'PY' … PY` unless noted; descriptions identify the executed probes rather than pretending the exploratory snippets are reusable verifier files.

| Command / probe | Exit | Observation |
|---|---:|---|
| Required acknowledgement: Python timestamp/JSON write to outbox `.tmp`, then `os.replace`; `pwd` | 0 | Protocol acknowledgement only; outside-workspace runner artifact. |
| `git rev-parse HEAD`; `git status --short`; `git log -5 --oneline -- …/preserve-premise`; `ls …/park-judgments` | 0 | Start pin above; initially clean; only shard ID files existed. |
| Python: inspect proof shape, select shard IDs, print first two complete rows and per-file population | 0 | 263 assigned identities and current source bindings. |
| Python: inspect units before f05100 | 0 | Tool output truncated; reran the early slice separately. |
| Python: inspect units before f04015 | 0 | Completed the early slice without relying on truncated output. |
| Python: inspect units f05100–f06799 | 0 | Inventory, source wrappers and metadata. |
| Python: inspect units f06800–f07068 | 0 | API/spec dependencies and host restoration sources. |
| Python: inspect units f07069 onward | 0 | Host source audit/vision, ledger, authoring rules and baseline. |
| Python: print knowledge file headers/section headings | 0 | Checked surrounding framing; early truncated portion was reread by the later header probe. |
| Python: count input kinds and locate every current unit in the actual source | 0 | 257 unconfirmed / 6 removed; repeated restoration notes located by their row coordinates. |
| Python: list removed-source rows/successors | 0 | All six have the law carrier as an explicit successor. |
| `git log -5 --oneline -S'prepared-not-applied' -- …/preserve-premise`; Python inspect carries shapes | 0 | Reused db023f065's prepared-patch structure, not a new patch mechanism. |
| Python: search document operations for root-holder mappings | 0 | No relevant root mappings; used the frozen ledger maps instead. |
| Python: print source headers for rows before f03868 | 0 | Completed the earlier truncated header inspection. |
| Python: inspect prior reasons for pattern/tree/source-link edge cases | 0 | Rejudged their semantics rather than inheriting old preserve assertions. |
| Python: list successor headings; inspect carries mission bindings | 0 | Located L1/L6/L7/L9, CLI sections, hard rule and 0035 narrative. |
| Python: exploratory repoint-heading validation | 1 | Found the actual governance heading is `## 5. Metadata`, not guessed `Metadata Discipline`; no artifact/source was written by this failed probe. |
| Python: build per-row judgments from pinned source bytes, explicit semantic choices, ledger spans and co-composed patch preimages | 0 | Wrote only `shard-2.json`; 263 rows / 12 groups / 16 patches. |
| Checker `--shard 2 --self-test` | 0 | Passed; 263 rows, 16 bidirectional patch replays, 8 rejected negative controls. |
| Python: inspect all prepared replacements and current source positions | 0 | 28 replacements, f04479 at current line 661. |
| Python: summarize successor digests and repoint members | 0 | Matches the tables above. |
| Python: double replay, AST parse, then initial new-file whitespace wrapper | 1 | Both checker runs passed with identical stdout/empty stderr and unchanged artifacts. The wrapper incorrectly expected `git diff --no-index` to return 0 for an added file; it returned normal difference code 1 with no diagnostics. No whitespace defect was reported. |
| Checker `--shard 2` | 0 | Required invocation passed: 263 rows, 12 groups, 16 patches. |
| Python: double `--self-test` replay and corrected new-file checks | 0 | Identical stdout, empty stderr, unchanged three artifacts; AST valid; explicit trailing-whitespace/EOF checks pass. Each `git diff --no-index --check /dev/null <new-file>` returns 1 (new content differs) with empty stdout/stderr. No checker scratch directory or pycache remains. |
| `GIT_OPTIONAL_LOCKS=0 git diff --check` | 0 | No tracked whitespace errors. |
| `GIT_OPTIONAL_LOCKS=0 git diff --name-only HEAD -- docs src scripts test packages apps` | 0 | Empty: no product/source changes. |
| `GIT_OPTIONAL_LOCKS=0 git status --short --untracked-files=all` | 0 | Exactly the three assigned shard output files are new. |

File reads, path searches and content greps also inspected the named briefs, reviews, rulings, source headers, target sections and ledger maps; no source-changing command was used. The exploratory lookup `docs/platform/io/README.md` was absent; the actual CLI contract was discovered under `work-state/contracts/` before any successor judgment was written.

No git add/commit, fgOS CLI/lifecycle, product tests, native addons, secret access, source writes, register/proof edits or pair accounting. Impact-analysis: **degraded/unqueried** because the brief forbids the CLI and no live impact-analysis tool is exposed; this is a new report-local checker, not an existing product-symbol edit. No Markdown preview service was launched under the exact write boundary.
