//! Owning proof of how the effective value is judged against the section schemas (wiring of
//! `Schemas::validate`): section lookup, paths, `required` on the merged value, null, sorted output
//! and no input value in a finding. Keyword semantics are proven in `validator_acceptance.rs`.
mod common;

use common::{cases, files, refs};
use fgos_config::schema::Schemas;
use fgos_yaml_doc::path::format_path;
use fgos_yaml_doc::{parse, Profile};

fn found(schemas: &Schemas, effective: &str) -> Vec<(String, String)> {
    let doc = parse(
        effective.as_bytes(),
        Profile::StrictConfig,
        "effective.yaml",
    )
    .unwrap();
    let violations = schemas.validate(doc.value()).unwrap();
    violations
        .into_iter()
        .map(|v| (format_path(&v.path), v.keyword))
        .collect()
}

#[test]
fn validate_cases() {
    for case in cases("validate.v1.json") {
        let (id, input) = (case["id"].as_str().unwrap(), &case["input"]);
        let schema_files = files(&input["schemas"], true);
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let want: Vec<(String, String)> = case["expect"]["violations"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| (v[0].as_str().unwrap().into(), v[1].as_str().unwrap().into()))
            .collect();
        assert_eq!(
            found(&schemas, &common::text(&input["effective"])),
            want,
            "{id}"
        );
    }
}

#[test]
fn a_violation_carries_no_value_of_the_input() {
    let schema_files = files(
        &serde_json::json!({"s": ["properties:", "  a: {type: integer, pattern: '^x'}"]}),
        true,
    );
    let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
    let doc = parse(
        b"s:\n  a: sentinel-7c1e\n",
        Profile::StrictConfig,
        "effective.yaml",
    )
    .unwrap();
    let violations = schemas.validate(doc.value()).unwrap();
    assert!(!violations.is_empty());
    assert!(!format!("{violations:?}").contains("sentinel-7c1e"));
}

