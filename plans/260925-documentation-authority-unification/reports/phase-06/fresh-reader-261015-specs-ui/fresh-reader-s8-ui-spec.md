# Fresh reader answers: UI specification (herdr web dashboard UI layer)

Standing caveat for all scenarios. Every file under `docs/platform/ui-spec/` is a candidate copy, not canonical. Its header says `Canonical: No`, `Design status: Candidate`, and "Carriage only; current implementation truth is not certified". Each file points to a legacy source under `docs/ui-spec/` as its provenance. The binding owners, as the files describe them, are the legacy `docs/ui-spec/` tree (its compiler root) and the product area spec `docs/specs/herdr-web-dashboard.md`. I did not open either, because both are outside my scope. This means I could not verify the area spec's content.

## Scenario A: new screen S05 (settings, switch gateway)

- Q1: Start at the portal `docs/platform/README.md`. It lists ui-spec's current source as `../ui-spec/`, so the candidate area is not the live source. Then read `docs/platform/ui-spec/README.md`, then `docs/platform/ui-spec/spec.md` (surface index and "How to work on this spec"), then the rules in `contracts/20-domain-rules.md`.
  cites: docs/platform/README.md#2-area-registry, docs/platform/ui-spec/README.md#added-in-candidate-read-this-area, docs/platform/ui-spec/spec.md#surface-index
- Q2: This is a new product surface plus a new screen spec file. It is not a documentation-only change. The spec layer "never settles a product question", so whether a settings screen exists must come from the area spec first. I could not check that. The surface index lists only S01-S04, M01-M03, C01 and F01-F02, and says all eight behaviour subsections of the area spec are covered. That suggests a settings screen is not in the product source today.
  cites: docs/platform/ui-spec/spec.md#herdr-web-dashboard-ui-spec-overview, docs/platform/ui-spec/spec.md#surface-index
- Q3: It touches R1. The client addresses a gateway, the endpoint is switchable, and every data-bearing surface shows which endpoint it reads. Today R1 lists S02, S03 and S04 only. The mapping is bidirectional, so S05 would need `R1` in its frontmatter `rules:` and in the R1 `surfaces` list, or the check raises VR-RULE-DRIFT. It also touches R2 (every write maps to a one-door-write verb), but a gateway switch is a client setting and I cannot tell from these files whether it counts as a write. The system-events contract applies if S05 listens to `gateway.unreachable`. The surface index and tree in spec.md need a new row.
  cites: docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules, docs/platform/ui-spec/contracts/15-system-events.md#system-events
- Q4: Medium. It adds a surface and edits a shared rule mapping. R4 (token never displayed or persisted) and R5 (standing exposure indicator) may also apply to a settings screen, but the files do not say. I cannot verify the effect on the compiler, because I only saw a provenance sidecar for `spec.config.yaml`, not the config itself.
  cites: docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules, docs/platform/ui-spec/architecture/spec.config.yaml.md#added-in-candidate-provenance-for-specconfigyaml
- Q5: The spec says `validate` is the trust gate: dangling navigate targets, bad hosts, listen-orphans and rule drift are errors. Run validate, build and interpret-wireframe against the compiler root. The candidate README warns that the compiler root is still legacy `docs/ui-spec/` and the candidate layout is not certified as a root. So a green run on `docs/platform/ui-spec` proves nothing yet.
  cites: docs/platform/ui-spec/spec.md#how-to-work-on-this-spec, docs/platform/ui-spec/README.md#added-in-candidate-tool-root-obligation
- Q6: Record the product decision in the area spec (the binding owner), and update the surface index and rules mapping. The candidate README says the batch report and pending ledger live under `plans/...`, which I did not read. Governance says one claim has one owner and settled content is promoted into the canonical doc. Where exactly this goes cannot be confirmed from these files.
  cites: docs/platform/governance.md#1-principles, docs/platform/ui-spec/README.md#added-in-candidate-verification-and-change-boundary

## Scenario B: notification bell with unread badge on S04

- Q1: Read `docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#states` first, then rule R11 in `contracts/20-domain-rules.md`, then `contracts/15-system-events.md`.
  cites: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#states, docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules
- Q2: This is not a small UI addition. It reverses a recorded product rule. R11 says "Nothing pushes. The UI must not imply it will alert anyone — no bell, no 'we'll notify you'". S04 states "there is no bell and no badge that implies push". The change needs a product decision first, in the area spec. That is a user decision under the repo's review rules, not something to silently override.
  cites: docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules, docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#states
- Q3: It touches R11 (surfaces S02 and S04), the S04 spec including its layout and States, and the events contract. The events are client-derived from polling `/v1/state/digest`, not pushed. An unread badge implies someone is told when they are not looking, but "a screen that is closed is not polling at all". R1 and R5 are also in S04's `rules:` list.
  cites: docs/platform/ui-spec/contracts/15-system-events.md#system-events, docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#s04-questions-needing-answer
