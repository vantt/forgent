# Independent re-review: required fields and submit ordering

Author session: codex-session:22@2026-10-14
Content commit: cd82746a8ba169600d987eeb0f5ca274304712f3
Review mode: ordinary
State: ready-for-review; Step 5 remains open

Read A19/A22/A35 and review-5-root-truth-corrections.md at c3895c140. Only U8 required flags and U26 RUL60 wrapper-order fragments change. `add` requires --title, --description, --kind, --risk, --verify; --id remains optional. Live submit wrapper step 4 reads raw text before item creation, returns optional rewritten title/description and domain (or a question), never re-judges size/kind/risk; step 5 submits and step 6 reports. Real discovery judgment remains where the unit already says. Every other sentence is unchanged.

Pack: [review-pack-261014-1950-root-required-fields-wrapper-rework.md](review-pack-261014-1950-root-required-fields-wrapper-rework.md), SHA256 `d0107feaea0417588909636a9aff8bf580693fc3615a89aabd20dfb0b0850849`; machine full-text sidecar at the same path plus .json. Conservation: eight entries, all pending; four source rows, two existing gaps, two new native block gaps. Truth: two corrected fragments with complete before/after unit text and full digests, file:line, git blob and excerpt SHA256 evidence. Read both fragments against code in full; do not certify untouched RUL clauses. Native four stable headings are accounted in root-source-native-accounting-turn22.json; only the two work-state headings belong to this correction.

A36: every eight conservation row has differing source/target digests, so all eight are mandatory deep reads; all are Judgment and minimum sample is all eight. Reviewer records seed even though all are deep, recomputes full digests/anchors and shard/pack equality. Differing set:
- `claim_b7cdc84d6130cac22511eed0ed6e4e6c`
- `claim_320ba6224015cc3877738795b80dabb7`
- `claim_477a30f4902261e390c34ab888145dcd`
- `claim_9bb5739f68a7b4bafcd959ef59104e6a`
- `claim_1a6a7460ede876ae7fa1de7c2e168cfe`
- `claim_8d273e8328dac53565eb0286c6a91d65`
- `claim_89727d0eb13008ab3f1ed76092044a4f`
- `claim_8ffb36c0af7a1f88517179b8b1adb0a4`

Ordinary tables use Reviewer, Author session, Review mode headers and Claim | Verdict | Note | Source digest | Target digest, full 64-hex cells, notes marked deep/mechanical. Write one row for each of the eight conservation entries and separate current native truth-unit rows for the two fragments (Source digest = complete current unit digest, Target = none); use the actual current IDs from the pack. Shards: pilot b-behaviors and b-entry-actors-rules-pointers (four source bindings), ledger s5-root-truth-successors (two old gaps), s5-root-source-native-successors (two new gaps). No approval carry. The lint currently indexes claims only; unknown-claim for a genuine gap/native truth unit is an explained limitation, not a report defect.

Both-prior D/E and native identity equality: root-source-completion-verification-turn22.json. Final fresh 30-unit reviewer draw is separately owed over truth-population-261014-1950-root-authorities-final.md. No promotion, main merge/write, push, Step 6 or protected tool change.
