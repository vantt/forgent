# Retrospective research: genesis and the compound idea (2026-07-13 to 2026-08-15)

Scope: read-only git archaeology. All commit times are the committer date in +0700. The history has 13701 commits reachable from HEAD; 4155 fall inside the window, so this report samples the first four days in depth and the rest by path.

Method note: `git log --since/--until` stops early on this history, so ranges were built from `git rev-list --topo-order` and from a full `%h %cs` listing. Anything I could not confirm is marked "unverified".

## 1. Timeline (date | commit | event | source)

| Date | Commit | Event | Source |
|---|---|---|---|
| 2026-07-13 11:34 | `f6139bf57` | Root commit. Contains only `LICENSE`. | `git ls-tree f6139bf57` |
| 2026-07-13 13:29 | `a21d9446c` | First real docs: a one-page positioning README (misspelled `READEME.md`) and `docs/naming.md` (133 lines, naming exploration). | `git show --stat a21d9446c` |
| 2026-07-13 13:30 | `2930a89fc` | "reference learning system": `docs/reference-learning-system.md`, `docs/references/{comparison-matrix,intake,porting-log}.md`, `docs/references/sources/{beegog,repository-harness}.md`, `scripts/ref-delta.sh`. This is the learning area that later became the distillery. | `git show --stat 2930a89fc` |
| 2026-07-13 13:45 | `40f924fb1` | Recovered two 260711 research reports (harness capabilities, harness CLI and symphony architecture) under `plans/reports/`. | `git show --stat 40f924fb1` |
| 2026-07-13 15:37 | `ba92c2a8c` | `READEME.md` renamed to `README.md`, with a documentation index. | `git show --stat ba92c2a8c` |
| 2026-07-13 16:39 | `81e271731` | Rename: skill `ref-scan` to `distill`, `docs/references` to `docs/distillery`, clones to `upstreams/`. | `git show --stat 81e271731` |
| 2026-07-13 22:31 to 23:17 | `dcff9a551`, `8224b678c`, `71a78e5f3` | Scans of symphony and marketing-cockpit (fgOS agent-agnostic framework); `distill consult` mode ("recall-first materials brief for new-feature design"). | `git log --topo-order` |
| 2026-07-14 00:01 | `ebc6e8047` | Deep-dives `state` and `compound-engineering` plus `plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md`. First dedicated compound document. | `git show --stat ebc6e8047` |
| 2026-07-14 00:03 | `823926cc7` | Onboard "bee 0.1.32 as development harness (scaffolding, not product)": `.bee/`, `AGENTS.md` (104 lines), `CLAUDE.md`, `docs/history/learnings/critical-patterns.md`. | `git show --stat 823926cc7` |
| 2026-07-14 00:28 | `e9ff70db7` | `docs/platform-foundations.md`: "eight laws of the compound-learning stack (Phase 0)", L1 to L8. Four decisions land in `.bee/decisions.jsonl` (`ca7de3cf`, `ae461c8b`, `ed953e09`, `14ebeea9`). | `git show e9ff70db7` |
| 2026-07-14 01:50 to 02:26 | `e034e3b6d` .. `ad65f59fd` | Phase 1 state layer: event log, FSM, `fgos` CLI. At close, the first `docs/specs/` (`work-state`, `system-overview`, `platform-foundations`, `reading-map`), `docs/backlog.md` and `docs/history/learnings/20260714-phase-1-state-layer.md`. | `git show --stat ad65f59fd` |
| 2026-07-14 12:57 to 16:43 | `49e5a42dc` .. `2034be14b` | Phase 2 routing (CONTEXT, plan, 10 cells, close). `docs/routing-handoff-contract.md` first appears in `06df4970f`. | `git log --topo-order` |
| 2026-07-14 17:54 | `a9327e574` | "repo-divorce" CONTEXT locked: product tree and workshop separated, `docs/history/` stays in the workshop. | `docs/history/repo-divorce/CONTEXT.md` in `a9327e574` |
| 2026-07-14 20:02 to 20:04 | `e99998633`, `e350acbda` | Workshop tree untracked from the product repo (`/plans/`, `/docs/history/`, `/docs/distillery/` ignored). Product `AGENTS.md` and `CLAUDE.md` swapped to pure product text; `docs/specs/reading-map.md` rewritten. | `git show e99998633:.gitignore` |
| 2026-07-14 22:48 | `c93aa4acf` | `docs/decisions/` created: index plus nine ADRs, `NNNN-<slug>.md` in Vietnamese slugs, distilled "from 17 source decisions". | `git show --stat c93aa4acf` |
| 2026-07-15 08:44 to 08:58 | `dc472783c`, `527673b7f`, `bb8039797` | Phase 3 slice 1: `work.outcome` event (predicted then actual), runner writes both halves, `fgos check` verb. | commit bodies |
| 2026-07-15 10:20 | `8c7be926a` | `docs/work-item-lifecycle.md` records the five-step base workflow; step 5 is "Compound-learning". Renamed in `fc746ce00` (same day). | `git show 8c7be926a:docs/work-item-lifecycle.md` |
| 2026-07-16 01:01 to 01:53 | `2d60303ef`, `f46a2d7b0`, `7349a52bc` | `docs/architecture-map.md` v0.2, adopted as the standard map; machine-readable `docs/architecture-manifest.json`. | `git log` |
| 2026-07-16 02:07 | `96e5e3a29` | Phase 3 slice 2: `work.friction` event with five-layer attribution. | commit subject |
| 2026-07-16 14:34 to 15:17 | `d285ae128`, `efa3d3784`, `0228c4034`, `15ddd61e8` | Settlement channel; entropy-trend plus seal-digest; automatic learning record on close; "claim F4 maturity rung, close P3". | commit bodies |
| 2026-07-20 18:58 to 23:51 | `ec93a3aaa` .. `23dd43764`, `1739a83d5` | "compound-learn-enduser-docs": a `compound-learn` stage in the coding domain, `fgos compound` verb, skill `fgos-compounding`. | `git log` |
| 2026-07-20 19:33 | `3ee30977a` | Done-gate: a coding item cannot reach `done` without the compound-learn stage. Adds `test/e2e/compound-learn-lifecycle.test.mjs`. | `git show --stat 3ee30977a` |
| 2026-07-21 | `143d9ba7f`, `081d2d329` | First end-user how-to (`docs/how-to/check-rollup-progress.md`); `fgos docs-index` verb writes `docs/enduser-docs-index.json`. | `git show` |
| 2026-07-22 18:48 | `cf27ae0b3` | "distill critical-patterns.md into fgOS explanation docs": first `docs/explanation/*`. | `git show -s cf27ae0b3` |
| 2026-07-28 13:46 | `2bbd8f70f` | `.gitignore` change: "un-ignore docs/history so fgos-exploring can commit CONTEXT.md". Removes `/plans/`, `/upstreams/`, `/docs/history/`, `/docs/distillery/` and two others. Ends the divorce-era ignore rules. | `git show 2bbd8f70f -- .gitignore` |
| 2026-08-01 | `76153af5c` | `docs/distribution-vision.md`. | added-files scan |
| 2026-08-03 to 08-15 | `3bb5addd4` .. `c3b721ded` | ADR-style files `docs/decisions/0026` to `0032` added (Vietnamese slugs continue). `docs/reference/*` numerous from 07-29. | added-files scan |
| 2026-08-27 (outside window) | `d889032c0` | `docs/knowledge/` first appears via "migrate ... to knowledge-registry layout" (tsk-5mh); 40 such commits found. | `git log --diff-filter=A -- 'docs/knowledge/*'` |