/// Each rule the runner schema owns, as the refusal it gives: type, enum, range, required and unknown-key
/// rules that no Node code repeats. A case with no refusal is a shape the schema must keep accepting.
const RUNNER_CASES: &[(&str, &str, &[(&str, &str)])] = &[
    ("executor keeps keys the schema does not name", "executors:\n  x:\n    kind: agent\n    capability: legacy\n", &[]),
    ("default executor adapter is a registered one", "executor:\n  command: node\n  args: []\n  adapter: nope\n", &[("runner.executor.adapter", "enum")]),
    ("executor adapter is a registered one", "executors:\n  x:\n    kind: agent\n    adapter: nope\n", &[("runner.executors.x.adapter", "enum")]),
    ("executor kind is agent or tool", "executors:\n  x:\n    kind: task\n", &[("runner.executors.x.kind", "enum")]),
    ("executor command comes with args", "executors:\n  x:\n    kind: agent\n    command: node\n", &[("runner.executors.x.args", "required")]),
    ("executor command is not blank", "executors:\n  x:\n    kind: agent\n    command: ' '\n    args: []\n", &[("runner.executors.x.command", "pattern")]),
    ("executor env names are not empty", "executors:\n  x:\n    kind: agent\n    env:\n      '': v\n", &[("runner.executors.x.env", "propertyNames")]),
    ("executor env values are strings", "executors:\n  x:\n    kind: agent\n    env:\n      A: 1\n", &[("runner.executors.x.env.A", "type")]),
    ("permission mode is ask or bypass", "executors:\n  x:\n    kind: agent\n    permissionMode: yolo\n", &[("runner.executors.x.permissionMode", "enum")]),
    ("prompt delivery is file-pointer or inline", "executors:\n  x:\n    kind: agent\n    promptDelivery: telepathy\n", &[("runner.executors.x.promptDelivery", "enum")]),
    ("carries is user-text or repo-content", "executors:\n  x:\n    kind: agent\n    carries: secrets\n", &[("runner.executors.x.carries", "enum")]),
    ("for lists capability names", "executors:\n  x:\n    kind: tool\n    for: []\n", &[("runner.executors.x.for", "minItems")]),
    ("identity names all four fields", "executors:\n  x:\n    kind: agent\n    identity:\n      principalRef: p\n", &[("runner.executors.x.identity.egressClass", "required"), ("runner.executors.x.identity.runtimeBackendRef", "required"), ("runner.executors.x.identity.trustDomain", "required")]),
    ("supports reasoning effort is a known level", "executors:\n  x:\n    kind: agent\n    supports:\n      reasoningEffort: [low, extreme]\n", &[("runner.executors.x.supports.reasoningEffort[1]", "enum")]),
    ("supports lists are not empty", "executors:\n  x:\n    kind: agent\n    supports:\n      skills: []\n      providerFamilies: []\n", &[("runner.executors.x.supports.providerFamilies", "minItems"), ("runner.executors.x.supports.skills", "minItems")]),
    ("supports system prompt is a boolean", "executors:\n  x:\n    kind: agent\n    supports:\n      systemPrompt: 'yes'\n", &[("runner.executors.x.supports.systemPrompt", "type")]),
    ("invocations are not empty", "executors:\n  x:\n    kind: agent\n    invocations: []\n", &[("runner.executors.x.invocations", "minItems")]),
    ("invocation via is cli, task or mcp", "executors:\n  x:\n    kind: agent\n    invocations:\n      - via: api\n", &[("runner.executors.x.invocations[0].via", "enum")]),
    ("cli invocation names command and args", "executors:\n  x:\n    kind: agent\n    invocations:\n      - via: cli\n", &[("runner.executors.x.invocations[0].args", "required"), ("runner.executors.x.invocations[0].command", "required")]),
    ("mcp invocation names its identifier", "executors:\n  x:\n    kind: tool\n    invocations:\n      - via: mcp\n", &[("runner.executors.x.invocations[0].command", "required")]),
    ("task invocation names neither", "executors:\n  x:\n    kind: agent\n    invocations:\n      - via: task\n", &[]),
    ("invocation id is not blank", "executors:\n  x:\n    kind: agent\n    invocations:\n      - via: task\n        id: ''\n", &[("runner.executors.x.invocations[0].id", "pattern")]),
    ("mcp tools map to non-blank identifiers", "executors:\n  x:\n    kind: tool\n    invocations:\n      - via: mcp\n        command: c\n        tools:\n          t: ''\n", &[("runner.executors.x.invocations[0].tools.t", "pattern")]),
    ("live output names its flags and renderer", "executors:\n  x:\n    kind: agent\n    invocations:\n      - via: task\n        liveOutput:\n          renderer: r\n", &[("runner.executors.x.invocations[0].liveOutput.streamFlags", "required")]),
    ("confinement keys are the flags, backend and policy parts", "executors:\n  x:\n    kind: agent\n    confinement:\n      sessionName: s\n", &[("runner.executors.x.confinement", "additionalProperties")]),
    ("confinement flags are booleans", "executors:\n  x:\n    kind: agent\n    confinement:\n      privateHome: 'yes'\n", &[("runner.executors.x.confinement.privateHome", "type")]),
    ("invocation confinement keys are the same", "executors:\n  x:\n    kind: agent\n    invocations:\n      - via: task\n        confinement:\n          sessionName: s\n", &[("runner.executors.x.invocations[0].confinement", "additionalProperties")]),
    ("interactive mode names its exit command", "executors:\n  x:\n    kind: agent\n    interactiveMode:\n      exitCommand: ''\n", &[("runner.executors.x.interactiveMode.exitCommand", "pattern")]),
    ("interactive mode kind is a lowercase name", "executors:\n  x:\n    kind: agent\n    interactiveMode:\n      exitCommand: /exit\n      kind: Claude\n", &[("runner.executors.x.interactiveMode.kind", "pattern")]),
    ("interactive mode trust store is a known kind or null", "executors:\n  x:\n    kind: agent\n    interactiveMode:\n      exitCommand: /exit\n      trustStore:\n        kind: nonesuch\n", &[("runner.executors.x.interactiveMode.trustStore.kind", "enum")]),
    ("interactive mode keeps a null trust store and a known kind", "executors:\n  x:\n    kind: agent\n    interactiveMode:\n      exitCommand: /exit\n      trustStore: null\n      kind: agy\n", &[]),
    ("capability keys are the ones the schema names", "capabilities:\n  foo:\n    overrides: 1\n    unconfined: true\n", &[("runner.capabilities.foo", "additionalProperties")]),
    ("capability description is not blank", "capabilities:\n  foo:\n    description: '  '\n", &[("runner.capabilities.foo.description", "pattern")]),
    ("capability aliases are non-blank strings", "capabilities:\n  foo:\n    aliases: ['']\n", &[("runner.capabilities.foo.aliases[0]", "pattern")]),
    ("capability rigor is a known rigor", "capabilities:\n  foo:\n    rigor: extreme\n", &[("runner.capabilities.foo.rigor", "enum")]),
    ("capability min checkers are checker seats", "capabilities:\n  foo:\n    minCheckers: [reviewer, intern]\n", &[("runner.capabilities.foo.minCheckers[1]", "enum")]),
    ("capability tier is a tier of the ladder", "capabilities:\n  foo:\n    tier: giant\n    maxTier: giant\n", &[("runner.capabilities.foo.maxTier", "enum"), ("runner.capabilities.foo.tier", "enum")]),
    ("capability serves is an object", "capabilities:\n  foo:\n    serves: change\n", &[("runner.capabilities.foo.serves", "type")]),
    ("capability serves keys are the demand facts", "capabilities:\n  foo:\n    serves:\n      size: heavy\n", &[("runner.capabilities.foo.serves", "additionalProperties")]),
    ("capability serves booleans are booleans", "capabilities:\n  foo:\n    serves:\n      mutates: 'true'\n", &[("runner.capabilities.foo.serves.mutates", "type")]),
    ("capability serves strings are not blank", "capabilities:\n  foo:\n    serves:\n      outputKind: ''\n", &[("runner.capabilities.foo.serves.outputKind", "pattern")]),
    ("capability serves lists are not empty", "capabilities:\n  foo:\n    serves:\n      domain: []\n", &[("runner.capabilities.foo.serves.domain", "minItems")]),
    ("capability serves takes a scalar or a list", "capabilities:\n  foo:\n    serves:\n      outputKind: [finding, verification]\n      mutates: false\n", &[]),
    ("capability roles are the five roles", "capabilities:\n  foo:\n    roles:\n      boss:\n        tier: standard\n", &[("runner.capabilities.foo.roles", "additionalProperties")]),
    ("seat taste keys are tier and prefer", "capabilities:\n  foo:\n    seats:\n      s:\n        speed: fast\n", &[("runner.capabilities.foo.seats.s", "additionalProperties")]),
    ("prefer is not empty", "capabilities:\n  foo:\n    prefer: []\n", &[("runner.capabilities.foo.prefer", "minItems")]),
    ("prefer entry keys are executor, invocation and crossProvider", "capabilities:\n  foo:\n    prefer:\n      - executor: x\n        weight: 2\n", &[("runner.capabilities.foo.prefer[0]", "additionalProperties")]),
    ("prefer entry names an executor", "capabilities:\n  foo:\n    prefer:\n      - invocation: i\n", &[("runner.capabilities.foo.prefer[0].executor", "required")]),
    ("prefer takes an id, a list of ids or a list of objects", "capabilities:\n  foo:\n    prefer: x\n  bar:\n    prefer: [x, {executor: y, invocation: i, crossProvider: true}]\n", &[]),
    ("model policy tiers are the ladder", "modelPolicies:\n  claude:\n    giant: x\n", &[("runner.modelPolicies.claude", "additionalProperties")]),
    ("model policy cell is a model, model@pool, an object or a list", "modelPolicies:\n  claude:\n    nano: ''\n    mini: []\n    standard: {pool: p}\n    advanced: {model: m, effort: extreme}\n", &[("runner.modelPolicies.claude.advanced", "oneOf"), ("runner.modelPolicies.claude.advanced.effort", "enum"), ("runner.modelPolicies.claude.mini", "oneOf"), ("runner.modelPolicies.claude.nano", "oneOf"), ("runner.modelPolicies.claude.standard", "oneOf")]),
    ("model policy cell accepts every form", "modelPolicies:\n  claude:\n    nano: haiku\n    mini: haiku@vertex\n    standard: {model: sonnet, pool: p, effort: high}\n    advanced: [sonnet, opus@p]\n", &[]),
    ("tier fallback tiers are the ladder", "tierFallback:\n  giant: [claude]\n", &[("runner.tierFallback", "additionalProperties")]),
    ("tier fallback lists are not empty and repeat no family", "tierFallback:\n  nano: []\n  mini: [claude, claude]\n", &[("runner.tierFallback.mini", "uniqueItems"), ("runner.tierFallback.nano", "minItems")]),
    ("defaults name only a tier", "defaults:\n  tier: giant\n  speed: fast\n", &[("runner.defaults", "additionalProperties"), ("runner.defaults.tier", "enum")]),
    ("max tier is a tier of the ladder", "maxTier: giant\n", &[("runner.maxTier", "enum")]),
    ("run timeout is positive", "timeoutMs: 0\n", &[("runner.timeoutMs", "exclusiveMinimum")]),
    ("run timeout stays under the ceiling", "timeoutMs: 14400001\n", &[("runner.timeoutMs", "maximum")]),
    ("run timeout is a number", "timeoutMs: soon\n", &[("runner.timeoutMs", "type")]),
    ("idle timeout is positive", "idleTimeoutMs: -1\n", &[("runner.idleTimeoutMs", "exclusiveMinimum")]),
    ("parallel limits are positive integers", "parallel:\n  maxRoots: 0\n  maxLeavesPerRoot: 1.5\n", &[("runner.parallel.maxLeavesPerRoot", "type"), ("runner.parallel.maxRoots", "minimum")]),
    ("runner confinement names only strict", "confinement:\n  strict: 'yes'\n  mode: x\n", &[("runner.confinement", "additionalProperties"), ("runner.confinement.strict", "type")]),
    ("loop names are the four loops", "loops:\n  unknown: {}\n", &[("runner.loops", "additionalProperties")]),
    ("reviewed rounds are a positive integer", "loops:\n  reviewed:\n    maxRounds: 0\n", &[("runner.loops.reviewed.maxRounds", "minimum")]),
    ("reviewed checkers are checker seats of known rigors", "loops:\n  reviewed:\n    checkersByRigor:\n      extreme: [reviewer]\n      low: [reviewer, intern]\n", &[("runner.loops.reviewed.checkersByRigor", "additionalProperties"), ("runner.loops.reviewed.checkersByRigor.low[1]", "enum")]),
    ("loop bounds are integers with a min and a max only", "loops:\n  reviewed:\n    bounds:\n      maxRounds: {min: 1.5, max: many, step: 2}\n", &[("runner.loops.reviewed.bounds.maxRounds", "additionalProperties"), ("runner.loops.reviewed.bounds.maxRounds.max", "type"), ("runner.loops.reviewed.bounds.maxRounds.min", "type")]),
    ("seat binding marker is version 1 or 2", "patterns:\n  seatBinding:\n    schema: 3\n    extra: 1\n", &[("runner.patterns.seatBinding", "additionalProperties"), ("runner.patterns.seatBinding.schema", "enum")]),
    ("pattern keys are promise, loop, defaults and invariants", "patterns:\n  mine:\n    loop: solo\n    extra: true\n", &[("runner.patterns.mine", "additionalProperties")]),
    ("pattern loop is one of the four loops", "patterns:\n  mine:\n    loop: unknown\n", &[("runner.patterns.mine.loop", "enum")]),
    ("pattern promise is not blank", "patterns:\n  mine:\n    promise: ' '\n", &[("runner.patterns.mine.promise", "pattern")]),
    ("pattern defaults are the loop parameters", "patterns:\n  mine:\n    defaults:\n      maxRounds: 0\n      minCheckers: [intern]\n      rebuttal: 'yes'\n      extra: 1\n", &[("runner.patterns.mine.defaults", "additionalProperties"), ("runner.patterns.mine.defaults.maxRounds", "minimum"), ("runner.patterns.mine.defaults.minCheckers[0]", "enum"), ("runner.patterns.mine.defaults.rebuttal", "type")]),
    ("pattern default rounds are an integer", "patterns:\n  mine:\n    defaults:\n      maxRounds: 1.5\n", &[("runner.patterns.mine.defaults.maxRounds", "type")]),
    ("pattern role tasks are not blank", "patterns:\n  mine:\n    defaults:\n      roleTasks:\n        producer: ' '\n", &[("runner.patterns.mine.defaults.roleTasks.producer", "pattern")]),
    ("pattern seats name a seat and a role", "patterns:\n  mine:\n    defaults:\n      seats:\n        - seat: a\n          role: bogus\n", &[("runner.patterns.mine.defaults.seats[0].role", "enum")]),
    ("pattern invariant declares exactly one of atLeast and fixed", "patterns:\n  mine:\n    invariants:\n      minCheckers: {atLeast: [reviewer], fixed: [reviewer]}\n      seats: {}\n", &[("runner.patterns.mine.invariants.minCheckers", "oneOf"), ("runner.patterns.mine.invariants.seats", "oneOf")]),
    ("pattern invariant names only atLeast and fixed", "patterns:\n  mine:\n    invariants:\n      minCheckers: {atLeast: [reviewer], other: 1}\n", &[("runner.patterns.mine.invariants.minCheckers", "additionalProperties")]),
    ("pattern invariant atLeast lists non-blank elements", "patterns:\n  mine:\n    invariants:\n      minCheckers: {atLeast: ['']}\n", &[("runner.patterns.mine.invariants.minCheckers.atLeast[0]", "pattern")]),
    ("generated path entry names from and also only", "generatedPaths:\n  - from: core\n    also: [x]\n    extra: 1\n", &[("runner.generatedPaths[0]", "additionalProperties")]),
    ("generated path entry names a non-empty also", "generatedPaths:\n  - from: core\n    also: []\n  - from: core\n", &[("runner.generatedPaths[0].also", "minItems"), ("runner.generatedPaths[1].also", "required")]),
    ("generated paths are a list", "generatedPaths: core\n", &[("runner.generatedPaths", "type")]),
];

#[test]
fn runner_schema_refuses_the_shapes_node_no_longer_checks() {
    let (schemas, _) = Schemas::bundled().unwrap();
    let mut wrong = Vec::new();
    for (id, runner, want) in RUNNER_CASES {
        let body: String = runner.lines().map(|l| format!("  {l}\n")).collect();
        let found = found(&schemas, &format!("runner:\n{body}"));
        let want: Vec<(String, String)> = want
            .iter()
            .map(|(p, k)| ((*p).into(), (*k).into()))
            .collect();
        if found != want {
            wrong.push(format!("{id}: got {found:?}, want {want:?}"));
        }
    }
    assert!(wrong.is_empty(), "{}", wrong.join("\n"));
}
