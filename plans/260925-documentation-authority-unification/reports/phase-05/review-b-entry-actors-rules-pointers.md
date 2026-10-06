# Review b-entry-actors-rules-pointers

Method: parsed the review pack with a script and compared each SOURCE block with its TARGET block (all 11 non-heading rows are byte-identical, no loss or addition); heading rows were judged for section fit and disclosed title change; anchors were all found; claimKind and disposition were judged by content.

| row | claimId | verdict | note |
|---|---|---|---|
| R1 | claim_eabede7444bd867855b0afedea32b372 | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R2 | claim_36389ecd6a08422af17bd5af68a6fce5 | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R3 | claim_c613cb5faff29ae8bd2374be9af5b48f | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R4 | claim_8f6ab9b2c2de71369769d27719a09b8e | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R5 | claim_a5326477491a9bc30a98744da8e9bfb9 | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R6 | claim_949f208343809a8ca04870aea74402de | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R7 | claim_f323a5093b365db84b200bcd86a3e019 | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R8 | claim_477a30f4902261e390c34ab888145dcd | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R9 | claim_9bb5739f68a7b4bafcd959ef59104e6a | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R10 | claim_904f21e704c3d43d63ae2a762bf9791c | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R11 | claim_b64e4bcb5061a6c42c0db1d5a1f2887b | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R12 | claim_d011d26d0e584f25caa838e02c59b613 | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R13 | claim_a27bf300f6a6f7901c1c072d5cf9e7da | defect:wrong-kind | Unit is a list of open gaps and deferred/not-yet-decided work ("chưa quyết", "cố ý không làm ... (deferred)"), i.e. intent/forward-looking, not a specification of current behavior; recorded kind is specification (text itself is carried byte-identical). |
| R14 | claim_294491cc27c7f037d7b904b6cfb2eddb | defect:wrong-kind | "Đã đóng: dư lượng CAS ... từng liệt ở đây, nay đã sửa" records a past gap that was closed, i.e. historical-context, not specification (text itself is carried byte-identical). |
| R15 | claim_1a9c10544a642b6001a8bacae1b6817b | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R16 | claim_2cfd89083b61b2c263e84f24624a6f3c | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |
| R17 | claim_40f7857c31724be3b7ca7a6de1097818 | verified | Heading represented by the right section of the candidate; title-only change disclosed in rationale. |
| R18 | claim_2e2bc9264b289319dfae5c6487978f99 | verified | Source and target text byte-identical; anchor found; kind/disposition fit. |

## Counts

- verified: 16
- defect:wrong-kind: 2

Row count: 18

## Defect rows

- R13 claim_a27bf300f6a6f7901c1c072d5cf9e7da defect:wrong-kind: Unit is a list of open gaps and deferred/not-yet-decided work ("chưa quyết", "cố ý không làm ... (deferred)"), i.e. intent/forward-looking, not a specification of current behavior; recorded kind is specification (text itself is carried byte-identical).
- R14 claim_294491cc27c7f037d7b904b6cfb2eddb defect:wrong-kind: "Đã đóng: dư lượng CAS ... từng liệt ở đây, nay đã sửa" records a past gap that was closed, i.e. historical-context, not specification (text itself is carried byte-identical).

## Re-review of the corrected rows

The author corrected the claim kind of the defect rows after this review (the shard was returned once). A second independent reviewer checked the corrected rows (anchor, meaning, kind, disposition) and verified all of them; the shard rows were then marked reviewed.
