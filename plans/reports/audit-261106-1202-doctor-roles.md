# Audit: what `fgos doctor` does, where each row belongs, and a target shape

Date: 2026-11-06 12:1x Asia/Saigon, fg-server2. Owner decision 64 (doctor a): read-only audit; no code before the owner approves a shape. Auditor: independent subagent (opus); HARDEN lead wrote this file from its reply.

Method: `fgos doctor --json` run twice in the forgent main checkout and once in a scratch Git repo with no fgOS setup, each row timed with a Node preload wrapper. Nothing edited, nothing committed, `--fix` never run. Spawn counts cover only Node `child_process` calls (lower bounds).

## 0. Short answer

- Wall time 45.4 s / 43.9 s in forgent; 4.2 s for 147 rows in a non-fgOS repo.
- By count: 94 setup/config (S), 20 live incident (L), 21 fgOS-repo hygiene (H), 8 packaged-definition checks (O), 4 dead (D).
- By summed time: fgOS-repo rows 24.7 s, setup 14.6 s (608 spawns, 522 in T5 seat rows), live incidents 10.4 s, packaged definitions 0.3 s.
- One row is 40 % of the run: `enduser-docs-index-stale` 19.7 s (rebuilds the whole index including a second fold of Work history to compare path sets).
- Proposed homes: keep ~83 (K), owning component ~26 (C), fgOS repo tests/CI ~15 (R), delete ~14 (D). Seven moves need something that does not exist yet (§2).
- The activated release runs 147 rows; source has 146 (`shadow-binder-divergence` already deleted in `847913570`).
- Live failing rows on fg-server2: `executor-skills-installed`, `tool-registry-configured`, `work-step-vocabulary` (tsk-5db on retired step `clarify`), `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted` (codex), `active-release-matches-checkout`.

Codes: Class S/L/H/O/D as above. Non-fgOS: Y means something in an ordinary project; skip = self-skips; rel = re-checks the installed release (same answer everywhere); ✗ = judges something that is not fgOS's business. Cost = ms/spawns in forgent.

## 1. Every row

