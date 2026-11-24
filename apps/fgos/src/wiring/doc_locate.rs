//! `fgos doc locate` and `fgos doc index run`, served by the host; the other `doc` sub-verbs stay in the payload.
//! This module carries the call to the `fgos-documentation` crate: the paths (the corpus is `<project>/docs`, the
//! index and profile live under `.fgos/runtime/doc-locate/`, the model in the machine folder), the index worker as a
//! detached process of this binary, the answer as the `fgos.v1` envelope, and one `fgos.doc.locate` record per call.
//! What locate answers and when a worker starts is the crate's.

use super::agents::PayloadRoot;
use crate::routing::Call;
use fgos_documentation::locate::{ensure_worker, locate};
use fgos_documentation::pkm::{self, EmbedderChoice, LocatePaths, PkmLocator, ResetOutcome};
use fgos_documentation::port::{Answer, IndexKind, LocateError, Query, WorkerLauncher};
use fgos_documentation::profile;
use fgos_host_runtime::cli_args::{parse_args_repeating, FlagScalar, FlagValue, ParsedArgs};
use fgos_host_runtime::{
    CategorisedRefusal, ContractRef, EventSink, HostInvocation, InvocationControl, OperationId,
    OperationProvider, OperationRequest, ProviderDescriptor, ProviderError, ProviderLifecycle,
    ProviderOutcome, VerbAnswer,
};
use fgos_observe::record::store::RecordDoor;
use fgos_observe::record::types::{
    AttrValue, Basis, Origin, Record, Redaction, SubjectRef, DETAIL_MAX_BYTES, RECORD_VERSION,
};
use sha2::{Digest, Sha256};
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::ffi::OsString;
use std::fmt::Write as _;
use std::future::Future;
use std::path::{Path, PathBuf};
use std::pin::Pin;
use std::time::{Duration, Instant};

pub const LOCATE_OPERATION_ID: &str = "doc.locate";
pub const INDEX_OPERATION_ID: &str = "doc.index";

/// The sub-verbs of `fgos doc` the host serves; the lifecycle sub-verbs (`reserve`, `register`, ...) stay in the payload.
pub const SUBCOMMANDS: &[&str] = &["index", "locate"];
/// The words `fgos doc index` takes. `run` is the detached worker's entry; `status`, `stop` and `reset` are how a
/// person sees and repairs the index.
pub const INDEX_SUBCOMMANDS: &[&str] = &["reset", "run", "status", "stop"];

/// The record kind of one locate call.
pub const LOCATE_KIND: &str = "fgos.doc.locate";

/// The redaction rule a locate record's `detail` follows: drafts only as sha256 digests, never their text, plus the
/// repository paths of the top candidates.
const DETAIL_REDACTION_REV: &str = "doc-locate-draft-digests.v1";

/// How long a started worker gets to take the index lock before the locator opens anyway.
const WORKER_LOCK_WAIT: Duration = Duration::from_secs(5);

/// How long `doc index stop` and `doc index reset` wait for the worker to release the index lock.
pub const WORKER_STOP_WAIT: Duration = Duration::from_secs(10);

const fn descriptor(
    id: &'static str,
    request: &'static str,
    outcome: &'static str,
) -> ProviderDescriptor {
    ProviderDescriptor {
        provider_id: Cow::Borrowed(id),
        operation_id: OperationId::from_static(id),
        component_class: Cow::Borrowed("documentation"),
        mechanism: Cow::Borrowed("builtin"),
        lifecycle: ProviderLifecycle::Singleton,
        request_contract: ContractRef::from_static(request, "1.0.0"),
        outcome_contract: ContractRef::from_static(outcome, "1.0.0"),
        allowed_hosts: &["cli"],
        allowed_modes: &["sync"],
        capabilities: &[],
        replacement: None,
        concurrency: None,
        health: None,
    }
}

pub const LOCATE_DESCRIPTOR: ProviderDescriptor = descriptor(
    LOCATE_OPERATION_ID,
    "doc.locate.request",
    "doc.locate.outcome",
);
pub const INDEX_DESCRIPTOR: ProviderDescriptor =
    descriptor(INDEX_OPERATION_ID, "doc.index.request", "doc.index.outcome");

