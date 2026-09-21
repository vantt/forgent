// test-ownership.mjs -- P04 reality-validated ownership manifest. Data-only:
// one rule per SOURCE file (never a glob), each with an explicit list of
// direct and/or boundary tests. Exact-path matching only (no glob engine),
// so "a path matches multiple rules" is structurally impossible -- manifest
// validation refuses a duplicate pattern outright rather than needing a
// rule-compatibility merge algorithm.
//
// Scope is deliberately narrower than the plan's candidate list:
//   - src/intake/** and src/report/** are included per the plan's own
//     candidate list, minus any file with zero test coverage found
//     (src/report/item-trace.mjs -- excluded, no direct or boundary test
//     located; it safely falls through to the unknown-path -> full default).
//   - src/state/** is scoped to modules with low fan-in (<=3 importers
//     outside src/state/ itself, grep-cross-checked) AND that are not
//     log/coordination-core-adjacent by role, per the plan's explicit
//     carve-out ("leaf modules ... that do not include shared
//     event/store/replay/schema core"). Higher-fan-in or core-adjacent
//     modules (events, store, replay, envelope, work, frontier,
//     workflow-stage-graphs, worker-slots, runtime-coordination, and
//     others) are deliberately left OUT of this manifest -- they fall
//     through to the unknown-path -> full default, same effective safety
//     as an explicit full-trigger, without needing to enumerate them twice.
//   - src/verbs/merge/** is excluded ENTIRELY from this pilot: only
//     approve.mjs has a direct test file, and confidently mapping the
//     "mandatory boundary tests" for the rest (merge, catchup, sync-root,
//     review, reject, promote-to-component, iron-law-level) for a
//     safety-critical approve/merge gate is not something this phase did
//     with enough confidence to ship. Reality validation may remove a
//     candidate area without a new decision; this is that removal,
//     recorded plainly rather than guessed past.

export const MANIFEST = [
  // -- src/intake/** (plan candidate area 1) --
  { id: 'intake-classify', pattern: 'src/intake/classify.mjs', directTests: ['test/intake/classify.test.mjs'], boundaryTests: [] },
  { id: 'intake-discovery', pattern: 'src/intake/discovery.mjs', directTests: ['test/intake/discovery.test.mjs'], boundaryTests: [] },
  { id: 'intake-plan', pattern: 'src/intake/plan.mjs', directTests: ['test/intake/plan.test.mjs'], boundaryTests: [] },
  { id: 'intake-plan-verdict-from-plan-md', pattern: 'src/intake/plan-verdict-from-plan-md.mjs', directTests: ['test/intake/plan-verdict-from-plan-md.test.mjs'], boundaryTests: [] },
  // No direct test file exists for these two; each has real boundary
  // coverage located by grep, not guessed.
  { id: 'intake-risk-keywords', pattern: 'src/intake/risk-keywords.mjs', directTests: [], boundaryTests: ['test/evolve/iron-law.test.mjs'] },
  { id: 'intake-verify-pattern-check', pattern: 'src/intake/verify-pattern-check.mjs', directTests: [], boundaryTests: ['test/intake/plan.test.mjs', 'test/state/discover-verdict-override.test.mjs', 'test/intake/judge-verify-second-pass-stability.test.mjs'] },

  // -- src/report/** (plan candidate area 2) --
  { id: 'report-authoritative-match', pattern: 'src/report/authoritative-match.mjs', directTests: ['test/report/authoritative-match.test.mjs'], boundaryTests: [] },
  { id: 'report-capability-plan-lint', pattern: 'src/report/capability-plan-lint.mjs', directTests: ['test/report/capability-plan-lint.test.mjs'], boundaryTests: [] },
  { id: 'report-context-render', pattern: 'src/report/context-render.mjs', directTests: ['test/report/context-render.test.mjs'], boundaryTests: [] },
  { id: 'report-decision-index', pattern: 'src/report/decision-index.mjs', directTests: ['test/report/decision-index.test.mjs'], boundaryTests: [] },
  { id: 'report-enduser-index', pattern: 'src/report/enduser-index.mjs', directTests: ['test/report/enduser-index.test.mjs'], boundaryTests: [] },
  { id: 'report-entropy', pattern: 'src/report/entropy.mjs', directTests: ['test/report/entropy.test.mjs'], boundaryTests: [] },
  { id: 'report-frontmatter', pattern: 'src/report/frontmatter.mjs', directTests: ['test/report/frontmatter.test.mjs'], boundaryTests: [] },
  { id: 'report-knowledge-resolver', pattern: 'src/report/knowledge-resolver.mjs', directTests: ['test/report/knowledge-resolver.test.mjs'], boundaryTests: [] },
  { id: 'report-dispatch-confidence', pattern: 'src/report/dispatch-confidence.mjs', directTests: [], boundaryTests: ['test/runner/dispatch.test.mjs'] },
  { id: 'report-enduser-index-generate', pattern: 'src/report/enduser-index-generate.mjs', directTests: [], boundaryTests: ['test/report/enduser-index.test.mjs'] },
  { id: 'report-knowledge-projection', pattern: 'src/report/knowledge-projection.mjs', directTests: [], boundaryTests: ['test/setup/knowledge-doctor.test.mjs'] },
  // src/report/item-trace.mjs intentionally NOT listed: no direct or
  // boundary test located. Falls through to unknown -> full.

  // -- src/state/** leaf modules only (plan candidate area 3) --
  { id: 'state-awaiting-context', pattern: 'src/state/awaiting-context.mjs', directTests: ['test/state/awaiting-context.test.mjs'], boundaryTests: [] },
  { id: 'state-cleanup-harness', pattern: 'src/state/cleanup-harness.mjs', directTests: ['test/state/cleanup-harness.test.mjs'], boundaryTests: [] },
  { id: 'state-cleanup-pool', pattern: 'src/state/cleanup-pool.mjs', directTests: ['test/state/cleanup-pool.test.mjs'], boundaryTests: [] },
  { id: 'state-cursor', pattern: 'src/state/cursor.mjs', directTests: ['test/state/cursor.test.mjs'], boundaryTests: [] },
  { id: 'state-dep-graph', pattern: 'src/state/dep-graph.mjs', directTests: ['test/state/dep-graph.test.mjs'], boundaryTests: [] },
  { id: 'state-discover-pool', pattern: 'src/state/discover-pool.mjs', directTests: ['test/state/discover-pool.test.mjs'], boundaryTests: [] },
  { id: 'state-drift-status', pattern: 'src/state/drift-status.mjs', directTests: ['test/state/drift-status.test.mjs'], boundaryTests: [] },
  { id: 'state-handoff', pattern: 'src/state/handoff.mjs', directTests: ['test/state/handoff.test.mjs'], boundaryTests: [] },
  { id: 'state-plan-pool', pattern: 'src/state/plan-pool.mjs', directTests: ['test/state/plan-pool.test.mjs'], boundaryTests: [] },
  { id: 'state-porting', pattern: 'src/state/porting.mjs', directTests: ['test/state/porting.test.mjs'], boundaryTests: [] },
  { id: 'state-porting-store', pattern: 'src/state/porting-store.mjs', directTests: ['test/state/porting-store.test.mjs'], boundaryTests: [] },
  { id: 'state-postland-drift', pattern: 'src/state/postland-drift.mjs', directTests: ['test/state/postland-drift.test.mjs'], boundaryTests: [] },
  { id: 'state-priority-formula', pattern: 'src/state/priority-formula.mjs', directTests: ['test/state/priority-formula.test.mjs'], boundaryTests: [] },
  { id: 'state-retro-pool', pattern: 'src/state/retro-pool.mjs', directTests: ['test/state/retro-pool.test.mjs'], boundaryTests: [] },
  { id: 'state-retrospective-doors', pattern: 'src/state/retrospective-doors.mjs', directTests: ['test/state/retrospective-doors.test.mjs'], boundaryTests: [] },
  { id: 'state-tool-registry', pattern: 'src/state/tool-registry.mjs', directTests: ['test/state/tool-registry.test.mjs'], boundaryTests: [] },
];

