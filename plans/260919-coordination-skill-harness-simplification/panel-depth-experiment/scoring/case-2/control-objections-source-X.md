# Architecture Critique: Rejecting Proposal B

Proposal B is arguably the strongest architectural pivot on the table. It correctly observes that `block-classify.ts` is already violating its "universal" mandate by hardcoding agent-specific regexes (e.g., Claude's `SUMMARY_QUESTION` and `MENU_CURSOR_ITEM`). Proposal B seeks to formalize this via the `HarnessAdapter` pattern from `collie`, giving each agent its own parser.

**However, Proposal B fatally misunderstands the risk profile of its domain.**

Collie uses the `HarnessAdapter` pattern because it maps terminal output to **executable native buttons** (Tier 2 interactive). A false positive in Collie injects a stray keystroke into a live, running shell—a destructive capability. To mitigate this, Collie requires a heavy architecture: strict fixture corpora, capability fences, pure detectors, and a dedicated registry to fail closed.

`herdr-gateway`'s `block-classify.ts`, by contrast, maps terminal text purely to **visual layout** (`wrap` vs `pan`). As `terminal-detail.md` dictates, the design is intentionally asymmetric: *"getting it wrong in the R22 direction leaves the block exactly as it always looked"*. The cost of a false positive is purely cosmetic.

Importing Collie's heavy, registry-bound `HarnessAdapter` machinery just to decide CSS word-wrapping is architectural overkill. It introduces Tier-2 complexity (fixture maintenance, CI gates) to solve a Tier-0 problem where the fallback (panning) is already acceptable. We should reject Proposal B's over-engineering; if a global heuristic (Proposal C) occasionally mis-wraps a line due to a regex collision, the blast radius is microscopic compared to the maintenance burden of a per-agent registry.

---

# Constraint-Advocate Risk Ranking: Terminal-Detail Classification

Role: constraint-advocate. Question: real operational risk ranking of A (universal classifier, in-system), B (HarnessAdapter/per-agent grammar, collie-inspired), C (universal heuristic, patched reactively — prior own proposal).

Note up front: I could not read `[REDACTED]/.fgos/assignments/[REDACTED]|033|034` — that path is outside this session's sandbox permission (both `Read` and `Bash` were denied against it). This ranking is built only from the herdr-gateway repo's own evidence, not from what earlier panel rounds already argued. If op_032/033/034 already fixed a sharper A/C distinction than the one I infer below, defer to that.

## Ranking (highest real operational risk first)

### 1. C — universal heuristic, patched reactively — HIGHEST risk

Evidence this is not hypothetical, it's already happening:
- `web/src/block-classify.ts` — the "universal content-shape classifier" already contains Claude-Code-specific special cases baked into a nominally-generic function (`looksStructured`): `MENU_CURSOR_ITEM`/`MENU_ITEM` regex is justified in-comment as "Claude Code's own menu, not text"; `SUMMARY_QUESTION`/`SUMMARY_ANSWER` as "Claude's own 'Review your answers' summary"; the `BOX_CHARS` arrow exclusion is tuned specifically because "an agent scatters [arrows] through ordinary prose as bullets." 3 of ~5 structural heuristics in a "universal" file are actually single-agent-shaped.
- Recent commit history (from git status context) shows exactly the incident-driven drift pattern: "widen reply guard tail window past Claude Code's footer," "pan Claude's Review your answers Q&A summary," "stop rules and choice menus from wrapping under real Claude Code footers" — three reactive patches in quick succession, each narrowing a shared function around one agent's UI quirks.
- `docs/specs/terminal-detail.md` Open Gaps admits: "Real miss rates have not been measured against a corpus of the output the operator actually reads" — there is no regression/fixture corpus today, so every reactive patch is validated against whatever the last incident looked like, not against a corpus covering other agents.
- `agent_presets` already supports Claude/Codex/"Agy" launch (`docs/backlog.md` PBI-036), and PBI-061 explicitly flags as unknown whether Codex/Agy have equivalent UI conventions the Claude-tuned regexes might misfire on. Since all heuristics share one function, a patch tuned to fix Claude Code has undocumented blast radius on every other agent and plain-shell pane — nobody is testing that.

This is compounding, ungated risk with no circuit breaker: no fixture corpus, no conformance suite, no per-agent isolation, and each fix's real scope is "whatever incident someone happened to notice." It is the status quo trajectory, not a considered decision.

### 2. B — per-agent HarnessAdapter (collie-inspired) — MEDIUM risk, different kind

This repo's own prior-art process (`docs/distillery/porting-log.md`) already scored the collie tiered-adapter pattern (`harness-adapter-capability-tiers`) as **R3 E1 F3**: high relevance, but E1 = only one source (collie), not independently converged like other patterns in the same log (e.g. `send-confirm-submit-pattern` reached E3/tier-3 convergence across airemote + collie + herdr's own docs before being ported). F3 = "an entire subsystem" (tier ladder + capability fence + conformance suite), and `web/src/lib/harness/` does not exist yet — this is a green-field build, not an extension.