/// One call, as the projector read it. `root` is the project the doors resolved.
#[derive(Debug, Clone)]
pub struct DocRequest {
    pub root: PathBuf,
    pub verb: DocVerb,
}

#[derive(Debug, Clone)]
pub enum DocVerb {
    Locate {
        query: Query,
        json: bool,
    },
    /// `doc locate --eval <gold>`: the gold set's text, in pkm's gold format with repository paths.
    LocateEval {
        gold: String,
        json: bool,
    },
    IndexRun,
    /// `wait`: seconds to wait for the index to be ready or broken before answering.
    IndexStatus {
        wait: Option<u64>,
        json: bool,
    },
    IndexStop {
        json: bool,
    },
    IndexReset {
        json: bool,
    },
}

impl DocRequest {
    pub fn operation_id(&self) -> &'static str {
        match self.verb {
            DocVerb::Locate { .. } | DocVerb::LocateEval { .. } => LOCATE_OPERATION_ID,
            DocVerb::IndexRun
            | DocVerb::IndexStatus { .. }
            | DocVerb::IndexStop { .. }
            | DocVerb::IndexReset { .. } => INDEX_OPERATION_ID,
        }
    }
}

fn validation(message: impl Into<String>) -> CategorisedRefusal {
    CategorisedRefusal::new("validation", message)
}

/// The flags of `doc locate` that collect every use; the shared parser keeps only the last use of any other flag.
const REPEATED_FLAGS: &[&str] = &["--draft", "--draft-file", "--area", "--question"];

/// Every value of a flag that may repeat; a flag given without a value is refused.
fn values(parsed: &ParsedArgs, name: &str, sub: &str) -> Result<Vec<String>, CategorisedRefusal> {
    let scalar = |value: &FlagScalar| match value {
        FlagScalar::Str(text) => Ok(text.clone()),
        FlagScalar::Bool => Err(validation(format!("doc {sub} --{name} needs a value"))),
    };
    match parsed.flag(name) {
        None => Ok(Vec::new()),
        Some(FlagValue::One(value)) => Ok(vec![scalar(value)?]),
        Some(FlagValue::Many(all)) => all.iter().map(scalar).collect(),
    }
}

/// Reads `doc locate --draft <text>... --draft-file <path>... [--area <v>]... [--question <v>]... [--json]`,
/// `doc locate --eval <gold> [--json]` and `doc index ...`. A draft or gold file is read here, so an unreadable one is
/// the caller's error.
pub fn project_request(args: &[OsString], root: PathBuf) -> Result<DocRequest, CategorisedRefusal> {
    let call = Call::new(args);
    let verb = match call.sub_word() {
        Some("locate") => {
            let repeated = parse_args_repeating(args.get(1..).unwrap_or_default(), REPEATED_FLAGS)
                .map_err(|e| validation(e.to_string()))?;
            let json = call.switch("json").map_err(validation)?;
            let mut parts = values(&repeated, "draft", "locate")?;
            for file in values(&repeated, "draft-file", "locate")? {
                parts.push(read_caller_file(&file, "draft-file")?);
            }
            if let Some(file) = call.value("eval").map_err(validation)? {
                if !parts.is_empty() {
                    return Err(validation(
                        "doc locate --eval measures a gold set; it takes no --draft or --draft-file",
                    ));
                }
                return Ok(DocRequest {
                    root,
                    verb: DocVerb::LocateEval {
                        gold: read_caller_file(&file, "eval")?,
                        json,
                    },
                });
            }
            DocVerb::Locate {
                query: Query {
                    parts,
                    area: values(&repeated, "area", "locate")?,
                    question: values(&repeated, "question", "locate")?,
                },
                json,
            }
        }
        Some("index") => match call.parsed().positional.get(1).map(String::as_str) {
            Some("run") => DocVerb::IndexRun,
            Some("status") => DocVerb::IndexStatus {
                wait: call
                    .value("wait")
                    .map_err(validation)?
                    .map(|w| {
                        w.parse::<u64>().map_err(|_| {
                            validation(format!(
                                "doc index status --wait takes whole seconds (got \"{w}\")"
                            ))
                        })
                    })
                    .transpose()?,
                json: call.switch("json").map_err(validation)?,
            },
            Some("stop") => DocVerb::IndexStop {
                json: call.switch("json").map_err(validation)?,
            },
            Some("reset") => DocVerb::IndexReset {
                json: call.switch("json").map_err(validation)?,
            },
            other => {
                return Err(validation(format!(
                    "doc index needs one of: {}{}",
                    INDEX_SUBCOMMANDS.join(", "),
                    other.map(|o| format!(" (got \"{o}\")")).unwrap_or_default()
                )))
            }
        },
        other => {
            return Err(validation(format!(
                "no host-served doc sub-verb named {}",
                other.unwrap_or("")
            )))
        }
    };
    Ok(DocRequest { root, verb })
}

