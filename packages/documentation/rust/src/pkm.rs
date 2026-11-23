//! The pkm adapter: answers the locate port with pkm-core linked as a library. The corpus (the docs root) is pkm's
//! vault, read-only; the graph index, search index, model and profile all live outside it, at paths the composition
//! root hands over. Paths cross the boundary with a `docs/` prefix added or stripped, so callers see repository paths.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::time::Duration;

use indexmap::IndexMap;
use pkm_core::search::{self, SearchOptions, StateKind, WorkerChoice, NOT_READY};
use pkm_core::service::{Session, SessionConfig};
use pkm_core::structure::eval::{parse_gold, Case};
use pkm_core::structure::locate::Request;
use pkm_lifecycle::install::model;
use serde::Serialize;
use serde_json::Value;

pub use pkm_core::search::EmbedderChoice;
pub use pkm_lifecycle::install::ModelSource;

use crate::port::{
    Answer, Candidate, Group, IndexKind, IndexState, LocateError, Locator, Part, Place, Query,
    CANDIDATES_MAX,
};
use crate::profile::PLATFORM;

/// The prefix that turns a vault path into a repository path.
pub const DOCS_PREFIX: &str = "docs/";

/// Every path the adapter reads or writes. Only `docs_root` is inside the repository, and pkm never writes there.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocatePaths {
    pub docs_root: PathBuf,
    pub graph_db: PathBuf,
    pub search_db: PathBuf,
    /// The folder that holds `<model id>@<commit>/`.
    pub model_dir: PathBuf,
    pub profile: PathBuf,
}

/// The search options for `paths`: no worker of pkm's own (fgOS starts it through its process door).
pub fn search_options(paths: &LocatePaths, embedder: EmbedderChoice) -> SearchOptions {
    SearchOptions {
        db: Some(paths.search_db.clone()),
        model_dir: Some(paths.model_dir.clone()),
        worker: WorkerChoice::External,
        embedder,
        ..SearchOptions::default()
    }
}

/// Whether an index worker holds the search index of `paths` now. Reads only; starts and writes nothing.
pub fn worker_running(paths: &LocatePaths) -> bool {
    search::probe(
        &paths.docs_root,
        &search_options(paths, EmbedderChoice::Model),
    )
    .worker_running
}

/// Runs the index worker of `paths` in this process until it goes idle or is stopped, and returns pkm's exit code:
/// 0 idle or stopped, 75 another worker holds the index, 78 cannot run, 1 failed.
pub fn run_worker(paths: &LocatePaths, embedder: EmbedderChoice) -> u8 {
    search::run_worker(&paths.docs_root, &search_options(paths, embedder), None)
}

/// Asks the index worker of `paths` to stop and waits up to `wait` for it to release the index. `Ok(true)` when one
/// ran and stopped, `Ok(false)` when none ran.
pub fn stop_worker(paths: &LocatePaths, wait: Duration) -> Result<bool, String> {
    match search::stop_worker(
        &paths.docs_root,
        &search_options(paths, EmbedderChoice::Model),
        wait,
    )? {
        search::StopResult::Stopped => Ok(true),
        search::StopResult::NotRunning => Ok(false),
        search::StopResult::NotWritable => {
            Err("the stop request could not be written: the search index is read-only".into())
        }
        search::StopResult::TimedOut => Err(format!(
            "the index worker did not stop within {} s",
            wait.as_secs()
        )),
    }
}

/// The search index as `fgos doc index status` reports it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexStatus {
    pub state: IndexKind,
    pub worker_running: bool,
    /// Chunks with a meaning vector, chunks still waiting for one, all chunks, chunks whose embedding failed.
    pub indexed: u64,
    pub pending: u64,
    pub total: u64,
    pub failed: u64,
    /// Seconds left by the worker's estimate; only while indexing.
    pub eta_s: Option<u64>,
    pub action: String,
}

