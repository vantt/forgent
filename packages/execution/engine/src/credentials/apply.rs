//! Compare-before-write: apply a renewed login to the source, and judge whether a copy is newer than it.

use std::fs;
use std::path::Path;

use super::files::{read_agent_file, MAX_COPY_FILE_BYTES};
use super::layout::{is_replacement, sidecar_bytes, ApplyArgs, Layout};
use super::ports::SqliteAdapter;

/// The result of [`apply_renewed_credential`]: `Applied`/`Unchanged` allow the caller to remove the copy (the
/// source is untouched unless `Applied`), `Unreadable` says the copy itself is unusable, and `ApplyDeferred` says
/// the source could not be read, its entry could not be identified, or the copy could not be read for a reason
/// that may pass, so the copy stays for the next holder of the account lock.
#[derive(Debug, Clone, PartialEq)]
pub enum ApplyOutcome {
    Applied(Vec<String>),
    Unchanged,
    Unreadable(&'static str),
    ApplyDeferred(String),
}

impl ApplyOutcome {
    pub fn status(&self) -> &'static str {
        match self {
            ApplyOutcome::Applied(_) => "applied",
            ApplyOutcome::Unchanged => "unchanged",
            ApplyOutcome::Unreadable(_) => "unreadable",
            ApplyOutcome::ApplyDeferred(_) => "apply-deferred",
        }
    }
}

/// Codes that say the copy itself is unusable; every other failure code may pass.
const COPY_UNUSABLE_CODES: [&str; 5] = [
    "missing-file",
    "unsafe-file",
    "unreadable-json",
    "unexpected-shape",
    "unknown-layout",
];
const SOURCE_SIDE_THROWS: [&str; 7] = [
    "missing-file",
    "unreadable-file",
    "unreadable-json",
    "unexpected-shape",
    "unreadable-db",
    "sqlite-unavailable",
    "entry-unidentified",
];

/// An entry of a store that holds logins of several providers belongs to one when its owner is the provider id or
/// starts with `<provider>-`; a store of one provider has no owner. Zero or several matches cannot be told apart.
pub fn select_provider_entry<'a>(
    entries: &'a [super::layout::Entry],
    provider: &str,
) -> Result<&'a super::layout::Entry, &'static str> {
    let mut matches = entries.iter().filter(|e| {
        e.owner
            .as_deref()
            .is_none_or(|o| o == provider || o.starts_with(&format!("{provider}-")))
    });
    match (matches.next(), matches.next()) {
        (Some(only), None) => Ok(only),
        _ => Err("entry-unidentified"),
    }
}

pub struct ApplyRequest<'a> {
    pub layout_name: &'a str,
    pub source_home: &'a Path,
    pub copy_home: &'a Path,
    /// Only this provider's entry is considered; `None` considers every entry.
    pub provider: Option<&'a str>,
    /// Also demand an expiry still ahead (a fresh renewal result); a copy staged earlier is applied without.
    pub require_future: bool,
    pub now: f64,
    pub sqlite: &'a dyn SqliteAdapter,
}

/// Apply the entry of `copy_home` that is strictly newer than the source's and carries a different refresh token.
/// The caller holds the account lock. `Err` only when writing the source itself fails.
pub fn apply_renewed_credential(request: &ApplyRequest<'_>) -> Result<ApplyOutcome, String> {
    let Some(layout) = Layout::from_name(request.layout_name) else {
        return Ok(ApplyOutcome::Unreadable("unknown-layout"));
    };
    let copy = match layout.read(request.copy_home, false, request.sqlite) {
        Ok(copy) => copy,
        Err(code) if COPY_UNUSABLE_CODES.contains(&code) => {
            return Ok(ApplyOutcome::Unreadable(code))
        }
        Err(code) => return Ok(ApplyOutcome::ApplyDeferred(code.to_owned())),
    };
    let source = match layout.read(request.source_home, false, request.sqlite) {
        Ok(source) => source,
        Err(code) => return Ok(ApplyOutcome::ApplyDeferred(code.to_owned())),
    };
    let key = match request.provider {
        Some(provider) => match select_provider_entry(&source.entries, provider) {
            Ok(entry) => Some(entry.key.clone()),
            Err(code) => return Ok(ApplyOutcome::ApplyDeferred(code.to_owned())),
        },
        None => None,
    };
    let args = ApplyArgs {
        now: request.now,
        key: key.as_deref(),
        require_future: request.require_future,
        sqlite: request.sqlite,
    };
    match layout.apply(request.source_home, &copy, &args) {
        Ok(keys) if keys.is_empty() => Ok(ApplyOutcome::Unchanged),
        Ok(keys) => Ok(ApplyOutcome::Applied(keys)),
        // The source changed between the read above and the write: still a source-side reason, not a verdict on the copy.
        Err(message) if SOURCE_SIDE_THROWS.contains(&message.as_str()) => {
            Ok(ApplyOutcome::ApplyDeferred(message))
        }
        Err(message) => Err(message),
    }
}