/// A file the caller named, relative to the working directory; an unreadable one is the caller's error.
fn read_caller_file(file: &str, flag: &str) -> Result<String, CategorisedRefusal> {
    let path = if Path::new(file).is_absolute() {
        PathBuf::from(file)
    } else {
        std::env::current_dir().unwrap_or_default().join(file)
    };
    std::fs::read_to_string(&path)
        .map_err(|e| validation(format!("doc locate --{flag} {file}: {e}")))
}

/// The adapter's paths for the project at `root`.
pub fn locate_paths(root: &Path) -> LocatePaths {
    let runtime = runtime_dir(root);
    LocatePaths {
        docs_root: root.join("docs"),
        graph_db: runtime.join("graph.db"),
        search_db: runtime.join("search").join("search.db"),
        model_dir: fgos_distribution::store::machine_model_root(),
        profile: runtime.join("profile.yaml"),
    }
}

fn runtime_dir(root: &Path) -> PathBuf {
    root.join(".fgos").join("runtime").join("doc-locate")
}

/// The index worker as a detached `fgos doc index run --dir <root>`: it leads its own session, writes to
/// `worker.log`, and pkm's `writer.lock` keeps it the only worker of the corpus.
struct ProcessLauncher<'a> {
    root: &'a Path,
    paths: &'a LocatePaths,
}

impl WorkerLauncher for ProcessLauncher<'_> {
    fn running(&self) -> bool {
        pkm::worker_running(self.paths)
    }

    /// Returns once the started worker holds the index, or after a short wait: a locator opened earlier would read
    /// the missing index as broken.
    fn start(&self) -> std::io::Result<()> {
        spawn_worker(self.root)?;
        let deadline = Instant::now() + WORKER_LOCK_WAIT;
        while !self.running() && Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(50));
        }
        Ok(())
    }
}

#[cfg(unix)]
fn spawn_worker(root: &Path) -> std::io::Result<()> {
    let runtime = runtime_dir(root);
    std::fs::create_dir_all(&runtime)?;
    let argv: Vec<OsString> = vec![
        std::env::current_exe()?.into_os_string(),
        "doc".into(),
        "index".into(),
        "run".into(),
        "--dir".into(),
        root.as_os_str().to_owned(),
    ];
    // `doc index run` is served by the host itself, so the legacy payload's recursion guard never applies to it.
    fgos_process::mapped::spawn_detached(&argv, root, &[], &[], Some(&runtime.join("worker.log")))
        .map(drop)
}

/// No detached spawn off Unix: the answer stays partial and its action names this.
#[cfg(not(unix))]
fn spawn_worker(_root: &Path) -> std::io::Result<()> {
    Err(std::io::Error::new(
        std::io::ErrorKind::Unsupported,
        "the index worker runs only on Unix hosts for now",
    ))
}

