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
    "acceptedReports",
    "accountPin",
    "activityUnit",
    "branchBase",
    "caseRef",
    "collaboration",
    "cwd",
    "declared",
    "forceSharedCwd",
    "overrides",
    "pattern",
    "personaScope",
    "pinInputs",
    "providerCapacityRuntimeDir",
    "raiseAuthorized",
    "reason",
    "repoRoot",
    "request",
    "resumeUnitRunId",
    "runnerConfig",
    "session",
    "stanceOptions",
    "unitData",
    "unitPath",
    "verify",
    "workflowId",
    "worktree",
];

/// The Node error class a caller branches on.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorTag {
    CaseAdmissionRefusedError,
    RunnerConfigError,
    /// A failure of the holder-lock driver (`src/holder-lock/protocol.mjs`): `code` is the facade's code
    /// (`lock-driver-unavailable`, `lock-order-violation`, ...).
    HolderLockError,
    /// Any other error: the caller reads `errorClass` and the message only.
    Error,
}

impl ErrorTag {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::CaseAdmissionRefusedError => "CaseAdmissionRefusedError",
            Self::RunnerConfigError => "RunnerConfigError",
            Self::HolderLockError => "HolderLockError",
            Self::Error => "Error",
        }
    }

    pub fn parse(text: &str) -> Option<Self> {
        [
            Self::CaseAdmissionRefusedError,
            Self::RunnerConfigError,
            Self::HolderLockError,
            Self::Error,
        ]
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
    /// The other own fields of the Node error a caller may read (`path`, `cwd`, `attemptState`, a dispatch
    /// error's details, the class `name` of an error that is neither tag): the door copies them onto the rethrown
    /// instance. Empty for none.
    pub fields: Map<String, Value>,
}

impl RunUnitError {
    /// A `RunnerConfigError` with its `code` and `phase` when it has them.
    pub fn config(message: impl Into<String>, code: Option<&str>, phase: Option<&str>) -> Self {
        Self {
            tag: ErrorTag::RunnerConfigError,
            error_class: "runner-config".into(),
            code: code.map(str::to_string),
            message: message.into(),
            phase: phase.map(str::to_string),
            refusal: None,
            fields: Map::new(),
        }
    }

    /// The `CaseAdmissionRefusedError` a port's refusal becomes; the refusal rides along.
    pub fn admission_refused(refusal: &crate::admission::Refusal) -> Self {
        // The port's own refusal object rides along whole, as Node's `this.refusal = refusal`.
        let answer = refusal.answer.clone().unwrap_or_else(|| {
            let mut built = Map::new();
            built.insert("code".into(), json!(refusal.code));
            built.insert("condition".into(), json!(refusal.condition));
            if let Some(violations) = &refusal.violations {
                built.insert("violations".into(), json!(violations));
            }
            Value::Object(built)
        });
        Self {
            tag: ErrorTag::CaseAdmissionRefusedError,
            error_class: "case-admission-refused".into(),
            code: Some(refusal.code.clone()),
            message: format!(
                "case admission refused {}: {}",
                refusal.code, refusal.condition
            ),
            phase: None,
            refusal: Some(answer),
            fields: Map::new(),
        }
    }

    /// Any other error: its class (a stable code such as `custody-predecessor-unknown`) and its message.
    pub fn other(error_class: &str, message: impl Into<String>) -> Self {
        Self {
            tag: ErrorTag::Error,
            error_class: error_class.into(),
            code: None,
            message: message.into(),
            phase: None,
            refusal: None,
            fields: Map::new(),
        }
    }

    /// One more field of the Node error.
    pub fn with(mut self, key: &str, value: Value) -> Self {
        self.fields.insert(key.into(), value);
        self
    }

    /// A `DispatchError` of the run supervisor: its code is its class, its details its fields. A holder-lock
    /// driver failure it carries keeps that class as its tag.
    pub fn dispatch(error: &fgos_run_supervisor::controller::error::DispatchError) -> Self {
        let mut out = Self::other(&error.code, error.message.clone());
        out.code = Some(error.code.clone());
        out.fields = (*error.detail).clone();
        if error.holder_lock {
            out.tag = ErrorTag::HolderLockError;
        } else {
            out.fields.insert("name".into(), json!("DispatchError"));
        }
        out
    }

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
        if !self.fields.is_empty() {
            error.insert("fields".into(), Value::Object(self.fields.clone()));
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
            fields: error
                .get("fields")
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default(),
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
    if let Some(unknown) = options
        .keys()
        .find(|k| !REQUEST_OPTIONS.contains(&k.as_str()))
    {
        return Err(format!("run-unit: unknown option \"{unknown}\""));
    }
    Ok(
        json!({ "contract": contract(REQUEST_CONTRACT_ID), "options": Value::Object(options.clone()) }),
    )
}

impl std::fmt::Display for RunUnitError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for RunUnitError {}