Note on the question's "knowledge dirs": `docs/knowledge/` does not exist anywhere in the window. The early knowledge stores were `docs/history/learnings/` (bee), `.fgos/` event-log learning records, and from 07-20 the Diataxis dirs (section 3).

## 2. The compound concepts

### 2.1 Compound engineering (the idea)

- Promise: every unit of work leaves the system better for the next unit.
- Mechanism as designed: three layers: capture, friction-to-outcome, health/trend. Three schools of "who closes the loop": bee (human-gated), harness (datafied, outcome measured), fgOS-marketing-cockpit (automatic, forgetting by weight). Recommendation: take bee's human gates, harness's outcome measurement, drop fgOS auto-memory.
- Quote, `ebc6e8047`, `docs/distillery/deep-dives/compound-engineering.md`: "'Compound engineering' = mỗi đơn vị công việc để lại hệ thống KHÁ HƠN cho đơn vị kế: tri thức được bắt lại như sản phẩm phụ, friction nuôi cải tiến, quyết định tích lũy thành memory tái dùng, harness tự sửa mình."
- Quote, same file, section "Câu hỏi": "Làm sao để engineering **cộng dồn** thay vì reset mỗi lần?" with four sub-questions: where settled knowledge is kept, how friction becomes improvement, how to know it helped, who closes the loop.
- Early framing of `distill` itself as the first instrument, same file: "distill CHÍNH LÀ một nhạc cụ compound-engineering (index = state, porting-log = decision log, deep-dive = knowledge đã consolidate, cursor = không bao giờ quét lại từ đầu)."
- Three ports named: `porting-outcome-lifecycle` (predicted to actual), `distillery-entropy-trend` (weighted score plus trend), `seal-digest-zero-effort` (one digest line at seal).

