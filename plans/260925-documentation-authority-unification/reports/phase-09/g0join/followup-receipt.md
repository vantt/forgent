# Heading, navigation and placement follow-up receipt

Base HEAD: `37dd5d1f90e352335ad16d301b28b74bf6b700b1`.
Brief: [w29-g0-last-rows-brief.md](../w29-g0-last-rows-brief.md).
Independent input: [w28-g0-verdicts-b9.md](../reviews/w28-g0-verdicts-b9.md) and [machine verdicts](../reviews/w28-g0-verdicts-b9.json), both read completely.
The preceding receipt remains available at the base commit; this receipt describes this turn only.

## Result

Corrected **24 ledger rows** in eight shards, including two appended overlays, and three reference sites in `docs/platform/work-state/spec.md`. Every changed row has `reviewStatus: pending`. No approval, source identity, historical snapshot, legacy document, register, review or existing script was rewritten. No Git write or native ownership-pair accounting was performed.

### Heading-title audit

Scanned **all 127 original g0 rows**, using the existing dual extractors, working identity registry (including identity gaps), and exact historical heading-digest preimages where current legacy bytes no longer matched. There are eight source-heading title translations:

| g0 pointer | Source title | Target title | Action |
| --- | --- | --- | --- |
| `/bindingRefresh/45` | Khai việc (add) — bề mặt nội bộ | Add Verb | Named the missing title change, including source line 864 and target line 713. |
| `/bindingRefresh/47` | Nộp vấn đề tự do (submit) | Submit Verb | Named the missing title change. |
| `/bindingRefresh/49` | Data Dictionary | 3. Work Item Data Dictionary | Already named; target digest subsequently rebound for the navigation fix. |
| `/bindingRefresh/115` | Entry Points & Triggers | 2. Entry Points And Triggers | Additional omission found and named. |
| `/bindingRefresh/117` | Business Rules | 11. Business Rules | Additional omission found and named. |
| `/bindingRefresh/118` | Edge Cases Settled | 12. Edge Cases Settled | Already named; unchanged. |
| `/bindingRefresh/120` | Open Gaps | 13. Known Gaps And Deferred Work | Already named; unchanged. |
| `/bindingRefresh/122` | Pointers (implementation) | 2. Implementation Pointers | Already named; unchanged. |

Full pre-edit rationales, authenticated source titles/digests/commits, target titles/digests and all 127 classifications: [last-rows-heading-audit.json](last-rows-heading-audit.json). The final proof checks that all eight translated headings are explicitly named in their current rationales. It also checks the two newly appended overlays (129 final g0 rows): `/127` explicitly names “Mô hình domain (base-workflow + domain-extension)” → “6. Domain Model”; `/128` has a block source, not a heading-title change.

### Placement content

Refreshed only the live `placement.content` in s4-successors `/registryGaps/22` and s5-authorities `/registryGaps/3` from the current extracted unit. The sole text defect was the code span `d['executeAssignment'](../../../../specs/a)`, now restored to `d['executeAssignment'](a)`. Each complete body now hashes to **`e8167a0a73f3c3642511a20aecbcee8b6f8ef8bbb0ab6912d41b8958038642e4`**, equal to both its selected digest and current target digest; `check_current` verifies `placement.content == unit.text` as well as selected/previous/next witnesses. The rationales explicitly record this refresh so the decision fingerprints change; no old REWORK is silently treated as approval.

Scanned **3,160 non-snapshot placements across all ledger/pilot shards** through the existing `bindings.rows` traversal. After correction, all **2,004 selected body hashes** and **164 legacy-shaped body hashes** agree; no other body-content/hash mismatch remains. There are **990 selected composite headings**, plus **two legacy-shaped headings**: their digests cover the heading and direct payload, whereas `placement.content` holds only the heading line. Hashing that line alone is not the heading recipe and is not a corruption finding. Immutable `priorReview`/supersession/before/after snapshots are excluded by the existing traversal contract, not rewritten.

The `import2/partial-carry-residuals.json` bytes, both residual texts/hashes, their current target bindings, and both string-form `residualRef` pointers remain unchanged and are verified. No residual rewrite was needed.