- Q4: High. It contradicts a stated rule and the product's pull-only stance. The existing topbar count ("Needs answer · 2") is deliberately "true at the moment of looking". An "unread" notion adds state the system does not track. A plain count is consistent with R11; a bell with an unread badge is not.
  cites: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#states, docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules
- Q5: I cannot verify from these files that the compiler checks R11 mechanically. Only the bidirectional rules-to-surfaces drift is stated as a check. Done would need the area spec's R11 changed by its owner, the rule text here updated to match, and the validate, build and interpret-wireframe run. Those tools are described in spec.md. I did not see their output.
  cites: docs/platform/ui-spec/spec.md#how-to-work-on-this-spec, docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules
- Q6: A settled decision to reverse R11 belongs in the area spec and its decision history. I could not verify the exact location from my scope. These candidate files should not be the only place it is written, because they are non-canonical.
  cites: docs/platform/ui-spec/README.md#ui-spec-candidate-area, docs/platform/governance.md#1-principles

## Scenario C: layout changed; refresh the clickable wireframe and pass compiler checks

- Q1: Read `docs/platform/ui-spec/spec.md#how-to-work-on-this-spec`, then the "Tool root obligation" section of `docs/platform/ui-spec/README.md`, then the screen file you changed. S04 is the one example I read.
  cites: docs/platform/ui-spec/spec.md#how-to-work-on-this-spec, docs/platform/ui-spec/README.md#added-in-candidate-tool-root-obligation
- Q2: This is a spec-layer edit plus a tooling run, with no product change if only layout changed. The screen's ASCII layout block and its `regions` frontmatter are the human-facing part. The `herdrweb-contract` YAML block is the machine part.
  cites: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#layout, docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#interactions
- Q3: It touches the screen file's layout and regions. If you rename or move regions, the interaction rows that reference `region:` must still match. The `rules:` frontmatter must still match the rules table. The compiler config `spec.config.yaml` is carried here only as a provenance sidecar, so I cannot say what it constrains.
  cites: docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md#interactions, docs/platform/ui-spec/contracts/20-domain-rules.md#domain-rules
- Q4: Low to medium. Layout alone is low risk. The risk is running the wrong root: the candidate tree (`architecture/screens/`, `contracts/`) does not match the compiler's expected layout (`screens/`, `modals/`, `components/`, `flows/` directly under the root). The candidate README says this directly. Editing only the candidate copy would leave the working legacy root unchanged.
  cites: docs/platform/ui-spec/README.md#added-in-candidate-tool-root-obligation
- Q5: Run the three commands against the legacy root `docs/ui-spec`: `validate.mjs`, `build.mjs`, `interpret-wireframe.mjs` (from the ui-spec skill tools, with `--root <repo>/docs/ui-spec`). Done means validate reports no errors. The clickable wireframe is regenerated by interpret-wireframe, and `generated/` is gitignored build output. The README says the five generated outputs "stay in place with regenerate-from-source". I could not identify them from these files.
  cites: docs/platform/ui-spec/spec.md#how-to-work-on-this-spec, docs/platform/ui-spec/README.md#added-in-candidate-tool-root-obligation
- Q6: Nothing durable beyond the edited screen file, unless the layout change alters a rule or surface. I cannot confirm any further record is required from these files.
  cites: docs/platform/ui-spec/spec.md#directory-tree

## Disagreements and unverifiable points

- Command mismatch. `spec.md` gives `node validate.mjs --root <repo>/docs/ui-spec`. `contracts/20-domain-rules.md` says drift is caught by `npm run check`. I could not tell from these files whether the two are the same gate.
- Location mismatch. `docs/platform/README.md` lists the ui-spec area's current source as `../ui-spec/`. `docs/platform/ui-spec/README.md` says the candidate layout follows the frozen map, and that the tool root stays at legacy `docs/ui-spec/`. The two agree that legacy is live, but neither says when the candidate becomes the root.
- The spec overview calls itself `status: active` in frontmatter, while the header block says `Design status: Candidate` and `Canonical: No`. Several files carry that same pairing. I treated the header block as the controlling statement.
- Area spec content, the compiler behaviour, `spec.config.yaml` contents and the `plans/` ledger are unverified, because they are out of scope.

## Files opened, in order

1. docs/platform/README.md
2. docs/platform/ui-spec/README.md
3. docs/platform/ui-spec/spec.md
4. docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md
5. docs/platform/ui-spec/contracts/20-domain-rules.md
6. docs/platform/ui-spec/contracts/15-system-events.md
7. docs/platform/ui-spec/architecture/spec.config.yaml.md
8. docs/platform/governance.md (first 120 lines only)

Anchors I could not verify: none. Every anchor cited came from `node scripts/list-doc-anchors.mjs`.