### 2.2 Compound-learning stack (the platform law)

- Promise: a stack of three phases above the laws: state/FSM, routing, compound-learning.
- Quote, `e9ff70db7`, `docs/platform-foundations.md`: "Tài liệu này khóa các **luật thiết kế** đứng trên mọi code của compound stack (state/FSM → routing → compound-learning)."
- Quote, same file, closing section: "Phase 1 (state/FSM ...) → Phase 2 (routing ...) → Phase 3 (compound: predicted→actual, capture 2 kênh, entropy-trend, evolving human-gated)."
- Where compound lives in the laws: L5 sixth question "Bài học nào để lại?" ("Câu 6 chính là compound-learning — nó nằm trong definition of done, không phải tính năng cộng thêm"), and L6 rung F4: "Compounding | Vòng predicted→actual chạy; capture 2 kênh; entropy-trend + seal-digest; câu 6 tự động" and F5 "Self-improving".
- L1 supplies the storage split: Log (append-only, per feature) vs State (overwrite, per area). L2 supplies two memory layers: lower layer "Không TTL, không tự quên, không consolidation"; higher layer four memory types plus consolidation, "port khi dựng tầng đó (sau Phase 1-2)".
- Decision identity: the laws carry D-IDs in `.bee/decisions.jsonl` (`ca7de3cf` L2, `ae461c8b` L3, `14ebeea9` L4). Rule: "Thay đổi luật = supersede quyết định D-ID tương ứng, không sửa tại chỗ."

### 2.3 Phase 3 "compound learning" in code (predicted vs actual)