### Navigation rebindings

Retargeted the three old-heading reference sites at lines **74, 83 and 516** to explicit `[Add Verb](#add-verb)` / `[Submit Verb](#submit-verb)` links. No old “Khai việc” / “Nộp vấn đề tự do” reference remains in the target spec; line counts and anchors did not shift.

Reused `rebind/rebind.py` **extract / locate / binding / witness**, not a new matching mechanism. Before-images come from the complete document at HEAD; after-images come from current bytes through both unchanged extractors. Four unit digests change: `3-work-item-data-dictionary`, `unheaded-block-4`, `6-domain-model`, and `unheaded-block-54`.

- Seven effective content bindings refreshed, including two overlays for read-only pilot origins.
- Six immediately adjacent placement witnesses refreshed; their own target digests are unchanged.
- Pilot `/claims/55` and `/claims/65` stay untouched. Their successors extend the existing g0 shard at `/bindingRefresh/127` and `/128`, with explicit `supersedesBinding` identities and pending independent review. No new claim identity was minted.
- `rebind.py` author-mode `main` was **not** invoked: it also performs native-pair accounting, forbidden by this brief. Its existing content-location/binding functions were invoked directly; the unmodified command-line `--check` is the final owning drift proof.

Full before/after rows and passage/neighbour witnesses: [../rebind/last-rows-rebindings.json](../rebind/last-rows-rebindings.json).

## Every changed ledger row

Shard names below are relative to `ledger/decisions/`. All 24 rows are pending.

| Shard | Pointers | Change |
| --- | --- | --- |
| `g0-content-redecisions.json` | `/bindingRefresh/45`, `/47`, `/115`, `/117` | Missing heading-title rationales. |
| `g0-content-redecisions.json` | `/bindingRefresh/49`, `/50` | Navigation-content digest/hash/rationale rebinds. |
| `g0-content-redecisions.json` | `/bindingRefresh/127`, `/128` | New explicit successors of the two read-only pilot bindings; existing claim identities retained. |
| `s13-resync-a.json` | `/sourceBindings/6`, `/60`, `/70` | Content bindings and complete current placements refreshed. |
| `s13-resync-a.json` | `/sourceBindings/4`, `/59`, `/61`, `/69`, `/71` | Immediate placement neighbours refreshed and explained. |
| `s5-root-truth-successors.json` | `/registryGaps/6` | Adjacent data-dictionary heading witness refreshed and explained. |
| `s4-packaging-distribution-successors.json` | `/registryGaps/22` | Placement content restored; rationale records the exact correction. |
| `s5-root-authorities-boundary-gaps.json` | `/registryGaps/3` | Same placement-content restoration and rationale. |
| `s2-agent-coordination-truth-judgment.json` | `/claims/404` | Source coordinates labelled historical at `0d8c602e2822184014c64243726fd9f6a1a4a5ba`. |
| `s8-observe-01.json` | `/claims/4`, `/registryGaps/2` | Same authenticated historical coordinate pin. |
| `s9-runner-01.json` | `/claims/9`, `/registryGaps/33` | Source coordinates labelled historical at `a9a2b079f6a12d5992461312cd03b5d24c6495a2`. |

The five historical coordinate labels are authenticated against exact anchor, full unit digest and start/end lines at the named commits. Current target coordinates are not relabelled historical.

## Proofs and the committed-pin boundary

All Python commands use `python3 -B`. All Node extraction runs under `NODE_OPTIONS=--no-addons`.

| Proof | Exit | Result |
| --- | --- | --- |
| `rebind/rebind.py --check` | **0** | Unresolved drift **0**. [Full stdout](last-rows-rebind-check.json). |
| Existing `ledgerfix/verify.py::check_current`, called by `g0join/last-rows-check.py` | **0** | All **24 changed current targets**, including full changed placements, satisfy the existing owning assertions. Complete live placement scan and immutable-source/snapshot checks also pass. [Full stdout](last-rows-validation.json). |
| `node scripts/check-legacy-docs-ratchet.mjs` | **0** | 997 legacy files, 28 accounted edits, 3 accounted additions; no violation. [Full stdout](last-rows-ratchet.txt). |
| `g0join/join.py --pin HEAD` | **1** | 1,927 effective rows, 1,924 approved, exactly **3 stale/open-REWORK** rows; missing/mismatched/invalid/unresolved = **0**. All three open rows are changed this turn. [Unmodified stdout](last-rows-join-head.json). |
| `git diff --check` | **0** | No whitespace errors. |

