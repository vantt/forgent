//! The Assignment builder: ids, the declared and inline shapes, the prompt a worker is given, the read-only
//! classification and the Unit-run assignment. Values are `serde_json::Value`, built in the key order the Node
//! builder wrote, so a record this module writes reads back byte-for-byte the same in the previous release.
//!
//! Two seams stay outside it, named by ports: the execution contract validator (`ContractPort`) and the operation
//! prompt template / persona renderers (`PromptPort`). A caller that has no template or persona hands the null port.

use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

use fgos_host_runtime::civil_time::format_unix_millis_rfc3339;
use serde_json::{json, Map, Value};

use super::normalizer::{stamp_declared_assignment, stamp_inline_assignment, NORMALIZER_VERSION};
use super::work_item_input::{refuse_work_item_input, WORK_ITEM_KEYS};
use super::{js_str, present, truthy, Refusal};
use crate::run_result::claim::{claim_report_path, render_agent_result_claim_instructions};

/// Version of the execution contract policy the stamp records (`CONTRACT_POLICY_VERSION`).
pub const CONTRACT_POLICY_VERSION: &str = "1";
const MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS: usize = 8;
const INLINE_PARAM_WHITELIST: [&str; 4] = ["provenance", "workId", "createdBy", "options"];

/// The execution contract validator, owned by the `contract` module.
pub trait ContractPort {
    /// Validates an inline contract and its caller; the refusal is the validator's own.
    fn validate(&self, contract: &Value, caller: &Value) -> Result<(), Refusal>;
    /// Whether the contract's constraints carry the engine-reserved protocol-operation stamp.
    fn carries_protocol_stamp(&self, contract: &Value) -> bool;
}

/// What the operation prompt template and the persona renderers return.
pub trait PromptPort {
    /// The rendered body of the assignment's `contractTemplate`, when it resolves.
    fn render_operation_prompt(
        &self,
        assignment: &Value,
        options: &PromptOptions,
    ) -> Result<String, Refusal>;
    /// The delimited persona block lines for a persona reference.
    fn persona_section(
        &self,
        persona: &str,
        pinned_text: Option<&str>,
        project_root: &Path,
    ) -> Vec<String>;
}

/// A prompt port for a caller whose assignments carry no template and no persona.
pub struct NoPromptSeams;

impl PromptPort for NoPromptSeams {
    fn render_operation_prompt(
        &self,
        assignment: &Value,
        _: &PromptOptions,
    ) -> Result<String, Refusal> {
        Err(Refusal::new(format!(
            "assignment {} names a contractTemplate but no template renderer is wired",
            js_str(assignment.get("assignmentId"))
        )))
    }
    fn persona_section(&self, _: &str, _: Option<&str>, _: &Path) -> Vec<String> {
        Vec::new()
    }
}

/// The domain harness seam of an inline build: `(contract) -> (contract, policy)`.
pub type DomainHarness<'a> = &'a dyn Fn(&Value) -> Result<(Value, Option<Value>), Refusal>;

#[derive(Default)]
pub struct BuildOptions<'a> {
    pub existing_ids: Vec<String>,
    pub assignments_dir: Option<PathBuf>,
    pub created_at: Option<String>,
    pub repo_root: Option<PathBuf>,
    pub allow_synthetic_compatibility_operation: bool,
    pub domain_harness: Option<DomainHarness<'a>>,
}

#[derive(Default)]
pub struct PromptOptions {
    /// The root a task-spec path is resolved against (the task-spec line stays repo-relative without one).
    pub cwd: Option<PathBuf>,
    pub repo_root: Option<PathBuf>,
    pub run_dir: Option<String>,
    /// `{ value, pinnedText? }` of a resolved persona.
    pub persona: Option<Value>,
    pub effective_contract: Option<Value>,
}

fn sanitize_token(token: &str) -> String {
    token
        .chars()
        .flat_map(|c| c.to_lowercase())
        .map(|c| {
            if c.is_ascii_lowercase() || c.is_ascii_digit() {
                c
            } else {
                '_'
            }
        })
        .collect()
}

/// `parseInt(text, 10)`: the leading digits, or none.
fn parse_leading_int(text: &str) -> Option<u64> {
    let text = text.trim_start_matches(super::js_space);
    let digits: String = text.chars().take_while(char::is_ascii_digit).collect();
    digits.parse().ok()
}

/// `asgn_<safe-work>_<safe-op>_<seq>`: falls back to the caller's writer id, then `nowork`, without a work id.
pub fn create_assignment_id(
    work_id: Option<&str>,
    stage: Option<&str>,
    operation: Option<&str>,
    caller_writer_id: Option<&str>,
    existing_ids: &[String],
    assignments_dir: Option<&Path>,
) -> String {
    let safe_work = match (
        work_id.filter(|w| !w.is_empty()),
        caller_writer_id.filter(|w| !w.is_empty()),
    ) {
        (Some(work), _) => sanitize_token(work),
        (None, Some(writer)) => sanitize_token(writer),
        (None, None) => "nowork".to_string(),
    };
    let op_source = operation
        .filter(|o| !o.is_empty())
        .or(stage.filter(|s| !s.is_empty()))
        .unwrap_or("op");
    let prefix = format!("asgn_{safe_work}_{}_", sanitize_token(op_source));
    let mut existing: Vec<String> = existing_ids.to_vec();
    if let Some(dir) = assignments_dir {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.starts_with(&prefix) {
                        existing.push(name.to_string());
                    }
                }
            }
        }
    }
    let max_seq = existing
        .iter()
        .filter_map(|id| id.strip_prefix(&prefix).and_then(parse_leading_int))
        .max()
        .unwrap_or(0);
    let mut next = max_seq + 1;
    let mut candidate = format!("{prefix}{next:03}");
    if let Some(dir) = assignments_dir {
        while dir.join(&candidate).exists() {
            next += 1;
            candidate = format!("{prefix}{next:03}");
        }
    }
    candidate
}