/// The locate answer, or the caller's refusal.
fn answer_locate(root: &Path, query: &Query) -> Result<Answer, CategorisedRefusal> {
    let paths = locate_paths(root);
    if !paths.docs_root.is_dir() {
        return Err(CategorisedRefusal::new(
            "precondition",
            format!(
                "no corpus to locate in: {} is not a directory [no-docs]",
                paths.docs_root.display()
            ),
        ));
    }
    profile::check_region(&paths.docs_root, &query.area, &query.question).map_err(validation)?;
    profile::write_if_changed(&paths.docs_root, &paths.profile).map_err(|e| {
        CategorisedRefusal::unexpected(format!("cannot write the locate profile: {e}"))
    })?;
    let launcher = ProcessLauncher {
        root,
        paths: &paths,
    };
    locate(
        || PkmLocator::open(&paths, EmbedderChoice::Model),
        &launcher,
        query,
    )
    .map_err(|e| match e {
        LocateError::Invalid(message) => validation(message),
        LocateError::Failed(message) => CategorisedRefusal::unexpected(message),
    })
}

/// The locate measurement over a gold set, only on a ready index: a partial index would measure the text branch
/// alone. When the index is not ready the worker is started, so a later call finds it ready.
fn answer_eval(root: &Path, gold: &str) -> Result<serde_json::Value, CategorisedRefusal> {
    let paths = locate_paths(root);
    if !paths.docs_root.is_dir() {
        return Err(CategorisedRefusal::new(
            "precondition",
            format!(
                "no corpus to measure: {} is not a directory [no-docs]",
                paths.docs_root.display()
            ),
        ));
    }
    profile::write_if_changed(&paths.docs_root, &paths.profile).map_err(|e| {
        CategorisedRefusal::unexpected(format!("cannot write the locate profile: {e}"))
    })?;
    let launcher = ProcessLauncher {
        root,
        paths: &paths,
    };
    let status = pkm::index_status(&paths, None);
    if status.state != IndexKind::Ready {
        let started = ensure_worker(&launcher).unwrap_or(false);
        return Err(CategorisedRefusal::new(
            "precondition",
            format!(
                "the locate index is {}{}{}; run `fgos doc index status --wait 900` and measure again [index-not-ready]",
                kind_name(status.state),
                status
                    .eta_s
                    .map(|s| format!(", about {s} s left"))
                    .unwrap_or_default(),
                if started { "; the index worker was started" } else { "" }
            ),
        ));
    }
    PkmLocator::open(&paths, EmbedderChoice::Model)
        .eval(gold)
        .map_err(|e| {
            let error = e["error"]
                .as_str()
                .map_or_else(|| e.to_string(), str::to_owned);
            if e.get("state").is_some() {
                CategorisedRefusal::new("precondition", format!("{error} [index-not-ready]"))
            } else {
                validation(error)
            }
        })
}

/// The measurement as a person reads it.
fn eval_text(out: &serde_json::Value) -> String {
    format!(
        "{} cases, {} with an owner: recall@3 {}, recall@10 {}; right section first {} of {}; {} misses\n",
        out["cases"],
        out["owned"],
        out["recall@3"],
        out["recall@10"],
        out["section"]["first"],
        out["section"]["cases"],
        out["misses"].as_array().map_or(0, Vec::len)
    )
}

/// The answer as a person reads it: the state when partial, then each part's candidates.
fn human(answer: &Answer) -> String {
    let mut out = String::new();
    if answer.partial {
        let _ = writeln!(out, "partial: index {}", kind_name(answer.state));
        if let Some(action) = &answer.action {
            let _ = writeln!(out, "  {action}");
        }
    }
    for (n, part) in answer.parts.iter().enumerate() {
        if answer.parts.len() > 1 {
            let _ = writeln!(out, "part {}:", n + 1);
        }
        if part.candidates.is_empty() {
            let _ = writeln!(out, "  no candidate");
        }
        for c in &part.candidates {
            let section = if c.section.is_empty() {
                String::new()
            } else {
                format!(" § {}", c.section.join(" > "))
            };
            let axes: Vec<String> = c.axes.iter().map(|(k, v)| format!("{k}={v}")).collect();
            let outside = if c.outside_region {
                " [outside region]"
            } else {
                ""
            };
            let _ = writeln!(
                out,
                "  {:>2}. {}{section} ({}){outside}",
                c.rank,
                c.path,
                axes.join(", ")
            );
        }
    }
    out
}