**Do not mistake working-tree evidence for committed proof or independent review.** `join.py` reads committed blobs and decision history only. At the unchanged HEAD it necessarily still sees the three reviewed defects in g0 `/45`, s4-successors `/22`, and s5-authorities `/3`; all three are corrected here. The worker cannot commit. Its output already shows no unrelated open row, but cannot certify the new uncommitted fingerprints.

The supplemental replay proves **1,913 unaffected approved effective rows** retain their exact fingerprints, and names **14 changed existing joined rows** awaiting fresh review plus the **two new pilot-successor overlays** without verdicts. Eight changed native `s13/sourceBindings` rows are checked directly but are not members of the existing G0 obligation population; this change does not manufacture approvals or broaden that population. After the runner commits, rerun `join.py --pin HEAD`: expect stale review on the changed existing decisions and missing review on the two new overlays, with no unrelated failures. No join implementation, review record, pin or Git object was altered to simulate this.

The full historical `ledgerfix/verify.py main` was not substituted for the scoped placement check: it also replays a frozen recipe-migration/register population outside this brief. The existing **`check_current`** placement assertions are reused unchanged, rather than weakening them or claiming every historical placement matches today's document.

## Separate finding — unchanged pre-existing placement drift

While preparing the neighbouring-witness refresh, six existing snapshots were found to describe older business-rule placements even though their bindings already name current content:

- `s13-resync-a.json`: `/sourceBindings/150`, `/152`.
- `s5-root-boundary-sync.json`: `/registryGaps/33`, `/43`.
- `s5-root-source-native-successors.json`: `/registryGaps/3`.
- `s5-root-truth-successors.json`: `/registryGaps/4`.

These are **not** introduced by the three heading-reference edits, and their body content hashes agree with their own stored selected digests. An initially over-broad placement regeneration provisionally refreshed them; that refresh was reverted to their exact original rows before final proofs. They are **unchanged in this diff**, are not counted as corrected rows, and are not hidden by a claim of a full all-current-placement pass. Follow-up custody: inspect and refresh these six witnesses in a separately authorized records task. The final validation JSON retains the six exact pointers.

## Command ledger

Commands ran in `/home/vantt/projects/forgentX-p9-w1-d4`; `B` abbreviates `plans/260925-documentation-authority-unification/reports/phase-09`, `P` its plan root. `python3 -B -` entries identify each inline invocation by its precise operation. Read-tool calls inspected the brief, both reviews, reading map, routing guidance, relevant spec passages, existing receipt, hash/traversal/extraction/rebind/join/placement implementations, ratchet and proof outputs; they have no process exit code.