/// Reserves a collision-free id by creating its directory (atomic: `create_dir` fails when it exists). The
/// assignments directory is created only after the first legal candidate, so a refused build leaves no trace.
pub fn claim_assignment_id(
    build_candidate: &mut dyn FnMut() -> Result<Value, Refusal>,
    assignments_dir: &Path,
) -> Result<Value, Refusal> {
    let mut ensured = false;
    for _ in 0..MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS {
        let assignment = build_candidate()?;
        if !ensured {
            fs::create_dir_all(assignments_dir).map_err(|e| {
                Refusal::new(format!(
                    "cannot create \"{}\": {e}",
                    assignments_dir.display()
                ))
            })?;
            ensured = true;
        }
        let id = assignment
            .get("assignmentId")
            .and_then(Value::as_str)
            .unwrap_or_default();
        match fs::create_dir(assignments_dir.join(id)) {
            Ok(()) => return Ok(assignment),
            Err(e) if e.kind() == ErrorKind::AlreadyExists => continue,
            Err(e) => {
                return Err(Refusal::new(format!(
                    "cannot claim assignment id \"{id}\": {e}"
                )))
            }
        }
    }
    Err(Refusal::new(format!(
        "claimAssignmentId could not claim a unique assignmentId under \"{}\" after {MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS} attempts -- persistent assignmentId collisions",
        assignments_dir.display()
    )))
}

/// `domains/<domain>/task-specs/<spec>.md` (or `core/task-specs/`), relative to `root` when given.
pub fn resolve_task_spec_path(domain: Option<&str>, spec_id: &str, root: Option<&Path>) -> String {
    let domain = domain.unwrap_or("coding");
    let filename = if spec_id.ends_with(".md") {
        spec_id.to_string()
    } else {
        format!("{spec_id}.md")
    };
    let relative = if domain == "core" {
        format!("core/task-specs/{filename}")
    } else {
        format!("domains/{domain}/task-specs/{filename}")
    };
    match root {
        Some(root) if !root.as_os_str().is_empty() => {
            root.join(relative).to_string_lossy().into_owned()
        }
        _ => relative,
    }
}

fn now_rfc3339() -> String {
    let millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    format_unix_millis_rfc3339(millis, 0).unwrap_or_default()
}

fn text<'a>(params: &'a Value, key: &str) -> Option<&'a str> {
    present(params.get(key)).and_then(Value::as_str)
}

fn strings(value: Option<&Value>) -> Vec<Value> {
    value.and_then(Value::as_array).cloned().unwrap_or_default()
}

/// The operation part of a declared Assignment, shared with a Unit run that carries a declared operation.
pub struct DeclaredFields {
    pub matched_op: Value,
    pub fields: Map<String, Value>,
}

/// What `declared_operation_fields` reads: the step's identity and the operations its Workflow resolved.
pub struct DeclaredRequest<'a> {
    pub domain: &'a str,
    pub workflow: Option<&'a str>,
    pub stage: &'a str,
    pub operation: &'a str,
    pub operations: &'a [Value],
    pub role: Option<&'a str>,
    pub contract_template: Option<&'a str>,
    pub task_spec_root: Option<&'a Path>,
}

