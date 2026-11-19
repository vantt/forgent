//! What a Unit run's directory says, and when it may go: the judgements over facts the caller read. Ported from
//! `unitRunFacts` and `judgeUnitRun` (`runner/execution/unit-run-record.mjs`) and `custodyHeld`
//! (`runner/execution/custody-door.mjs`).
//!
//! The reads are the caller's: `unit.json` (durable file door), the control ledger (run supervisor, `lease`), the
//! custody holders (holder lock), and the lstat of the run directory. Nothing here touches a file or a process.

use serde_json::{json, Map, Value};

/// The contract the facts carry.
pub const UNIT_RUN_RECORD_CONTRACT_ID: &str = "unit-run-record";
pub const UNIT_RUN_RECORD_CONTRACT_VERSION: u32 = 1;

/// `JSON.parse(readFileSync(file, 'utf8'))`, or none when the text does not parse: invalid UTF-8 reads as
/// replacement characters, a byte order mark is not skipped.
fn read_json(bytes: &[u8]) -> Option<Value> {
    serde_json::from_str(&String::from_utf8_lossy(bytes)).ok()
}

/// A member that is neither missing nor null (`a ?? b` takes the next).
fn defined(value: Option<&Value>) -> Option<&Value> {
    value.filter(|v| !v.is_null())
}

/// What a Unit run's directory says.
#[derive(Debug, Clone, PartialEq)]
pub struct UnitRunFacts {
    pub exists: bool,
    pub settled: bool,
    pub controller_held: bool,
    pub worktree: Option<String>,
    pub write_scope: Option<Value>,
    pub resumable: bool,
    pub case_id: Option<Value>,
}

impl UnitRunFacts {
    /// The facts as Workflow reads them: `{ contract, exists, settled, controllerHeld, worktree, writeScope, resumable,
    /// caseId }`, the member order and nulls of the Node object.
    pub fn to_json(&self) -> Value {
        let mut out = Map::new();
        out.insert(
            "contract".into(),
            json!({"id": UNIT_RUN_RECORD_CONTRACT_ID, "version": UNIT_RUN_RECORD_CONTRACT_VERSION}),
        );
        out.insert("exists".into(), json!(self.exists));
        out.insert("settled".into(), json!(self.settled));
        out.insert("controllerHeld".into(), json!(self.controller_held));
        out.insert("worktree".into(), json!(self.worktree));
        out.insert(
            "writeScope".into(),
            self.write_scope.clone().unwrap_or(Value::Null),
        );
        out.insert("resumable".into(), json!(self.resumable));
        out.insert("caseId".into(), self.case_id.clone().unwrap_or(Value::Null));
        Value::Object(out)
    }
}

/// What a Unit run's directory says. `record_bytes` is `unit.json` when the file exists (`None` for a run id that
/// names no directory, a run id that is not a plain id, or a missing file: all read as `exists: false`). An
/// unreadable record reads as not settled and not resumable: only positive evidence counts. `controller_held` is
/// the control ledger's answer (`inspectRunControl(...).held === true`), `worktree_exists` whether the record's
/// worktree directory exists.
pub fn unit_run_facts(
    record_bytes: Option<&[u8]>,
    controller_held: bool,
    worktree_exists: bool,
) -> UnitRunFacts {
    let exists = record_bytes.is_some();
    let record = record_bytes.and_then(read_json);
    let field = |key: &str| record.as_ref().and_then(|r| r.get(key));
    let worktree = field("worktree")
        .and_then(Value::as_str)
        .map(str::to_string);
    let write_scope = record.as_ref().map(|r| {
        defined(r.get("writeScope"))
            .or_else(|| defined(r.get("unit").and_then(|unit| unit.get("writes"))))
            .cloned()
            .unwrap_or(Value::Null)
    });
    UnitRunFacts {
        exists,
        settled: record
            .as_ref()
            .and_then(|r| r.get("execution"))
            .and_then(|e| e.get("status"))
            .and_then(Value::as_str)
            == Some("settled"),
        controller_held: exists && controller_held,
        resumable: worktree.is_some() && worktree_exists,
        worktree,
        write_scope,
        case_id: defined(
            record
                .as_ref()
                .and_then(|r| r.get("workflow"))
                .and_then(|w| w.get("caseId")),
        )
        .cloned(),
    }
}

