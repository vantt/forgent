# Canonical portal authorization correction

Date: 2026-10-15. Author: codex-session:40@2026-10-15. Assignment: unit-run-1792018768541-038ef4c5/producer/1.
Input: `bd437be1cabb21c0b8c1b03e4d76612fa21d7438`. State: authored, pending independent review; Step 6 remains open.

Lead explicitly authorizes this A19 correction; A22 applies to its mechanical bindings. Exactly one clause changes in [the canonical portal](../../../../docs/platform/README.md#3-decision-surface), at line 59. Every other byte is preserved.

Before: “Phases 00–02 are completed, Phases 03–09 remain unauthorized”.

After: “Phases 00–04 are completed, Phase 05 is authorized and in progress, Phases 06–09 remain unauthorized”.

Evidence: [plan phase table](../../plan.md#7-program-phases), lines 250–261, maps current phases to legacy numbers: legacy 00–04 completed, transformation legacy 05, later legacy 06–09 unauthorized. [Owner answers](owner-answers.md):4 expressly authorize current Phase 6 on 2026-10-07; plan.md:374 records the same authorization. Input progress.md records Step 6 open and completed authoring/review work. **The plan's own summary/status table is stale** at lines 15, 21, 257 and 276 for the current phase. It is recorded here and deliberately left unchanged. The phase file's old overview is likewise not an authorization source.

Two receipts and their two classification references bind to actual extracted current unit/shown-text digests. Both remain pending; no approval, reviewer field or invented receipt commit carries forward. Original artifact session provenance is preserved, `amendedBy` identifies this session and the two changed rows have this author. The other thirteen receipt objects and references are unchanged. Complete before/after receipt/reference objects, unit text/ancestry, portal files, hashes and replayable command evidence are in [accounting JSON](accounting-261015-0601-portal-authorization-correction.md.json). This is accounting, not a review pack or review verdict.

| Claim ID (pre-native binding) | Anchor | Before unit digest | Corrected unit digest |
|---|---|---|---|
| `claim_e6c39f56c4d05238618e1a7fb7004af1` | `3-decision-surface` | `5b577ba76c013ac3079053a37da9764292815a862e3d1519d54172d8d9bf7e3c` | `4f71dfe83dabcb8db41496b7f6ef054a9c8241d3847dd590731f03430e017ccb` |
| `claim_afcdab4a068dfd573dfa7ec5a5f21c34` | `unheaded-block-7` | `d2295aa8bb8ade7d7e359ae65c80b310d7baf8921771294e58d0523302d5269e` | `f2fc847dcc06987d76c83c1e8ab5f049b5d6ab9b049241ca047d517d6b1afd63` |

All 94 decision shards were recursively inspected, including exact rows and historical gaps. None currently targets `docs/platform/README.md`; the prior source README carriage targets its separate History carrier. There are therefore no additional source/gap decision rebindings in this turn. The two predecessor IDs above remain explicit pre-native bindings; only next turn's actual native sync can determine live/gap identities. No ID is fabricated and no native equality is claimed.

Validation: 114/114 unchanged relevant tests pass with `env -u CLAUDE_CODE_SESSION_ID`, no failure/cancel/skip/todo. Candidate status has zero findings; placement 537 files / 536 matched / one existing exception. Extractor closure, switchboard authority statuses, reader route set and write scope pass. The portal is exactly the single authorized replacement; the other 13 receipt objects are unchanged, shown/evidence hashes recompute, and diff whitespace is clean. Native registry bytes, protected tools, vocabulary, baselines and plan.md are unchanged. D/E/G and full suite were not run; no native or current truth acceptance is asserted.

The unchanged ratchet reports the existing runner exception digest mismatch: expected `10b2de40c7668c98cf84a93785a7933a280e2fe7683328f97742c09365090e8b`, actual `dcad9c1729e181668f15130635114ed452dd89ba55dd359a8ab416ac6914d564`. Lead owes its separately authorized correction; this writer does not edit checker/exception files. No new owner decision blocks the assigned correction.

Next turn: run native sync **once** from this runner-produced commit, carrying directly from the persisted registry. Reconcile actual receipt/source/gap/list identity and digest consequences, pin corrected receipt artifacts to the actual commit, run both-prior D/E plus known/live/full-list tuple equality, and persist the registry. Package one bounded independent re-review covering these two corrections plus every changed row, receipt, exception and native consequence already listed in [prior accounting](accounting-261015-0547-whole-system-verdict-corrections.md). Preserve and expose the four machine-reference classification protocol debts. No unsupported approval carries. Native sync and review-pack creation were not performed in this turn.

No component-boundary change. No promotion, Step 7, git write, workspace `.fgos` mutation or secret read. All Rings holds, A34 residuals, owner queue and remaining Step 6 truth/sample/red-team/fresh-reader/checkpoint/consumer/alias/effort obligations remain. Markdown preview unavailable within the authorized scope.
