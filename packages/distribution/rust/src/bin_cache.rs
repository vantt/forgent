//! The global `fgos` path cache, `<global dir>/runtime/bin-cache.json`: `{"globalFgosPath":"<absolute path>"}`,
//! mode 0600. It is a cache, never config. `fgos doctor --fix` fills and repairs it (the one writer, here); the
//! shell integration script and the Node bin discovery read it and fall back to a live `PATH` probe when it is
//! absent or names a file that is gone, so a stale cache costs a lookup and never a failure.
//!
//! The file's bytes are pinned by `tests/goldens/bin-cache-file.json`, which the Node reader's test reads too.

use std::io;
use std::path::{Path, PathBuf};

use serde_json::Value;

/// The cache file relative to the global fgOS directory.
pub const CACHE_FILE: &str = "runtime/bin-cache.json";
const CACHE_DIR: &str = "runtime";
const CACHE_NAME: &str = "bin-cache.json";
const KEY: &str = "globalFgosPath";

/// What a refresh found and did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refreshed {
    /// The `fgos` the search path resolves now, if any.
    pub resolved: Option<PathBuf>,
    /// Whether the cache file was written or removed.
    pub changed: bool,
}

/// The cached path, or `None` when the cache is absent, unreadable or not a path string: a cache never fails
/// its reader.
fn read_cache(global_dir: &Path) -> Option<String> {
    let bytes = std::fs::read(global_dir.join(CACHE_FILE)).ok()?;
    match serde_json::from_slice::<Value>(&bytes).ok()?.get(KEY)? {
        Value::String(path) if !path.is_empty() => Some(path.clone()),
        _ => None,
    }
}

/// The bytes the cache file holds for `path`.
fn cache_bytes(path: &str) -> Vec<u8> {
    let mut text = serde_json::json!({ KEY: path }).to_string();
    text.push('\n');
    text.into_bytes()
}

/// Populates or refreshes the cache from the first `fgos` on the search path. Writes only when the resolved
/// value differs from what is cached (every fix is safe to re-run), and removes the file when nothing resolves
/// rather than leaving a stale path behind.
pub fn refresh_global_bin_cache(
    global_dir: &Path,
    path_env: &str,
    pathext: &str,
    windows: bool,
) -> io::Result<Refreshed> {
    let resolved = fgos_process::spawn::resolve_program("fgos", path_env, pathext, windows);
    let resolved_text = resolved.as_ref().map(|p| p.to_string_lossy().into_owned());
    if resolved_text == read_cache(global_dir) {
        return Ok(Refreshed {
            resolved,
            changed: false,
        });
    }
    match &resolved_text {
        Some(path) => {
            let dir = global_dir.join(CACHE_DIR);
            create_private_dir(&dir)?;
            fgos_durable_file::replace_durably_with_mode(
                &dir,
                CACHE_NAME,
                &cache_bytes(path),
                0o600,
            )
            .map_err(io::Error::other)?;
        }
        None => match std::fs::remove_file(global_dir.join(CACHE_FILE)) {
            Ok(()) => {}
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => return Err(error),
        },
    }
    Ok(Refreshed {
        resolved,
        changed: true,
    })
}

#[cfg(unix)]
fn create_private_dir(dir: &Path) -> io::Result<()> {
    use std::os::unix::fs::DirBuilderExt;
    std::fs::DirBuilder::new()
        .recursive(true)
        .mode(0o700)
        .create(dir)
}