/// One `fgos.doc.locate` record: what was asked (only digests of the drafts, never their text) and what came back.
fn locate_record(query: &Query, answer: &Answer, took: Duration) -> Record {
    let mut detail = String::new();
    for part in &query.parts {
        let _ = writeln!(
            detail,
            "draft sha256:{:x}",
            Sha256::digest(part.trim().as_bytes())
        );
    }
    for (n, part) in answer.parts.iter().enumerate() {
        if let Some(top) = part.candidates.first() {
            let _ = writeln!(detail, "top {}: {}", n + 1, top.path);
        }
    }
    let mut cut = detail.len().min(DETAIL_MAX_BYTES);
    while !detail.is_char_boundary(cut) {
        cut -= 1;
    }
    detail.truncate(cut);
    let state = kind_name(answer.state);
    let mut attrs = BTreeMap::new();
    attrs.insert(
        "fgos.doc.locate.partial".to_owned(),
        AttrValue::Bool(answer.partial),
    );
    attrs.insert("fgos.doc.locate.state".to_owned(), AttrValue::Str(state));
    if !query.area.is_empty() {
        attrs.insert(
            "fgos.doc.locate.area".to_owned(),
            AttrValue::Str(query.area.join(",")),
        );
    }
    if !query.question.is_empty() {
        attrs.insert(
            "fgos.doc.locate.question".to_owned(),
            AttrValue::Str(query.question.join(",")),
        );
    }
    let candidates: usize = answer.parts.iter().map(|p| p.candidates.len()).sum();
    let measures = [
        ("fgos.doc.locate.duration", took.as_millis() as u64),
        (
            "fgos.doc.locate.parts",
            query.parts.iter().filter(|p| !p.trim().is_empty()).count() as u64,
        ),
        ("fgos.doc.locate.candidates", candidates as u64),
    ];
    Record {
        v: RECORD_VERSION,
        id: String::new(),
        kind: LOCATE_KIND.to_owned(),
        ts: fgos_observe::time::now_iso(),
        end_ts: None,
        subject: SubjectRef {
            kind: "session".to_owned(),
            id: fgos_identity::resolve::resolve_current().id.to_string(),
        },
        refs: Vec::new(),
        attrs,
        measures: measures
            .into_iter()
            .map(|(k, v)| (k.to_owned(), v.into()))
            .collect(),
        basis: Basis::Observed,
        origin: Origin {
            source: "documentation".to_owned(),
            component: Some("host".to_owned()),
            host: Some(fgos_process::facts::host()),
            ..Origin::default()
        },
        redaction: (!detail.is_empty()).then(|| Redaction {
            rev: DETAIL_REDACTION_REV.to_owned(),
        }),
        detail: (!detail.is_empty()).then_some(detail),
    }
}