| Invocation, in order | Exit | Observation |
| --- | --- | --- |
| Initial `cd` plus atomic ACK `printf`/`mv` in assignment outbox | 0 | Required transport acknowledgement; no workspace mutation. |
| `git status --short && git rev-parse HEAD && git log -5 --oneline` | 0 | Clean starting tree and base pin established. |
| `git log -5 --oneline -G 'Khai việc\|Nộp vấn đề tự do\|Add Verb\|Submit Verb' -- docs/platform/work-state/spec.md "$P/ledger/decisions/g0-content-redecisions.json"`; `git log -5 --oneline -S 'current lines' -- "$P/ledger/decisions/s8-observe-01.json"` | 0 | Existing heading migration and rationale-correction history inspected. |
| `python3 -B -`: all-placement raw-hash scan plus requested-row inspection, first attempt | timeout | 20-second execution limit; no write. |
| Same placement/row inspection retried with longer timeout | 1 | Naive scan encountered the legacy placement shape without `selected`; revealed composite-heading false positives; no write. |
| `python3 -B -`: seven requested rationale rows and embedded extractor definition inspection | 0 | Established exact live rationale text and composite heading semantics. |
| `NODE_OPTIONS=--no-addons python3 -B -`: placement-shape scan plus `rebind.main --check` | 0 | 3,160 placements; exactly two non-heading content/hash mismatches; baseline drift 0. |
| `NODE_OPTIONS=--no-addons python3 -B -`: original g0 predecessor/source path listing | 0 | Located all original g0 targets and source metadata availability. |
| `python3 -B -`: pilot source row and g0 document metadata inspection | 0 | Confirmed pilot is read-only and g0 owns its overlays. |
| `python3 -B -`: registry row shape and existing evidence pins | 0 | Located source path/anchor/kind fields. |
| `NODE_OPTIONS=--no-addons python3 -B -`: initial registry/current-source heading comparison | 0 | Identified add/submit changes; missing historical digests were explicitly reported, not accepted. |
| `python3 -B -`: selected current g0 rationales and evidence-record shapes | 0 | Found potential entry-point/business-rule title omissions. |
| `NODE_OPTIONS=--no-addons python3 -B -`: first full historical heading-audit attempt | 1 | Correctly stopped on an identity-gap source absent from the initial units-only map; no audit output written. |
| `python3 -B -`: registry collections/identity-gap inspection | 0 | Included `identityGaps`; distinguished block sources from heading targets. |
| `NODE_OPTIONS=--no-addons python3 -B -`: complete 127-row heading audit | 0 | Wrote `last-rows-heading-audit.json`; eight translations, four omissions. |
| `NODE_OPTIONS=--no-addons python3 -B -`: first historical coordinate authentication | 1 | s2/s8 matched at `0d8c602e2`; runner's desired historical line 68 did not (then line 71); no write. |
| `git log -12 --format='%h %s' 0d8c602e2 -- docs/specs/runner.md && git log -5 --format='%h %s' -- "$P/ledger/decisions/s9-runner-01.json"` | 0 | Inspected source/ledger history to find an honest historical coordinate pin. |
| `NODE_OPTIONS=--no-addons python3 -B -`: four candidate runner source pins plus placement text extraction | 0 | Candidates still had shifted lines; extracted exact body text. |
| `NODE_OPTIONS=--no-addons python3 -B -`: code-span diff plus batched runner document-history scan | 0 | Only one corrupted span per live body; found exact line-68 pin `a9a2b079f6a12d5992461312cd03b5d24c6495a2`. |
| `python3 -B -`: code-span occurrence count | 0 | Distinguished current content from immutable priorReview copies. |
| `python3 -B -`: structured code-span field-path scan | 0 | Only live and historical-copy occurrences; historical copies left intact. |
| `NODE_OPTIONS=--no-addons python3 -B -`: changed-unit/effective-binding/neighbour analysis | 0 | Four changed unit digests; identified pilot origins requiring overlays. |
| `python3 -B -`: pilot/native-row/placement field inspection | 0 | Reused current contracts and clarified each rebind's ownership. |
| `NODE_OPTIONS=--no-addons python3 -B -`: existing rebind-port authoring and two content refreshes | 0 | Authored rebindings/placements and report; initially included six pre-existing stale neighbours. |
| `python3 -B -`: before/after placement-field diff | 0 | Identified those six unrelated provisional changes. |
| `python3 -B -`: restore six unrelated rows and regenerate rebind receipt | 0 | Final rebind counts: 7 content bindings, 6 adjacent placements, 2 body snapshots; 2 pilot overlays. |
| `NODE_OPTIONS=--no-addons python3 -B -`: proof subprocess capture wrapper | 0 | Child `rebind.py --check` **0**, ratchet **0**, `join.py --pin HEAD` **1**; raw stdout/stderr and child exits retained. |
| `python3 -B -`: committed join membership/open-row inspection | 0 | Exactly three open rows, all changed; native s13 rows are outside existing G0 obligation membership. |
| `python3 -B -`: current placement-rationale suffix inspection | 0 | Prepared explicit placement-refresh rationale without changing historical copies. |
| `python3 -B -`: live placement-rationale field-order/prefix inspection | 0 | Disambiguated exact live rationale replacement. |
| `NODE_OPTIONS=--no-addons python3 -B -`: refresh two generated report after-images and invoke scoped replay | 1 | Proof found that `residualRef` uses the existing string pointer contract, not an object; corrected the new proof, not production data. |
| `python3 -B -`: residual pointer and record-shape inspection | 0 | Confirmed unchanged `#/rows/0` and `#/rows/1` contracts. |
| `NODE_OPTIONS=--no-addons python3 -B "$B/g0join/last-rows-check.py"` with stdout/stderr capture | 0 | All 24 changed rows, source snapshots, coordinates, body hashes, residuals and join boundary checks passed. |
| `git diff --check && git diff --stat && git status --short && git diff --numstat && command -v mdview` | 0 | Scope inspected; markdown preview CLI available. |
| `python3 -B -`: legacy-shaped placement hash classification and validation-count inspection | 0 | 164 bodies hash exactly; two additional composite headings. Extended the new proof to check this shape too. |