// Explicit full-trigger rules (plan's day-one list). Prefix-matched, each
// with its own id/reason so --explain can say WHY a path escalated rather
// than just "unmatched". Functionally any of these paths would already
// fall through to the same full-suite fallback as a genuinely unknown
// path (default-deny); naming them here is purely for audit clarity.
export const FULL_TRIGGERS = [
  { id: 'bin-entry', prefix: 'bin/', reason: 'CLI/Rust-host entry surface' },
  { id: 'test-select-scripts', prefix: 'scripts/', reason: 'the runner/canary/selector scripts and their own tooling' },
  { id: 'ownership-manifest', exact: 'test/test-ownership.mjs', reason: 'the ownership manifest itself' },
  { id: 'cli-shared-harness', prefix: 'test/cli/helpers/', reason: 'shared CLI/setup test harness' },
  { id: 'package-manifest', exact: 'package.json', reason: 'package manifest' },
  { id: 'package-lock', exact: 'package-lock.json', reason: 'lockfile' },
  { id: 'ci-workflows', prefix: '.github/', reason: 'CI configuration' },
  { id: 'state-shared-core', prefix: 'src/state/', reason: 'default for any src/state/** file not explicitly leaf-mapped in the manifest -- events/store/replay/envelope/work/frontier/etc. and anything new all stay full by default' },
  { id: 'verbs-merge', prefix: 'src/verbs/merge/', reason: 'excluded from this pilot -- boundary-test mapping for the approve/merge gate was not completed with confidence' },
  { id: 'setup-registry', prefix: 'src/setup/', reason: 'install/setup/doctor config-merge and check registry' },
  { id: 'core-projection', prefix: 'core/', reason: 'generated/projection relationships not fully mapped' },
  { id: 'domains-projection', prefix: 'domains/', reason: 'generated/projection relationships not fully mapped' },
  { id: 'agents-projection', prefix: '.agents/', reason: 'generated/projection relationships not fully mapped' },
  { id: 'plugins-projection', prefix: 'plugins/', reason: 'generated/projection relationships not fully mapped' },
  { id: 'rust-host-apps', prefix: 'apps/', reason: 'Rust host binaries (fgos/fgctl) and cross-language route descriptors' },
  { id: 'rust-host-packages', prefix: 'packages/', reason: 'Rust host runtime/distribution crates' },
  { id: 'rust-host-cargo', exact: 'Cargo.toml', reason: 'Rust workspace manifest' },
  { id: 'rust-host-cargo-lock', exact: 'Cargo.lock', reason: 'Rust workspace lockfile' },
  { id: 'components', prefix: 'components/', reason: 'packaging/distribution components' },
];