pub fn declared_operation_fields(request: &DeclaredRequest) -> Result<DeclaredFields, Refusal> {
    let DeclaredRequest {
        domain,
        workflow,
        stage,
        operation,
        operations,
        role,
        contract_template,
        task_spec_root,
    } = *request;
    let matched = operations
        .iter()
        .find(|o| o.get("id").and_then(Value::as_str) == Some(operation));
    let Some(matched) = matched else {
        let ids: Vec<String> = operations.iter().map(|o| js_str(o.get("id"))).collect();
        return Err(Refusal::new(format!(
            "unknown operation \"{operation}\" for stage \"{stage}\" in domain \"{domain}\" (declared operations: [{}])",
            ids.join(", ")
        )));
    };
    let Some(task_spec) = present(matched.get("taskSpec"))
        .filter(|t| truthy(Some(t)))
        .and_then(Value::as_str)
    else {
        return Err(Refusal::new(format!(
            "operation \"{operation}\" in stage \"{stage}\" declares no taskSpec"
        )));
    };
    if let Some(root) = task_spec_root {
        let abs = resolve_task_spec_path(Some(domain), task_spec, Some(root));
        if !Path::new(&abs).exists() {
            return Err(Refusal::new(format!(
                "operation \"{operation}\" in stage \"{stage}\": taskSpec file does not exist: {abs} \u{2014} refuse runtime dispatch for missing taskSpec"
            )));
        }
    }
    let target_role = role
        .or_else(|| text(matched, "role"))
        .unwrap_or("implementer");
    let template = contract_template
        .or_else(|| present(matched.get("task")).and_then(|t| text(t, "contractTemplate")));
    let op_id = text(matched, "id").unwrap_or(operation);
    let stamped = stamp_declared_assignment(Some(target_role), op_id);
    let mut declared = Map::new();
    declared.insert("domain".into(), json!(domain));
    if let Some(workflow) = workflow.filter(|w| !w.is_empty()) {
        declared.insert("workflow".into(), json!(workflow));
    }
    declared.insert("stage".into(), json!(stage));
    declared.insert("operation".into(), json!(op_id));
    declared.insert("taskSpec".into(), json!(task_spec));
    declared.insert(
        "legalOperations".into(),
        Value::Array(
            operations
                .iter()
                .map(|o| o.get("id").cloned().unwrap_or(Value::Null))
                .collect(),
        ),
    );
    let mut fields = Map::new();
    fields.insert("domain".into(), json!(domain));
    if let Some(workflow) = workflow.filter(|w| !w.is_empty()) {
        fields.insert("workflow".into(), json!(workflow));
    }
    fields.insert("stage".into(), json!(stage));
    fields.insert("operation".into(), json!(op_id));
    fields.insert("role".into(), json!(target_role));
    fields.insert(
        "dispatch".into(),
        present(matched.get("dispatch"))
            .cloned()
            .unwrap_or(json!("assignment")),
    );
    fields.insert("taskSpec".into(), json!(task_spec));
    fields.insert(
        "skills".into(),
        Value::Array(strings(matched.get("skills"))),
    );
    if let Some(template) = template.filter(|t| !t.is_empty()) {
        fields.insert("contractTemplate".into(), json!(template));
    }
    fields.insert("mutation".into(), json!(stamped.mutation));
    fields.insert("evidence".into(), stamped.evidence());
    fields.insert("resultKind".into(), json!(stamped.result_kind));
    if let Some(on_advance) = stamped.on_advance {
        fields.insert("onAdvance".into(), json!(on_advance));
    }
    fields.insert("declared".into(), Value::Object(declared));
    Ok(DeclaredFields {
        matched_op: matched.clone(),
        fields,
    })
}

/// Builds an Assignment from one of two shapes: declared (`stage` + `operation`) or inline (`provenance.kind`
/// `inline`). A Work item input is refused.
pub fn build_assignment(
    params: &Value,
    options: &BuildOptions,
    contract: &dyn ContractPort,
) -> Result<Value, Refusal> {
    refuse_work_item_input(params, "buildAssignment()", &WORK_ITEM_KEYS)?;
    let inline = params
        .get("provenance")
        .and_then(|p| p.get("kind"))
        .and_then(Value::as_str)
        == Some("inline");
    if inline {
        let conflicting: Vec<&str> = params
            .as_object()
            .map(|o| {
                o.keys()
                    .map(String::as_str)
                    .filter(|k| !INLINE_PARAM_WHITELIST.contains(k))
                    .collect()
            })
            .unwrap_or_default();
        if !conflicting.is_empty() {
            return Err(Refusal::new(format!(
                "buildAssignment: inline provenance cannot be combined with declared-shape field(s): {}",
                conflicting.join(", ")
            )));
        }
        return build_inline_assignment(params, options, contract);
    }
    build_declared_assignment(params, options)
}

