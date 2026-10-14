# Review 5: root authorities current-content truth draw

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:17@2026-10-14
Review mode: ordinary
Request commit: ce1e0f018
Content commit: c8b2d948d

## Scope and method

Read-only review in worktree forgentX-phase00-documentation-authority-unification (HEAD 7073e11e5; `git diff --stat c8b2d948d HEAD -- docs/platform src bin` is empty, so the content pin and HEAD carry the same candidate text and code). The conservation part of common.md was skipped as instructed; the request asks for no sensitivity pack, so none was produced or fabricated.

Independent draw (A28). My seed is SHA256 of my start time `2026-10-14T08:32:22Z` = `6537015a6f270dc2d837d9be147306569c07c20d2d7cd0d80884a88aabe61fab`. Population: the 226 units in root-authorities-truth-population.json (population SHA256 as pinned by the author). Rule: the 30 lowest SHA256(seed NUL path NUL anchor NUL unitDigest). My draw overlaps the author's draw in 6 of 30 units: cli-io-contract.md#unheaded-block-35, spec.md#unheaded-block-65, governance.md#unheaded-block-51, spec.md#unheaded-block-48, governance.md#unheaded-block-38, governance.md#unheaded-block-35. I did not re-filter the author's population; it holds no metadata or heading units, but several drawn units are bare lead-in labels or policy sentences and are counted with 0 assertions.

Digest recompute. With extractMarkdownConservationUnits at c8b2d948d I recomputed 5 of 30 units (10% is 3; seed `eaf0dead773c4276a650371fd0e13a3d2e0391002eaa2320ccdb054208c1852d` = SHA256 of `digest-recompute|` plus the start time): U27, U29, U5, U10, U6. For each, the committed lines equal the population text, SHA256 of those lines equals textDigest, and textDigest equals the population unitDigest. Source digest in the table is the unit digest; claim IDs are the working-identity-registry claims of the docs/platform candidate units.

Truth method. Each assertion of present behavior was checked against code at HEAD with the file and line given in the Note column; commands used were grep, sed and `node -e` imports of src/state/domain-registry.mjs. Dated design text and history clauses were not counted as claims of current implementation. Normative policy sentences and bare labels carry 0 assertions.

## Result

| Measure | Value |
|---|---|
| Denominator | 30 units drawn from 226 |
| Units with at least one present-behavior assertion | 20 |
| Assertions checked | about 184 (unit 26 only 47 of about 150) |
| False assertions | 20 |
| False units | 5 of 30 = 16.7% (U3, U8, U19, U20, U26) |

More than 10% false units: OWNER ESCALATION under A28. All five need correction under A19 and re-review. Unit 26 is also a 44,882-character block of 53 rules, so a single draw hit about 150 assertions; I verified 47 of them and stopped at the 12 false ones found, so the remaining rules in that unit still owe a full pass and more false sentences there are likely.

