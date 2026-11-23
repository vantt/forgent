//! The pkm adapter: answers the locate port with pkm-core linked as a library. The corpus (the docs root) is pkm's
//! vault, read-only; the graph index, search index, model and profile all live outside it, at paths the composition
//! root hands over. Paths cross the boundary with a `docs/` prefix added or stripped, so callers see repository paths.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::time::Duration;

use indexmap::IndexMap;
use pkm_core::search::{self, SearchOptions, StateKind, WorkerChoice, NOT_READY};
use pkm_core::service::{Session, SessionConfig};
use pkm_core::structure::eval::{parse_gold, Case};
use pkm_core::structure::locate::Request;
use serde_json::Value;

pub use pkm_core::search::EmbedderChoice;

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
        let state = self.state();
        if let Some(error) = reply.get("error").and_then(Value::as_str) {
            if error == NOT_READY {
                let kind = reply["state"].as_str().map_or(state.kind, kind_of_name);
                let action = reply["action"]
                    .as_str()
                    .map(str::to_owned)
                    .unwrap_or(state.action);
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
        action: s.action.clone(),
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
