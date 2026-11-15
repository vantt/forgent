//! The facts of one repository the doctor's Git rows judge, read without writing anything: the Git floor, the
//! layout, the journal, the activation fence, native locks, untrusted transport settings, reserved legacy refs and
//! the fetch mappings. The host's doctor reads the typed value.
use crate::incidents::{journal_facts, native_lock_names, FactError, JournalFacts};
use crate::repository_config::obsolete_legacy_fetch_mapping;
use crate::wal;
use crate::{plain_path, GitDriver, GitFloorVerdict, Inspect, RefPrefix, RepoHandle, ResolveRepo};
use serde::Serialize;
use std::path::Path;

/// The durability sentence the doctor prints for a repository.
pub const DURABILITY: &str = "process-crash; file and parent sync; stable media not certified";

/// The Git binary the driver runs and what it can do.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FloorFacts {
    pub version: String,
    pub minimum: String,
    pub supported: bool,
    pub probes: Vec<ProbeFacts>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbeFacts {
    pub name: String,
    pub passed: bool,
    pub evidence: String,
}

impl From<&GitFloorVerdict> for FloorFacts {
    fn from(verdict: &GitFloorVerdict) -> Self {
        Self {
            version: verdict.version.clone(),
            minimum: verdict.minimum.clone(),
            supported: verdict.supported,
            probes: verdict
                .probes
                .iter()
                .map(|probe| ProbeFacts {
                    name: probe.name.clone(),
                    passed: probe.passed,
                    evidence: probe.evidence.clone(),
                })
                .collect(),
        }
    }
}

/// What a repository reports about itself.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepositoryFacts {
    pub floor: FloorFacts,
    pub common_dir: String,
    pub layout: String,
    pub journal: JournalFacts,
    pub activation_fence: bool,
    pub native_locks: Vec<String>,
    pub untrusted_transport_config: Vec<String>,
    pub reserved_legacy_refs: Vec<String>,
    pub obsolete_fetch_mapping: bool,
    pub fetch_refspecs: Vec<String>,
    pub durability: &'static str,
}

/// The inspection of a path: no repository there (the floor is still known), or the repository's facts.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Inspection {
    NotARepository { floor: FloorFacts },
    Repository(Box<RepositoryFacts>),
}

/// Inspects `repo_path` (inside `trusted_main`) for `remote`. Never acquires a lock, never initialises a journal;
/// the activation fence is reported through the check every journal-writing door runs.
pub fn inspect_repository(
    driver: &GitDriver,
    repo_path: &Path,
    trusted_main: &Path,
    remote: &str,
) -> Result<Inspection, FactError> {
    let floor = FloorFacts::from(driver.git_floor_verdict()?);
    let repo = match driver.resolve_repo(repo_path, trusted_main)? {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Ok(Inspection::NotARepository { floor }),
    };
    let activation_fence = wal::require_activation_fence(&repo).is_ok();
    let journal = journal_facts(&repo)?;
    let obsolete = obsolete_legacy_fetch_mapping(remote)?;
    let mappings = driver.configured_fetch_refspecs(&repo, remote)?;
    Ok(Inspection::Repository(Box::new(RepositoryFacts {
        floor,
        common_dir: plain_path(repo.common_dir()).to_string_lossy().into_owned(),
        layout: format!("{:?}", repo.layout()),
        journal,
        activation_fence,
        native_locks: native_lock_names(&repo),
        untrusted_transport_config: driver.untrusted_transport_config(&repo)?,
        reserved_legacy_refs: reserved_legacy_refs(driver, &repo)?,
        obsolete_fetch_mapping: mappings.iter().any(|f| f.value == obsolete.as_bytes()),
        fetch_refspecs: mappings
            .into_iter()
            .map(|f| String::from_utf8_lossy(&f.value).into_owned())
            .collect(),
        durability: DURABILITY,
    })))
}

/// `refs/fgos/remotes/<remote>/legacy<suffix>` mirrors other than the one `legacy` mirror fgOS owns.
fn reserved_legacy_refs(driver: &GitDriver, repo: &RepoHandle) -> Result<Vec<String>, FactError> {
    let prefix = RefPrefix::parse("refs/fgos/remotes/")
        .map_err(|error| FactError::Plain(error.to_string()))?;
    let mut found = Vec::new();
    let mut cursor = None;
    loop {
        let page = driver.list_refs(repo, std::slice::from_ref(&prefix), cursor, 1000)?;
        for entry in page.entries {
            let name = entry.name.as_str();
            if let Some((_, suffix)) = name
                .strip_prefix("refs/fgos/remotes/")
                .and_then(|rest| rest.split_once('/'))
            {
                if suffix.starts_with("legacy") && suffix != "legacy" {
                    found.push(name.to_owned());
                }
            }
        }
        if page.complete {
            return Ok(found);
        }
        cursor = page.next_cursor;
    }
}