## Verdict table

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_2beadda8db30fa95fa29063bae954245 | ok | U1 cli-io-contract.md#unheaded-block-18: Success path prints the fgos.v1 envelope to stdout (bin/fgos.mjs:4835); on error main() writes the diagnosis to stderr and sets exitCode from EXIT_CODES[categoryOf(err)] (bin/fgos.mjs:4860-4867, src/state/store.mjs:72); 3 of 3 true | 5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4 | none |
| claim_f2c6496ee19b35da438259dc94874fe5 | ok | U2 spec.md#unheaded-block-42: fgos plan exists with role session (bin/fgos.mjs:1163-1189); planUseCase rejects an item at another step and points at fgos discover (src/verbs/state/step.mjs:39-51); loop plan sweep sits after the discovery sweep and before the drain run (src/runner/loop.mjs:1446,1600-1670,1706); runner role with no verdict is a noop (src/intake/plan.mjs:636-641); 7 of 7 true; nuance: plan.md tiny or small mode can also pass the runner sweep through | 86cba6c33b5a8fe95261ed07c3e670db494beb82c49fb80f0cb7cd32c6241e41 | none |
| claim_64efd51dc50d417f21972188bf57afe9 | rework | U3 spec.md#unheaded-block-75: false: answer no longer resumes to doing. The awaiting-human to doing edge is retired and answerAwaiting resumes to durableStatusAtAsk clamped to todo (src/state/store.mjs:1417-1419, src/state/status-fsm.mjs:175-177,186-190); statusAtAsk is audit-only (store.mjs:751-757); so the todo-or-doing sentence and the 'doing is not in ready' consequence are false; 13 of 16 true; correction text in Findings | 504b6a5b42d39ff1886b7e1865b5cd54713406e8caff7f6c22e0b3085efb755d | none |
| claim_2cacf92d42ea9cd8c0046f318de2dd18 | ok | U4 governance.md#unheaded-block-51: Bare lead-in label ending in a colon; no assertion; 0 of 0 | 7d63e10ab7e1a99a6ff8a9670bf281b5cca0e3875d33ae93c2061088c086c6d8 | none |
| claim_e4f03a34cf0718c43c6faa9baac040ab | ok | U5 platform-foundations.md#unheaded-block-10: Four read pointers; docs/platform-foundations.md, docs/specs/platform-foundations.md, docs/platform/vision.md and docs/platform/component-boundary.md all exist at HEAD; 4 of 4 true | b8dfcdaaf4850b881b6b58c8f5d30c3ad90b9bf8f0c40c73416cff26ef0102fc | none |
| claim_cdd858ddc77eff892c0d7595a2db233a | ok | U6 platform-foundations.md#unheaded-block-8: Design-gate question list, normative checklist with no behavior claim about code; 0 of 0 | bdb17898e7cf55880fca4f9b8f0768512d63cc439553812987b32a4ad461774a | none |
| claim_aaa34e85df8d9f5ab183ad271e19541e | ok | U7 governance.md#unheaded-block-7: Principle sentence about documentation structure; no code-checkable assertion; 0 of 0 | ef21ba805cd74f7adf24adc665c8232ce5fc3effa92fb1f749087ad9fb9663af | none |
| claim_1a6a7460ede876ae7fa1de7c2e168cfe | rework | U8 spec.md#unheaded-block-65: false: add no longer makes the caller invent the id. --id is optional and generateId derives tsk-<hash> from --title (bin/fgos.mjs:933-949); only --title and --description are required (bin/fgos.mjs:947,959); the (9 file) count is also wrong: at least 23 test files invoke fgos add (grep of test/); 5 of 7 true | 96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16 | none |
| claim_9b38fd09b00c8c222e85b72c3f2164e9 | ok | U9 spec.md#unheaded-block-48: Registry has exactly four domains coding, synthetic, triage, fixture-marketing (node import of DOMAINS), all walked by the same stage tables and the one runner path; domains/marketing has no compiled.json so no second production domain is registered (src/state/domain-registry.mjs:38-60,103-170); 3 of 3 true | b4fd3392f55abbeae560ec53ebb763fdf048ff1c40e2f856e0750dc935c6fc8a | none |
| claim_dd4cc4719aa5c7640a0b398c496e5b1f | ok | U10 spec.md#unheaded-block-13: Settlement kinds clarify-pass/answer/close and role fold match src/state/replay.mjs:326-372 and 470-535 (clarify-pass keyed on leaving the entry step, suppressed only by clear:false); close detail is null; system role is stamped (bin/fgos.mjs:1244,1323,3284); 12 of 12 true | 79d33485a7951e73e67a2e485f8a2bbf8b839c71868bd303cecd35c16489225a | none |
| claim_2c7ba7c08b540f1565c4fac86e0f88d5 | ok | U11 cli-io-contract.md#unheaded-block-15: Both binaries print the fgos.v1 envelope to stdout: bin/fgos.mjs:4835 and bin/fgos-runner.mjs:26,69-92 (printResult, final outcome line); 3 of 3 true | 6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa | none |
| claim_c831f12dd72aacb905d84ab3c97f269f | ok | U12 spec.md#unheaded-block-30: replay.mjs foldLegacyStage/canonicalStep (src/state/replay.mjs:48-57,105,401,464); work.stage folds like work.step (replay.mjs:452); aliases decompose to planning (domains/coding/workflows/feature.yaml:161-162); write door rejects stage (src/state/work.mjs:456); 6 of 6 true | 509d6750254a6802e862d838af1177d127df2fad450ac289d027f57e307d335b | none |
| claim_448d3b26a4cd9fb551588da0071935ca | ok | U13 spec.md#unheaded-block-24: addDiscovery appends a work.discovery event per verdict on both clear and unclear (src/intake/discovery.mjs:343,373; src/state/store.mjs:1603-1614) and the fold appends per id (src/state/replay.mjs:597-614); the record carries the applied verdict; 5 of 5 true | 5c9201d70578877abf44602c087ab21de9d8966cca3adf8e3f9531bf324084f7 | none |
| claim_587d1adddb37253c6b6780b9a00c6b59 | ok | U14 cli-io-contract.md#unheaded-block-35: multiValueFormat csv for deps/refs/footprint/targets and json-array for acceptance (src/cli/command-registry.mjs:137-149,177-178); 5 of 5 true | a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5 | none |
| claim_b94f2db838b056a5bbfb4130f0751f92 | ok | U15 spec.md#unheaded-block-58: Blocked item with a live fgw branch is retaken and returned through the same verbs, differing only in branchHeadAtTake/branchHeadAtReturn (bin/fgos.mjs:2945,3020,3151-3182); 3 of 3 true | 169457cec66b3a789d636951cf5ce82ee55e64668f0c1355eae9047b67ba22a1 | none |
| claim_014119579acfa0eb94598e780a915d8c | ok | U16 spec.md#unheaded-block-54: Lazy coding default and warn-and-fold on unknown domain (src/state/domain-registry.mjs:176-195); declaration rejects an unknown domain (src/state/work.mjs:400-402); add/submit take --domain (bin/fgos.mjs:970,1074); 9 of 9 true; stage is now the step field, wording only | fcc3b5bc63c02eeb3180877c80fe6e2d2bb620cb2ffd41bd865d2f9624bac9a0 | none |
| claim_b5c860d660743abfdb836c6a497525c4 | ok | U17 spec.md#unheaded-block-31: All seven renamed surfaces exist: workflowStepEffective (bin/fgos.mjs:608), stepByItem (bin/fgos.mjs:2335), add --step (984), ready --phase (2120, src/state/frontier.mjs:84), workflow operations --step (2228-2237), doctor check work-step-vocabulary (src/setup/registrations.mjs); 7 of 7 true | 26c7bc289872ab33201af4b02bb9b6499f805b51d9c8848c53ff88b42ab66fda | none |
| claim_8d2d644c796466ee36b93f7c5b91ddcc | ok | U18 governance.md#unheaded-block-38: Policy rules; only checkable fact is docs/platform/intent-preservation-ledger.md which exists; 1 of 1 true, remaining sentences are normative | 0756c95549ccda581c1a34db1a971c70a94fd97cf12436ad67ffff69e35246c6 | none |
| claim_ac8be2d94e5bad871f26214d7eaac4af | rework | U19 spec.md#unheaded-block-22: false in G4: statusAtAsk is audit-only and answer does not read it back; resume reads durableStatusAtAsk and a doing value clamps to todo (src/state/store.mjs:751-777,1417-1419); G1 to G3 verified (src/state/store.mjs, replay.mjs:268-305); 18 of 20 true | 896856e1509a84929acc35bbf336ab20a94a6f95415423205fa32a2bfe54d45c | none |
| claim_3b151159fccbac3b57c7ea93fb1d8ca7 | rework | U20 spec.md#unheaded-block-91: false: 'PHI-CHẶN: chỉ nuôi cố-vấn này' - footprint also drives the plan decompose overlap gate (src/intake/plan.mjs:891-897), wave packing in computeSchedule (src/state/graph-metrics.mjs:737-750) and merge ranking; SCHEMA_VERSION is 3 (src/state/work.mjs:214); conflicts options sequence/hoist/re-slice true (graph-metrics.mjs:584); 9 of 10 true | 27a3ba1515c8ffa4c6db8e9123168b72f583293dd0d4904824848c7187fe2bf1 | none |
| claim_d0a69ac0621ef7d766b61ddd97f700cd | ok | U21 governance.md#unheaded-block-35: Definitional role table for document types; no code behavior; 0 of 0 | cbcd46946204f1fee09cc538210be3a601fff688a5dc3d80693a266801610daf | none |
| claim_27679f61b3c23810d58003e5bb07c70d | ok | U22 governance.md#unheaded-block-6: Single normative sentence; no code behavior; 0 of 0 | 7ef9b5241735031868e2cc5040922cbf257d86a58d6ff0b524efc98b21e0dea1 | none |
| claim_9053f1edd1765577dd1bef202eff3d98 | ok | U23 cli-io-contract.md#unheaded-block-25: fgos-discovered fence is the worker to runner protocol parsed in src/runner/loop.mjs:710-717 and emitted by prompt templates; not part of the envelope contract; 3 of 3 true | 549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe | none |
| claim_82642146e7b828e815d06cd9e38ebbfc | ok | U24 governance.md#unheaded-block-17: Normative header convention; no code behavior; 0 of 0 | 75056aa118940baf3e88c1a2faad9eadbac3991bd4c2ccf55cdc8d8e69d3f502 | none |
| claim_2c16dcf7e25396c56c18e719e440b68d | ok | U25 platform-foundations.md#unheaded-block-2: docs/platform-foundations.md exists and still holds the legacy law text; the sentence is a labelled migration statement; 2 of 2 true | 5682857e36dbe2f2257da713fe265fe2386dfdfa21da814d538db5e7cdef15da | none |
| claim_8d273e8328dac53565eb0286c6a91d65 | rework | U26 spec.md#unheaded-block-93: false: 12 false sentences found in 47 mechanically checkable assertions across 53 rules (listed verbatim under Findings); RUL1 to RUL9, RUL12-14, RUL17, RUL22, RUL35, RUL44-45, RUL54-58, RUL61-66 checked and true apart from the RUL61 naming slip; the rest not checked individually | 19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d | none |
| claim_aaa72c913f079f0362774422779962d6 | ok | U27 governance.md#unheaded-block-20: Bare lead-in label; no assertion; 0 of 0 | bbd05650fff03e29629acc6cd54b07715cabbbc74d631593f73e5c308cb33708 | none |
| claim_3ea0f6d319afd9e84b6a642f58f91e07 | ok | U28 governance.md#unheaded-block-5: Provenance-versus-authority policy sentence; no code behavior; 0 of 0 | 3a2144a14bfdeb20f5695c5a8320201e1e01a2bb773dafd3e5dc5bdd498fd748 | none |
| claim_ee3dda56ccb53db87ee1c4f1bd5711c2 | ok | U29 spec.md#unheaded-block-52: Discovery sweep skips items whose domain has no clarify-mapped step (src/runner/loop.mjs:1493-1496) and the plan sweep requires a plan-mapped step (loop.mjs:1604-1610); consequence statement true; the five-step vocabulary is the older model while code uses clarify/plan/execute phases (src/workflow/definition.mjs:219-224); 6 of 6 true | 621c91d31cc07f4e090993c8b83d5b3fdd1f76796fc8c4c066faccfc6b456aee | none |
| claim_18bc93913b448431a0c855963911fe2b | ok | U30 platform-foundations.md#unheaded-block-7: Bare lead-in label ending in a colon; no assertion; 0 of 0 | e0c8ac3c9a003bc9c5327c935fb9dce93fb8c05bc50c1a197d32333e8fba140c | none |

