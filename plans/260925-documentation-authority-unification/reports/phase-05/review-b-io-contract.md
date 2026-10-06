# Review B: io-contract shard

## Method

Each of the 41 rows was compared source versus target (facts, identifiers, list items, links), the anchor block was checked as shown in the pack, and claimKind, disposition and rationale were judged against content. Rows whose target text is byte-identical to the source were verified on all six checks; the three rows with rewritten links (R2, R32) were accepted because the rationale discloses the link change and nothing else differs.

| row | claimId | verdict | note |
|---|---|---|---|
| R1 | claim_9466cce125cf03619e4d50ff9f340dcb | verified |  |
| R2 | claim_1b5bd12129cc41ea75fc7dd3993142f3 | verified |  |
| R3 | claim_882ee3f986d0dacee87764a5b6bb75d8 | verified |  |
| R4 | claim_51848961a2bbf93d37bc2b46d9f141f5 | verified |  |
| R5 | claim_426f29d1e11055574c203d89cba84cc7 | verified |  |
| R6 | claim_b5ef9b491d020583ac6ca1379e4115a0 | verified |  |
| R7 | claim_f5365b8e40fb58c75adc56a574263242 | verified |  |
| R8 | claim_cb629f70ad6029530d70253f96ad3221 | verified |  |
| R9 | claim_153f56c2d5a2e895f8e6b2607bb7ab3d | verified |  |
| R10 | claim_e9c39f67bc2eab533faa3053ff482708 | verified |  |
| R11 | claim_38ad96d62f2c6cf7a639fc24a83c2621 | verified |  |
| R12 | claim_dc506074dcc2f08f6012ebb078b50371 | verified |  |
| R13 | claim_62d31ae4e5abfcf0ab158c0c6a8337ee | verified |  |
| R14 | claim_5e282fb457ff9ef02e88cf329556cf34 | verified |  |
| R15 | claim_5b930b5ce84afec3d4b2c383c7f85925 | verified |  |
| R16 | claim_f50b3640275fce5d0a7e8d4f4077c0c9 | verified |  |
| R17 | claim_2fa062c56cf4226e8519e768a5b5cab4 | verified |  |
| R18 | claim_2b155082055823ccabf6fb40242abe42 | verified |  |
| R19 | claim_b92ac199356ff830e5554647ab143a90 | verified |  |
| R20 | claim_6a8087a3f502f37f9c7b729e871bee9c | verified |  |
| R21 | claim_3c993001919f57e0f96a36c2a4d92c43 | verified |  |
| R22 | claim_27d4d4dca46d6a8859628c443df0b31e | verified |  |
| R23 | claim_da21278ab32966f6631c82420552ed2b | verified |  |
| R24 | claim_b38e730cc466114aa1e1ebba6fa880ed | verified |  |
| R25 | claim_fda67d0dfc15159dc0e4c62b9dfddd87 | verified |  |
| R26 | claim_19495d2772ced1aa1af4b20d4640fa3a | verified |  |
| R27 | claim_e2377849e4ba8e3d3beaf70880e4ed23 | verified |  |
| R28 | claim_535f1aeb31d616e2138a5b3719cb4cd0 | verified |  |
| R29 | claim_ba1c2ac95c9c161d9fd345e3bfa63741 | verified |  |
| R30 | claim_d0e16d088cdecf2dd0b491f819009aa6 | verified |  |
| R31 | claim_6c529b87f6073cc75fdf836d3507d21d | verified |  |
| R32 | claim_e9ee744c6e1847ef25b3eb0bf180f577 | verified |  |
| R33 | claim_6f7c99f38f64abb5af7f07c1e2690730 | verified |  |
| R34 | claim_ea280fa29dca090fe3306f6161ac6ae7 | verified |  |
| R35 | claim_95a909b7be1252ba8de3be4c15f3638e | verified |  |
| R36 | claim_8999e61e46d6c02b407b84263d7a2d67 | verified |  |
| R37 | claim_f10fba22a20755dc700bb1720f98f451 | verified |  |
| R38 | claim_cf56f4a8b7679435c6bf59abd8c23093 | defect:wrong-kind | Unit explains why the original CoS of STR46 (backlog item) was narrowed ("Đây là lý do CoS gốc của STR46 ... bị thu hẹp có chủ ý"); this is historical rationale, not a contract obligation, so claimKind should be historical-context. |
| R39 | claim_deb4b4da2abbc3d6190dfce1c75cabf2 | verified |  |
| R40 | claim_7524deb4b2a1c12d1652076040bfec36 | verified |  |
| R41 | claim_d802aabd387ae98595c102f0e857f9b1 | verified |  |

## Counts

- verified: 40
- defect:wrong-kind: 1
- total: 41

## Defect rows

- R38 claim_cf56f4a8b7679435c6bf59abd8c23093 defect:wrong-kind: Unit explains why the original CoS of STR46 (backlog item) was narrowed ("Đây là lý do CoS gốc của STR46 ... bị thu hẹp có chủ ý"); this is historical rationale, not a contract obligation, so claimKind should be historical-context.

## Re-review of the corrected rows

The author corrected the claim kind of the defect rows after this review (the shard was returned once). A second independent reviewer checked the corrected rows (anchor, meaning, kind, disposition) and verified all of them; the shard rows were then marked reviewed.