fn build_declared_assignment(params: &Value, options: &BuildOptions) -> Result<Value, Refusal> {
    let stage = text(params, "stage")
        .filter(|s| !s.is_empty())
        .ok_or_else(|| Refusal::new("buildAssignment requires a non-empty stage name"))?;
    let operation = text(params, "operation")
        .filter(|s| !s.is_empty())
        .ok_or_else(|| Refusal::new("buildAssignment requires a non-empty operation id"))?;
    let domain = text(params, "domain").map(str::trim).filter(|d| !d.is_empty()).ok_or_else(|| {
        Refusal::new("buildAssignment requires a non-empty \"domain\" (the caller resolves it from the Work item)")
    })?;
    let operations = params.get("operations").and_then(Value::as_array).ok_or_else(|| {
        Refusal::new("buildAssignment requires \"operations\": the legal operations of the step, resolved from its Workflow by the caller")
    })?;
    let workflow = text(params, "workflow");
    let work_id = text(params, "workId");
    let root = if options.allow_synthetic_compatibility_operation {
        None
    } else {
        Some(
            options
                .repo_root
                .clone()
                .or_else(|| std::env::current_dir().ok())
                .unwrap_or_default(),
        )
    };
    let DeclaredFields { matched_op, fields } = declared_operation_fields(&DeclaredRequest {
        domain,
        workflow,
        stage,
        operation,
        operations,
        role: text(params, "role"),
        contract_template: text(params, "contractTemplate"),
        task_spec_root: root.as_deref(),
    })?;
    let op_id = js_str(matched_op.get("id"));
    let policy_param = present(params.get("policy")).filter(|p| truthy(Some(p)));
    let op_policy = present(matched_op.get("policy")).filter(|p| truthy(Some(p)));
    let merged_policy = if op_policy.is_some() || policy_param.is_some() {
        let mut combined = Map::new();
        for source in [op_policy, policy_param].into_iter().flatten() {
            if let Some(object) = source.as_object() {
                for (key, value) in object {
                    combined.insert(key.clone(), value.clone());
                }
            }
        }
        let yaml_model = op_policy.is_some_and(|p| truthy(p.get("model")));
        if yaml_model && !policy_param.is_some_and(|p| truthy(p.get("model"))) {
            combined.insert("_fromYaml".into(), json!(true));
        }
        Some(Value::Object(combined))
    } else {
        None
    };
    let assignment_id = create_assignment_id(
        work_id,
        Some(stage),
        Some(&op_id),
        None,
        &options.existing_ids,
        options.assignments_dir.as_deref(),
    );
    let objective = text(params, "objective")
        .map(str::to_string)
        .unwrap_or_else(|| format!("Execute {stage}.{op_id} operation"));
    let mut expected_outputs = strings(params.get("expectedOutputs"));
    if expected_outputs.is_empty() {
        if operation == "validate-plan" {
            expected_outputs.push(json!(
                "result-1.json (verdict: READY | NOT READY | READY WITH CONSTRAINTS)"
            ));
            expected_outputs.push(json!("report-1.md (reviewer findings and evaluation)"));
        } else if operation == "review-item" {
            expected_outputs.push(json!("result-1.json (verdict: APPROVED | REJECT, evidenceRefs: [candidate diff ref, verify result ref])"));
            expected_outputs.push(json!("report-1.md (reviewer findings and evaluation)"));
        }
    }
    let expected_files: Vec<Value> = strings(params.get("expectedFiles"))
        .into_iter()
        .filter(|f| {
            f.as_str()
                .is_some_and(|s| !s.trim_matches(super::js_space).is_empty())
        })
        .collect();
    let mut validators = vec![json!("workflow-step-legality")];
    if !options.allow_synthetic_compatibility_operation {
        validators.push(json!("task-spec-existence"));
    }
    let reason = text(params, "reason")
        .map(str::to_string)
        .or_else(|| text(&matched_op, "reason").map(str::to_string));

    let mut a = Map::new();
    a.insert("assignmentId".into(), json!(assignment_id));
    a.insert("workId".into(), work_id.map_or(Value::Null, |w| json!(w)));
    a.insert("domain".into(), json!(domain));
    if let Some(workflow) = workflow.filter(|w| !w.is_empty()) {
        a.insert("workflow".into(), json!(workflow));
    }
    a.insert("stage".into(), json!(stage));
    a.insert("operation".into(), json!(op_id));
    a.insert("role".into(), fields["role"].clone());
    a.insert("dispatch".into(), fields["dispatch"].clone());
    a.insert("taskSpec".into(), fields["taskSpec"].clone());
    a.insert("skills".into(), fields["skills"].clone());
    a.insert("objective".into(), json!(objective));
    if let Some(template) = fields.get("contractTemplate") {
        a.insert("contractTemplate".into(), template.clone());
    }
    a.insert(
        "contextRefs".into(),
        Value::Array(strings(params.get("contextRefs"))),
    );
    a.insert("expectedOutputs".into(), Value::Array(expected_outputs));
    a.insert("expectedFiles".into(), Value::Array(expected_files));
    if let Some(reason) = reason.filter(|r| !r.is_empty()) {
        a.insert("reason".into(), json!(reason));
    }
    if let Some(policy) = merged_policy {
        a.insert("policy".into(), policy);
    }
    a.insert(
        "createdAt".into(),
        json!(options.created_at.clone().unwrap_or_else(now_rfc3339)),
    );
    if let Some(created_by) = text(params, "createdBy").filter(|c| !c.is_empty()) {
        a.insert("createdBy".into(), json!(created_by));
    }
    a.insert(
        "provenance".into(),
        json!({
            "kind": "declared",
            "contractPolicyVersion": CONTRACT_POLICY_VERSION,
            "normalizerVersion": NORMALIZER_VERSION,
            "validators": validators,
            "declared": fields["declared"].clone(),
        }),
    );
    a.insert("mutation".into(), fields["mutation"].clone());
    a.insert("evidence".into(), fields["evidence"].clone());
    a.insert("resultKind".into(), fields["resultKind"].clone());
    if let Some(on_advance) = fields.get("onAdvance") {
        a.insert("onAdvance".into(), on_advance.clone());
    }
    Ok(Value::Object(a))
}