## Findings: false sentences and the correct fact (A19)

U3 spec.md#unheaded-block-75 (claim_64efd51dc50d417f21972188bf57afe9):
1. "item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: ... — đã sửa)". Correct: the `awaiting-human -> doing` edge is retired (src/state/status-fsm.mjs:175-177, 186-190); `putInAwaiting` settles and releases the claim at park time; `answerAwaiting` resumes to the gate's `durableStatusAtAsk` (computed from the durable status in moveWork, store.mjs:757-777) and clamps `doing` to `todo` (store.mjs:1417-1419). `statusAtAsk` is audit-only and never read for the resume.
2. "về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường)". Correct: an answered item never resumes to `doing`; it returns to `todo` and appears in `ready` when deps allow.

U8 spec.md#unheaded-block-65 (claim_1a6a7460ede876ae7fa1de7c2e168cfe):
3. "đòi người gọi tự điền mọi trường (kể cả tự đặt id kebab-case)". Correct: `--id` is optional; without it `add` derives a collision-free `tsk-<hash>` id from `--title` via generateId (bin/fgos.mjs:933-949). Required are `--title` and `--description` (bin/fgos.mjs:947, 959).
4. "bộ test hiện dùng `add` để tự điền id/field trực tiếp (9 file)". Correct: the count is stale; `grep -rlE "fgos add|'add'" test` finds well over 9 files (at least 23 invoke the verb).