### Packaging, install and host
| id | checks | class | non-fgOS | cost | fix | home |
|---|---|---|---|---|---|---|
| node-version-and-git | Node ≥18 and git on PATH | S | Y | 231/0 | – | K |
| cli-version-visible | `fgos version` resolves | S | Y | 1/0 | – | K |
| shell-integration-sourced | rc source line (legacy setup) | S | Y | 1/0 | (setup) | K until the `fgos setup` window closes, then D |
| project-fgos-launcher | one launcher runs each project's activated fgos | S | Y | 1/0 | yes | K |
| curl-available | curl on PATH | S | Y | 6/1 | – | K |
| rust-host-binary-present | active release binary executable | S | Y | 3/0 | – | K |
| rust-host-target-supported | OS/arch approved | S | Y | 0/0 | – | K |
| legacy-node-payload-present | manifest `legacyNode` entry exists | S | Y | 3/0 | – | K |
| dependencies-installed | `package.json` deps in `node_modules` | S | ✗ (user's app deps; fgOS has 0 runtime deps) | 1/0 | – | D |
| plugin-skill-cli-reachable | some fgos CLI reachable | S | Y | 0/0 | – | D (a running doctor proves it; `project-fgos-launcher` covers it) |
| claude-plugin-marketplace | marketplace registered, plugin enabled | S | Y | 1280/3 | yes | K |
| main-checkout-hook-wired | `core.hooksPath` = `.githooks` | S (contributor) | skip | 403/0 | – | K |
| active-release-matches-checkout | source payload matches activation | H | skip | 222/0 | – | K (only the dev machine can judge it) |
| command-routes-drift | routes descriptor matches registry | H | skip | 56/1 | – | D (dup of `test/rust-host/command-routes.test.mjs:123`) |
| git-mutation-one-door | release mutation census clean | H/rel | rel | 15/0 | – | R (pre-commit census + `test/githooks/census-drift.test.mjs`) |
| instruction-projections-stale | AGENTS.md and projection ledger current | H | skip | 143/1 | yes (writes tracked files) | R (Q1) |
| plugin-dev-skills-packaged | dev skills mirrored into plugin | H | skip | 0/0 | – | D (dup of `test/skills/fgos-mirror.test.mjs:116-138`) |

### Config (one engine shared with `fgos config check`)
| id | class | non-fgOS | cost | fix | home |
|---|---|---|---|---|---|
| 15 `config-*` rows + gateway-token-configured | S | Y | ~70 ms total | 6 fixes | K (could print as one row) |
| runner-generated-paths, runner-patterns-config | S | Y | 3, 33 | – | K |
| tier-vocabulary-dead-keys | S (migration) | Y | 1/0 | – | D (dup of `config-unknown-key`) |
| worker-slots-ceiling-usable | S | Y | 0/0 | – | K, or fold into schema (`minimum: 1` missing) |
| run-supervisor-config | S | Y | 0/0 | – | K (no `dispatch` schema file exists) |
| global-model-policies-portable | S | Y | 1/0 | – | K |

### Runner, seat binding, confinement (T5; not re-planned)
| id | class | non-fgOS | cost | fix | home |
|---|---|---|---|---|---|
| executor-family-unique, executor-skills-installed, tier-fallback, model-policy-pools, llm-accounts-shape, capability-serves-valid, workflow-capabilities-configured, executor-confinement, invocation-git-write-grants, herdr-executor-kinds, trust-store-readable, non-claude-trust-stores-readable, agent-cli-project-trusted, confined-pane-accounts | S | Y | 1–29 each | – | K (T5) |
| llm-accounts-vs-legacy | S (migration) | Y | 2 | – | K until `runner.providers` retires |
| executor-profile-warnings | S (migration) | Y | 3 | – | K; reports `passed:false` while saying "informational" |
| seat-binding-dry-bind | S | Y | 980/62 | – | K (T5) |
| blind-steps-use-proven-pools | S | Y | 7059/460 | – | K (T5); most expensive by spawns |
| executor-posture-coverage | S | Y | 694/36 | – | folded by T5 phase 12 |
| seat-binding-route | S | Y | 15/1 | – | K |
| bwrap-available, confinement-bwrap-platform, confinement-probe-freshness (482/12), confinement-blind-read, confinement-strict-readiness, confinement-policies-declared | S | Y (Linux) | – | – | K |
| confinement-backend-registry-readable | S | Y | 0 | yes | K |
| confinement-herdr-maturity | O (always "partial") | Y | 2 | – | T5 decides |
| confinement-orphaned-resources-reaped | L | Y | 0 | yes | C: run-supervisor adopt/sweep (T5) |
| credential-copies-retained | L | Y | 3 | yes (applies login copies) | C: T5 phase 03 credential module |
| shadow-binder-divergence | D | – | 0 | – | already deleted in source |
| tool-registry-configured | S | Y | 4 | – | K |
| agy-permissions-configured, agy-sub-homes-configured | S | Y | 0–3 | one | K |

### Agent CLI hooks
| dispatch-decide-hook-wired, codex-, agy-, omp-, pi-hook-wired | S | Y | ~200/2 each | yes | K |
|---|---|---|---|---|---|

### Run supervisor (T4)
| id | class | non-fgOS | cost | fix | home |
|---|---|---|---|---|---|
| run-supervisor-route | S | Y | 46/4 | – | K |
| runtime-socket-dir | S + L (orphan sockets) | Y | 1 | yes | K for the dir; orphan sockets → C (adopt) |
| run-attempts-stuck | L | Y | 187/1 | yes (adopt) | C (`fgos run`, runner loop and `dispatch reconcile` already adopt; `dispatch inspect`/`show-run` report) |

### Holder-lock
| lock-kernel-semantics | S | Y | 20 | (lock-dirs) | K |
|---|---|---|---|---|---|
| lock-borrow-vectors | S | Y | 100/1 | – | K |
| lock-holders | L | Y | 949/0 | – | C: `fgos lock-status` (missing two judgments, §2) |

### Event Store
| id | class | non-fgOS | cost | fix | home |
|---|---|---|---|---|---|
| event-store-open-root | S | Y | 875 | (lock-dirs) | K |
| event-store-machine-id | S | Y | 605 | – | K |
| event-store-legacy-layout | S (migration) | Y | 51 | – | K until retired |
| event-store-refspec | S | Y | 0 | – | D (dup of `git-repository-config`) |
| event-store-native-addon | S | Y | 1 | – | D (its message points to `git-component-compatible`) |
| event-store-unsealed, -integrity, -sync | L | Y | 0 | – | C: `fgos events status` |

### Git
| id | class | non-fgOS | cost | fix | home |
|---|---|---|---|---|---|
| git-component-compatible | S | Y | 0 | – | K |
| git-repository-config | S | Y | 0 | yes | K |
| git-operation-journal | S + L | Y | 411 | yes (`git-land-recovery`, `git-wal-dir`) | K for WAL/fence; recovery needs a door (§2) |
| git-worktree-recovery | L | Y | 1437 | – | door (§2) else K |
| git-native-locks | L | Y | 0 | – | door (§2) else K |
| no-stuck-merge-abort | L | Y | 6 | fix is a no-op | delete the fix; fold the check into Git in-progress facts |

### Work and Workflow
| work-classification-vocabulary (506), work-step-vocabulary, work-recorded-conflicts, root-drift (479), leaf-notify-drift (242), delivered-not-on-trunk (4465) | L | Y | – | – | C (WORK; reporting doors missing, §2) |
|---|---|---|---|---|---|
| workflow-case-binding-sentinel | S | Y | 1 | – | K |
| workflow-case-bindings | L | Y | 1619 | yes | C (Workflow; §2) |

### Mailbox
| mailbox-hook | S + L | Y if enabled | 224/1 | – | K for wiring; record verdict → `fgos mailbox status` |
|---|---|---|---|---|---|
| mailbox-claude-accept, mailbox-sync-timer | S | Y | 1, 18 | yes | K |

### Identity, Observe, Terminal, provider capacity
| writer-identity-resolvable, identity-machine-id, identity-machine-key, identity-ssh-keygen, identity-project-id | S | Y | 20–50 | some | K |
|---|---|---|---|---|---|
| identity-shared-directory | S/L | Y | 2 | – | K (security signal) |
| identity-pinned-machines | O | Y | 20 | – | D (dup of `fgos identity pins`) |
| identity-ids-unique | H | skip | 44 | – | R |
| observe-dir-writable, observe-host-resolvable | S | Y | 1, 33 | – | K |
| observe-run-coverage | O | Y | 329/1 | – | R (implementation parity is a test) |
| terminal-control | S | Y | 23/1 | – | K |
| terminal-allocations | L | Y | 87/2 | – | door (§2) else K |
| provider-capacity-state | L | Y | 3 | – | C: `dispatch inspect` / `dispatch reconcile provider-capacity` |

### Packaged definitions and retired coordination
| task-specs-resolve, agent-claims-resolve, domain-registry-compiled, agent-type-names-unique, domain-workflow-operations-coverage, operation-prompt-templates-valid | O | rel + project tier | 0–6 | – | R for release tiers; K only for a project tier |
|---|---|---|---|---|---|
| coordination-protocol-dead-vocabulary | O | Y | 1 | – | D |
| coordination-protocol-fixtures-valid, coordination-example-requests-valid, operation-capability-resolves | D (return "retired") | – | 0 | – | D |

### Docs and knowledge
| enduser-docs-index-stale | H | skip | 19716/0 | yes | R or preflight (Q1) |
|---|---|---|---|---|---|
| decision-index-stale | H | skip | 248 | yes | R or preflight (`fgos decision-index --check` exists) |
| doc-registry-stale | H | skip | 41 | yes | C: `fgos doc-registry` (no `--check`, §2) |
| 9 `doc-*` lint rows (doc-current-path-missing 2960, doc-near-duplicate 108) | H | skip | – | – | C: `fgos knowledge status` (only counts today, §2) |
| changelog-unreleased-stale | H | ✗ (fails any project right after a release) | 2 | – | R |
| readme-install-tag-exists | H | skip | 4 | – | R |
| convention-conformance | H | skip | 1025/1 | – | D/R (dup of `fgos convention check --all` and pre-commit) |

## 2. Moves whose home is missing (each an addition under RUL104; owner approval needed)

1. Git sweep and recovery (`git-worktree-recovery`, pending part of `git-operation-journal` + `git-land-recovery`, `git-native-locks`, `no-stuck-merge-abort`): no public Git verb; the only recovering sweep is `doctor --fix` (`src/setup/git-checks.mjs:152`). Needs e.g. `fgos git status|recover`, else K.
2. Terminal allocations: `reconcile-scan` is internal; needs a read verb or a `dispatch inspect` section.
3. Workflow case bindings: `fgos workflow status` does not show them; repair only in `doctor --fix`.
4. Work data drift (vocabularies, conflicts, leaf drift, delivered-not-on-trunk): no verb covers them (WORK lane, batched later).
5. Holder-lock leftovers: `fgos lock-status` lacks "predecessor domain still running" and "hot record does not parse".
6. Knowledge lints: `fgos knowledge status` only counts; `doc-registry`/`docs-index` have no `--check` (extends existing verbs).
7. Config: no `dispatch` schema file, so `run-supervisor-config` is the only validator.

## 3. Proposed target shape

Doctor answers one question: can fgOS run correctly on this machine and in this project? Installation and activation, platform capabilities (filesystem lock guarantee, bwrap, git/Node floors), config validity through the one config engine, agent CLI wiring, identity keys, and the component routes the host must answer. `--fix` repairs readiness only: directories, modes, hooks, launcher, keys, refspecs, config hygiene.

Doctor is not an incident console (stuck attempts, held locks, unsealed events, Git recovery, terminal slots, Work drift, orphaned homes belong to each component's own read verb and repair path, which already runs on its normal path) and not an fgOS-repo linter (changelog, README tag, doc registry, convention, census, mirrors, routes, projections belong to `npm test`, CI or pre-commit). Optionally at most one read-only pointer row per component ("Event Store: 0 unsealed, run `fgos events status`"), never repairing (Q2).

Proposed AGENTS.md gate wording: "A new config key goes into `core/config-standard` and `core/config-schema`. A new runtime dependency (tool, file, directory, platform capability) needs a readiness row in doctor. A new runtime state or incident class must be reportable and repairable through its component's own verb, never only through doctor. A rule about the fgOS repo's own files goes into `npm test`, CI or pre-commit, never into doctor."

## 4. Cost

Ten slowest rows: enduser-docs-index-stale 19 716 ms; blind-steps-use-proven-pools 7 059 ms / 460 spawns (T5); delivered-not-on-trunk 4 465; doc-current-path-missing 2 960; workflow-case-bindings 1 619; git-worktree-recovery 1 437 (computes Git facts for all Git rows); claude-plugin-marketplace 1 280; convention-conformance 1 025; seat-binding-dry-bind 980 / 62 (T5); lock-holders 949. Moving the R, C and D rows would take doctor from ~45 s to ~12 s here.

## 5. Risks and lane ownership

- A user loses the single place to look (pointer rows answer this, Q2).
- `fgctl init` runs `doctor --fix`, which today adopts stuck attempts, recovers Git Land operations, reaps confinement homes, applies retained login copies and rewrites workflow bindings. Run adopt also happens in `fgos run`, the runner loop and `dispatch reconcile`; Git sweep recovery has no other door, so it must not leave `--fix` before §2.1 exists.
- The two history-derived indexes need local Work history that CI may not have (Q1).
- Owners: T5 HARDEN (executor/seat/confinement/trust/account rows, `credential-copies-retained`); T4 (`run-*`, `runtime-socket-dir`); ES (`event-store-*`); GIT/OPC (`git-*`, lock rows, hook); MAIL (`mailbox-*`); WORK (`work-*`, drift, workflow-case); DOC (`doc-*`, indexes, changelog, README, convention, ids); TEST (every R move lands as one owning proof); CFG (`config-*`, possible `dispatch` schema).

Defects found (not fixed): the `no-stuck-merge-abort` fix is a no-op; `executor-profile-warnings` returns `passed:false` while saying "informational"; `dependencies-installed` and `changelog-unreleased-stale` judge the user's own files; doctor in a non-fgOS repo left `.fgos/{logs,observe,locks}` behind and launched `events sync --opportunistic`, which logged a fault telling the user to run the deprecated `fgos setup` (conflicts with "the default path never writes"; not traced).

## 6. Owner questions

Q1. Where do the 21 fgOS-repo rows go? (a) `npm test`/CI (the two history-derived indexes may lack history there); (b) `fgos preflight`, which already runs repo checks; (c) keep in doctor gated to source checkouts (~25 s per run). Recommendation: (a) for static rows, (b) for the two indexes.

Q2. Keep a short pointer for live incidents? (a) remove entirely; (b) one read-only pointer row per component, no repair (~7 rows); (c) keep as is. Recommendation: (b).

Q3. Give Git its own recovery door (§2.1, an addition)? (a) add `fgos git status|recover` and move the Git rows and `git-land-recovery` there (same pattern then covers §2.2, §2.3); (b) keep them in doctor as a stated exception. Recommendation: (a), a real trade-off against RUL104.