/// Whether the copy holds a login newer than the source's.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Verdict {
    Newer,
    /// The source was read and proves it, or the copy is proven malformed.
    NotNewer,
    /// Nothing proves it: the copy cannot be read for a reason that may pass, or the source cannot say. Such a
    /// copy is staged rather than dropped.
    Undetermined,
}

const COPY_MALFORMED_CODES: [&str; 5] = [
    "missing-file",
    "unsafe-file",
    "unreadable-json",
    "unexpected-shape",
    "unknown-layout",
];

pub fn judge_copy(
    layout: Layout,
    provider: &str,
    source_home: &Path,
    copy_home: &Path,
    now: f64,
    sqlite: &dyn SqliteAdapter,
) -> Verdict {
    let copy = match layout.read(copy_home, true, sqlite) {
        Ok(copy) => copy,
        Err(code) if COPY_MALFORMED_CODES.contains(&code) => return Verdict::NotNewer,
        Err(_) => return Verdict::Undetermined,
    };
    let Ok(source) = layout.read(source_home, false, sqlite) else {
        return Verdict::Undetermined;
    };
    let selected = match select_provider_entry(&source.entries, provider) {
        Ok(selected) => selected,
        Err(_) => {
            let held: Vec<&str> = source
                .entries
                .iter()
                .filter_map(|e| e.refresh.as_deref())
                .collect();
            return if copy
                .entries
                .iter()
                .any(|e| e.refresh.as_deref().is_some_and(|r| !held.contains(&r)))
            {
                Verdict::Undetermined
            } else {
                Verdict::NotNewer
            };
        }
    };
    match copy.entries.iter().find(|e| e.key == selected.key) {
        Some(next)
            if is_replacement(
                next,
                selected.expires_ms,
                selected.refresh.as_deref(),
                now,
                false,
            ) =>
        {
            Verdict::Newer
        }
        _ => Verdict::NotNewer,
    }
}

/// A copy whose files are byte for byte the source's renewed nothing, whatever can or cannot be parsed, so it
/// cannot be newer; any other copy that nothing can judge stays undetermined.
pub fn copy_is_newer(
    layout: Layout,
    provider: &str,
    source_home: &Path,
    copy_home: &Path,
    now: f64,
    sqlite: &dyn SqliteAdapter,
) -> Verdict {
    let verdict = judge_copy(layout, provider, source_home, copy_home, now, sqlite);
    if verdict == Verdict::Undetermined && files_identical(layout, source_home, copy_home) {
        Verdict::NotNewer
    } else {
        verdict
    }
}

fn files_identical(layout: Layout, source_home: &Path, copy_home: &Path) -> bool {
    // A login renewed after the last checkpoint sits in the log or journal, not in the main file: a copy or a
    // source with one (or one that cannot be read) cannot be shown identical by its main file alone.
    for (found, unreadable) in [
        sidecar_bytes(layout, copy_home, true),
        sidecar_bytes(layout, source_home, false),
    ] {
        if unreadable || !found.is_empty() {
            return false;
        }
    }
    layout.files().iter().all(|name| {
        match (
            fs::read(source_home.join(name)),
            read_agent_file(&copy_home.join(name), MAX_COPY_FILE_BYTES),
        ) {
            (Ok(a), Ok(b)) => a == b,
            _ => false,
        }
    })
}