/// The search index of `paths` now, or after waiting up to `wait` for it to be ready or broken. Reads only; starts
/// no worker and loads no model.
pub fn index_status(paths: &LocatePaths, wait: Option<Duration>) -> IndexStatus {
    let s = search::Search::open(
        &paths.docs_root,
        &search_options(paths, EmbedderChoice::Model),
    );
    let st = match wait {
        Some(wait) => s.wait_ready(wait),
        None => s.state(),
    };
    s.close();
    let state = index_state(&st);
    IndexStatus {
        state: state.kind,
        worker_running: st.worker_running,
        indexed: st.indexed,
        pending: st.pending,
        total: st.total,
        failed: st.failed,
        eta_s: st.eta_s,
        action: state.action,
    }
}

/// What `fgos doc index reset` did.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(tag = "result", rename_all = "kebab-case")]
pub enum ResetOutcome {
    /// The worker's crash history is cleared; `notes` documents that once crashed it are queued again.
    Reset { notes: usize },
    /// No search index exists yet.
    NoIndex,
    /// A worker holds the index: stop it first.
    Busy,
}

/// Clears the index worker's crash history (the `broken` state after repeated crashes and its back-off) and queues
/// the documents that crashed it again. Needs no worker running; waits up to `wait` for the index lock.
pub fn reset_index(paths: &LocatePaths, wait: Duration) -> Result<ResetOutcome, String> {
    Ok(
        match search::reset_worker(
            &paths.docs_root,
            &search_options(paths, EmbedderChoice::Model),
            wait,
        )? {
            search::ResetResult::Reset { notes } => ResetOutcome::Reset { notes },
            search::ResetResult::NoIndex => ResetOutcome::NoIndex,
            search::ResetResult::Busy => ResetOutcome::Busy,
        },
    )
}

/// The embedding model under the machine model folder, as the doctor row sees it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ModelCheck {
    /// `<model id>@<commit>`.
    pub version: String,
    pub dir: PathBuf,
    pub missing: Vec<String>,
    pub corrupt: Vec<String>,
}

impl ModelCheck {
    pub fn usable(&self) -> bool {
        self.missing.is_empty() && self.corrupt.is_empty()
    }
}

/// Checks every file of the embedding model under `model_dir` against its size and sha256. Reads only.
pub fn check_model(model_dir: &Path) -> ModelCheck {
    let p = model::probe(model_dir, &pkm_embed::model::E5_SMALL);
    ModelCheck {
        version: p.version,
        dir: p.dir,
        missing: p.missing,
        corrupt: p.corrupt,
    }
}

/// Reads a model source: `huggingface`, an `https://` mirror root, or a local folder for an offline install.
pub fn parse_model_source(text: &str) -> Result<ModelSource, String> {
    ModelSource::parse(text)
}

/// Makes the embedding model under `model_dir` complete and correct: a correct file stays, a wrong one is fetched
/// again, each file lands under a temporary name and is renamed only after its sha256 matches. Downloads with `curl`;
/// `progress` hears one line per file. Returns the model folder.
pub fn fetch_model(
    model_dir: &Path,
    source: &ModelSource,
    progress: &mut dyn FnMut(String),
) -> Result<PathBuf, String> {
    model::ensure(
        model_dir,
        &pkm_embed::model::E5_SMALL,
        source,
        None,
        &pkm_lifecycle::install::fetch::curl,
        &mut |event| match event {
            model::Progress::Ready => progress("the model is already complete".into()),
            model::Progress::Imported(files) => progress(format!("copied {}", files.join(", "))),
            model::Progress::Fetching { path, size } => {
                progress(format!("fetching {path} ({size} bytes)"))
            }
            model::Progress::Fetched { path } => progress(format!("fetched {path}")),
        },
    )
}

/// A locator over one corpus.
pub struct PkmLocator {
    session: Session,
}

impl PkmLocator {
    /// Opens a pkm session on the corpus. The graph index is built in the background; locate waits for it.
    pub fn open(paths: &LocatePaths, embedder: EmbedderChoice) -> PkmLocator {
        let mut cfg = SessionConfig::new(&paths.docs_root);
        cfg.db = Some(paths.graph_db.clone());
        cfg.profile = Some(paths.profile.clone());
        cfg.search = search_options(paths, embedder);
        PkmLocator {
            session: Session::open(cfg),
        }
    }

    /// Waits up to `timeout` for the search index to be ready; returns the state reached.
    pub fn wait_ready(&self, timeout: Duration) -> IndexState {
        match self.session.search() {
            Some(s) => index_state(&s.wait_ready(timeout)),
            None => self.state(),
        }
    }