U19 spec.md#unheaded-block-22 (G4 row):
5. "mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần)". Correct: `answer` reads `durableStatusAtAsk`, not `statusAtAsk`, and a `doing` value resumes to `todo` (store.mjs:751-777, 1417-1419).

U20 spec.md#unheaded-block-91:
6. "PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier". Correct: footprint is not in cycle-check or frontier, but it is not advisory-only: it is a hard park in the plan decompose gate (src/intake/plan.mjs:891-897, a footprint conflict puts the item in awaiting-human), it drives wave packing in computeSchedule (src/state/graph-metrics.mjs:737-750) and it feeds mergeReadiness.

U26 spec.md#unheaded-block-93 (claim_8d273e8328dac53565eb0286c6a91d65):
7. RUL10: "`addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi ... CAS `expectedStatus`/`expectedStage`". Correct: the functions are `moveStep` and `expectedStep` (src/state/store.mjs:1432); no `moveStage` or `expectedStage` exists.
8. RUL15: "(dep chỉ mở khi thật `done`)". Correct: a dep opens at `delivered`, `retrospective`, `cleanup`, `done` or canceled (src/state/frontier.mjs:242 TAIL_RESOLVED_STATUSES), as RUL12 itself says.
9. RUL16: "Phân loại tier/kind/risk của `submit` ... quyết định tier `heavy`". Correct: tier is retired; submit classifies size, rigor, kind and risk and refuses `--tier` (bin/fgos.mjs:1068-1070, 1078-1079).
10. RUL18: "qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing`". Correct: `add` stamps the entry step via entryStepFor, `discovery` for coding (bin/fgos.mjs:971-985); only records created before the feature, with no step, read lazily as `executing`.
11. RUL19: "Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống." Correct: the runner discovery sweep dispatches a real `fgos-researching` worker, and that worker's verdict goes through resolveDiscovery and can advance the item to `planning` or `exploring` with no live session (src/runner/loop.mjs:1446-1500).
12. RUL26: "item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`". Correct: the plan gate also parks on the blast-radius gate, a disputed child verify and footprint overlap among children (src/intake/plan.mjs:806-818, 891-897).
13. RUL30: "ghi thêm `headAtReturn` ... lên CÙNG sự kiện `doing→awaiting-approval`". Correct: nothing durably writes `doing`; a fresh claim settles `todo -> awaiting-approval` (and `blocked -> awaiting-approval`), see src/state/status-fsm.mjs:120-139 and store.mjs:1194.
14. RUL33/RUL34: "(`blocked→doing`, có tính)" and "`branchHeadAtTake` ... trên cạnh `blocked→doing`". Correct: `todo -> doing` and `blocked -> doing` are retired (src/state/status-fsm.mjs:120-132); the markers ride the claim record and lastAttempt (src/state/store.mjs:1241-1242, src/runner/claim-port.mjs:221-230).
15. RUL53: "KHÔNG kiểm hình dạng (đường dẫn tự do)". Correct: `compound --doc-path` must be committed at the main checkout HEAD and an ambiguous path is refused (bin/fgos.mjs, compound case, validation errors at about 1683-1699); the verb itself prints a deprecation warning in favour of `fgos doc`.
16. RUL59: "`priority` ... CHỈ ghi qua `edit --priority <n>`" and "`intent` ... do giai đoạn soi-rõ TỰ TÍNH". Correct: `intent` is retired in place; discovery computes `priority` with computePriority and writes `{priority}` through editWork on every pass (src/intake/discovery.mjs:375-396).
17. RUL60: "ba cờ ... `--tier`/`--kind`/`--risk` ... vẫn hoạt động y nguyên". Correct: `--tier` throws "--tier is retired; use --size ... or --rigor" (bin/fgos.mjs:1068-1070); `--size` and `--rigor` replace it.
18. RUL61: "Ba cửa ghi `work.move`/`work.edit`/`work.stage`". Correct: `work.stage` is a legacy event name, the writer stamp is on `work.step` (src/state/store.mjs:1432-1455; replay.mjs:452).

## Notes

- U2 nuance only: the runner plan sweep also advances an item when plan.md declares tiny or small mode (src/intake/plan.mjs:620-633); the sentence about "no verdict" is true for the resolvePlan fallback, so U2 stays ok.
- U9 and RUL35 agree with code on four domains; domains/marketing exists on disk without compiled.json so it is not registered.
- U29 and RUL35 still speak of "5 bước base-workflow" while code carries three step phases (clarify, plan, execute); I treated this as concept vocabulary, not a false behavior claim.
- Units with 0 assertions (U4, U6, U7, U21, U22, U24, U27, U28, U30) are ok only in the sense that nothing was claimed; they should not have been drawn into a truth sample of behavior and the author may drop them from the population.
- The population is partial by the author's own statement; this review does not certify unbuilt carriers or close Step 5.
- Worktree `git status --short` at the end: empty.

Unresolved: whether the owner wants the full 53-rule block U26 (and the rest of work-state/spec.md that mirrors the same stale claims about doing, tier and stage) corrected wholesale rather than sentence by sentence; whether the 9 zero-assertion units stay in the truth population.
