//! Pure reads of a project's activation; no install, repair, PATH lookup or mutation.
use std::path::{Path, PathBuf};

/// Where the project's activation record lives (it need not exist).
pub fn activation_record_path(project_root: &Path) -> PathBuf {
    project_root
        .join(".fgos")
        .join("installation")
        .join("activation.json")
}

/// The ready activation, if the record exists and parses.
pub fn ready_activation(project_root: &Path) -> Option<serde_json::Value> {
    let text = std::fs::read_to_string(activation_record_path(project_root)).ok()?;
    let activation: serde_json::Value = serde_json::from_str(&text).ok()?;
    (activation["status"].as_str() == Some("ready")).then_some(activation)
}

/// The executable host inside the project's activated release, never a shim or PATH result.
pub fn activated_host_bin(project_root: &Path) -> Option<PathBuf> {
    let activation = ready_activation(project_root)?;
    let release = activation["releasePath"]
        .as_str()
        .filter(|p| !p.is_empty())?;
    let base = std::path::absolute(release).ok()?;
    let real_base = std::fs::canonicalize(&base).ok()?;
    ["fgos", "fgos.exe"]
        .iter()
        .map(|name| base.join("bin").join(name))
        .find(|candidate| {
            is_executable_file(candidate)
                && std::fs::canonicalize(candidate)
                    .map(|real| real.starts_with(&real_base))
                    .unwrap_or(false)
        })
}

fn is_executable_file(path: &Path) -> bool {
    let Ok(meta) = std::fs::metadata(path) else {
        return false;
    };
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        meta.is_file() && meta.permissions().mode() & 0o111 != 0
    }
    #[cfg(not(unix))]
    {
        meta.is_file()
    }
}