Real constraints against adopting it wholesale for *this* problem:
- Severity mismatch: collie's tiered-adapter discipline was built to prevent a safety-relevant failure (a reply typed into the wrong dialog, silently losing a message — `docs/distillery/deep-dives/verify-before-submit-send-guard.md`, incident #34). Wrap/pan classification is explicitly *not* that class of problem: R25 in `terminal-detail.md` already encodes the asymmetric-risk design — wrong-toward-`pan` is invisible/cosmetic, never data loss or misdirected input. Importing a 3-tier capability-fence + fail-closed-detector subsystem, sized for interactive-safety guarantees, onto a passive display decision is disproportionate engineering weight for the actual failure mode being defended against.
- Migration risk: `terminal-detail.md` has 20+ locked decision IDs (R21-R30 specifically govern the classifier) and existing unit tests assume one shared classifier. Splitting into per-agent adapters means re-deriving/reconciling those decisions per adapter with no fixture corpus yet built to validate against — real short-term regression risk during the cutover itself, on top of the E1/F3 already noted.
- Upside is real, not dismissed: this is the one option that *forces* the missing rigor (fixture corpus + conformance suite as a hard gate) rather than relying on someone remembering to write tests. If herdr-gateway's problem space grows to include interactive per-agent send/detect logic (not just passive wrap/pan), B's evidence case gets stronger — it is currently scoped for a harder problem than the one being decided here.

### 3. A — universal classifier, stay in-system — LOWEST risk, conditional

Same code as C today — the risk difference from C is not architectural, it's procedural discipline, and that difference only holds if it's real. A is lower risk than C **only if** "stay in-system" is paired with closing the admitted gap: building a real fixture/regression corpus captured from each already-supported agent kind (Claude, Codex, Agy) and running `looksStructured` against it before merging future patches. That gets most of B's actual safety benefit (a corpus that catches cross-agent regressions) without B's F3 infrastructure cost, because it doesn't require adapters, tiers, or a capability fence — just tests, which is cheap relative to the subsystem B implies.

Caveat that must be stated plainly: without that explicit corpus commitment, A is indistinguishable from C — it is the same file, same drift, same undocumented Codex/Agy blast radius. "Stay in-system" is not itself a risk mitigation; it only becomes one if it comes with a stated, checked gate. If the driver picks A without that gate, re-rank it as risk-equivalent to C.

## Unresolved

- Could not access op_032/033/034 context-ref artifacts (outside this session's sandbox path permission) — this ranking may be missing prior panel reasoning that already resolved the A/C distinction differently.
- Whether Codex/Agy panes actually trigger false positives/negatives in the current Claude-tuned regexes is unconfirmed either way (PBI-061 flags it as open, not measured) — this is the single fact that would most sharpen this ranking if resolved.
- Exact commit count/dates for `block-classify.ts` reactive-patch history unobtainable — `git log` was denied in this sandbox; the pattern is confirmed from in-file comments and the three recent commit subjects visible in git status context, not a full audit.
