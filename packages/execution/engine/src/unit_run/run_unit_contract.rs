//! The `run-unit` request and result: what a caller (Workflow, Work, `fgos run`) passes to run a Unit and reads
//! back, across the internal op of phase 19. An error result carries the error type tag a Node caller branches on
//! with `instanceof`, beside `errorClass`, with that class's fields, so the door rethrows an instance.
//! Schema: `packages/execution/contracts/unit-run/run-unit.v1.json`.

use serde_json::{json, Map, Value};

pub const REQUEST_CONTRACT_ID: &str = "run-unit-request";
pub const RESULT_CONTRACT_ID: &str = "run-unit-result";
pub const CONTRACT_VERSION: u64 = 1;

/// Every `runUnit` option a caller passes as data today (read from `run.mjs` and `unit-run-start.mjs`: Workflow, Work
/// operation step, claim dispatch, fanout and `fgos run`). The three callbacks and the port are not options of this
/// list: the port is the admission peer, `onCaseAdmitted` and `onUnitRunCreated` are its two acknowledged events.
pub const REQUEST_OPTIONS: [&str; 27] = [
    "acceptedReports", "accountPin", "activityUnit", "branchBase", "caseRef", "collaboration", "cwd", "declared",
    "forceSharedCwd", "overrides", "pattern", "personaScope", "pinInputs", "providerCapacityRuntimeDir",
    "raiseAuthorized", "reason", "repoRoot", "request", "resumeUnitRunId", "runnerConfig", "session",
    "stanceOptions", "unitData", "unitPath", "verify", "workflowId", "worktree",
];

/// The Node error class a caller branches on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorTag {
    CaseAdmissionRefusedError,
    RunnerConfigError,
    /// Any other error: the caller reads `errorClass` and the message only.
    Error,
}

impl ErrorTag {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::CaseAdmissionRefusedError => "CaseAdmissionRefusedError",
            Self::RunnerConfigError => "RunnerConfigError",
            Self::Error => "Error",
        }
    }

    pub fn parse(text: &str) -> Option<Self> {
        [Self::CaseAdmissionRefusedError, Self::RunnerConfigError, Self::Error]
            .into_iter()
            .find(|t| t.as_str() == text)
    }
}

/// An error result: the tag, the class string (`custody-predecessor-unknown` and the like), and the class's fields.
#[derive(Debug, Clone, PartialEq)]
pub struct RunUnitError {
    pub tag: ErrorTag,
    pub error_class: String,
    pub code: Option<String>,
    pub message: String,
    pub phase: Option<String>,
    /// The refusal a `CaseAdmissionRefusedError` carries: `{ code, condition, violations? }`.
    pub refusal: Option<Value>,
}

impl RunUnitError {
    pub fn to_json(&self) -> Value {
        let mut error = Map::new();
        error.insert("tag".into(), json!(self.tag.as_str()));
        error.insert("errorClass".into(), json!(self.error_class));
        error.insert("message".into(), json!(self.message));
        if let Some(code) = &self.code {
            error.insert("code".into(), json!(code));
        }
        if let Some(phase) = &self.phase {
            error.insert("phase".into(), json!(phase));
        }
        if let Some(refusal) = &self.refusal {
            error.insert("refusal".into(), refusal.clone());
        }
        json!({ "contract": contract(RESULT_CONTRACT_ID), "ok": false, "error": Value::Object(error) })
    }

    pub fn from_json(value: &Value) -> Option<Self> {
        let error = value.get("error")?;
        let text = |key: &str| error.get(key).and_then(Value::as_str).map(str::to_string);
        Some(Self {
            tag: ErrorTag::parse(error.get("tag")?.as_str()?)?,
            error_class: text("errorClass")?,
            code: text("code"),
            message: text("message")?,
            phase: text("phase"),
            refusal: error.get("refusal").cloned(),
        })
    }
}

fn contract(id: &str) -> Value {
    json!({ "id": id, "version": CONTRACT_VERSION })
}

/// The result of a run that returned: `unitRunId`, `outcome` and `results[]` are what callers read.
pub fn ok_result(result: Value) -> Value {
    json!({ "contract": contract(RESULT_CONTRACT_ID), "ok": true, "result": result })
}

/// The request of a run: only the options of [`REQUEST_OPTIONS`] cross; an unknown one is refused by name.
pub fn request(options: &Map<String, Value>) -> Result<Value, String> {
    if let Some(unknown) = options.keys().find(|k| !REQUEST_OPTIONS.contains(&k.as_str())) {
        return Err(format!("run-unit: unknown option \"{unknown}\""));
    }
    Ok(json!({ "contract": contract(REQUEST_CONTRACT_ID), "options": Value::Object(options.clone()) }))
}