    /// Measures locate over a gold set in pkm's format whose paths are repository paths (`docs/...`).
    pub fn eval(&self, gold: &str) -> Result<Value, Value> {
        let cases: Vec<Case> = parse_gold(gold).map_err(|e| serde_json::json!({ "error": e }))?;
        let cases: Vec<Case> = cases.into_iter().map(strip_case).collect();
        let mut out = self.session.locate_eval(&cases)?;
        for line in out["results"].as_array_mut().into_iter().flatten() {
            for path in line["top"].as_array_mut().into_iter().flatten() {
                prefix_value(path);
            }
        }
        for miss in out["misses"].as_array_mut().into_iter().flatten() {
            for top in miss["top"].as_array_mut().into_iter().flatten() {
                prefix_value(&mut top["path"]);
            }
        }
        Ok(out)
    }
}

impl Locator for PkmLocator {
    fn locate(&self, query: &Query) -> Result<Answer, LocateError> {
        let mut region = IndexMap::new();
        if !query.area.is_empty() {
            region.insert("area".to_owned(), query.area.clone());
        }
        if !query.question.is_empty() {
            region.insert("question".to_owned(), query.question.clone());
        }
        let request = Request {
            parts: query.parts.clone(),
            region,
            top: CANDIDATES_MAX,
            explain: true,
        };
        let reply = self.session.locate(&request).map_err(LocateError::Failed)?;
        let st = self.session.search_state();
        let state = index_state(&st);
        if let Some(error) = reply.get("error").and_then(Value::as_str) {
            if error == NOT_READY {
                let kind = reply["state"].as_str().map_or(state.kind, kind_of_name);
                let action = action_for(
                    kind,
                    st.worker_running,
                    reply["action"].as_str().unwrap_or(&st.action),
                );
                return Ok(Answer {
                    partial: true,
                    state: kind,
                    action: Some(action),
                    parts: Vec::new(),
                    group: None,
                });
            }
            return Err(LocateError::Invalid(error.to_owned()));
        }
        let partial = state.kind != IndexKind::Ready;
        Ok(Answer {
            partial,
            state: state.kind,
            action: partial.then_some(state.action),
            parts: reply["parts"]
                .as_array()
                .into_iter()
                .flatten()
                .map(part)
                .collect(),
            group: reply
                .get("group")
                .and_then(Value::as_array)
                .map(|g| g.iter().map(group).collect()),
        })
    }

    fn state(&self) -> IndexState {
        index_state(&self.session.search_state())
    }
}

fn index_state(s: &search::SearchState) -> IndexState {
    let kind = match s.state {
        StateKind::Starting => IndexKind::Starting,
        StateKind::Indexing => IndexKind::Indexing,
        StateKind::ModelMissing => IndexKind::ModelMissing,
        StateKind::Broken => IndexKind::Broken,
        StateKind::Ready => IndexKind::Ready,
    };
    IndexState {
        kind,
        action: action_for(kind, s.worker_running, &s.action),
    }
}

/// What a person does about an index state, in fgOS's own verbs: pkm's sentences name pkm commands, which an fgOS
/// user does not have. pkm's words survive only as the reason a broken index gives.
fn action_for(kind: IndexKind, worker_running: bool, pkm_action: &str) -> String {
    match kind {
        IndexKind::Ready => String::new(),
        IndexKind::Starting | IndexKind::Indexing if !worker_running => {
            "no index worker is running; `fgos doc index status --wait 900` starts one and waits for the index".to_owned()
        }
        IndexKind::Starting => {
            "the index worker is reading the documents for the first time; `fgos doc index status --wait 900` waits for it"
                .to_owned()
        }
        IndexKind::Indexing => {
            "answers use text only while the index worker computes meaning vectors; `fgos doc index status --wait 900` \
             waits for it"
                .to_owned()
        }
        IndexKind::ModelMissing => {
            "no usable embedding model, so answers use text only; `fgos doctor --fix` fetches it".to_owned()
        }
        IndexKind::Broken => {
            let reason: Vec<&str> = pkm_action
                .split(". ")
                .map(|s| s.trim().trim_end_matches('.'))
                .filter(|s| !s.is_empty() && !s.contains("`pkm"))
                .collect();
            format!(
                "the locate index cannot run ({}); `fgos doc index reset` clears the worker's crash history once the \
                 cause is fixed",
                if reason.is_empty() { "no reason given".to_owned() } else { reason.join("; ") }
            )
        }
    }
}