fn build_inline_assignment(
    params: &Value,
    options: &BuildOptions,
    port: &dyn ContractPort,
) -> Result<Value, Refusal> {
    let provenance = params.get("provenance").unwrap_or(&Value::Null);
    let raw = provenance.get("contract").cloned().unwrap_or(Value::Null);
    let caller = provenance.get("caller").cloned().unwrap_or(Value::Null);
    port.validate(&raw, &caller)?;
    let mut contract = raw;
    let mut harness_policy: Option<Value> = None;
    if let Some(harness) = options.domain_harness {
        let (enriched, policy) = harness(&contract)?;
        contract = enriched;
        harness_policy = policy;
        port.validate(&contract, &caller)?;
    }
    let stamped = stamp_inline_assignment(&contract, port.carries_protocol_stamp(&contract))?;
    let work_id = text(params, "workId");
    let writer_id = caller.get("writerId").map(|w| js_str(Some(w)));
    let assignment_id = create_assignment_id(
        work_id,
        None,
        None,
        writer_id.as_deref(),
        &options.existing_ids,
        options.assignments_dir.as_deref(),
    );

    let context_refs = Value::Array(strings(contract.get("contextRefs")));
    let expected_outputs = Value::Array(strings(contract.get("expectedOutputs")));
    let mut frozen = Map::new();
    frozen.insert(
        "objective".into(),
        contract.get("objective").cloned().unwrap_or(Value::Null),
    );
    frozen.insert("contextRefs".into(), context_refs.clone());
    frozen.insert(
        "constraints".into(),
        Value::Array(strings(contract.get("constraints"))),
    );
    frozen.insert("expectedOutputs".into(), expected_outputs.clone());
    frozen.insert(
        "mutation".into(),
        contract.get("mutation").cloned().unwrap_or(Value::Null),
    );
    frozen.insert(
        "evidence".into(),
        contract.get("evidence").cloned().unwrap_or(json!({})),
    );
    frozen.insert(
        "role".into(),
        contract.get("role").cloned().unwrap_or(Value::Null),
    );
    frozen.insert(
        "capabilities".into(),
        Value::Array(strings(contract.get("capabilities"))),
    );
    frozen.insert(
        "budget".into(),
        contract.get("budget").cloned().unwrap_or(json!({})),
    );
    for key in ["supports", "contractTemplate", "policy"] {
        if let Some(value) = contract.get(key) {
            frozen.insert(key.into(), value.clone());
        }
    }

    let mut frozen_caller = Map::new();
    frozen_caller.insert(
        "writerId".into(),
        caller.get("writerId").cloned().unwrap_or(Value::Null),
    );
    if let Some(parent) = present(caller.get("parentAssignmentId")).filter(|p| truthy(Some(p))) {
        frozen_caller.insert("parentAssignmentId".into(), parent.clone());
    }
    let coordination = caller.get("coordination");
    let fan_out = coordination
        .and_then(|c| present(c.get("fanOutPayload")))
        .filter(|f| truthy(Some(f)));
    let action = coordination
        .and_then(|c| present(c.get("actionInvocation")))
        .filter(|a| truthy(Some(a)));
    let fan_out_frozen = fan_out.map(|payload| {
        let mut out = payload.as_object().cloned().unwrap_or_default();
        out.insert(
            "expectedOutputs".into(),
            Value::Array(strings(payload.get("expectedOutputs"))),
        );
        out.insert(
            "constraints".into(),
            Value::Array(strings(payload.get("constraints"))),
        );
        if let Some(capabilities) = payload.get("capabilities") {
            out.insert(
                "capabilities".into(),
                Value::Array(strings(Some(capabilities))),
            );
        }
        Value::Object(out)
    });
    if fan_out_frozen.is_some() || action.is_some() {
        let mut coordination_out = Map::new();
        if let Some(fan_out) = fan_out_frozen {
            coordination_out.insert("fanOutPayload".into(), fan_out);
        }
        if let Some(action) = action {
            let steps: Vec<Value> = action
                .get("normalizedSteps")
                .and_then(Value::as_array)
                .map(|steps| {
                    steps
                        .iter()
                        .map(|step| {
                            let mut out = step.as_object().cloned().unwrap_or_default();
                            if let Some(omitted) = step.get("omittedFields") {
                                out.insert(
                                    "omittedFields".into(),
                                    Value::Array(strings(Some(omitted))),
                                );
                            }
                            Value::Object(out)
                        })
                        .collect()
                })
                .unwrap_or_default();
            coordination_out.insert(
                "actionInvocation".into(),
                json!({
                    "actionKey": action.get("actionKey").cloned().unwrap_or(Value::Null),
                    "kind": action.get("kind").cloned().unwrap_or(Value::Null),
                    "normalizedSteps": steps,
                }),
            );
        }
        frozen_caller.insert("coordination".into(), Value::Object(coordination_out));
    }

    let merged_policy = match contract.get("policy").and_then(|p| p.get("tier")) {
        Some(tier) => {
            let mut merged = harness_policy
                .as_ref()
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default();
            merged.insert("tier".into(), tier.clone());
            Some(Value::Object(merged))
        }
        None => harness_policy,
    };

    let mut a = Map::new();
    a.insert("assignmentId".into(), json!(assignment_id));
    a.insert("workId".into(), work_id.map_or(Value::Null, |w| json!(w)));
    a.insert(
        "role".into(),
        contract.get("role").cloned().unwrap_or(Value::Null),
    );
    a.insert("dispatch".into(), json!("assignment"));
    a.insert(
        "objective".into(),
        contract.get("objective").cloned().unwrap_or(Value::Null),
    );
    if let Some(template) = contract.get("contractTemplate") {
        a.insert("contractTemplate".into(), template.clone());
    }
    a.insert("contextRefs".into(), context_refs);
    a.insert("expectedOutputs".into(), expected_outputs);
    a.insert("expectedFiles".into(), json!([]));
    a.insert(
        "createdAt".into(),
        json!(options.created_at.clone().unwrap_or_else(now_rfc3339)),
    );
    if let Some(created_by) = text(params, "createdBy").filter(|c| !c.is_empty()) {
        a.insert("createdBy".into(), json!(created_by));
    }
    if let Some(policy) = merged_policy.filter(|p| truthy(Some(p))) {
        a.insert("policy".into(), policy);
    }
    let validators = if options.domain_harness.is_some() {
        json!(["execution-contract-schema", "domain-harness-seam"])
    } else {
        json!(["execution-contract-schema"])
    };
    a.insert(
        "provenance".into(),
        json!({
            "kind": "inline",
            "contractPolicyVersion": CONTRACT_POLICY_VERSION,
            "normalizerVersion": NORMALIZER_VERSION,
            "validators": validators,
            "inline": { "contract": Value::Object(frozen), "caller": Value::Object(frozen_caller) },
        }),
    );
    a.insert("mutation".into(), stamped["mutation"].clone());
    a.insert("evidence".into(), stamped["evidence"].clone());
    Ok(Value::Object(a))
}