/// What the caller read of `assignments/<unitRunId>` before the record is judged.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Standing {
    /// The id is not a plain path inside the assignments directory.
    Unsafe,
    /// The id is plain and names a symbolic link.
    UnsafeLink,
    /// Nothing exists there.
    Missing,
    /// A link, not a directory, or a directory whose real path is not the expected one.
    Link,
    /// A real directory of the expected path.
    Directory(DirectoryReads),
}

/// The derived state of a Unit run (`deriveUnitState`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnitState {
    Running,
    AwaitingResume,
    Completed,
    Failed,
}

/// The reads of a run directory the keep reasons ask, taken once.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DirectoryReads {
    /// The real path of the run directory (what a removable run answers).
    pub expected: String,
    /// `lstat(unit.json).isFile()`.
    pub unit_json_is_file: bool,
    /// `unit.json` as text, when it could be read.
    pub record_bytes: Option<Vec<u8>>,
    /// `unitControllerHeld(expected)`.
    pub controller_held: bool,
    /// `custodyHeld(fgosDir, record.worktree)`; asked only for a record with a worktree string.
    pub custody_held: bool,
    /// `deriveUnitState(expected)` without a live probe.
    pub unit_state: UnitState,
}

/// Where one Unit run of a case stands.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verdict {
    /// The run may go: its directory.
    Dir(String),
    /// Nothing to remove.
    Gone,
    /// The run stays; `blocks`: whoever removes several runs together keeps them all.
    Keep { reason: &'static str, blocks: bool },
}

impl Verdict {
    /// `{ dir }`, `{ gone: true }` or `{ keep, blocks }`.
    pub fn to_json(&self) -> Value {
        match self {
            Verdict::Dir(dir) => json!({ "dir": dir }),
            Verdict::Gone => json!({ "gone": true }),
            Verdict::Keep { reason, blocks } => json!({ "keep": reason, "blocks": blocks }),
        }
    }
}

fn keep(reason: &'static str, blocks: bool) -> Verdict {
    Verdict::Keep { reason, blocks }
}

/// Where one Unit run of `case_id` stands: `Dir` when it may go, `Gone` when there is nothing to remove, `Keep`
/// otherwise. The reasons are asked in order and the first that fires wins. A run that another case owns or names
/// (`unless`) stays alone: nothing kept then names it from the case asking.
pub fn judge_unit_run(
    unit_run_id: &str,
    case_id: &str,
    unless: &[String],
    standing: &Standing,
) -> Verdict {
    let reads = match standing {
        Standing::Unsafe => return keep("unsafe-path", true),
        Standing::UnsafeLink | Standing::Link => return keep("link", true),
        Standing::Missing => return Verdict::Gone,
        Standing::Directory(reads) => reads,
    };
    if !reads.unit_json_is_file {
        return keep("unit-record-missing", true);
    }
    let record = reads.record_bytes.as_deref().and_then(read_json);
    let names_case = record
        .as_ref()
        .and_then(|r| r.get("workflow"))
        .and_then(|w| w.get("caseId"))
        .and_then(Value::as_str)
        == Some(case_id);
    if !names_case {
        return keep("names-other-case", false);
    }
    if unless.iter().any(|named| named == unit_run_id) {
        return keep("named-by-other-case", false);
    }
    if reads.controller_held {
        return keep("controller-held", true);
    }
    let has_worktree = record
        .as_ref()
        .and_then(|r| r.get("worktree"))
        .is_some_and(Value::is_string);
    if has_worktree && reads.custody_held {
        return keep("custody-held", true);
    }
    if !matches!(reads.unit_state, UnitState::Completed | UnitState::Failed) {
        return keep("unsettled", true);
    }
    Verdict::Dir(reads.expected.clone())
}

/// What the caller read of the holders of a worktree's dispatch custody lock.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CustodyHolders {
    /// The worktree is gone, or the lock file was never created: nothing holds it.
    None,
    /// The kernel listed the holders.
    Listed(Vec<u32>),
    /// The platform cannot list holders; `free` is what a probe of the lock said.
    Unlisted { free: bool },
}

/// Whether a dispatch holds custody of a worktree right now.
pub fn custody_held(holders: &CustodyHolders) -> bool {
    match holders {
        CustodyHolders::None => false,
        CustodyHolders::Listed(pids) => !pids.is_empty(),
        CustodyHolders::Unlisted { free } => !free,
    }
}