fn kind_of_name(name: &str) -> IndexKind {
    match name {
        "starting" => IndexKind::Starting,
        "indexing" => IndexKind::Indexing,
        "model_missing" => IndexKind::ModelMissing,
        "ready" => IndexKind::Ready,
        _ => IndexKind::Broken,
    }
}

fn repo_path(vault_path: &str) -> String {
    format!("{DOCS_PREFIX}{vault_path}")
}

fn vault_path(repo_path: &str) -> String {
    repo_path
        .strip_prefix(DOCS_PREFIX)
        .unwrap_or(repo_path)
        .to_owned()
}

fn prefix_value(v: &mut Value) {
    if let Some(s) = v.as_str() {
        *v = Value::String(repo_path(s));
    }
}

fn strip_case(mut c: Case) -> Case {
    c.expect = c.expect.iter().map(|p| vault_path(p)).collect();
    c.exclude = c.exclude.iter().map(|p| vault_path(p)).collect();
    c.sections = c
        .sections
        .into_iter()
        .map(|(p, s)| (vault_path(&p), s))
        .collect();
    c
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(str::to_owned)
        .collect()
}

/// A home folder as a repository path. pkm has one home template per axis (`platform/{value}/`), which for the
/// `platform` value itself names `platform/platform/`; documents that govern every area live at the docs root.
fn home(raw: &str) -> String {
    if raw == format!("{PLATFORM}/{PLATFORM}/") {
        DOCS_PREFIX.to_owned()
    } else {
        repo_path(raw)
    }
}

fn candidate(c: &Value) -> Candidate {
    let axes: BTreeMap<String, String> = c["facets"]
        .as_object()
        .into_iter()
        .flatten()
        .filter_map(|(k, v)| {
            v["value"]
                .as_str()
                .map(|value| (k.clone(), value.to_owned()))
        })
        .collect();
    Candidate {
        rank: c["rank"].as_u64().unwrap_or(0) as usize,
        path: c["path"].as_str().map(repo_path).unwrap_or_default(),
        title: c["title"].as_str().unwrap_or_default().to_owned(),
        section: strings(&c["section"]),
        excerpt: c["excerpt"].as_str().map(str::to_owned),
        axes,
        outside_region: c["region"].as_str() == Some("outside-region"),
    }
}

fn part(p: &Value) -> Part {
    Part {
        candidates: p["candidates"]
            .as_array()
            .into_iter()
            .flatten()
            .map(candidate)
            .collect(),
        places: p["places"]
            .as_array()
            .into_iter()
            .flatten()
            .map(|pl| Place {
                axis: pl["facet"].as_str().unwrap_or_default().to_owned(),
                value: pl["value"].as_str().unwrap_or_default().to_owned(),
                home: pl["home"].as_str().map(home),
                candidates: pl["candidates"].as_u64().unwrap_or(0) as usize,
            })
            .collect(),
    }
}

fn group(g: &Value) -> Group {
    Group {
        parts: g["parts"]
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(Value::as_u64)
            .map(|n| n as usize)
            .collect(),
        home: g["home"].as_str().map(home),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_index_state_tells_the_person_an_fgos_verb_and_never_a_pkm_command() {
        let pkm_words =
            "Cannot read the search index (disk full). Run `pkm VAULT doctor` to see why.";
        for kind in [
            IndexKind::Starting,
            IndexKind::Indexing,
            IndexKind::ModelMissing,
            IndexKind::Broken,
        ] {
            for running in [false, true] {
                let action = action_for(kind, running, pkm_words);
                assert!(!action.contains("`pkm"), "{kind:?}: {action}");
                assert!(action.contains("`fgos "), "{kind:?}: {action}");
            }
        }
        assert!(
            action_for(IndexKind::Starting, false, "").starts_with("no index worker is running")
        );
        assert!(action_for(IndexKind::Broken, false, pkm_words)
            .contains("(Cannot read the search index (disk full))"));
        assert_eq!(action_for(IndexKind::Ready, true, pkm_words), "");
    }
}