/// A Unit run's mutating seat: its files are committed by the runner, never by the worker.
fn is_runner_committed(assignment: &Value) -> bool {
    assignment
        .get("provenance")
        .and_then(|p| p.get("kind"))
        .and_then(Value::as_str)
        == Some("unit-run")
        && assignment.get("mutation").and_then(Value::as_str) == Some("mutating")
}

/// Read-only or mutating, from the `mutation` stamped once at build time.
pub fn is_read_only_assignment(assignment: &Value) -> bool {
    assignment.is_object()
        && assignment.get("mutation").and_then(Value::as_str) == Some("read-only")
}

fn list_or_none(lines: &mut Vec<String>, label: &str, items: &Value) {
    lines.push(label.to_string());
    match items.as_array().filter(|a| !a.is_empty()) {
        Some(items) => lines.extend(items.iter().map(|i| format!("- {}", js_str(Some(i))))),
        None => lines.push("- (none)".to_string()),
    }
}

/// Renders the standard semantic prompt for a worker; result artifact paths appear when `run_dir` is given.
pub fn render_assignment_prompt(
    assignment: &Value,
    options: &PromptOptions,
    seams: &dyn PromptPort,
) -> Result<String, Refusal> {
    if !assignment.is_object() {
        return Err(Refusal::new(
            "renderAssignmentPrompt requires an assignment object",
        ));
    }
    let root = options
        .repo_root
        .clone()
        .or_else(|| options.cwd.clone())
        .or_else(|| std::env::current_dir().ok())
        .unwrap_or_default();
    let task_spec_rel = present(assignment.get("taskSpec"))
        .filter(|t| truthy(Some(t)))
        .and_then(Value::as_str)
        .map(|spec| {
            resolve_task_spec_path(text(assignment, "domain"), spec, options.cwd.as_deref())
                .replace('\\', "/")
        });
    let persona_ref = options
        .persona
        .as_ref()
        .and_then(|p| p.get("value"))
        .and_then(Value::as_str)
        .filter(|v| !v.trim_matches(super::js_space).is_empty());
    let pinned = options
        .persona
        .as_ref()
        .and_then(|p| p.get("pinnedText"))
        .and_then(Value::as_str);
    let rendered_template = if truthy(assignment.get("contractTemplate")) {
        Some(seams.render_operation_prompt(assignment, options)?)
    } else {
        None
    };
    let work = present(assignment.get("workId"))
        .filter(|w| truthy(Some(w)))
        .map_or("(none)".to_string(), |w| js_str(Some(w)));
    let mut lines = vec![
        format!("Assignment: {}", js_str(assignment.get("assignmentId"))),
        format!("Work: {work}"),
    ];
    if let (Some(stage), Some(operation)) = (
        present(assignment.get("stage")).filter(|s| truthy(Some(s))),
        present(assignment.get("operation")).filter(|s| truthy(Some(s))),
    ) {
        lines.push(format!(
            "Stage operation: {}.{}",
            js_str(Some(stage)),
            js_str(Some(operation))
        ));
    }
    let persona_lines = |lines: &mut Vec<String>| {
        if let Some(persona) = persona_ref {
            lines.extend(seams.persona_section(persona, pinned, &root));
        }
    };
    if let Some(body) = rendered_template {
        persona_lines(&mut lines);
        lines.push(String::new());
        lines.push(body);
    } else {
        lines.push(format!("Role: {}", js_str(assignment.get("role"))));
        if let Some(rel) = task_spec_rel {
            lines.push(format!("Task-spec: {rel}"));
        }
        lines.push(format!(
            "Objective: {}",
            js_str(assignment.get("objective"))
        ));
        persona_lines(&mut lines);
        list_or_none(
            &mut lines,
            "Context refs:",
            assignment.get("contextRefs").unwrap_or(&Value::Null),
        );
        list_or_none(
            &mut lines,
            "Expected outputs:",
            assignment.get("expectedOutputs").unwrap_or(&Value::Null),
        );
    }

    let runner_commits = is_runner_committed(assignment);
    let writes: Vec<String> = assignment
        .get("writes")
        .and_then(Value::as_array)
        .map(|w| w.iter().map(|e| js_str(Some(e))).collect())
        .unwrap_or_default();
    if runner_commits {
        lines.push("Write scope:".into());
        lines.push("- Write only files inside this scope (repo-relative):".into());
        if writes.is_empty() {
            lines.push("  - (none declared: the runner commits nothing)".into());
        } else {
            lines.extend(writes.iter().map(|entry| format!("  - {entry}")));
        }
        lines.push("- Do not run `git add` or `git commit`, even if the task above asks you to: the runner commits after the round passes, and only the files inside the scope.".into());
        lines.push("- The first line of \"summary\" is the commit subject, in conventional form: `type(scope): ...`.".into());
        lines.push("- Need to write a file outside the scope? Do not write it: list it in \"needsWrites\": [<path>, ...] in your result claim and say why in \"summary\".".into());
        lines.push("- Your result files (the claim and its report, named below) are the exception: they sit outside the workspace, writing them is required, and they never go in \"needsWrites\".".into());
    }

    let contract = options
        .effective_contract
        .as_ref()
        .filter(|c| truthy(Some(c)));
    if let Some(run_dir) = &options.run_dir {
        let default_claim = format!(
            "{}/worker-output/outbox/result-1.json",
            run_dir.trim_end_matches('/')
        );
        let result_path = contract
            .and_then(|c| c.get("resultClaim"))
            .and_then(|r| r.get("path"))
            .and_then(Value::as_str)
            .map(str::to_string)
            .unwrap_or_else(|| default_claim.clone());
        let report_path = claim_report_path(&result_path);
        let read_only = is_read_only_assignment(assignment);
        lines.push("Result artifact:".into());
        if read_only {
            lines.push("- This operation is read-only: change nothing in the workspace. Your result files are the exception: they sit outside the workspace and writing them is required, not a breach of read-only.".into());
        }
        lines.push(format!("- Write structured JSON to {result_path}"));
        let context = super::brief::claim_context_of(assignment);
        for instruction in render_agent_result_claim_instructions(&context).split('\n') {
            let tail: String = instruction.chars().skip(2).collect();
            lines.push(format!("  {tail}"));
        }
        lines.push(if read_only {
            format!("- Also write a human-readable report to {report_path} -- REQUIRED for this read-only operation: write one sentence stating what was answered or done; a \"done\" status with no report artifact is treated as unevidenced (no-evidence), not accepted as done.")
        } else {
            format!("- Optional human-readable report: {report_path}")
        });
        lines.push("- Do not call Work lifecycle verbs unless the task-spec explicitly says this Assignment is the lifecycle driver.".into());
    }

    if let Some(ec) = contract {
        let id = ec
            .get("contract")
            .and_then(|c| present(c.get("id")))
            .filter(|v| truthy(Some(v)))
            .map_or("effective-execution-contract".to_string(), |v| {
                js_str(Some(v))
            });
        let version = ec
            .get("contract")
            .and_then(|c| present(c.get("version")))
            .filter(|v| truthy(Some(v)))
            .map_or("1".to_string(), |v| js_str(Some(v)));
        lines.push("Effective execution contract:".into());
        lines.push(format!("- Contract: {id}.v{version}"));
        lines.push(format!("- Mutation: {}", js_str(ec.get("mutation"))));
        let claim = ec
            .get("resultClaim")
            .and_then(|r| r.get("path"))
            .and_then(Value::as_str)
            .filter(|p| !p.is_empty())
            .map(str::to_string)
            .unwrap_or_else(|| match &options.run_dir {
                Some(run_dir) => format!(
                    "{}/worker-output/outbox/result-1.json",
                    run_dir.trim_end_matches('/')
                ),
                None => "(none)".to_string(),
            });
        lines.push(format!("- Claim path: {claim}"));
        let limits = ec.get("limits");
        let timeout = limits
            .and_then(|l| present(l.get("executorTimeoutMs")))
            .or_else(|| limits.and_then(|l| l.get("timeoutMs")));
        lines.push(format!("- Timeout: {}ms", js_str(timeout)));
        let mount: Vec<String> = ec
            .get("workspace")
            .and_then(|w| w.get("writeScope"))
            .and_then(Value::as_array)
            .map(|m| m.iter().map(|e| js_str(Some(e))).collect())
            .unwrap_or_default();
        let scope = if runner_commits && !writes.is_empty() && !mount.is_empty() {
            format!(
                "{} (the workspace mount {} is wider; write only inside the scope)",
                writes.join(", "),
                mount.join(", ")
            )
        } else if !mount.is_empty() {
            mount.join(", ")
        } else {
            "none in the workspace (read-only); your result files are still required".to_string()
        };
        lines.push(format!("- Write scope: {scope}"));
        lines.push(format!(
            "- Permission enforcement: {}",
            present(ec.get("enforcementPosture"))
                .map_or("instructed".to_string(), |v| js_str(Some(v)))
        ));
    }
    Ok(lines.join("\n"))
}

