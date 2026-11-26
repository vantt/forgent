//! The pkm adapter: reads the three rule roots as unit files, indexes them with pkm (the index is a view, rebuilt from
//! the files whenever they change), asks pkm which rules are in force, and folds pkm's own graph findings into ACE
//! refusals. pkm writes no note into the repository (the profile declares no proposals directory); the only file it writes is the index view at `graph_db`.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use pkm_core::service::{installed, Session, SessionConfig};
use pkm_core::{index, validate};
use serde_json::{json, Map, Value};

use crate::check::{self, OwnerRegistry};
use crate::refusal::{Refusal, RefusalCode};
use crate::rule::RuleFile;
use crate::set::EffectiveSet;
use crate::when_keys::ValueSource;

/// How long the first index build may take before the store gives up.
const BUILD_WAIT: Duration = Duration::from_secs(120);

/// A limit large enough that pkm never cuts a list of rules.
const NO_LIMIT: i64 = 1_000_000;

/// Every path the store reads or writes. `repo_root` is the vault; `graph_db` may sit inside it (the host keeps it under `.fgos`), and pkm writes nothing else there.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StorePaths {
    pub repo_root: PathBuf,
    /// The pkm graph index, a view of the unit files (`.fgos/runtime/context-engine/rules.db`).
    pub graph_db: PathBuf,
    /// `packages/agent-context-engine/pkm/profile.yaml`; the pack file sits beside it.
    pub profile: PathBuf,
}

/// A failure of the machinery, as opposed to a refusal of a rule.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoreError(pub String);

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for StoreError {}

fn unit_invalid(source: &str, message: impl Into<String>) -> Refusal {
    Refusal::new(RefusalCode::UnitInvalid, message).with_source(source)
}

/// The YAML and the Markdown of a unit file; `None` when the file has no frontmatter block.
fn cut_frontmatter(text: &str) -> Option<(&str, &str)> {
    let rest = text
        .strip_prefix("---\r\n")
        .or_else(|| text.strip_prefix("---\n"))?;
    let mut offset = 0;
    for line in rest.split_inclusive('\n') {
        if line.trim_end_matches(['\r', '\n']).trim_end() == "---" {
            return Some((&rest[..offset], &rest[offset + line.len()..]));
        }
        offset += line.len();
    }
    None
}

fn read_unit(full: &Path, source: &str) -> Result<RuleFile, Refusal> {
    let text = fs::read_to_string(full)
        .map_err(|e| unit_invalid(source, format!("the file cannot be read: {e}")))?;
    let (yaml, body) = cut_frontmatter(&text)
        .ok_or_else(|| unit_invalid(source, "the file has no frontmatter block (--- ... ---)"))?;
    let doc = fgos_yaml_doc::parse(yaml.as_bytes(), fgos_yaml_doc::Profile::Tool, source).map_err(
        |e| {
            unit_invalid(
                source,
                format!("the frontmatter is not valid YAML: rule {}", e.rule),
            )
        },
    )?;
    let frontmatter = doc.to_json().map_err(|e| {
        unit_invalid(
            source,
            format!("the frontmatter cannot be read: rule {}", e.rule),
        )
    })?;
    RuleFile::read(&frontmatter, body, source)
}

fn sorted_dirs(dir: &Path) -> Vec<PathBuf> {
    let Ok(entries) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut dirs: Vec<PathBuf> = entries
        .filter_map(Result::ok)
        .filter(|e| !e.file_name().to_string_lossy().starts_with('.') && e.path().is_dir())
        .map(|e| e.path())
        .collect();
    dirs.sort();
    dirs
}

/// Collects the `.md` files under `dir`, in path order. A symlink that leaves the repository is refused.
fn scan(
    dir: &Path,
    root: &Path,
    repo: &Path,
    files: &mut Vec<(PathBuf, String)>,
    refusals: &mut Vec<Refusal>,
) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    let mut entries: Vec<_> = entries.filter_map(Result::ok).collect();
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        if entry.file_name().to_string_lossy().starts_with('.') {
            continue;
        }
        let path = entry.path();
        let source = path
            .strip_prefix(root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_default();
        let Ok(real) = fs::canonicalize(&path) else {
            continue;
        };
        if !real.starts_with(repo) {
            refusals.push(unit_invalid(
                &source,
                "the path resolves outside the repository through a symlink",
            ));
            continue;
        }
        if real.is_dir() {
            scan(&path, root, repo, files, refusals);
        } else if real.is_file() && path.extension().is_some_and(|e| e == "md") {
            files.push((path, source));
        }
    }
}