fn answer(
    request: &DocRequest,
    payload_root: PayloadRoot,
) -> Result<VerbAnswer, CategorisedRefusal> {
    match &request.verb {
        DocVerb::Locate { query, json } => {
            let started = Instant::now();
            let answer = answer_locate(&request.root, query)?;
            // The write door counts its own failures; a lost record never changes the answer.
            let _ = RecordDoor::new(
                request.root.clone(),
                super::observe_declarations::embedded_declarations(),
                payload_root().ok(),
            )
            .write(locate_record(query, &answer, started.elapsed()));
            let data = serde_json::to_value(&answer)
                .map_err(|e| CategorisedRefusal::unexpected(e.to_string()))?;
            Ok(VerbAnswer {
                text: (!json).then(|| human(&answer)),
                data,
                exit: 0,
            })
        }
        DocVerb::LocateEval { gold, json } => {
            let out = answer_eval(&request.root, gold)?;
            let text = eval_text(&out);
            completed(&out, *json, text)
        }
        DocVerb::IndexRun => {
            let code = pkm::run_worker(&locate_paths(&request.root), EmbedderChoice::Model);
            Ok(VerbAnswer {
                data: serde_json::json!({ "exit": code }),
                exit: i32::from(code),
                text: Some(String::new()),
            })
        }
        DocVerb::IndexStatus { wait, json } => {
            let paths = locate_paths(&request.root);
            // Waiting only makes sense while a worker embeds, so a wait starts one; a bare status reads and writes
            // nothing.
            if wait.is_some() && paths.docs_root.is_dir() {
                profile::write_if_changed(&paths.docs_root, &paths.profile).map_err(|e| {
                    CategorisedRefusal::unexpected(format!("cannot write the locate profile: {e}"))
                })?;
                let launcher = ProcessLauncher {
                    root: &request.root,
                    paths: &paths,
                };
                let started = ensure_worker(&launcher).map_err(|e| {
                    CategorisedRefusal::new(
                        "precondition",
                        format!("the index worker did not start: {e} [worker-not-started]"),
                    )
                })?;
                // A session opened before the new worker holds its lock reads a missing index as broken.
                let deadline = Instant::now() + WORKER_LOCK_WAIT;
                while started && !launcher.running() && Instant::now() < deadline {
                    std::thread::sleep(Duration::from_millis(100));
                }
            }
            let status = pkm::index_status(&paths, wait.map(Duration::from_secs));
            let text = format!(
                "index {}{}: {} of {} chunks embedded, {} pending, {} failed{}\n  {}\n",
                kind_name(status.state),
                if status.worker_running {
                    ", worker running"
                } else {
                    ""
                },
                status.indexed,
                status.total,
                status.pending,
                status.failed,
                status
                    .eta_s
                    .map(|s| format!(", about {s} s left"))
                    .unwrap_or_default(),
                status.action
            );
            completed(&status, *json, text)
        }
        DocVerb::IndexStop { json } => {
            let stopped = pkm::stop_worker(&locate_paths(&request.root), WORKER_STOP_WAIT)
                .map_err(|e| CategorisedRefusal::new("precondition", e))?;
            let text = if stopped {
                "the index worker stopped\n"
            } else {
                "no index worker was running\n"
            };
            completed(
                &serde_json::json!({ "stopped": stopped }),
                *json,
                text.to_owned(),
            )
        }
        DocVerb::IndexReset { json } => {
            let outcome = pkm::reset_index(&locate_paths(&request.root), WORKER_STOP_WAIT)
                .map_err(CategorisedRefusal::unexpected)?;
            let text = match outcome {
                ResetOutcome::Reset { notes } => format!(
                    "the index worker's crash history is cleared; {notes} documents are queued again\n"
                ),
                ResetOutcome::NoIndex => "no search index exists yet\n".to_owned(),
                ResetOutcome::Busy => {
                    return Err(CategorisedRefusal::new(
                        "precondition",
                        "an index worker is running; run `fgos doc index stop` first [busy]",
                    ))
                }
            };
            completed(&outcome, *json, text)
        }
    }
}

/// A completed answer: the data in the envelope, and `text` unless the call asked for JSON.
fn completed(
    data: &impl serde::Serialize,
    json: bool,
    text: String,
) -> Result<VerbAnswer, CategorisedRefusal> {
    Ok(VerbAnswer {
        data: serde_json::to_value(data)
            .map_err(|e| CategorisedRefusal::unexpected(e.to_string()))?,
        exit: 0,
        text: (!json).then_some(text),
    })
}

/// The wire name of an index state (`model-missing`, ...).
fn kind_name(kind: IndexKind) -> String {
    serde_json::to_value(kind)
        .ok()
        .and_then(|v| v.as_str().map(str::to_owned))
        .unwrap_or_default()
}

/// The provider of `doc.locate` and `doc.index`.
pub struct DocProvider {
    descriptor: ProviderDescriptor,
    payload_root: PayloadRoot,
}