/// `{ personaPin }` for an assignment policy when the persona bound for this seat carries pinned text.
fn pinned_persona_for(unit_record: &Value, seat_id: &str, persona: &Value) -> Option<Value> {
    let hit = unit_record
        .get("overrides")
        .and_then(Value::as_array)
        .and_then(|overrides| {
            overrides.iter().find(|o| {
                truthy(o.get("personaPin"))
                    && o.get("scope")
                        .and_then(|s| s.get("seat"))
                        .and_then(Value::as_str)
                        == Some(seat_id)
                    && o.get("persona") == Some(persona)
            })
        });
    if let Some(hit) = hit {
        return hit.get("personaPin").cloned();
    }
    let pin = unit_record.get("personaPin").filter(|p| truthy(Some(p)))?;
    (pin.get("name") == Some(persona)).then(|| pin.clone())
}

/// The inputs of one attempt of a seat, as `buildUnitRunAssignment`'s second argument.
pub struct SeatAttempt<'a> {
    /// `{ seat, role, posture }`.
    pub seat: &'a Value,
    pub round: &'a Value,
    pub read_only: bool,
    pub bound: &'a Value,
    pub assignment_id: &'a str,
    pub objective: &'a str,
    pub context_refs: &'a Value,
    pub carries_operation: bool,
    pub writes: &'a Value,
}

