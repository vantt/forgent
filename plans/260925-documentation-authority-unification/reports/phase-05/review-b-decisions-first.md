# Review B: decisions-first shard

## Method

All 100 rows were read. A script re-extracted each source and target line range from the worktree and confirmed the pack text matches the files (0 mismatches). Body units were compared byte-for-byte (56 identical; the one differing body, row 4, differs only by the rewritten link to the in-document anchor for ADR 0012, which exists as row 60's target and is declared in the rationale). Heading units were checked for ADR number and section role (Context, Decision, Consequences and so on) against the surrounding source range and target order. claimKind and disposition were judged by content.

| row | claimId | verdict | note |
|---|---|---|---|
| 1 | claim_ae1f21106b52006a2ff377f9104a1fce | verified | |
| 2 | claim_192ebab9dbc6cec8b8957683e3ff8c82 | verified | |
| 3 | claim_5412ac73c702e4ec33e4b59dd9ad1940 | verified | |
| 4 | claim_0201a1d648765d578fb8fd96673da674 | verified | |
| 5 | claim_f8e2b48d6234ca8a73e15cdaad7d9c07 | verified | |
| 6 | claim_faeaa8e46158de47c45810fb0a595dcc | verified | |
| 7 | claim_310b7c85756d5a5631a83fd5b6f51450 | verified | |
| 8 | claim_5b6cd72833b3ee7ea7a2862b4eadb328 | verified | |
| 9 | claim_6f1392a7f197c9824233896cf218bda9 | verified | |
| 10 | claim_e8b18c86c4297b05e04a14793817bf6a | verified | |
| 11 | claim_6bf5e5b90a15803e49010737491afdb9 | verified | |
| 12 | claim_c56e0ea4200729ae5cf5542803b2fe10 | verified | |
| 13 | claim_0e062808f47ce5c348b6b44a91650ecc | verified | |
| 14 | claim_75f47ef3fd99abd07c138f106f1ca023 | verified | |
| 15 | claim_70c83eabb546f46e040404b3b908a02e | verified | |
| 16 | claim_c6a1314c4583518f5100cc53e78b1979 | verified | |
| 17 | claim_45c662066b6e70bac4ff5991ee40afca | verified | |
| 18 | claim_f161fbd15476131b86b7c2fd2f1d8f59 | verified | |
| 19 | claim_0f85275ad3f392256b805bf226c9562d | verified | |
| 20 | claim_c57c39536b983d5f172833853e8b3344 | verified | |
| 21 | claim_5908b357cb98d52934398e26e43fcb39 | verified | |
| 22 | claim_67494c7de8ad006fcb01b825ea00e6b2 | verified | |
| 23 | claim_c23f1c3ed45f72de28f6ed3c605bc43a | verified | |
| 24 | claim_4a9e0c360118d90051bb7c03002ff4d9 | verified | |
| 25 | claim_4063855a9287de7cf5b27cb77d96955f | verified | |
| 26 | claim_93d9f629f8c7258d208b1c2d3fc413ab | verified | |
| 27 | claim_0b4d53be3903ac1ce9299b5d7174feab | verified | |
| 28 | claim_664fd1639ad346a2d2d240596a2a6604 | verified | |
| 29 | claim_7bc17cd130d9b9600e3a8db9bd57ca88 | verified | |
| 30 | claim_dbc0da98acd1c90327ebd67850cc8983 | verified | |
| 31 | claim_a79114f19bb479ea6b69c50166af8972 | verified | |
| 32 | claim_423abdded73e62ffd62a773173555583 | verified | |
| 33 | claim_0fe4212f0537cfd4b9232280e9e6781b | verified | |
| 34 | claim_99fa84eefd3c917530ef1a453f08be21 | verified | |
| 35 | claim_9283d5a06984f8b7a0bb9b53cb947051 | verified | |
| 36 | claim_aadb6e62ef42d3ea549cc667328aa410 | verified | |
| 37 | claim_2e390ae8e0379eae085591d9d6ff9af3 | verified | |
| 38 | claim_e602fe2731b631f7be06ccebc5cf8e91 | verified | |
| 39 | claim_453534a2ccfccba30980d90ae47b6e63 | verified | |
| 40 | claim_ad95e550092bec4474133ac2a451649d | verified | |
| 41 | claim_2f1ede55aaf8adff2f15c46ffc646e8d | verified | |
| 42 | claim_208f5cc84da2b23ab24abde2c91c4f06 | verified | |
| 43 | claim_5f4f81607ad69719e2fed9631a8dcd2b | verified | |
| 44 | claim_886f9acc902249e303bacc887ffb9882 | verified | |
| 45 | claim_37315ade5a8ca0c583456c157daaecba | verified | |
| 46 | claim_4c29ddf395edf0a905c5cf76729c2d26 | verified | |
| 47 | claim_9faf2f6fcfad6a089f7077f61abb3b56 | verified | |
| 48 | claim_d0aa35a58456de6d8e5f552bdad1b08c | verified | |
| 49 | claim_576e295be7d60ab95a555f11ada15da5 | verified | |
| 50 | claim_e375b70390617716823280eb03a82a87 | verified | |
| 51 | claim_a93bf40197e2bf32890a9cf931226e15 | verified | |
| 52 | claim_bad3eb429a52fae0b9100c7468c2d4d6 | verified | |
| 53 | claim_33c9953761a4fe99a4072b008cefc634 | verified | |
| 54 | claim_ff4510bb2afe125aedac972ed943ce2c | verified | |
| 55 | claim_50eed5d7ed0c4f2107e50cca1ffcee82 | verified | |
| 56 | claim_6346dec77f2dff715949806586e100d3 | verified | |
| 57 | claim_0dd6189a9d8ed1bcdd656127bf71774e | verified | |
| 58 | claim_9be26c9507109484cc9b1663ca4ca2d9 | verified | |
| 59 | claim_08dc68ef23395b8f3f5b095508348e00 | verified | |
| 60 | claim_e3c928a8fca5c645487d1b574f0c5d36 | verified | |
| 61 | claim_386a8c90d7f9d79a52190add7a82f33f | verified | |
| 62 | claim_4806fa4d3041b4b051cddf6a2490730b | verified | |
| 63 | claim_d1d70b955b085baafa10ffcec2702b8d | verified | |
| 64 | claim_dc663544c2f4766e60ca2ce841c6ffd6 | verified | |
| 65 | claim_3b4da5c5b12c6780b24e84b53ca73e49 | verified | |
| 66 | claim_f44a3645601fbc48b21a8d73b3ac3426 | verified | |
| 67 | claim_c6a32a1e4ab8c7078b89199236f3d5e0 | verified | |
| 68 | claim_4da244a64b6f33711d89feb47331b4f0 | verified | |
| 69 | claim_a7c2e1310de5bcd152e86f3833e90033 | verified | |
| 70 | claim_2d27908b73621a411fcf708b067b6ba2 | verified | |
| 71 | claim_e68c14be45a430e3676761d7bdc9e6db | verified | |
| 72 | claim_62c3b825e8cc887ad822b8d1b5316769 | verified | |
| 73 | claim_2591914de0c8f3b95488576fb8643dfb | verified | |
| 74 | claim_1f9265c6ad8bc4b9e8cf754fb1b8b164 | verified | |
| 75 | claim_e2589be21644922e0424a20d39bbd6e3 | verified | |
| 76 | claim_ebf8d11889aea2db10db3f7d03fb7d50 | verified | |
| 77 | claim_afaa4b9499e137528bcf889ef6ef93f0 | verified | |
| 78 | claim_185e1f6f4d1ef50fead4ce341980898d | verified | |
| 79 | claim_fc4d5078de5528578407ea0e3715e723 | verified | |
| 80 | claim_df1ec9feeaeb131a98f44cebcd3c8f6c | verified | |
| 81 | claim_b8d85d30862c55869062b5418f430f69 | verified | |
| 82 | claim_9f56719f95c81edecfe6dfda00ca0268 | verified | |
| 83 | claim_a4c7eec1fc96a1ad212a5de75a8942c5 | verified | |
| 84 | claim_4e04420f3322b42d6a313faa72216ae9 | verified | |
| 85 | claim_bd1c7b0191b236990a4740f007de2397 | verified | |
| 86 | claim_fe29583fb3eaae959e22d8ea42f76e6d | verified | |
| 87 | claim_8beebc48272beb4cf5dd32b6ed94d5d0 | verified | |
| 88 | claim_e763e03b02e0c2d677ef4b49f30a9ad3 | verified | |
| 89 | claim_a9ff1aae0ff13bbce2c3ba5e9f30b19e | verified | |
| 90 | claim_b87e27dca1c9e551eb4d296c858d0f08 | verified | |
| 91 | claim_5770fe5a53057464d4c4795b24abb38a | verified | |
| 92 | claim_86e1127b120054dafe55e52585c2a1d9 | verified | |
| 93 | claim_ef05e66d20bc35c8c80ac2a83dbe7d92 | verified | |
| 94 | claim_16901b7106220f70f44d600ba4dbb40f | verified | |
| 95 | claim_6ce44d19e0f7b99b1c363579bf6eb68e | verified | |
| 96 | claim_9974f7370cd9be4ca66f08057a94d3d7 | verified | |
| 97 | claim_38fc27aadc8aecf157c5db30cda1862b | verified | |
| 98 | claim_ebfb0421fa0d9c6693aaf57a262dd471 | verified | |
| 99 | claim_aa501f53cee0b7ec6adc656971266a97 | verified | |
| 100 | claim_7d0cfc9e7e784ee0492be9c2d04fa93b | verified | |

## Counts

- rows: 100
- verified: 100
- defects: 0

## Defect rows

None.

## Concern outside the pack

Source line 1454 of docs/specs/work-state.md ("Ngu nghia:", the lead-in line between ADR 0006 rows 36 and 37) is covered by no row in this pack and does not appear in the target document. It may belong to another shard; if no row carries it, it is a loss.