#[cfg(not(unix))]
fn create_private_dir(dir: &Path) -> io::Result<()> {
    std::fs::create_dir_all(dir)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_scratch::scratch;

    const GOLDEN: &str = include_str!("../tests/goldens/bin-cache-file.json");

    /// The launcher's extension where the search is Windows's own: a program there is found by `PATHEXT`.
    const EXT: &str = if cfg!(windows) { ".exe" } else { "" };

    fn fgos_on_path(dir: &Path) -> PathBuf {
        let bin = dir.join("bin");
        std::fs::create_dir_all(&bin).unwrap();
        let file = bin.join(format!("fgos{EXT}"));
        std::fs::write(&file, "#!/bin/sh\nexit 0\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&file, std::fs::Permissions::from_mode(0o755)).unwrap();
        }
        file
    }

    fn refresh(global: &Path, path: &str) -> Refreshed {
        refresh_global_bin_cache(global, path, EXT, cfg!(windows)).unwrap()
    }

    #[test]
    fn the_first_populate_writes_the_resolved_path_as_the_pinned_bytes_and_says_it_changed() {
        let dir = scratch("bin-cache-populate");
        let global = dir.join("global");
        let fgos = fgos_on_path(&dir);
        let out = refresh(&global, fgos.parent().unwrap().to_str().unwrap());
        assert_eq!(out.resolved.as_deref(), Some(fgos.as_path()));
        assert!(out.changed);
        let written = std::fs::read_to_string(global.join(CACHE_FILE)).unwrap();
        let golden: Value = serde_json::from_str(GOLDEN).unwrap();
        // The file holds the path as a JSON string, so a Windows path's backslashes are escaped there.
        let escaped = serde_json::to_string(fgos.to_str().unwrap()).unwrap();
        let expected = golden["file"]
            .as_str()
            .unwrap()
            .replace("<BIN>", escaped.trim_matches('"'));
        assert_eq!(written, expected);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = |p: PathBuf| std::fs::metadata(p).unwrap().permissions().mode() & 0o777;
            assert_eq!(mode(global.join(CACHE_FILE)), 0o600);
            assert_eq!(mode(global.join(CACHE_DIR)), 0o700);
        }
    }

    #[test]
    fn a_cache_that_already_names_the_resolved_path_is_left_alone() {
        let dir = scratch("bin-cache-idempotent");
        let global = dir.join("global");
        let fgos = fgos_on_path(&dir);
        let path = fgos.parent().unwrap().to_str().unwrap().to_owned();
        assert!(refresh(&global, &path).changed);
        let file = global.join(CACHE_FILE);
        let first = std::fs::metadata(&file).unwrap().modified().unwrap();
        let again = refresh(&global, &path);
        assert!(!again.changed);
        assert_eq!(again.resolved.as_deref(), Some(fgos.as_path()));
        assert_eq!(std::fs::metadata(&file).unwrap().modified().unwrap(), first);
    }

    #[test]
    fn a_stale_cache_is_overwritten_and_a_cache_with_nothing_on_the_path_is_removed() {
        let dir = scratch("bin-cache-stale");
        let global = dir.join("global");
        std::fs::create_dir_all(global.join(CACHE_DIR)).unwrap();
        std::fs::write(global.join(CACHE_FILE), cache_bytes("/gone/long/ago/fgos")).unwrap();
        let fgos = fgos_on_path(&dir);
        let out = refresh(&global, fgos.parent().unwrap().to_str().unwrap());
        assert!(out.changed);
        assert_eq!(read_cache(&global).as_deref(), Some(fgos.to_str().unwrap()));
        let none = refresh(&global, "");
        assert_eq!(none.resolved, None);
        assert!(none.changed);
        assert!(!global.join(CACHE_FILE).exists());
        // Nothing cached and nothing found: nothing to do.
        assert!(!refresh(&global, "").changed);
    }

    #[test]
    fn a_cache_that_is_not_a_path_string_reads_as_no_cache() {
        let dir = scratch("bin-cache-garbage");
        let global = dir.join("global");
        std::fs::create_dir_all(global.join(CACHE_DIR)).unwrap();
        for text in [
            "not json",
            "{}",
            "{\"globalFgosPath\":7}",
            "{\"globalFgosPath\":\"\"}",
        ] {
            std::fs::write(global.join(CACHE_FILE), text).unwrap();
            assert_eq!(read_cache(&global), None, "{text}");
        }
    }
}
