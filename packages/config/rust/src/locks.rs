//! The two config lock rows of `packages/holder-lock/contracts/lock-registry.v1.json`. Acquiring
//! them belongs to the write transaction; this module only names them and builds the path parameters.
use std::collections::BTreeMap;
use std::path::Path;

pub const PROJECT_CONFIG: &str = "project-config";
pub const GLOBAL_CONFIG: &str = "global-config";
/// Both are leaves: a write may sit inside any lower-ranked lock and takes nothing beneath it.
pub const RANK: u64 = 80;

/// Parameters for the registry templates `<fgosDir>/...` (project) and `<lockRoot>/...` (global).
pub fn scope_params(fgos_dir: &Path, lock_root: &Path) -> BTreeMap<String, String> {
    BTreeMap::from([
        ("fgosDir".into(), fgos_dir.to_string_lossy().into_owned()),
        ("lockRoot".into(), lock_root.to_string_lossy().into_owned()),
    ])
}