/// Reads every unit file of the three roots. Missing roots are fine; an unknown component or domain directory, a
/// file outside the repository, and any unit that does not read are refusals, all of them returned together.
pub fn read_corpus(
    repo_root: &Path,
    owners: &dyn OwnerRegistry,
) -> Result<Vec<RuleFile>, Vec<Refusal>> {
    let repo = fs::canonicalize(repo_root).map_err(|e| {
        vec![unit_invalid(
            "",
            format!("the repository root cannot be read: {e}"),
        )]
    })?;
    let mut refusals = Vec::new();
    let mut found: Vec<(PathBuf, String)> = Vec::new();
    scan(
        &repo.join("core").join("instructions"),
        &repo,
        &repo,
        &mut found,
        &mut refusals,
    );
    for (group, kind) in [("components", "component"), ("domains", "domain")] {
        for dir in sorted_dirs(&repo.join(group)) {
            let name = dir
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();
            if !owners.is_owner(&name) {
                refusals.push(
                    Refusal::new(
                        RefusalCode::OwnerUnknown,
                        format!("the {kind} directory \"{name}\" is not a {kind} of the authority model"),
                    )
                    .with_source(format!("{group}/{name}")),
                );
                continue;
            }
            scan(
                &dir.join("instructions"),
                &repo,
                &repo,
                &mut found,
                &mut refusals,
            );
        }
    }
    let mut corpus = Vec::new();
    for (path, source) in &found {
        match read_unit(path, source) {
            Ok(file) => corpus.push(file),
            Err(refusal) => refusals.push(refusal),
        }
    }
    if refusals.is_empty() {
        Ok(corpus)
    } else {
        refusals.sort();
        Err(refusals)
    }
}

/// What pkm answers for the rules in force on one day.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InForce {
    /// Rule ids in force.
    pub ids: BTreeSet<String>,
    /// Notes pkm counted: in force, ended, or excluded for a reason.
    pub accounted: usize,
}

/// A pkm session over the rule roots of one repository.
pub struct RuleIndex {
    session: Session,
    db: PathBuf,
}

impl RuleIndex {
    /// Opens the index and waits for its first build. Every later query rebuilds incrementally first, so the index
    /// is never stale.
    pub fn open(paths: &StorePaths) -> Result<RuleIndex, StoreError> {
        let mut cfg = SessionConfig::new(&paths.repo_root);
        cfg.db = Some(paths.graph_db.clone());
        cfg.profile = Some(paths.profile.clone());
        cfg.refresh_every = Some(0.0);
        let session = Session::start(cfg, installed(), None);
        if !session.wait_ready(Some(BUILD_WAIT)) {
            return Err(StoreError("the pkm index did not finish building".into()));
        }
        Ok(RuleIndex {
            session,
            db: paths.graph_db.clone(),
        })
    }

    /// The rules in force on `as_of` (`YYYY-MM-DD`), ids mapped from pkm's tree paths through `corpus`.
    pub fn in_force(&self, as_of: &str, corpus: &[RuleFile]) -> Result<InForce, StoreError> {
        let mut args = Map::new();
        args.insert("type".into(), json!("rule"));
        args.insert("as_of".into(), json!(as_of));
        args.insert("limit".into(), json!(NO_LIMIT));
        let reply = self.session.query("in_force", args).map_err(StoreError)?;
        if let Some(error) = reply.get("error") {
            return Err(StoreError(format!("pkm in_force failed: {error}")));
        }
        let by_path: BTreeMap<&str, &str> = corpus
            .iter()
            .map(|f| (f.source.as_str(), f.unit.id.as_str()))
            .collect();
        let list = |key: &str| {
            reply
                .get(key)
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default()
        };
        let mut ids = BTreeSet::new();
        for item in list("items") {
            let path = item.get("id").and_then(Value::as_str).unwrap_or_default();
            let id = by_path.get(path).ok_or_else(|| {
                StoreError(format!(
                    "pkm names a rule file the reader did not find: {path}"
                ))
            })?;
            ids.insert((*id).to_string());
        }
        let excluded: usize = reply
            .get("excluded")
            .and_then(Value::as_object)
            .map(|m| m.values().filter_map(Value::as_u64).sum::<u64>() as usize)
            .unwrap_or(0);
        Ok(InForce {
            ids,
            accounted: list("items").len() + list("ended").len() + excluded,
        })
    }

