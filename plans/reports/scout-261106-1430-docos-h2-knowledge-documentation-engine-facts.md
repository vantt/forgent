# DOCOS H2 scout: what exists, what H2 needs

Date: 2026-11-06. Main `b6d250ca2`. Active release `bd53efb6` (from `9d62b93a1`). Lead `claude-wfgg@design-lap` (`lead:DOCOS`).
Read-only scout. Commands run: read-only `fgos --help --json`, `fgos convention path`, Node scans of tracked files (scratch script, not committed).
Inputs: [handoff](handoff-261106-1248-docos-h2-knowledge-documentation-engine-spec.md), [proposal](../../docs/platform/proposals/documentation-system-unification.md), [ledger](../../docs/platform/intent-preservation-ledger.md) rows PF-I007, PF-I010 and PF-I024, [Phase 10 facts](scout-261104-1016-doc-maintenance-facts.md), [10-21 synthesis](research-261021-1759-knowledge-registry-vs-knowledge-doc-engine-synthesis.md).

## 1. Doors that exist today

| Door | Where | Job today | Reach |
|---|---|---|---|
| Knowledge Registry | `src/state/knowledge-registry.mjs` (812 lines), resolver (130 lines) and projection (50 lines) in `src/report/` | Document identity `topicId:role`, a five-state lifecycle, aliases, `sourceCaptureIds`, events. Contract: `docs/platform/work-state/contracts/knowledge-registry.md` (711 lines) | Shipped to every project: `fgos topic`, `fgos doc` (reserve, register, mark-rendered, move-path, promote, demote, supersede, retire), `fgos knowledge status/attest`, `fgos doc-registry`, `fgos docs-index`, `fgos doc-sources`, and 13 `doc-*` doctor rows |
| Writer of user documents | `domains/coding/skills/fgos-coding-knowledge/SKILL.md` | The only caller of `fgos doc reserve`. Runs at status `retrospective`; reserve, write, commit, attest, mark-rendered, then promote | Coding domain, retrospective only |
| Convention | `packages/convention/contracts/convention.rules.v1.json`: 90 rows, 85 of them for docs; Rust `classify` returns kind, cardinality, scope and the flags `canonical`, `metadataExempt`, `generated` | Placement and kind of every `docs/**` path. `unplaced-docs` and `unplaced-platform` catch-alls block (live in `bd53efb6`) | **fgOS repo only.** The rules are embedded with `include_str!`, and the project overlay is unbuilt (Convention spec §3.3, Q13 open): "Repositories outside the fgOS source tree … receive no packaged fgOS-specific document rules" |
| doc-health | `scripts/doc-health.mjs` (214 lines): three strict rules, links-resolve, metadata (governance §5 baseline) and dead backticked paths | Body health of `docs/platform/**` | fgOS repo only. Runs only from `test/scripts/doc-health.test.mjs` (npm test); not in pre-commit, doctor or CI |
| Decisions | `state.decisions` + `fgos decision --scope`; projection `src/report/decision-index.mjs` → `docs/decisions/index.md` (generated, 66 lines); doctor `decision-index-stale` | Platform decisions with a scope; holder resolved through the governance [holder table](../../docs/platform/governance.md#decision-scope-to-holder-table) | Shipped |
| Governance | `docs/platform/governance.md` §2 placement map, §3 types, §4 authority matrix, §5 metadata | Prose rules; Convention and doc-health execute parts of them | — |

The documentation area has no spec yet: `docs/platform/documentation/` holds only `architecture/documentation-system-design.md`, `operations/portals/` and `history/`. Convention row `doc-spec-1` admits `docs/platform/documentation/spec.md`.

## 2. Registry state (measured today)

| Fact | Value | Change since 10-21 |
|---|---|---|
| Documents / topics | 479 / 479; lifecycle 332 `provisional`, 147 `active` | none |
| Roots registered | `docs/knowledge` 333, `docs/explanation` 136, `docs/how-to` 4, `docs/reference` 6; **0 under `docs/platform`** | none |
| Distinct `role` values | 365 for 479 docs (design expects a small closed set) | none |
| Tracked user docs not in registry | 19 of 497 (e.g. 15 under `docs/how-to/`, incl. `coordination-examples/*`); 1 registered path missing on disk | was 34 per agent, not re-derived the same way |
| `docs/doc-registry.json` last change | `23fb220e3`, 2026-09-15 | registry effectively idle since September |
| Parallel indexes | `docs/enduser-docs-index.json` 490 rows (keys quadrant/purpose/audience/docPath…), `docs/doc-registry.json` 479, tracked `.fgos/docs/enduser-docs-index.json` = `[]` (last touched 2026-08-01) | still three, still disagreeing |
| `doc-provisional-aged` | `now - doc.updatedAt` with ISO-string `updatedAt` → `NaN`, never fires (`src/setup/registrations.mjs:3223`) | still broken |
| Path shape mismatch | skill writes `docs/<purposeSlug>/<role>.md`; registry rows live mostly at `docs/knowledge/…` | — |

## 3. Name registries for the "named skill/command exists" check

| Namespace | Machine source | Gap |
|---|---|---|
| `fgos <verb>` | `fgos --help --json`: 79 commands (Node registry + native descriptors such as `convention`, `mailbox`, `config`, `metrics`) | Hidden/internal verbs (`internal`) are not listed |
| Skills | directory names under `core/skills/` and `domains/<domain>/skills/` | no single listing; `fgos-*` collides with crate names (`fgos-process`, `fgos-git`) and error codes (`fgos-write-rejected`) |

Scan of 258 canonical-path docs (excluding verification, history, decisions, reports and proposals) plus `AGENTS.md`, `core/**` and `domains/**` for `` `fgos <verb>`` not in the help JSON:

- **One proven dead live instruction** (new since PF-I024, which recorded "no dead verb proven"): `core/skills/_shared/private-cell-worktree.md:58` tells the agent to run `fgos coordination run …`. The verb was retired in `2180b4e72` (2026-10-02), and the active release answers `unknown verb "coordination"`. The file is included by `domains/coding/skills/_shared/coding-cell-policy.md`.
- The other hits are wording that names a removed or planned verb on purpose: `docs-lease` (holder-lock spec: "removed"), `repair` (work-state spec: "ĐÃ GỠ"), `evolve` (RUL36 "verb removed"), `secrets` (secrets spec: "planned"), `unlock` (RUL74 prose), `internal …` (real hidden door).
- The skill-name regex yields 40 non-skill `fgos-*` tokens: crates, error codes, pre-rename skill names. A regex gate is noise; a check needs the two name sources above plus a context marker ("removed", "planned").

So a verb check has a usable registry (help JSON) and one real catch today; a skill check needs a skill listing that does not exist as one projection yet.

## 4. Prior art

| Term | `git log -S` in `src bin scripts packages apps core domains` |
|---|---|
| `doc new`, `platform-docs` | 0 commits: never existed |
| `authorityKind` | only `97dd62aa7` (cutover) and `159971615` (retired migration tools): it lived in the plan-era scripts, now deleted |
| `docRegistry` | 11 commits from `5c948d2a4` (tsk-28x registry); config section `docRegistry` (`topicMaxDocs`, adoption check `docRegistryAdopted`) |
| `Canonical for` | 1 code commit (`3130002d4`, workflow propose reads it as a frame hint) |

Locked constraints H2 inherits: no stored graph or daemon (tsk-1lv D2), no second decision store (D3), no second checker or write door beside Convention and doc-health (L10, PF-I024), and spec before code (AGENTS.md L5 Q2).

## 5. Exists → what H2 needs (B1: one owner per job)

| H2 job | Owner today | H2 slice 1 needs | Owner after |
|---|---|---|---|
| Path, kind and cardinality of a doc | Convention | nothing new for fgOS; an overlay for other projects (Q13) | Convention |
| Body health (links, metadata, dead paths) | doc-health (npm test only) | run at the write door and in pre-commit for staged docs | doc-health |
| Doc identity and lifecycle | Registry, user profile only (`diataxis` enforced by `assertFrameworkModeRoleValid`) | a `platform-docs` profile, or keep platform docs path-identified by Convention | Registry |
| Choosing grow vs create, owner and template | nobody; templates in `docs/platform/documentation/history/templates/` | the write door (§10 items 1–7) | write-door skill over Convention + registry |
| Claim owner (A1) | nobody; `Canonical for` is boilerplate (60 docs share one string) | a claim key that is not prose: e.g. per-spec RUL ids and per-contract ids, which already exist | later slice (needs claim identity) |
| Named verb/skill exists | nobody | verb check against `fgos --help --json` in doc-health; skill listing | doc-health |
| Decisions | `state.decisions` + decision-index | unchanged | unchanged |
| User doc topology (PF-I010) | four Diataxis roots + `docs/knowledge`, routed by `docs/user/README.md` | one profile and one root, or confirm the current split | Registry + Convention |

## 6. Findings that shape the spec

1. **Convention does not reach other projects.** The write door, built "by extending Convention", serves only fgOS's own repo until Q13 (overlay) is decided. Mission boundary (D-ADR0035) says the door exists for projects that use fgOS. This is the main design fork of slice 1.
2. **The registry is shipped and cross-project, but idle and defective.** It works only for retrospective user docs, has three parallel indexes, a dead aging check, 365 free-form roles and 19 unregistered docs. Generalizing it before fixing these carries the defects into H2 (10-21 synthesis §3, still true).
3. **doc-health is not in the write path.** It runs only in npm test; an agent writing a doc gets no check until the suite runs. The cheapest A4 gain is to run doc-health (and Convention) at the door and in pre-commit on staged docs, not to add a checker.
4. **The proposal's `fgos doc new/check/classify` conflicts with Phase 10 decision 1** (no new `fgos doc` verbs). `fgos doc` today is the registry lifecycle verb; classify belongs to `fgos convention classify`; check belongs to doc-health. A skill-first door (proposal §4.4 already says "use the documentation authoring skill") resolves it without a new verb; a verb would be needed only for a cross-project door.
5. **The claim-owner check has no key.** RUL ids in area specs and contract ids are real, unique, machine-greppable owners; `Canonical for` is not. A first claim check can key on RUL id uniqueness (one spec defines each RUL) without a claims engine.
6. **One live dead instruction** (`fgos coordination run` in a shared skill file) proves the verb-reference check pays off today.

## Unresolved questions

1. Should H2 slice 1 serve other projects now (needs the Convention overlay, Q13), or fgOS's repo first with the cross-project route recorded under §0.3?
2. Platform docs in the registry (`platform-docs` profile) in slice 1, or keep them path-identified by Convention until claim identity exists?
3. Fix the registry defects (aging check, three indexes, 19 unregistered docs, free roles) as part of H2, or as a separate item first?
4. The `fgos coordination run` line in `core/skills/_shared/private-cell-worktree.md`: does DOCOS fix it now, or does it go to the owner of the coding cell policy?

Status: DONE
Summary: H2 starts from four existing doors (registry, Convention, doc-health, decisions). The real gaps are the write door, a claim key, the verb/skill check, user-doc topology and the registry's own defects. Convention's fgOS-only reach is the main fork for slice 1.
