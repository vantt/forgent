//! Finding declarations on disk: the payload's `core` and `domains` trees and the project's own directory.

use super::declaration::DeclarationSource;
use super::merge::{EmbeddedDeclaration, Registry, RegistryError};
use std::fs;
use std::path::{Path, PathBuf};

const PAYLOAD_TREES: &[&str] = &["core", "domains"];
const MAX_DEPTH: usize = 12;

/// Declarations under `core/**/observe/kinds/*.json` and `domains/**/observe/kinds/*.json`, in path order.
pub fn discover_payload_declarations(
    payload_root: &Path,
) -> Result<Vec<DeclarationSource>, RegistryError> {
    let mut found = Vec::new();
    for tree in PAYLOAD_TREES {
        collect_kinds_dirs(&payload_root.join(tree), 0, &mut found)?;
    }
    found.sort();
    read_files("payload", payload_root, found)
}

/// Declarations under the project's `.fgos/observe/kinds/*.json`, in path order.
pub fn discover_project_declarations(
    project_root: &Path,
) -> Result<Vec<DeclarationSource>, RegistryError> {
    let dir = project_root.join(".fgos").join("observe").join("kinds");
    let mut found = json_files_in(&dir)?;
    found.sort();
    read_files("project", project_root, found)
}

/// The merged registry: embedded declarations, then the payload's, then the project's.
pub fn load_registry(
    embedded: &[EmbeddedDeclaration],
    payload_root: Option<&Path>,
    project_root: Option<&Path>,
) -> Result<Registry, RegistryError> {
    let mut sources: Vec<DeclarationSource> =
        embedded.iter().map(EmbeddedDeclaration::source).collect();
    if let Some(root) = payload_root {
        sources.extend(discover_payload_declarations(root)?);
    }
    if let Some(root) = project_root {
        sources.extend(discover_project_declarations(root)?);
    }
    Registry::from_sources(&sources)
}

fn io_error(path: &Path, e: &std::io::Error) -> RegistryError {
    RegistryError::Io {
        origin: path.display().to_string(),
        message: e.to_string(),
    }
}

/// Symlinks are never followed, so a link cannot pull in a declaration from outside the tree.
fn collect_kinds_dirs(
    dir: &Path,
    depth: usize,
    found: &mut Vec<PathBuf>,
) -> Result<(), RegistryError> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(()),
        Err(e) => return Err(io_error(dir, &e)),
    };
    for entry in entries {
        let entry = entry.map_err(|e| io_error(dir, &e))?;
        let file_type = entry.file_type().map_err(|e| io_error(&entry.path(), &e))?;
        if !file_type.is_dir() {
            continue;
        }
        let path = entry.path();
        let is_kinds_dir = path.file_name().is_some_and(|n| n == "kinds")
            && path
                .parent()
                .and_then(Path::file_name)
                .is_some_and(|n| n == "observe");
        if is_kinds_dir {
            found.extend(json_files_in(&path)?);
        } else if depth < MAX_DEPTH {
            collect_kinds_dirs(&path, depth + 1, found)?;
        }
    }
    Ok(())
}

fn json_files_in(dir: &Path) -> Result<Vec<PathBuf>, RegistryError> {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => return Err(io_error(dir, &e)),
    };
    let mut files = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| io_error(dir, &e))?;
        let file_type = entry.file_type().map_err(|e| io_error(&entry.path(), &e))?;
        let path = entry.path();
        if file_type.is_file() && path.extension().is_some_and(|x| x == "json") {
            files.push(path);
        }
    }
    Ok(files)
}

fn read_files(
    label: &str,
    root: &Path,
    paths: Vec<PathBuf>,
) -> Result<Vec<DeclarationSource>, RegistryError> {
    paths
        .into_iter()
        .map(|path| {
            let text = fs::read_to_string(&path).map_err(|e| io_error(&path, &e))?;
            let relative = path.strip_prefix(root).unwrap_or(&path);
            let shown: Vec<String> = relative
                .components()
                .map(|c| c.as_os_str().to_string_lossy().into_owned())
                .collect();
            Ok(DeclarationSource {
                origin: format!("{label}:{}", shown.join("/")),
                text,
            })
        })
        .collect()
}
