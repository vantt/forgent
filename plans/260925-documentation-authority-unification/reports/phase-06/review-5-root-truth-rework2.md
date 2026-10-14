# Review 5 root truth rework2: required fields and submit ordering

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:22@2026-10-14
Review mode: ordinary
Request commit: 5209441cd
Content commit: cd82746a8

## Scope and method

Group rework2. Read at worktree HEAD 5620e199a (no docs, plugin, bin or src change between cd82746a8 and HEAD). Pack sha256 d0107fea... matches the request. No sensitivity pack was requested or produced.

Truth, run live: I ran `add` with `bin/fgos.mjs` in a scratch store under my work dir (never the worktree's .fgos). Results: a call with --title, --description, --kind, --risk (standard) and --verify succeeds both with and without --id (an id is generated when absent); dropping --title fails (work.title required), dropping --description fails (add requires --description), dropping --kind fails (work.kind required), dropping --risk fails (work.risk required), dropping --verify fails (work.verify required). Exactly those five are required, --id is optional. U8 fragment is true.

Truth, submit wrapper: `plugins/fgOS/skills/submit/SKILL.md` has no `core/skills/submit` source (that directory does not exist; the plugin file is the only source). It says step 4 runs `fgos-clarifying` on the raw text from step 1 before any item exists, returns `{title?, description?, domain, question?}`, on `question` the person is asked and the helper is re-run, otherwise the rewritten title/description and domain feed step 5; step 5 calls `submit`; step 6 is "Report the result"; and tier/kind/risk are never re-judged by the skill. `core/skills/fgos-clarifying/SKILL.md` line 92 and 148 confirm it never decides size. The new RUL60 sentence matches all of this, including the live-session gate (step 4 is skipped for no-soul callers; the sentence opens with "Trong phien tuong tac song").

No other sentence changed: `git diff --word-diff c3895c140 HEAD -- docs/platform/work-state/spec.md` shows exactly two changed lines, line 708 (the required-flags phrase) and line 1080 (the RUL60 clarify clause). The pack's before and after fragments equal the git text.

Conservation: A36 applies; all eight rows have differing source and target digests, so all eight were read in full. Seed 261014 (Python random.Random(261014).sample(range(8),3) gave rows 5, 2, 6 for the independent hand recompute, which I then widened to every non-heading unit). Mechanical checks: full digests recomputed with extractMarkdownConservationUnits at HEAD and at c3895c140 equal the shard decision, pack row and sidecar for all eight; non-heading unit digests also recomputed by plain sha256 over the file lines (src76 96b66946, old65 72721c54, new65 91c2e63a, old93 5c61302d, new93 f20c0ca6, src104 19f7dcac); shard entries deep-equal the pack decisions (b-behaviors, b-entry-actors-rules-pointers, s5-root-truth-successors, s5-root-source-native-successors); all eight anchors pass `list-doc-anchors --check`; docs/specs/work-state.md is byte-identical to its 23062c2ce pin. Identity: gaps 1a6a and 8d27 keep their original fingerprints (122c77d8, e25e00fd), gaps 89727 and 8ffb carry the c3895c140 unit fingerprints (89bc54bf, 787b3dda), and the new successor fingerprints (a42a524f, 09ce18e5) are different, so nothing is grafted. Registry entries for all four equal the pack gap records.

## Verdicts

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|
| claim_b7cdc84d6130cac22511eed0ed6e4e6c | ok | deep: heading Khai viec (add) to Add Verb, H3 both, ancestry equal, anchor add-verb exists; the heading digest binds the section body so it moved to 5a8bd904 only because of the two corrected fragments; rebound digest equals the file at HEAD. | e5aec62d393c0201df912b76467125999b27d5b466327e3dd73991287a251386 | 5a8bd90404bdc7021a6d3ba75882493b6331b3d3640224d7e3e654c07cf523ad |
| claim_320ba6224015cc3877738795b80dabb7 | ok | deep: source lines 835-840 against target 707-712 differ only in the U8 required-flags clause and the id and test-file clauses already accepted last round; no word lost or added elsewhere; the lead sentence of the rationale says byte-identical which describes the pre-correction candidate but the same rationale discloses the correction, so not misleading. | 96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16 | 91c2e63acc8563a92edc6d06d6634a299a3120b6682db0bf3e3fd289b6987445 |
| claim_477a30f4902261e390c34ab888145dcd | ok | deep: heading Business Rules to 11. Business Rules, H2 both, only the numbering prefix differs, anchor 11-business-rules exists, digest moved to e8875bfd with the RUL60 fix and matches HEAD. | da8ed377d2e302110807e0eaf3806227a6b0bdb590793350e9ff477bbc16b3b3 | e8875bfd3ae0aff0ed573fd69a62868e8d8ad38af409b4c01b0d1533a2908f1b |
| claim_9bb5739f68a7b4bafcd959ef59104e6a | ok | deep: source 1160-1213 against target 1032-1085 differs in exactly the 13 lines reviewed last round, and of those only line 1080 (RUL60) changed this round; rebound target digest f20c0ca6 equals the file at HEAD; rationale lead says identical in the candidate yet discloses the correction in the same text. | 19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d | f20c0ca6ad7490fa85635d8100333e97787282b0936df18a2f7f7599d5cd3b63 |
| claim_1a6a7460ede876ae7fa1de7c2e168cfe | ok | deep: old gap keeps its immutable id and original fingerprint 122c77d8, before-digest 72721c54 equals the c3895c140 unit, successor 91c2e63a equals HEAD, anchor unheaded-block-65 exists, shard equals pack; identity not grafted. | 96b669468dbe4f3a8fd6eaa112986cead07ae88fa9de2b233f8fbf27314f9d16 | 91c2e63acc8563a92edc6d06d6634a299a3120b6682db0bf3e3fd289b6987445 |
| claim_8d273e8328dac53565eb0286c6a91d65 | ok | deep: old gap keeps id and fingerprint e25e00fd, before-digest 5c61302d equals the c3895c140 unit, successor f20c0ca6 equals HEAD, anchor unheaded-block-93 exists, shard equals pack; no identity graft. | 19f7dcac1af1f366369c2b1b75261b376f12ecaabf4b65f5f0d6f92c191a712d | f20c0ca6ad7490fa85635d8100333e97787282b0936df18a2f7f7599d5cd3b63 |
| claim_89727d0eb13008ab3f1ed76092044a4f | ok | deep: new native predecessor for the c3895c140 unit 72721c54 (fingerprint 89bc54bf recomputed and equal to the registry gap), successor 91c2e63a at the same anchor and ancestry, supersede with named successor is correct; shard s5-root-source-native-successors equals pack. | 72721c54253ba541180f7b7114d858ce2af06671f1fa05f45162063962b681b2 | 91c2e63acc8563a92edc6d06d6634a299a3120b6682db0bf3e3fd289b6987445 |
| claim_8ffb36c0af7a1f88517179b8b1adb0a4 | ok | deep: new native predecessor for the c3895c140 RUL unit 5c61302d (fingerprint 787b3dda equal to the registry gap), successor f20c0ca6 at unheaded-block-93, ancestry two levels equal; shard equals pack; nothing grafted. | 5c61302d66e78a5c872334e3a00927d6a8230642fd670dc0af923cad3e83f3b8 | f20c0ca6ad7490fa85635d8100333e97787282b0936df18a2f7f7599d5cd3b63 |
| claim_567bf1ddf315b3a08029eb28ac4ee2e2 | ok | deep: truth U8 fragment, required flags --title --description --kind --risk --verify with optional --id and generateId, verified by running add in a scratch store (each missing flag rejected, id omitted works); only this phrase changed in the unit; I did not certify the other sentences of the unit. | 91c2e63acc8563a92edc6d06d6634a299a3120b6682db0bf3e3fd289b6987445 | none |
| claim_3d2d87a2a9582e2faebabc79470d8ee8 | ok | deep: truth U26 RUL60 fragment matches SKILL.md (step 4 clarify on raw text before item creation, domain plus optional rewritten title and description or a question, no size kind risk judgment, step 5 submit, step 6 report); only that clause changed in the 54-line unit; other RUL clauses not certified here. | f20c0ca6ad7490fa85635d8100333e97787282b0936df18a2f7f7599d5cd3b63 | none |

## Notes

- Both prior rework reasons are closed: U8 now names all five required flags and U26 now has the right step numbers, the right input (raw text, before item creation) and no re-judging of size, kind or risk.
- The first sentence of two conservation rationales (320ba622 and 9bb5739f) still describes the pre-correction candidate as identical or byte-identical; the same rationale then states the corrected unit differs. Accepted because the disclosure is in the same text; a later cleanup could drop the stale lead sentence.
- The RUL60 text now begins a clause with a capital after a semicolon ("; Trong phien tuong tac song"), a cosmetic nit only.
- `submit` skill has no `core/skills` source file; the plugin file is the only authority for the wrapper order, so no render-drift question arises.
- Lint: every reported problem across the four shards is unknown-claim (each shard knows only its own claims; registry gap and truth-unit rows are not indexed), nothing else.
- Worktree `git status --short` was empty after the review.

Unresolved: none.