- Backlog row, `24e1d45de`, `docs/backlog.md` P3: "Compound-learning trên routing (Phase 3): vòng predicted→actual, capture 2 kênh, entropy-trend, evolving human-gated | Vòng predicted→actual chạy thật với bằng chứng output (tiêu chí F4, luật L6)".
- Mechanism as built (07-15 to 07-16): `work.outcome` merged by id ("both ... survive the fold", `dc472783c`); runner writes predicted at claim and actual at terminal exits (`527673b7f`: "closing the 'failures learn nothing'" gap); `work.friction` with five layers task-spec/context/environment/verification/state (`96e5e3a29`); settlement with actor (`d285ae128`); entropy-trend and seal-digest inside `fgos check` (`efa3d3784`); automatic learning record on done: "Zero model call, fail-safe best-effort compose, single write door" (`0228c4034`).
- Closure claim, `15ddd61e8` (2026-07-16 15:17): "Real-run benchmark ... confirms the predicted->actual loop, capture 2 kênh, entropy-trend plus seal-digest, and the automatic câu-6 learning record all fire as designed; full evidence lives in the workshop's benchmark report." The evidence sits outside the repo (the divorce put reports in the workshop). Unverified whether it was ever imported.
- Not built in the window: "evolving human-gated" self-improvement loop (rung F5). A separate `self-improve-loop` feature appears 07-17 (Iron Law commits `31aadb6f5`, `479f25f9e`); I did not verify that it is the same idea.

### 2.4 Compound-learn as a lifecycle stage (the end-user-docs form)

- Origin: `docs/work-item-lifecycle.md` (`8c7be926a`, 07-15) lists "5. **Compound-learning** — học từ chính vận hành."
- Promise, `docs/specs/work-state.md` at `bf7819380` (07-20): compound-learning "nay là một stage quan sát-được của chính item, không còn là một phản xạ có thể mất dấu (per D2 compound-learn-enduser-docs / 9c67c3d1)". Also `fgos compound <id>` is "hành động CHỦ Ý duy nhất mở lối vào Compound-learn (không có đường tự-động nào khác)". Rule 4: for domains declaring the stage (coding), `done` requires having passed it; domain `synthetic` is exempt.
- Mechanism: gate in `store.mjs moveWork` after the CAS and precondition checks (`3ee30977a`). The e2e test drives "take -> return -> compound -> approve -> done" through the real binary.
- Skill, `1739a83d5` (07-20 23:49) `fgos-compounding/SKILL.md`: gather via `fgos check`, classify into one Diataxis quadrant, store the tag via `fgos compound <id> --doc-type <quadrant>`, write an evidence-quoted doc under `repo/docs/<quadrant>/`. Quote: "a thin, honest document beats an invented rich one." and "Do not write the end-user document anywhere outside `repo/docs/<quadrant>/` matching the tag just stored — `repo/docs/specs/` is the separate, technology-agnostic reference layer this skill never touches."
- Index: `docs/enduser-docs-index.json` rows carry quadrant, purpose, audience, docPath, title, sourceCaptureId (`081d2d329`).

## 3. Early storage choices that later drifted

Each row: choice, commit, date, rule, and the drift signal I could verify. "Later" means after this report's window unless a dated commit is cited. Drift conclusions beyond the cited commits are my reading, not verified.