    /// pkm's own graph findings (rules R3, R9, R12, R15, R16 ...) as refusals, with node paths mapped to rule ids.
    pub fn validate(&self, corpus: &[RuleFile]) -> Result<Vec<Refusal>, StoreError> {
        let conn = index::connect(&self.db, true).map_err(|e| StoreError(e.to_string()))?;
        let deviations =
            validate::deviations(&conn, None, None).map_err(|e| StoreError(e.to_string()))?;
        let by_path: BTreeMap<&str, &str> = corpus
            .iter()
            .map(|f| (f.source.as_str(), f.unit.id.as_str()))
            .collect();
        let mut out = Vec::new();
        for d in deviations {
            let node = d.node.as_deref().unwrap_or_default();
            let detail = d.detail.as_deref().unwrap_or_default();
            let code = match d.rule.as_str() {
                "R12" => RefusalCode::ReplacementIncomplete,
                "R16" => RefusalCode::IdDuplicate,
                "R3" if detail.starts_with("superseded_by") => RefusalCode::ReplacementIncomplete,
                "R3" => RefusalCode::DependencyNotInForce,
                _ => RefusalCode::UnitInvalid,
            };
            let mut refusal = Refusal::new(code, format!("pkm {}: {detail}", d.rule));
            if let Some(id) = by_path.get(node) {
                refusal = refusal.with_ids([*id]);
            }
            if !node.is_empty() {
                refusal = refusal.with_source(node);
            }
            out.push(refusal);
        }
        Ok(out)
    }
}

fn store_refusal(error: StoreError) -> Vec<Refusal> {
    vec![Refusal::new(
        RefusalCode::UnitInvalid,
        format!("the rule store failed: {error}"),
    )]
}

/// Everything the check finds on a repository: the unit files, pkm's graph findings, the accounting of the set in
/// force, and the composition. Returns the corpus and the refusals (empty when clean) with the ids in force.
pub fn check_repository(
    paths: &StorePaths,
    as_of: &str,
    owners: &dyn OwnerRegistry,
    live: &dyn ValueSource,
) -> Result<(Vec<RuleFile>, BTreeSet<String>, Vec<Refusal>), Vec<Refusal>> {
    let corpus = read_corpus(&paths.repo_root, owners)?;
    let index = RuleIndex::open(paths).map_err(store_refusal)?;
    let in_force = index.in_force(as_of, &corpus).map_err(store_refusal)?;
    let mut refusals = check::check(&corpus, &in_force.ids, owners, live);
    // A pkm finding the unit check already made is not repeated.
    let known: BTreeSet<(RefusalCode, Vec<String>)> =
        refusals.iter().map(|r| (r.code, r.ids.clone())).collect();
    for finding in index.validate(&corpus).map_err(store_refusal)? {
        if !known.contains(&(finding.code, finding.ids.clone())) {
            refusals.push(finding);
        }
    }
    // pkm leaves a rule out of the set in force without a word when it has no valid_from; the counts must add up.
    if in_force.accounted != corpus.len() {
        refusals.push(Refusal::new(
            RefusalCode::UnitInvalid,
            format!(
                "pkm accounts for {} of {} rule files: a rule has dropped out of the set in force",
                in_force.accounted,
                corpus.len()
            ),
        ));
    }
    refusals.sort();
    refusals.dedup();
    Ok((corpus, in_force.ids, refusals))
}

/// Checks the repository and, when it is clean, compiles the effective set.
pub fn compile_repository(
    paths: &StorePaths,
    as_of: &str,
    owners: &dyn OwnerRegistry,
    live: &dyn ValueSource,
) -> Result<EffectiveSet, Vec<Refusal>> {
    let (corpus, in_force, refusals) = check_repository(paths, as_of, owners, live)?;
    if !refusals.is_empty() {
        return Err(refusals);
    }
    check::compile(&corpus, &in_force, owners, live)
}