/// The assignment one attempt of a seat dispatches. `seat` is `{ seat, role, posture }`.
pub fn build_unit_run_assignment(
    unit_record: &Value,
    unit_run_id: &str,
    declared_op: &Value,
    unit: &Value,
    attempt: &SeatAttempt,
) -> Value {
    let (seat, round, read_only) = (attempt.seat, attempt.round, attempt.read_only);
    let carries = attempt.carries_operation;
    let bound = attempt.bound;
    let get = |value: &Value, key: &str| value.get(key).cloned().unwrap_or(Value::Null);
    let mut a = Map::new();
    a.insert("assignmentId".into(), json!(attempt.assignment_id));
    a.insert("unitRunId".into(), json!(unit_run_id));
    a.insert("seat".into(), get(seat, "seat"));
    a.insert(
        "role".into(),
        if carries {
            get(declared_op, "role")
        } else {
            get(seat, "role")
        },
    );
    a.insert("posture".into(), get(seat, "posture"));
    a.insert("round".into(), round.clone());
    if carries {
        let declared = unit_record.get("declared").unwrap_or(&Value::Null);
        a.insert("workId".into(), get(declared, "workId"));
        if truthy(declared.get("title")) {
            a.insert("title".into(), get(declared, "title"));
        }
        a.insert("domain".into(), get(declared_op, "domain"));
        if truthy(declared_op.get("workflow")) {
            a.insert("workflow".into(), get(declared_op, "workflow"));
        }
        for key in ["stage", "operation", "dispatch", "taskSpec", "skills"] {
            a.insert(key.into(), get(declared_op, key));
        }
        if truthy(declared_op.get("contractTemplate")) {
            a.insert(
                "contractTemplate".into(),
                get(declared_op, "contractTemplate"),
            );
        }
        a.insert("evidence".into(), get(declared_op, "evidence"));
        a.insert("resultKind".into(), get(declared_op, "resultKind"));
        if truthy(declared_op.get("onAdvance")) {
            a.insert("onAdvance".into(), get(declared_op, "onAdvance"));
        }
    }
    a.insert("objective".into(), json!(attempt.objective));
    a.insert(
        "mutation".into(),
        json!(if read_only { "read-only" } else { "mutating" }),
    );
    a.insert("binding".into(), bound.clone());
    let mut provenance = Map::new();
    provenance.insert("kind".into(), json!("unit-run"));
    provenance.insert("unitRunId".into(), json!(unit_run_id));
    provenance.insert("seat".into(), get(seat, "seat"));
    provenance.insert("role".into(), get(seat, "role"));
    provenance.insert("posture".into(), get(seat, "posture"));
    provenance.insert("round".into(), round.clone());
    provenance.insert("binding".into(), bound.clone());
    if carries {
        provenance.insert("declared".into(), get(declared_op, "declared"));
    }
    a.insert("provenance".into(), Value::Object(provenance));
    a.insert(
        "expectedOutputs".into(),
        if truthy(unit.get("expectedOutputs")) {
            get(unit, "expectedOutputs")
        } else {
            json!([])
        },
    );
    a.insert("contextRefs".into(), attempt.context_refs.clone());
    a.insert("writes".into(), attempt.writes.clone());
    let sync = unit_record.get("sync");
    if !read_only
        && sync.and_then(|s| s.get("status")).and_then(Value::as_str) == Some("conflicted")
    {
        a.insert(
            "syncConflicts".into(),
            Value::Array(strings(sync.and_then(|s| s.get("conflicts")))),
        );
    }
    let mut policy = Map::new();
    policy.insert("tier".into(), get(bound, "tier"));
    policy.insert("preferExecutor".into(), get(bound, "executor"));
    policy.insert("preferInvocation".into(), get(bound, "invocation"));
    policy.insert("preferPersona".into(), get(bound, "persona"));
    if truthy(unit.get("rigor")) {
        policy.insert("rigor".into(), get(unit, "rigor"));
    }
    if let (Some(seat_id), Some(persona)) = (
        seat.get("seat").and_then(Value::as_str),
        bound.get("persona"),
    ) {
        if let Some(pin) = pinned_persona_for(unit_record, seat_id, persona) {
            policy.insert("personaPin".into(), pin);
        }
    }
    a.insert("policy".into(), Value::Object(policy));
    Value::Object(a)
}