1. Specs root `docs/specs/<area>.md` as the "state layer".
   - Commit `ad65f59fd` (2026-07-14). `reading-map` of that commit: "`docs/specs/` — state layer: area spec + system-overview + bản đồ này". `docs/specs/work-state.md` header lists `sources:` (feature slugs) and `decisions:` (hex IDs).
   - Rule: AGENTS.md at `e350acbda`: "Specs are the state layer — BA-grade, tech-agnostic — read the spec before the code." DoD Q6 at that commit: "A settled decision goes into `docs/decisions/`; a settled spec fact goes into the relevant `docs/specs/<area>.md`."
   - Drift seed: one monolithic `work-state.md` (RUL1..RUL51 and a long Data Dictionary) absorbs every feature via "spec sync" commits (e.g. `a970522ac`, `372c58999`). Current AGENTS.md instead routes to `docs/platform/<area>/spec.md` (verified at the top of this session's context, not traced to a commit).

2. Decision store split in three places.
   - (a) `.bee/decisions.jsonl` with hex D-IDs (e.g. `ca7de3cf`), written through `bee_decisions.mjs`; AGENTS.md at `823926cc7` rule 7: "`docs/history/<feature>/CONTEXT.md` is the source of truth for locked decisions. Log decisions through `node .bee/bin/bee_decisions.mjs`, never by hand-editing `.bee/decisions.jsonl`."
   - (b) `docs/decisions/NNNN-<slug>.md`, created `c93aa4acf` (2026-07-14 22:48) by hand-distilling 17 source decisions into 9 ADRs. Index: "Record là bản chưng cất viết-tay từ nhật ký quyết định của dự án — không phải log thô."
   - (c) Decision-history sections in specs ("per D2 ... / 9c67c3d1" citations).
   - Drift seeds: numbering `NNNN` is sequential and hand-assigned (later ADRs 0026 to 0032 were added 08-03 to 08-15, `3bb5addd4`..`c3b721ded`); the current AGENTS.md says `docs/decisions/*.md` corpus is "retired tsk-1lv-4" and that IDs now come from `fgos identity mint`. Two ID systems existed by 07-18: `docs/id-systems-audit.md` was added in `400668931`. Hex IDs are cited in specs but the logs holding them were in the workshop after the divorce (`e99998633`).

3. Workshop/product divorce (history and reports not in the product repo).
   - `a9327e574` CONTEXT D3: "`docs/history/` ở XƯỞNG (không xuống repo) + export chưng cất khi cần". D2 lists what stays in the workshop: `docs/history/`, `plans/`, `docs/distillery/`, `docs/reference-learning-system.md`, `docs/naming.md`, `upstreams/`, `.bee/ .claude/ .agents/ .codex/`.
   - Enforced in `e99998633` `.gitignore`: `/plans/`, `/docs/history/`, `/docs/distillery/`.
   - Reversed in `2bbd8f70f` (2026-07-28): "un-ignore docs/history so fgos-exploring can commit CONTEXT.md". Result: feature CONTEXT/plan files that existed only in the workshop for two weeks (for example Phase 3 CONTEXT and benchmark report) are not in this repo; I could not find `docs/history/phase-3-compound-learning/CONTEXT.md` in any commit reachable from HEAD (`git show dc472783c^:...` fails). Where the earlier `docs/history` files went is unverified.
   - Net seed: evidence for the F4 claim (`15ddd61e8`) lived outside the repo; the doc plan of 260925 later dealt with 868 run-evidence files (per memory entry "Evidence out of docs deferred to Phase 10", not re-verified here).

4. Knowledge store = `docs/history/learnings/` (bee scribing format).
   - `823926cc7` created `docs/history/learnings/critical-patterns.md`; AGENTS.md step 5 loaded it every session: "If `docs/history/learnings/critical-patterns.md` exists, read it before any planning or execution work."
   - Learning file shape (e.g. `20260714-phase-1-state-layer.md`): frontmatter `date, feature, categories, severity, tags`; sections What Happened / Root Cause / Recommendation.
   - Drift: from 07-20 learnings were also composed into events (`view.learnings[id]`, `0228c4034`) and into Diataxis docs (`docs/how-to`, `docs/explanation`, `docs/reference`, `docs/tutorials`); on 07-22 `cf27ae0b3` distilled `critical-patterns.md` into `docs/explanation/*`. Then `docs/knowledge/` appears on 2026-08-27 (outside the window). So in six weeks there were at least four knowledge stores.
   - A rule collision is visible in the skill text at `1739a83d5`: end-user docs go under `docs/<quadrant>/`, while `docs/specs/` is "the separate ... reference layer". The word "reference" therefore names two roots: `docs/reference/` (Diataxis, from 07-29 onward) and the earlier `docs/references/` (distillery precursor, `2930a89fc`) plus `docs/specs`.

5. Plans and reports as "Log" in `plans/reports/`.
   - L1 names `plans/reports/` as Log; reading-map `ad65f59fd`: "`plans/reports/` — báo cáo phiên làm việc (physics: log, append-only)". Report names followed `<kind>-YYMMDD-HHMM-<slug>-report.md` (e.g. `distill-consult-260713-2323-...`).
   - Drift seeds: ignored by git from `e99998633` to `2bbd8f70f`; today AGENTS.md requires `fgos convention name|path` for names, which means the ad hoc convention failed (a memory entry records a misnamed report breaking `npm test`; not re-verified).

6. Flat root files before any `docs/` taxonomy.
   - Root-level docs added in the window: `docs/naming.md` (07-13), `docs/platform-foundations.md` (07-14), `docs/backlog.md`, `docs/routing-handoff-contract.md`, `docs/work-item-lifecycle.md` (07-15), `docs/architecture-map.md`, `docs/coexistence.md` (07-16), `docs/id-systems-audit.md`, `docs/operator-runbook-herdr-cockpit.md` (07-18), `docs/io-contract.md` (07-28), `docs/distribution-vision.md` (08-01).
   - Today they live under `docs/platform/...` (AGENTS.md paths). This is the move that the 260925 doc plan carried out; the seed is that no placement rule existed in the window beyond L8 (doctrine layer only).

7. Two copies of the laws.
   - `docs/platform-foundations.md` (`e9ff70db7`) and `docs/specs/platform-foundations.md` (`ad65f59fd`, 94 lines) were both created within two hours, the latter as a spec pointing at the former. Reading-map: "văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md". Duplicate-authority risk from day one (unverified whether the two diverged later).

8. Distillery and `upstreams/` as part of the repo.
   - `docs/distillery/` (state) plus `plans/reports/distill-*` (log), cursor model `last_analyzed_commit`. Quote of decision `ed953e09`: "Trend-history và reconsideration bookkeeping lưu policy-side (git-tracked)." The same commit that created it (`e99998633`) then ignored `/docs/distillery/` in the product repo. The distillery thus violated its own "git-tracked, durable" rule from the first product-repo commit after the divorce.

9. Doctrine filename `AGENTS.md` plus `CLAUDE.md` duplicating bee text.
   - `823926cc7`: `AGENTS.md` carried a 100-line `<!-- BEE:START -->` block; `CLAUDE.md` 8 lines. Replaced in `e350acbda` by product text. L8 (placement test, anchor suite) was the intended guard; whether an anchor suite was built is unverified.

## 4. Open questions

1. What happened to the workshop-only files (Phase 1 to 3 CONTEXT, plans, benchmark report, `.bee/decisions.jsonl`) after the divorce? Are they in this history under another path, in a tag (for example `archive/*`), or lost? Check `git tag` and `git log --all -- .bee/decisions.jsonl`.
2. `15ddd61e8` points to "the workshop's benchmark report" as evidence for F4. Is there any copy that a future stranger can read? If not, the F4 claim is unverifiable from this repo.
3. Was `docs/specs/platform-foundations.md` kept in sync with `docs/platform-foundations.md`, and when did L9 and L10 arrive? The window shows only L1 to L8 (`e9ff70db7`).
4. The "evolving human-gated" loop (F5) was promised in Phase 0 and Phase 3 titles; the `self-improve-loop` commits of 07-17 look like Iron Law gating, not self-modification. Needs a read of `docs/history/self-improve-loop` (if it exists in any commit) to settle.
5. Why does `docs/history` first appear as `added` on 2026-07-28 and 2026-08-26 in different listings? Probably renames or the path being un-ignored in stages. A `git log --follow` on one file would settle it.
6. Does the `compound-learn` stage still exist in the current lifecycle? The skill `fgos-coding-knowledge` (retrospective status, from the skill list in this session) and `091a6daf8`/`2e43f679d` (2026-08-12: "give compounding ownership of the retrospec...") suggest compound-learn was reshaped into `retrospective`. Unverified.
7. Which hex D-IDs from `.bee/decisions.jsonl` map to which of the nine ADRs `0001` to `0009`? The index claims a full traceability table; I read only its head.

Status: DONE