Edits to ordinary prose used exact-replacement tooling; generated ledger/rebinding data used the existing rebind extraction/binding/witness ports and ledger JSON writer convention. Rejected exact replacements (ambiguous live/snapshot matches, one indentation mismatch) changed no bytes and were retried with unique context. No product tests, fgOS CLI, lifecycle verbs, native addons, secrets or `phase-08/audit-report.py` were used. Scratch extraction/history batches used `tempfile.TemporaryDirectory` under `/tmp/fgos-work/` and removed their directories on exit. No scratch was placed in the repo.

### Final replay and preview

| Invocation | Exit | Observation |
| --- | --- | --- |
| `NODE_OPTIONS=--no-addons python3 -B -`: first final-replay capture wrapper | 1 | Both child rebind and ratchet already exited 0; the wrapper then indexed the shorter Node argv as if it were Python. No product/ledger write; corrected only the inline capture wrapper. |
| `NODE_OPTIONS=--no-addons python3 -B -`: corrected final-replay/scope wrapper | 0 | Child rebind **0**, ratchet **0**, committed join **1**, scoped placement/data replay **0**, whitespace check **0**. Raw commands and outputs: [last-rows-commands.json](last-rows-commands.json). |
| `mdview open /home/vantt/projects/forgentX-p9-w1-d4/docs/platform/work-state/spec.md && mdview open /home/vantt/projects/forgentX-p9-w1-d4/plans/260925-documentation-authority-unification/reports/phase-09/g0join/followup-receipt.md` | 1 | Preview service refused its read-only database (SQLite code 8), so the second open did not run and no URL was returned. No database repair/config change attempted outside scope. |
| `NODE_OPTIONS=--no-addons python3 -B -`: final report synchronization, heading-overlay authentication and complete proof replay | 0 | Captures final row fingerprints after explicitly naming the new domain-heading overlay's source title; same expected proof exits and zero outside-scope files/index/HEAD writes. |

Two additional read-only `python3 -B -` invocations inspected embedded extractor recipe keys/hash definitions and the extractor's import header; both exited **0**. Final `git diff --check` / scoped-files / index / HEAD audits are also recorded in `last-rows-commands.json`. Markdown preview remains unavailable due to service permissions, not a documentation-content failure.

## Reproduce

```sh
B=plans/260925-documentation-authority-unification/reports/phase-09
NODE_OPTIONS=--no-addons python3 -B "$B/rebind/rebind.py" --check
NODE_OPTIONS=--no-addons python3 -B "$B/g0join/last-rows-check.py"
NODE_OPTIONS=--no-addons node scripts/check-legacy-docs-ratchet.mjs
python3 -B "$B/g0join/join.py" --pin HEAD
```

The scoped replay intentionally compares this change to its uncommitted base HEAD. After the runner commits, use the new committed `join.py --pin HEAD` for review freshness; the saved base-pin join and authoring replay are not approvals.