impl DocProvider {
    pub fn for_descriptor(descriptor: ProviderDescriptor, payload_root: PayloadRoot) -> Self {
        Self {
            descriptor,
            payload_root,
        }
    }
}

impl OperationProvider for DocProvider {
    fn descriptor(&self) -> &ProviderDescriptor {
        &self.descriptor
    }

    fn invoke<'a>(
        &'a self,
        _invocation: &'a HostInvocation,
        request: OperationRequest,
        _control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>> {
        Box::pin(async move {
            events.record_event(&format!(
                "{}.invoked",
                self.descriptor.operation_id.as_str()
            ));
            let request = request.input.downcast_ref::<DocRequest>().ok_or_else(|| {
                ProviderError::SemanticValidation("input is not DocRequest".into())
            })?;
            let contract = self.descriptor.outcome_contract.clone();
            Ok(match answer(request, self.payload_root) {
                Ok(verb_answer) => ProviderOutcome::completed(contract, Box::new(verb_answer)),
                Err(refusal) => ProviderOutcome::completed(contract, Box::new(refusal)),
            })
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(args: &[&str]) -> Vec<OsString> {
        args.iter().map(OsString::from).collect()
    }

    #[test]
    fn a_locate_call_reads_repeated_drafts_draft_files_and_the_guessed_region() {
        let dir =
            std::env::temp_dir().join(format!("fgos-doc-locate-projector-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("draft.md");
        std::fs::write(&file, "from a file").unwrap();
        let request = project_request(
            &os(&[
                "doc",
                "locate",
                "--draft",
                "one",
                "--draft",
                "two",
                "--draft-file",
                file.to_str().unwrap(),
                "--area",
                "git",
                "--question",
                "choice",
                "--json",
            ]),
            dir.clone(),
        )
        .unwrap();
        std::fs::remove_dir_all(&dir).unwrap();
        match &request.verb {
            DocVerb::Locate { query, json } => {
                assert_eq!(query.parts, vec!["one", "two", "from a file"]);
                assert_eq!(query.area, vec!["git"]);
                assert_eq!(query.question, vec!["choice"]);
                assert!(*json);
            }
            other => panic!("expected locate, got {other:?}"),
        }
        assert_eq!(request.operation_id(), LOCATE_OPERATION_ID);
    }

    #[test]
    fn an_unreadable_draft_file_and_a_bare_index_are_the_callers_errors() {
        let missing = project_request(
            &os(&["doc", "locate", "--draft-file", "/nonexistent/draft.md"]),
            PathBuf::new(),
        );
        assert_eq!(missing.unwrap_err().category, "validation");
        let bare = project_request(&os(&["doc", "index"]), PathBuf::new());
        assert_eq!(bare.unwrap_err().category, "validation");
        let run = project_request(&os(&["doc", "index", "run"]), PathBuf::new()).unwrap();
        assert_eq!(run.operation_id(), INDEX_OPERATION_ID);
    }

    #[test]
    fn the_record_keeps_draft_digests_never_the_draft_text() {
        let query = Query {
            parts: vec!["a secret draft sentence".into()],
            ..Query::default()
        };
        let answer = Answer {
            partial: true,
            state: fgos_documentation::port::IndexKind::Starting,
            action: None,
            parts: Vec::new(),
            group: None,
        };
        let record = locate_record(&query, &answer, Duration::from_millis(7));
        let detail = record.detail.clone().unwrap();
        assert!(!detail.contains("secret"), "{detail}");
        assert!(detail.starts_with("draft sha256:"), "{detail}");
        assert_eq!(
            record.attrs["fgos.doc.locate.partial"],
            AttrValue::Bool(true)
        );
        let door = RecordDoor::new(
            std::env::temp_dir(),
            super::super::observe_declarations::embedded_declarations(),
            None,
        );
        // The door mints the id when it writes; asking it ahead needs one.
        let minted = Record {
            id: fgos_observe::record::store::new_record_id(),
            ..record
        };
        assert_eq!(
            door.admits(&minted),
            Ok(()),
            "the declared kind admits the record"
        );
    }
}
