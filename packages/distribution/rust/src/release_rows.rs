//! The doctor rows over the active release: is the host binary there, is the platform one a release is published
//! for, is the Node payload there, does the Node payload of the active release match this source checkout, and
//! does the activation match the committed pin. Each row reports and writes nothing.
//!
//! Every input is passed in (an environment lookup, the process directory, the OS and architecture), so a row
//! answers for exactly what it was given. The doctor root is the project directory the host already resolved.

use crate::doctor::{RowResult, Status};
use crate::fetch::{host_target, SUPPORTED_TARGETS};
use crate::init::{pin_note_of, read_tracked_pin, PinFile, PIN_FILE_RELATIVE};
use crate::source_payload::list_source_files;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Component, Path, PathBuf};

/// Where a row reads the environment and the process directory from.
pub struct ReleaseEnv<'a> {
    pub get: &'a dyn Fn(&str) -> Option<String>,
    pub process_cwd: &'a Path,
}

use crate::ACTIVATION_RELATIVE;
const GUIDANCE: &str = "B: npm run fgos:dev -- <verb> runs working-tree code. A: rebuild/stage, then fgctl upgrade --from <release> in this workspace to update plain fgos.";

fn judged(passed: bool, message: impl Into<String>) -> RowResult {
    RowResult {
        passed,
        status: None,
        message: Some(message.into()),
        fix_command: None,
        detail: None,
    }
}

fn skipped(message: impl Into<String>) -> RowResult {
    RowResult {
        passed: true,
        status: Some(Status::Skip),
        message: Some(message.into()),
        fix_command: None,
        detail: None,
    }
}

fn warned(message: impl Into<String>, fix_command: &str) -> RowResult {
    RowResult {
        passed: true,
        status: None,
        message: Some(message.into()),
        fix_command: Some(fix_command.to_owned()),
        detail: None,
    }
}

fn lexical(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push("..");
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn absolute(path: &Path) -> PathBuf {
    lexical(&std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf()))
}

/// `base` joined with `segments` when the result stays inside `base`, also by the real path of what exists: a link
/// staged inside the release that points outside it is refused. `None` for an escape.
fn confined(base: &Path, segments: &[&str]) -> Option<PathBuf> {
    let base = absolute(base);
    let mut joined = base.clone();
    for segment in segments {
        joined = if Path::new(segment).is_absolute() {
            PathBuf::from(segment)
        } else {
            joined.join(segment)
        };
    }
    let resolved = lexical(&joined);
    if resolved != base && !resolved.starts_with(&base) {
        return None;
    }
    if resolved.exists() {
        let real = std::fs::canonicalize(&resolved).ok()?;
        let real_base = std::fs::canonicalize(&base).ok()?;
        if real != real_base && !real.starts_with(&real_base) {
            return None;
        }
    }
    Some(resolved)
}

fn read_json(path: &Path) -> Option<Value> {
    serde_json::from_slice(&std::fs::read(path).ok()?).ok()
}

/// The release the doctor judges: where it is, its manifest when it has a readable one, and whether it is the
/// development layout of a source checkout.
struct Resolved {
    release_path: PathBuf,
    manifest: Option<Value>,
    is_dev_checkout: bool,
}

fn truthy(value: Option<String>) -> Option<String> {
    value.filter(|v| !v.is_empty())
}

fn candidate_dirs(dir: &Path, env: &ReleaseEnv) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = Vec::new();
    for candidate in [dir, env.process_cwd] {
        if !candidate.as_os_str().is_empty() && !dirs.iter().any(|d| d == candidate) {
            dirs.push(candidate.to_path_buf());
        }
    }
    dirs
}

/// The active release, found in this order: the environment, the workspace activation record of a candidate
/// directory, then (the development door's cases) a staged manifest, a dev manifest, a source checkout.
fn resolve_active_release(
    dir: &Path,
    candidates: &[PathBuf],
    get: &dyn Fn(&str) -> Option<String>,
) -> Resolved {
    if let Some(release) = truthy(get("FGOS_ACTIVE_RELEASE_PATH")) {
        let release_path = PathBuf::from(&release);
        let manifest_path = truthy(get("FGOS_ACTIVE_MANIFEST_PATH")).map_or_else(
            || {
                if release_path.join("manifest.json").exists() {
                    release_path.join("manifest.json")
                } else {
                    release_path.join("target").join("dev-manifest.json")
                }
            },
            PathBuf::from,
        );
        let manifest = manifest_path
            .exists()
            .then(|| read_json(&manifest_path))
            .flatten();
        return Resolved {
            release_path,
            manifest,
            is_dev_checkout: false,
        };
    }
    for candidate in candidates {
        let activation_path = candidate.join(ACTIVATION_RELATIVE);
        if !activation_path.exists() {
            continue;
        }
        let Some(activation) = read_json(&activation_path) else {
            continue;
        };
        let Some(release) = activation
            .get("releasePath")
            .and_then(Value::as_str)
            .filter(|r| !r.is_empty())
        else {
            continue;
        };
        let manifest_path = Path::new(release).join("manifest.json");
        if manifest_path.exists() {
            match read_json(&manifest_path) {
                Some(manifest) => {
                    return Resolved {
                        release_path: release.into(),
                        manifest: Some(manifest),
                        is_dev_checkout: false,
                    }
                }
                None => continue,
            }
        }
        return Resolved {
            release_path: release.into(),
            manifest: None,
            is_dev_checkout: false,
        };
    }
    for relative in [&["manifest.json"][..], &["target", "dev-manifest.json"][..]] {
        for candidate in candidates {
            let file = relative.iter().fold(candidate.clone(), |p, s| p.join(s));
            if file.exists() {
                if let Some(manifest) = read_json(&file) {
                    return Resolved {
                        release_path: candidate.clone(),
                        manifest: Some(manifest),
                        is_dev_checkout: false,
                    };
                }
            }
        }
    }
    // A directory with a package.json is no signal (fgOS runs against other projects): the Rust host
    // workspace marker is unique to this repository's own checkout.
    for candidate in candidates {
        if candidate
            .join("apps")
            .join("fgos")
            .join("Cargo.toml")
            .exists()
        {
            return Resolved {
                release_path: candidate.clone(),
                manifest: None,
                is_dev_checkout: true,
            };
        }
    }
    Resolved {
        release_path: dir.to_path_buf(),
        manifest: None,
        is_dev_checkout: false,
    }
}

fn exe_name(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_owned()
    }
}

#[cfg(unix)]
fn is_executable(path: &Path) -> bool {
    use std::os::unix::ffi::OsStrExt;
    std::ffi::CString::new(path.as_os_str().as_bytes())
        .map(|c| unsafe { libc::access(c.as_ptr(), libc::X_OK) == 0 })
        .unwrap_or(false)
}

#[cfg(not(unix))]
fn is_executable(_path: &Path) -> bool {
    true
}

/// Row `rust-host-binary-present`.
pub fn check_rust_host_binary_present(cwd: &Path, env: &ReleaseEnv) -> RowResult {
    let candidates = candidate_dirs(cwd, env);
    let release = resolve_active_release(cwd, &candidates, env.get);
    let binary = if let Some(manifest) = &release.manifest {
        let Some(entry) = manifest.pointer("/entries/fgos").filter(|v| !v.is_null()) else {
            return judged(false, "active release manifest missing entries.fgos");
        };
        let Some(entry) = entry.as_str() else {
            return judged(
                false,
                "active release manifest's entries.fgos is not a path",
            );
        };
        match confined(&release.release_path, &[entry]) {
            Some(path) => path,
            None => {
                return judged(
                    false,
                    format!("active release manifest's entries.fgos (\"{entry}\") escapes the active release path"),
                )
            }
        }
    } else if release.is_dev_checkout {
        let name = exe_name("fgos");
        candidates
            .iter()
            .flat_map(|c| {
                [
                    c.join("target").join("release").join(&name),
                    c.join("target").join("debug").join(&name),
                ]
            })
            .find(|p| p.exists())
            .unwrap_or_else(|| cwd.join("target").join("release").join(&name))
    } else {
        return skipped("no active fgos rust host release or dev checkout found -- rust-host-binary-present skipped");
    };
    if !binary.exists() {
        return judged(
            false,
            format!("rust host binary does not exist at {}", binary.display()),
        );
    }
    if is_executable(&binary) {
        judged(
            true,
            format!(
                "rust host binary present and executable: {}",
                binary.display()
            ),
        )
    } else {
        judged(
            false,
            format!(
                "rust host binary at {} is not executable: EACCES: permission denied, access '{}'",
                binary.display(),
                binary.display()
            ),
        )
    }
}

/// Row `rust-host-target-supported`: `os` and `arch` are `std::env::consts::OS` and `ARCH`.
pub fn check_rust_host_target_supported(os: &str, arch: &str) -> RowResult {
    if let Some(triple) = host_target(os, arch) {
        return judged(
            true,
            format!("current platform ({triple}) is an approved rust host target"),
        );
    }
    let arch = match arch {
        "x86_64" => "x64",
        "aarch64" => "arm64",
        other => other,
    };
    let platform = match os {
        "windows" => "win32",
        "macos" => "darwin",
        other => other,
    };
    judged(
        false,
        format!(
            "current platform ({arch}-{platform}) is not an approved rust host target (approved: {})",
            SUPPORTED_TARGETS.join(", ")
        ),
    )
}

/// Row `legacy-node-payload-present`.
pub fn check_legacy_node_payload_present(cwd: &Path, env: &ReleaseEnv) -> RowResult {
    let candidates = candidate_dirs(cwd, env);
    let release = resolve_active_release(cwd, &candidates, env.get);
    let payload = if let Some(manifest) = &release.manifest {
        let text = |pointers: &[&str], default: &str| {
            pointers
                .iter()
                .find_map(|p| manifest.pointer(p).and_then(Value::as_str))
                .unwrap_or(default)
                .to_owned()
        };
        let root = text(&["/components/legacyNode/root", "/root"], ".");
        let entry = text(&["/components/legacyNode/entry", "/entry"], "bin/fgos.mjs");
        match confined(&release.release_path, &[&root, &entry]) {
            Some(path) => path,
            None => {
                return judged(
                    false,
                    format!("active release manifest's legacyNode root/entry (\"{root}\"/\"{entry}\") escapes the active release path"),
                )
            }
        }
    } else if release.is_dev_checkout {
        candidates
            .iter()
            .map(|c| c.join("bin").join("fgos.mjs"))
            .find(|p| p.exists())
            .unwrap_or_else(|| cwd.join("bin").join("fgos.mjs"))
    } else {
        return skipped("no active fgos rust host release or dev checkout found -- legacy-node-payload-present skipped");
    };
    if payload.is_file() {
        judged(
            true,
            format!("legacy node payload present: {}", payload.display()),
        )
    } else {
        judged(
            false,
            format!(
                "legacy node payload does not exist at {}",
                payload.display()
            ),
        )
    }
}

// -- active-release-matches-checkout ---------------------------------------------------------------------------

/// `relative` below `base`, refusing a path that is empty, absolute, spelled with a backslash or `..`, or that
/// leaves `base`, and every link on the way from the file system root down (a followed link would read foreign
/// bytes). `None` for a missing path when `optional`.
fn drift_path(base: &Path, relative: &str, optional: bool) -> Result<Option<PathBuf>, String> {
    if relative.is_empty()
        || Path::new(relative).is_absolute()
        || relative.contains('\\')
        || relative.split('/').any(|s| s == "..")
    {
        return Err(format!(
            "Manifest path escapes containment or is invalid: {relative}"
        ));
    }
    let base = absolute(base);
    let resolved = lexical(&base.join(relative));
    if resolved != base && !resolved.starts_with(&base) {
        return Err(format!("Path escapes containment: {relative}"));
    }
    let mut current = PathBuf::new();
    for component in resolved.components() {
        current.push(component.as_os_str());
        if matches!(component, Component::Prefix(_) | Component::RootDir) {
            continue;
        }
        match std::fs::symlink_metadata(&current) {
            Ok(meta) if meta.file_type().is_symlink() => {
                return Err(format!(
                    "Symlink refused in checkout diagnosis: {}",
                    current.display()
                ))
            }
            Ok(_) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound && optional => return Ok(None),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                return Err(format!(
                    "ENOENT: no such file or directory, lstat '{}'",
                    current.display()
                ))
            }
            Err(e) => return Err(format!("{e}, lstat '{}'", current.display())),
        }
    }
    Ok(Some(resolved))
}

fn read_value(path: &Path) -> Result<Value, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("{e}, open '{}'", path.display()))?;
    serde_json::from_slice(&bytes).map_err(|e| format!("{}: {e}", path.display()))
}

fn drift_activation(checkout: &Path) -> Result<Option<Value>, String> {
    let Some(path) = drift_path(checkout, ACTIVATION_RELATIVE, true)? else {
        return Ok(None);
    };
    let activation = read_value(&path)?;
    let release_ok = activation
        .get("releasePath")
        .and_then(Value::as_str)
        .is_some_and(|r| Path::new(r).is_absolute());
    if !release_ok {
        return Err(format!(
            "Invalid activation releasePath in {}; an absolute release path is required",
            path.display()
        ));
    }
    Ok(Some(activation))
}

fn hash_file(path: &Path) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("{e}, open '{}'", path.display()))?;
    Ok(format!("sha256:{:x}", Sha256::digest(bytes)))
}

fn is_digest(text: &str) -> bool {
    text.strip_prefix("sha256:").is_some_and(|hex| {
        hex.len() == 64
            && hex
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    })
}

fn js_order(a: &str, b: &str) -> std::cmp::Ordering {
    a.encode_utf16().cmp(b.encode_utf16())
}

fn canonical_posix(path: &str) -> bool {
    !path.contains('\\')
        && !path.starts_with('/')
        && !path
            .split('/')
            .any(|s| s == ".." || s == "." || s.is_empty())
}

/// Row `active-release-matches-checkout`: the Node payload of the active release against the working tree of
/// the fgOS source checkout at `dir`. Skips everywhere that is not such a checkout with an activation of its own.
pub fn check_active_release_matches_checkout(dir: &Path, env: &ReleaseEnv) -> RowResult {
    match drift(dir, env) {
        Ok(row) => row,
        Err(error) => judged(
            false,
            format!(
                "active-release-matches-checkout could not safely compare Node payload: {error}. {GUIDANCE}"
            ),
        ),
    }
}

fn drift(dir: &Path, env: &ReleaseEnv) -> Result<RowResult, String> {
    let checkout = absolute(dir);
    let skip = |why: &str| {
        Ok(skipped(format!(
            "active-release-matches-checkout skipped: {why}"
        )))
    };
    let Some(marker) = drift_path(&checkout, "apps/fgos/Cargo.toml", true)? else {
        return skip("outside an fgOS source checkout (apps/fgos/Cargo.toml absent)");
    };
    if !std::fs::metadata(&marker)
        .map_err(|e| e.to_string())?
        .is_file()
    {
        return Err(format!(
            "Source checkout marker is not a file: {}",
            marker.display()
        ));
    }
    let activation = drift_activation(&checkout)?;
    let explicit = (env.get)("FGOS_ACTIVE_RELEASE_PATH");
    let mut scoped: BTreeMap<&str, String> = BTreeMap::new();
    // A dev wrapper binds this exact checkout. An inherited installation shim environment may name main's
    // release instead: it cannot override the directory doctor was asked about.
    let activation_release = activation
        .as_ref()
        .and_then(|a| a.get("releasePath"))
        .and_then(Value::as_str)
        .map(|r| absolute(Path::new(r)));
    match explicit.as_deref().filter(|e| Path::new(e).is_absolute()) {
        Some(release)
            if absolute(Path::new(release)) == checkout
                || activation_release.as_deref() == Some(&absolute(Path::new(release))) =>
        {
            scoped.insert("FGOS_ACTIVE_RELEASE_PATH", release.to_owned());
            if let Some(manifest) = (env.get)("FGOS_ACTIVE_MANIFEST_PATH") {
                scoped.insert("FGOS_ACTIVE_MANIFEST_PATH", manifest);
            }
        }
        _ if activation.is_none() => {
            // A linked worktree resolves doctor to its main checkout, so the host passes the main checkout
            // here: the only activation that can exist is this directory's own.
            return skip("no activation owned by doctor dir");
        }
        _ => {}
    }
    let release_path = match scoped.get("FGOS_ACTIVE_RELEASE_PATH") {
        Some(explicit) => PathBuf::from(explicit),
        None => PathBuf::from(
            activation
                .as_ref()
                .and_then(|a| a["releasePath"].as_str())
                .ok_or("no active release")?,
        ),
    };
    drift_path(&release_path, ".", false)?;
    let manifest_path = match scoped.get("FGOS_ACTIVE_MANIFEST_PATH") {
        Some(path) => PathBuf::from(path),
        None if scoped.contains_key("FGOS_ACTIVE_RELEASE_PATH")
            && drift_path(&release_path, "manifest.json", true)?.is_none() =>
        {
            release_path.join("target").join("dev-manifest.json")
        }
        None => release_path.join("manifest.json"),
    };
    let manifest_relative = absolute(&manifest_path)
        .strip_prefix(absolute(&release_path))
        .map(|p| {
            p.components()
                .map(|c| c.as_os_str().to_string_lossy().into_owned())
                .collect::<Vec<_>>()
                .join("/")
        })
        .map_err(|_| format!("Path escapes containment: {}", manifest_path.display()))?;
    drift_path(&release_path, &manifest_relative, false)?;
    // Read strictly: this row reports a manifest it cannot read, where older consumers tolerate it as missing.
    read_value(&manifest_path)?;
    let scoped_get = |key: &str| scoped.get(key).cloned();
    let info = resolve_active_release(&checkout, std::slice::from_ref(&checkout), &scoped_get);
    let manifest = info
        .manifest
        .filter(|m| m.get("files").is_some_and(Value::is_array))
        .ok_or("Active release manifest must contain files[]")?;
    let raw_root = manifest
        .pointer("/components/legacyNode/root")
        .and_then(Value::as_str)
        .filter(|r| !r.is_empty())
        .ok_or("Active release manifest missing components.legacyNode.root")?;
    if raw_root != "." && !canonical_posix(raw_root) {
        return Err(format!(
            "Non-canonical legacyNode.root in active manifest: {raw_root}"
        ));
    }
    let payload_root = drift_path(&release_path, raw_root, false)?;
    if raw_root == "." && payload_root.as_deref() == Some(checkout.as_path()) {
        return skip("development manifest uses this checkout directly (legacyNode.root=\".\")");
    }
    let Some(activation) = activation else {
        return skip("no activation owned by doctor dir (explicit manifest is not this checkout development payload)");
    };

    let package_path = drift_path(&checkout, "package.json", false)?.expect("not optional");
    let package = read_value(&package_path)?;
    // Validate declared paths before the shared walker can traverse an intermediate link.
    for declared in package
        .get("files")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        let declared = declared.as_str().ok_or("a `files` entry is not a string")?;
        drift_path(&checkout, declared, false)?;
    }
    let source_files: Vec<String> = list_source_files(&checkout)
        .map_err(|e| e.to_string())?
        .into_iter()
        .filter(|f| f != "node_modules" && !f.starts_with("node_modules/"))
        .collect();
    let source_set: BTreeSet<&str> = source_files.iter().map(String::as_str).collect();
    let mut release_sources: BTreeMap<String, String> = BTreeMap::new();
    let mut manifest_paths: BTreeSet<String> = BTreeSet::new();
    let prefix = if raw_root == "." {
        String::new()
    } else {
        format!("{}/", raw_root.trim_end_matches('/'))
    };
    let entries = |key: &str| {
        manifest
            .pointer(&format!("/entries/{key}"))
            .and_then(Value::as_str)
    };
    for entry in manifest["files"].as_array().expect("checked above") {
        let path = entry.get("path").and_then(Value::as_str).unwrap_or("");
        if path.is_empty() || !canonical_posix(path) {
            return Err(format!(
                "Non-canonical or escaping manifest files[] path: {}",
                entry
                    .get("path")
                    .and_then(Value::as_str)
                    .unwrap_or("undefined")
            ));
        }
        let digest = entry.get("digest").and_then(Value::as_str).unwrap_or("");
        if entry.get("kind").and_then(Value::as_str) != Some("file") || !is_digest(digest) {
            return Err(format!(
                "Invalid file kind or digest for manifest file {path}"
            ));
        }
        if !manifest_paths.insert(path.to_owned()) {
            return Err(format!("Duplicate manifest file path: {path}"));
        }
        let staged = drift_path(&release_path, path, false)?.expect("not optional");
        if !std::fs::metadata(&staged)
            .map_err(|e| format!("{e}, stat '{}'", staged.display()))?
            .is_file()
        {
            return Err(format!("Manifest entry is not a regular file: {path}"));
        }
        if !prefix.is_empty() && !path.starts_with(&prefix) {
            continue;
        }
        let relative = &path[prefix.len()..];
        if relative.is_empty()
            || relative == "node_modules"
            || relative.starts_with("node_modules/")
        {
            continue;
        }
        let generated_shim = !source_set.contains(relative)
            && ((relative == "bin/fgos" && entries("fgos") == Some(path))
                || (relative == "bin/fgos-runner" && entries("fgosRunner") == Some(path)));
        if generated_shim {
            continue;
        }
        release_sources.insert(relative.to_owned(), digest.to_owned());
    }

    let (mut changed, mut missing, mut extra) = (0usize, 0usize, 0usize);
    let mut examples: Vec<String> = Vec::new();
    let mut example = |kind: &str, relative: &str| {
        if examples.len() < 5 {
            examples.push(format!("{kind}: {relative}"));
        }
    };
    for relative in &source_files {
        let path = drift_path(&checkout, relative, false)?.expect("not optional");
        let digest = hash_file(&path)?;
        match release_sources.get(relative) {
            None => {
                missing += 1;
                example("missing", relative);
            }
            Some(staged) if *staged != digest => {
                changed += 1;
                example("changed", relative);
            }
            Some(_) => {}
        }
    }
    let mut extras: Vec<&String> = release_sources.keys().collect();
    extras.sort_by(|a, b| js_order(a, b));
    for relative in extras {
        if !source_set.contains(relative.as_str()) {
            extra += 1;
            example("extra", relative);
        }
    }
    let passed = changed + missing + extra == 0;
    let artifact = manifest
        .get("artifactDigest")
        .and_then(Value::as_str)
        .or_else(|| activation.get("artifactDigest").and_then(Value::as_str))
        .unwrap_or("unknown");
    let activated_at = activation
        .get("activatedAt")
        .and_then(Value::as_str)
        .unwrap_or("unknown");
    let tail = if examples.is_empty() {
        String::new()
    } else {
        format!("; examples: {}", examples.join(", "))
    };
    Ok(judged(
        passed,
        format!(
            "Node payload versus working tree: changed={changed}, missing in release={missing}, extra in release={extra}; artifactDigest={artifact}, activatedAt={activated_at}{tail}. Rust host/source freshness is not checked.{}",
            if passed { String::new() } else { format!(" {GUIDANCE}") }
        ),
    ))
}

// -- activation-matches-pin --------------------------------------------------------------------------------------

const PIN_FIX: &str = "fgctl init to follow the pin, or fgctl upgrade and commit the moved .fgos/distribution.json if you are ahead on purpose";

/// Row `activation-matches-pin`: the activation differs from the committed exact-digest pin. A warning, never a
/// failure or a repair, because a machine may run ahead of the pin on purpose.
pub fn check_activation_matches_pin(root: &Path) -> RowResult {
    match pin_row(root) {
        Ok(row) => row,
        Err(error) => judged(
            true,
            format!("warning: could not compare the activation with the pin: {error}"),
        ),
    }
}

fn pin_row(root: &Path) -> Result<RowResult, String> {
    let root = absolute(root);
    let Some(pin_file) = drift_path(&root, PIN_FILE_RELATIVE, true)? else {
        return Ok(skipped("activation-matches-pin skipped: no committed pin"));
    };
    let pin = read_tracked_pin(&pin_file);
    if matches!(pin, PinFile::Unreadable) {
        return Ok(warned(
            format!("warning: the committed pin is unreadable: {PIN_FILE_RELATIVE}"),
            "restore .fgos/distribution.json from version control, or fgctl upgrade to write a new pin",
        ));
    }
    let activation = match drift_path(&root, ACTIVATION_RELATIVE, true)? {
        Some(file) => Some(read_value(&file)?),
        None => None,
    };
    let Some(digest) = activation
        .as_ref()
        .and_then(|a| a.get("artifactDigest"))
        .and_then(Value::as_str)
    else {
        return Ok(skipped(
            "activation-matches-pin skipped: no activation in this workspace",
        ));
    };
    let reason = activation
        .as_ref()
        .and_then(|a| a.get("pinOverrideReason"))
        .and_then(Value::as_str);
    Ok(match pin_note_of(digest, reason, &pin) {
        Some(line) => warned(format!("warning: {line}"), PIN_FIX),
        None => {
            let PinFile::Present(pin) = pin else {
                unreachable!("an absent pin is skipped above")
            };
            judged(
                true,
                format!(
                    "active release matches the pin ({})",
                    crate::init::short_digest(&pin.project_runtime.artifact_digest)
                ),
            )
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_scratch::scratch;
    use serde_json::json;
    use std::fs;
    use std::process::Command;

    fn put(root: &Path, relative: &str, content: &str) -> PathBuf {
        let dest = root.join(relative);
        fs::create_dir_all(dest.parent().unwrap()).unwrap();
        fs::write(&dest, content).unwrap();
        dest
    }

    fn put_json(root: &Path, relative: &str, value: &Value) -> PathBuf {
        put(root, relative, &value.to_string())
    }

    fn message(row: &RowResult) -> &str {
        row.message.as_deref().unwrap()
    }

    fn no_env(_: &str) -> Option<String> {
        None
    }

    // -- the host binary, the payload and the target ---------------------------------------------------------

    fn release_with_manifest(root: &Path, manifest: &Value) -> PathBuf {
        let release = root.join("release");
        put_json(&release, "manifest.json", manifest);
        put_json(
            root,
            ".fgos/installation/activation.json",
            &json!({ "releasePath": release }),
        );
        release
    }

    #[test]
    fn the_host_binary_row_follows_the_active_releases_manifest_and_refuses_an_escaping_or_missing_entry(
    ) {
        let dir = scratch("rr-binary");
        let cwd = dir.join("project");
        fs::create_dir_all(&cwd).unwrap();
        let env = ReleaseEnv {
            get: &no_env,
            process_cwd: &dir,
        };
        let release = release_with_manifest(&cwd, &json!({ "entries": { "fgos": "bin/fgos" } }));
        let row = check_rust_host_binary_present(&cwd, &env);
        assert!(!row.passed);
        assert!(message(&row).starts_with("rust host binary does not exist at "));
        let binary = put(&release, "bin/fgos", "#!/bin/sh\n");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let row = check_rust_host_binary_present(&cwd, &env);
            assert!(!row.passed && message(&row).contains("is not executable"));
            fs::set_permissions(&binary, fs::Permissions::from_mode(0o755)).unwrap();
        }
        let row = check_rust_host_binary_present(&cwd, &env);
        assert!(row.passed, "{}", message(&row));
        assert_eq!(
            message(&row),
            format!(
                "rust host binary present and executable: {}",
                binary.display()
            )
        );
        put_json(&release, "manifest.json", &json!({ "entries": {} }));
        assert_eq!(
            message(&check_rust_host_binary_present(&cwd, &env)),
            "active release manifest missing entries.fgos"
        );
        put_json(
            &release,
            "manifest.json",
            &json!({ "entries": { "fgos": "../outside" } }),
        );
        assert_eq!(
            message(&check_rust_host_binary_present(&cwd, &env)),
            "active release manifest's entries.fgos (\"../outside\") escapes the active release path"
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_binary_staged_as_a_link_that_leaves_the_release_is_an_escape() {
        let dir = scratch("rr-binary-link");
        let cwd = dir.join("project");
        fs::create_dir_all(&cwd).unwrap();
        let release = release_with_manifest(&cwd, &json!({ "entries": { "fgos": "bin/fgos" } }));
        fs::create_dir_all(release.join("bin")).unwrap();
        std::os::unix::fs::symlink("/bin/sh", release.join("bin/fgos")).unwrap();
        let env = ReleaseEnv {
            get: &no_env,
            process_cwd: &dir,
        };
        assert!(message(&check_rust_host_binary_present(&cwd, &env))
            .contains("escapes the active release path"));
    }

    #[test]
    fn with_no_release_and_no_checkout_the_binary_and_payload_rows_skip_and_a_dev_checkout_reads_its_target_directory(
    ) {
        let dir = scratch("rr-skip");
        let cwd = dir.join("project");
        fs::create_dir_all(&cwd).unwrap();
        let env = ReleaseEnv {
            get: &no_env,
            process_cwd: &dir,
        };
        for row in [
            check_rust_host_binary_present(&cwd, &env),
            check_legacy_node_payload_present(&cwd, &env),
        ] {
            assert_eq!(row.status, Some(Status::Skip));
            assert!(row.passed);
        }
        put(&cwd, "apps/fgos/Cargo.toml", "[package]");
        let row = check_rust_host_binary_present(&cwd, &env);
        assert_eq!(
            message(&row),
            format!(
                "rust host binary does not exist at {}",
                cwd.join("target")
                    .join("release")
                    .join(exe_name("fgos"))
                    .display()
            )
        );
        put(&cwd, "target/debug/fgos", "x");
        assert!(
            message(&check_rust_host_binary_present(&cwd, &env)).contains("target/debug/fgos")
                || cfg!(windows)
        );
        let row = check_legacy_node_payload_present(&cwd, &env);
        assert!(!row.passed && message(&row).starts_with("legacy node payload does not exist at "));
        put(&cwd, "bin/fgos.mjs", "x");
        assert!(check_legacy_node_payload_present(&cwd, &env).passed);
    }

    #[test]
    fn the_environment_names_the_release_before_any_activation_record_does() {
        let dir = scratch("rr-env");
        let cwd = dir.join("project");
        fs::create_dir_all(&cwd).unwrap();
        release_with_manifest(
            &cwd,
            &json!({ "components": { "legacyNode": { "root": "libexec/legacy-node", "entry": "bin/fgos.mjs" } } }),
        );
        let other = dir.join("other");
        put_json(
            &other,
            "manifest.json",
            &json!({ "components": { "legacyNode": { "root": "pay", "entry": "main.mjs" } } }),
        );
        put(&other, "pay/main.mjs", "x");
        let other_text = other.display().to_string();
        let get = move |k: &str| (k == "FGOS_ACTIVE_RELEASE_PATH").then(|| other_text.clone());
        let env = ReleaseEnv {
            get: &get,
            process_cwd: &dir,
        };
        assert!(check_legacy_node_payload_present(&cwd, &env).passed);
        let plain = ReleaseEnv {
            get: &no_env,
            process_cwd: &dir,
        };
        let row = check_legacy_node_payload_present(&cwd, &plain);
        assert!(!row.passed && message(&row).contains("legacy-node/bin/fgos.mjs"));
    }

    #[test]
    fn a_payload_root_or_entry_that_escapes_the_release_fails_the_payload_row_by_name() {
        let dir = scratch("rr-payload-escape");
        let cwd = dir.join("project");
        fs::create_dir_all(&cwd).unwrap();
        release_with_manifest(
            &cwd,
            &json!({ "components": { "legacyNode": { "root": "../x", "entry": "bin/fgos.mjs" } } }),
        );
        let env = ReleaseEnv {
            get: &no_env,
            process_cwd: &dir,
        };
        assert_eq!(
            message(&check_legacy_node_payload_present(&cwd, &env)),
            "active release manifest's legacyNode root/entry (\"../x\"/\"bin/fgos.mjs\") escapes the active release path"
        );
    }

    #[test]
    fn the_target_row_approves_the_published_targets_and_names_any_other_platform_as_node_did() {
        assert!(check_rust_host_target_supported("linux", "x86_64").passed);
        let win = check_rust_host_target_supported("windows", "x86_64");
        assert!(win.passed);
        assert!(message(&win).contains("x86_64-pc-windows-msvc"));
        let mac = check_rust_host_target_supported("macos", "aarch64");
        assert!(!mac.passed);
        assert_eq!(
            message(&mac),
            "current platform (arm64-darwin) is not an approved rust host target (approved: x86_64-unknown-linux-gnu, x86_64-pc-windows-msvc)"
        );
    }

    // -- active-release-matches-checkout ---------------------------------------------------------------------

    const ACTIVATED_AT: &str = "2026-10-06T12:00:00Z";

    struct Fixture {
        _dir: crate::test_scratch::Scratch,
        temp: PathBuf,
        source: PathBuf,
        release: PathBuf,
        outside: PathBuf,
        manifest: Value,
    }

    fn digest_of(path: &Path) -> String {
        hash_file(path).unwrap()
    }

    impl Fixture {
        fn new() -> Self {
            let dir = scratch("rr-drift");
            let temp = fs::canonicalize(&*dir).unwrap();
            let source = temp.join("checkout");
            let release = temp.join("release");
            let outside = temp.join("outside");
            fs::create_dir_all(&outside).unwrap();
            put(
                &source,
                "apps/fgos/Cargo.toml",
                "[package]\nname=\"fgos\"\n",
            );
            put_json(
                &source,
                "package.json",
                &json!({ "name": "drift-fixture", "files": ["bin", "src"] }),
            );
            put(&source, "bin/fgos.mjs", "console.log(\"source\");\n");
            put(&source, "src/one.mjs", "export const one = 1;\n");
            put(&source, "src/two.mjs", "export const two = 2;\n");
            let mut fixture = Self {
                _dir: dir,
                temp,
                source,
                release,
                outside,
                manifest: json!({}),
            };
            fixture.manifest = json!({
                "schemaVersion": 1,
                "artifactDigest": format!("sha256:{}", "a".repeat(64)),
                "entries": { "fgos": "bin/fgos", "fgosRunner": "bin/fgos-runner" },
                "components": { "legacyNode": { "root": "libexec/legacy-node", "entry": "bin/fgos.mjs" } },
                "files": fixture.stage_all(),
            });
            fixture.write_manifest();
            fixture.activate();
            fixture
        }

        fn stage_all(&self) -> Vec<Value> {
            list_source_files(&self.source)
                .unwrap()
                .iter()
                .map(|relative| {
                    self.stage(
                        relative,
                        &fs::read_to_string(self.source.join(relative)).unwrap(),
                    )
                })
                .collect()
        }

        fn stage(&self, relative: &str, content: &str) -> Value {
            let path = format!("libexec/legacy-node/{relative}");
            let staged = put(&self.release, &path, content);
            json!({ "path": path, "kind": "file", "digest": digest_of(&staged) })
        }

        fn write_manifest(&self) {
            put_json(&self.release, "manifest.json", &self.manifest);
        }

        fn activate(&self) {
            put_json(
                &self.source,
                ".fgos/installation/activation.json",
                &json!({ "releasePath": self.release, "artifactDigest": self.manifest["artifactDigest"], "activatedAt": ACTIVATED_AT }),
            );
        }

        fn files(&mut self) -> &mut Vec<Value> {
            self.manifest["files"].as_array_mut().unwrap()
        }

        fn run(&self) -> RowResult {
            self.run_in(&self.source, &no_env)
        }

        fn run_in(&self, dir: &Path, get: &dyn Fn(&str) -> Option<String>) -> RowResult {
            check_active_release_matches_checkout(
                dir,
                &ReleaseEnv {
                    get,
                    process_cwd: &self.outside,
                },
            )
        }
    }

    fn counts(row: &RowResult, changed: usize, missing: usize, extra: usize) {
        assert!(
            message(row).contains(&format!(
                "changed={changed}, missing in release={missing}, extra in release={extra}"
            )),
            "{}",
            message(row)
        );
    }

    #[test]
    fn an_equal_payload_passes_against_the_doctor_dir_not_the_process_dir_and_the_row_writes_nothing(
    ) {
        let f = Fixture::new();
        put(
            &f.outside,
            "apps/fgos/Cargo.toml",
            "unrelated process dir marker",
        );
        put(
            &f.outside,
            ".fgos/installation/activation.json",
            "{invalid process dir activation",
        );
        let before =
            fs::read_to_string(f.source.join(".fgos/installation/activation.json")).unwrap();
        let row = f.run();
        assert!(row.passed, "{}", message(&row));
        counts(&row, 0, 0, 0);
        assert!(message(&row).contains("Node payload"));
        assert!(message(&row).contains(&format!("artifactDigest=sha256:{}", "a".repeat(64))));
        assert!(message(&row).contains(&format!("activatedAt={ACTIVATED_AT}")));
        assert_eq!(
            fs::read_to_string(f.source.join(".fgos/installation/activation.json")).unwrap(),
            before
        );
        assert_eq!(fs::read_dir(f.source.join(".fgos")).unwrap().count(), 1);
    }

    #[test]
    fn a_working_tree_edit_is_changed_an_added_file_missing_a_removed_one_extra_and_failing_names_both_ways_to_update(
    ) {
        let f = Fixture::new();
        put(&f.source, "bin/fgos.mjs", "changed uncommitted entry");
        let row = f.run();
        assert!(!row.passed);
        counts(&row, 1, 0, 0);
        assert!(message(&row).contains("bin/fgos.mjs"));
        assert!(message(&row).ends_with(GUIDANCE));
        assert!(message(&row).contains("Rust host/source freshness is not checked."));
        let f = Fixture::new();
        put(&f.source, "src/added.mjs", "added");
        fs::remove_file(f.source.join("src/two.mjs")).unwrap();
        let row = f.run();
        counts(&row, 0, 1, 1);
        assert!(
            message(&row).contains("missing: src/added.mjs")
                && message(&row).contains("extra: src/two.mjs")
        );
    }

    #[test]
    fn at_most_five_examples_are_named_in_the_order_the_walk_found_them() {
        let f = Fixture::new();
        for i in 0..8 {
            put(&f.source, &format!("src/new-{i}.mjs"), "new");
        }
        let row = f.run();
        counts(&row, 0, 8, 0);
        assert!(message(&row).contains("src/new-0.mjs") && message(&row).contains("src/new-4.mjs"));
        assert!(!message(&row).contains("src/new-5.mjs"));
    }

    #[test]
    fn a_directory_that_is_not_the_fgos_source_checkout_skips_even_with_an_explicit_release() {
        let f = Fixture::new();
        put_json(
            &f.outside,
            "package.json",
            &json!({ "files": ["not-fgos"] }),
        );
        let release = f.release.display().to_string();
        let get = move |k: &str| (k == "FGOS_ACTIVE_RELEASE_PATH").then(|| release.clone());
        let row = f.run_in(&f.outside, &get);
        assert_eq!(row.status, Some(Status::Skip));
        assert!(message(&row).contains("outside an fgOS source checkout"));
    }

    #[test]
    fn a_checkout_with_no_activation_of_its_own_skips_rather_than_borrowing_the_process_dirs_or_a_staged_manifest(
    ) {
        let f = Fixture::new();
        fs::remove_file(f.source.join(".fgos/installation/activation.json")).unwrap();
        put_json(
            &f.outside,
            ".fgos/installation/activation.json",
            &json!({ "releasePath": f.release }),
        );
        put_json(&f.source, "manifest.json", &f.manifest);
        let row = f.run();
        assert_eq!(row.status, Some(Status::Skip));
        assert!(message(&row).contains("no activation owned by doctor dir"));
    }

    #[test]
    fn a_development_manifest_that_names_this_checkout_skips_and_one_that_names_another_does_not() {
        let mut f = Fixture::new();
        f.manifest["components"]["legacyNode"]["root"] = json!(".");
        let manifest_path = put_json(
            &f.source,
            ".fgos/runtime/dev-host/manifest.json",
            &f.manifest,
        );
        let (release, manifest) = (
            f.source.display().to_string(),
            manifest_path.display().to_string(),
        );
        let get = move |k: &str| match k {
            "FGOS_ACTIVE_RELEASE_PATH" => Some(release.clone()),
            "FGOS_ACTIVE_MANIFEST_PATH" => Some(manifest.clone()),
            _ => None,
        };
        let row = f.run_in(&f.source, &get);
        assert_eq!(row.status, Some(Status::Skip));
        assert!(message(&row).contains("development manifest uses this checkout directly"));

        let mut f = Fixture::new();
        f.manifest["components"]["legacyNode"]["root"] = json!(".");
        let files: Vec<Value> = f
            .files()
            .iter()
            .map(|e| json!({ "path": e["path"].as_str().unwrap().replace("libexec/legacy-node/", ""), "kind": "file", "digest": e["digest"] }))
            .collect();
        for e in &files {
            let path = e["path"].as_str().unwrap();
            put(
                &f.release,
                path,
                &fs::read_to_string(f.source.join(path)).unwrap(),
            );
        }
        f.manifest["files"] = json!(files);
        f.write_manifest();
        let release = f.release.display().to_string();
        let get = move |k: &str| (k == "FGOS_ACTIVE_RELEASE_PATH").then(|| release.clone());
        put(&f.source, "src/one.mjs", "changed");
        let row = f.run_in(&f.source, &get);
        assert!(!row.passed, "{}", message(&row));
        counts(&row, 1, 0, 0);
    }

    #[test]
    fn a_linked_worktree_is_judged_by_the_activation_of_its_own_directory_only() {
        let f = Fixture::new();
        let git = |dir: &Path, args: &[&str]| {
            let ok = Command::new("git")
                .args([
                    "-c",
                    "user.name=Fixture",
                    "-c",
                    "user.email=fixture@example.test",
                ])
                .args(args)
                .current_dir(dir)
                .output()
                .unwrap()
                .status
                .success();
            assert!(ok, "git {args:?}");
        };
        git(&f.source, &["init", "-q", "-b", "main"]);
        git(&f.source, &["add", "apps", "bin", "src", "package.json"]);
        git(&f.source, &["commit", "-qm", "fixture"]);
        let linked = f.temp.join("linked");
        git(
            &f.source,
            &[
                "worktree",
                "add",
                "-q",
                "-b",
                "linked",
                linked.to_str().unwrap(),
            ],
        );
        put(&linked, "src/one.mjs", "different worktree");
        let row = f.run_in(&linked, &no_env);
        assert_eq!(row.status, Some(Status::Skip));
        assert!(message(&row).contains("no activation owned by doctor dir"));
        put_json(
            &linked,
            ".fgos/installation/activation.json",
            &json!({ "releasePath": f.release, "activatedAt": ACTIVATED_AT }),
        );
        let row = f.run_in(&linked, &no_env);
        assert!(!row.passed, "{}", message(&row));
        counts(&row, 1, 0, 0);
    }

    #[test]
    fn a_foreign_release_in_the_environment_cannot_override_the_activation_of_the_doctor_dir() {
        let f = Fixture::new();
        let foreign = f.temp.join("foreign-release");
        put(&foreign, "manifest.json", "{invalid foreign manifest");
        let (release, manifest) = (
            foreign.display().to_string(),
            foreign.join("manifest.json").display().to_string(),
        );
        let get = move |k: &str| match k {
            "FGOS_ACTIVE_RELEASE_PATH" => Some(release.clone()),
            "FGOS_ACTIVE_MANIFEST_PATH" => Some(manifest.clone()),
            _ => None,
        };
        let owned = f.run_in(&f.source, &get);
        assert!(owned.passed, "{}", message(&owned));
        counts(&owned, 0, 0, 0);
        fs::remove_file(f.source.join(".fgos/installation/activation.json")).unwrap();
        let unbound = f.run_in(&f.source, &get);
        assert_eq!(unbound.status, Some(Status::Skip));
        assert!(message(&unbound).contains("no activation owned by doctor dir"));
    }

    #[test]
    fn dependencies_generated_shims_and_a_neighbouring_payload_prefix_are_not_source_extras() {
        let mut f = Fixture::new();
        for relative in [
            "libexec/legacy-node/node_modules/dep/index.mjs",
            "bin/fgos",
            "bin/fgos-runner",
            "libexec/legacy-node-other/foreign.mjs",
        ] {
            let staged = put(&f.release, relative, "staged only");
            let digest = digest_of(&staged);
            f.files()
                .push(json!({ "path": relative, "kind": "file", "digest": digest }));
        }
        for relative in ["bin/fgos", "bin/fgos-runner"] {
            let staged = put(
                &f.release,
                &format!("libexec/legacy-node/{relative}"),
                "packaging shim",
            );
            let digest = digest_of(&staged);
            f.files().push(json!({ "path": format!("libexec/legacy-node/{relative}"), "kind": "file", "digest": digest }));
        }
        f.manifest["entries"]["fgos"] = json!("libexec/legacy-node/bin/fgos");
        f.manifest["entries"]["fgosRunner"] = json!("libexec/legacy-node/bin/fgos-runner");
        f.write_manifest();
        let row = f.run();
        assert!(row.passed, "{}", message(&row));
        counts(&row, 0, 0, 0);
    }

    #[test]
    fn a_declared_dependency_namespace_is_excluded_without_excluding_selected_source_files() {
        let mut f = Fixture::new();
        let package = json!({ "name": "drift-fixture", "files": ["bin", "src", "node_modules"] });
        put_json(&f.source, "package.json", &package);
        put(
            &f.source,
            "node_modules/dep/index.mjs",
            "checkout dependency",
        );
        put_json(&f.release, "libexec/legacy-node/package.json", &package);
        let digest = digest_of(&f.source.join("package.json"));
        for entry in f.files() {
            if entry["path"] == "libexec/legacy-node/package.json" {
                entry["digest"] = json!(digest);
            }
        }
        f.write_manifest();
        let row = f.run();
        assert!(row.passed, "{}", message(&row));
        counts(&row, 0, 0, 0);
    }

    #[test]
    fn files_the_repository_ignores_under_a_declared_directory_are_not_drift() {
        let mut f = Fixture::new();
        put_json(
            &f.source,
            "package.json",
            &json!({ "name": "drift-fixture", "files": ["bin", "src", ".agents"] }),
        );
        put(&f.source, ".agents/keep.md", "kept");
        put(
            &f.source,
            ".gitignore",
            ".agents/hooks.json\n.agents/skills/instruction-audit/\n",
        );
        assert!(Command::new("git")
            .args(["init", "-q"])
            .current_dir(&f.source)
            .status()
            .unwrap()
            .success());
        f.manifest["files"] = json!(f.stage_all());
        f.write_manifest();
        counts(&f.run(), 0, 0, 0);
        put(&f.source, ".agents/hooks.json", "{\"hooks\":{}}");
        put(
            &f.source,
            ".agents/skills/instruction-audit/SKILL.md",
            "rendered by setup",
        );
        let row = f.run();
        assert!(row.passed, "{}", message(&row));
        counts(&row, 0, 0, 0);
    }

    fn fails(name: &str, mutate: impl FnOnce(&mut Fixture)) {
        let mut f = Fixture::new();
        mutate(&mut f);
        let row = f.run();
        assert!(!row.passed, "{name}: {}", message(&row));
        assert!(
            message(&row)
                .contains("active-release-matches-checkout could not safely compare Node payload"),
            "{name}: {}",
            message(&row)
        );
        assert!(message(&row).ends_with(GUIDANCE), "{name}");
    }

    #[test]
    fn every_unreadable_unsafe_or_malformed_input_fails_this_row_with_the_guidance_and_nothing_else(
    ) {
        fails("invalid activation JSON", |f| {
            put(&f.source, ".fgos/installation/activation.json", "{bad");
        });
        fails("activation without an absolute release path", |f| {
            put_json(
                &f.source,
                ".fgos/installation/activation.json",
                &json!({ "releasePath": "relative" }),
            );
        });
        fails("invalid manifest JSON", |f| {
            put(&f.release, "manifest.json", "{bad");
        });
        fails("manifest path that is a directory", |f| {
            fs::remove_file(f.release.join("manifest.json")).unwrap();
            fs::create_dir(f.release.join("manifest.json")).unwrap();
        });
        fails("missing active manifest", |f| {
            fs::remove_file(f.release.join("manifest.json")).unwrap();
        });
        fails("missing manifest files", |f| {
            f.manifest.as_object_mut().unwrap().remove("files");
            f.write_manifest();
        });
        fails("invalid digest", |f| {
            f.files()[0]["digest"] = json!("bad");
            f.write_manifest();
        });
        fails("duplicate manifest source", |f| {
            let first = f.files()[0].clone();
            f.files().push(first);
            f.write_manifest();
        });
        fails("legacy root escape", |f| {
            f.manifest["components"]["legacyNode"]["root"] = json!("../outside");
            f.write_manifest();
        });
        fails("manifest source escape", |f| {
            f.files()[0]["path"] = json!("libexec/legacy-node/../../outside/file");
            f.write_manifest();
        });
        fails("dependency-shaped manifest escape", |f| {
            f.files().push(json!({ "path": "libexec/legacy-node/node_modules/../../escape", "kind": "file", "digest": format!("sha256:{}", "b".repeat(64)) }));
            f.write_manifest();
        });
        fails("declared source escape", |f| {
            put_json(
                &f.source,
                "package.json",
                &json!({ "files": ["../outside"] }),
            );
        });
        fails("missing declared source", |f| {
            put_json(
                &f.source,
                "package.json",
                &json!({ "files": ["bin", "absent"] }),
            );
        });
        fails("missing listed release source", |f| {
            fs::remove_file(f.release.join("libexec/legacy-node/src/one.mjs")).unwrap();
        });
    }

    #[cfg(unix)]
    #[test]
    fn a_link_anywhere_on_the_way_to_a_file_the_row_reads_fails_the_row() {
        use std::os::unix::fs::symlink;
        fails("source symlink", |f| {
            fs::remove_file(f.source.join("src/one.mjs")).unwrap();
            symlink(f.source.join("src/two.mjs"), f.source.join("src/one.mjs")).unwrap();
        });
        fails("source intermediate symlink", |f| {
            fs::rename(f.source.join("src"), f.source.join("real-src")).unwrap();
            symlink("real-src", f.source.join("src")).unwrap();
        });
        fails("declared empty directory behind a link", |f| {
            fs::create_dir(f.outside.join("empty")).unwrap();
            symlink(&f.outside, f.source.join("alias")).unwrap();
            put_json(
                &f.source,
                "package.json",
                &json!({ "files": ["bin", "alias/empty"] }),
            );
        });
        fails("broken source symlink", |f| {
            fs::remove_file(f.source.join("src/one.mjs")).unwrap();
            symlink("absent.mjs", f.source.join("src/one.mjs")).unwrap();
        });
        fails("broken activation symlink", |f| {
            let path = f.source.join(".fgos/installation/activation.json");
            fs::remove_file(&path).unwrap();
            symlink("absent.json", path).unwrap();
        });
        fails("package symlink", |f| {
            fs::rename(
                f.source.join("package.json"),
                f.source.join("real-package.json"),
            )
            .unwrap();
            symlink("real-package.json", f.source.join("package.json")).unwrap();
        });
        fails("manifest symlink", |f| {
            fs::rename(
                f.release.join("manifest.json"),
                f.release.join("real-manifest.json"),
            )
            .unwrap();
            symlink("real-manifest.json", f.release.join("manifest.json")).unwrap();
        });
        fails("release source symlink", |f| {
            let path = f.release.join("libexec/legacy-node/src/one.mjs");
            fs::remove_file(&path).unwrap();
            symlink(f.source.join("src/one.mjs"), path).unwrap();
        });
    }

    #[test]
    fn an_entry_the_comparison_ignores_still_has_to_obey_the_confined_manifest_tree() {
        let namespaces: [(&str, &str, Option<&str>); 4] = [
            (
                "dependency",
                "libexec/legacy-node/node_modules/dep/index.mjs",
                None,
            ),
            ("payload shim", "libexec/legacy-node/bin/fgos", Some("fgos")),
            ("outer shim", "bin/fgos-runner", Some("fgosRunner")),
            (
                "neighboring payload prefix",
                "libexec/legacy-node-other/foreign.mjs",
                None,
            ),
        ];
        for (namespace, relative, key) in namespaces {
            for fault in [
                "malformed kind",
                "invalid digest",
                "duplicate path",
                "missing file",
            ] {
                let mut f = Fixture::new();
                let staged = put(&f.release, relative, "excluded artifact");
                let mut entry =
                    json!({ "path": relative, "kind": "file", "digest": digest_of(&staged) });
                if let Some(key) = key {
                    f.manifest["entries"][key] = json!(relative);
                }
                match fault {
                    "malformed kind" => entry["kind"] = json!("directory"),
                    "invalid digest" => entry["digest"] = json!("invalid"),
                    "duplicate path" => f.files().push(entry.clone()),
                    _ => fs::remove_file(&staged).unwrap(),
                }
                f.files().push(entry);
                f.write_manifest();
                let row = f.run();
                assert!(!row.passed, "{namespace} with {fault}: {}", message(&row));
            }
        }
    }

    #[test]
    fn a_payload_staged_by_the_release_builder_layout_with_production_dependencies_compares_equal()
    {
        let mut f = Fixture::new();
        put_json(
            &f.source,
            "package.json",
            &json!({ "name": "drift-fixture", "files": ["bin", "src", "bin/fgos.mjs"], "dependencies": { "dep": "1.0.0" } }),
        );
        put(
            &f.source,
            "node_modules/dep/index.mjs",
            "export default \"dependency\";",
        );
        let mut files = f.stage_all();
        files.push(f.stage(
            "node_modules/dep/index.mjs",
            "export default \"dependency\";",
        ));
        f.manifest["files"] = json!(files);
        f.write_manifest();
        let row = f.run();
        assert!(row.passed, "{}", message(&row));
        counts(&row, 0, 0, 0);
        assert_eq!(
            f.manifest["files"]
                .as_array()
                .unwrap()
                .iter()
                .filter(|e| e["path"] == "libexec/legacy-node/bin/fgos.mjs")
                .count(),
            1
        );
    }

    // -- activation-matches-pin ------------------------------------------------------------------------------

    const CASES: &str = include_str!("../tests/goldens/pin-drift-cases.json");

    fn pin_workspace(case: &Value) -> crate::test_scratch::Scratch {
        let dir = scratch("rr-pin");
        if case["activation"].is_object() {
            let mut record = json!({ "artifactDigest": case["activation"]["artifactDigest"], "releasePath": "/nowhere", "status": "ready" });
            if let Some(reason) = case["activation"]["pinOverrideReason"].as_str() {
                record["pinOverrideReason"] = json!(reason);
            }
            put_json(&dir, ".fgos/installation/activation.json", &record);
        }
        match &case["pin"] {
            Value::String(_) => {
                put(
                    &dir,
                    ".fgos/distribution.json",
                    "{ \"projectRuntime\": {} }",
                );
            }
            Value::Object(pin) => {
                let mut runtime =
                    json!({ "policy": "exact-digest", "artifactDigest": pin["artifactDigest"] });
                if let Some(tag) = pin.get("releaseVersion") {
                    runtime["releaseVersion"] = tag.clone();
                }
                put_json(
                    &dir,
                    ".fgos/distribution.json",
                    &json!({ "schemaVersion": 1, "projectRuntime": runtime }),
                );
            }
            _ => {}
        }
        dir
    }

    #[test]
    fn the_pin_row_says_what_the_shared_cases_say_and_never_fails() {
        let cases: Value = serde_json::from_str(CASES).unwrap();
        for case in cases["cases"].as_array().unwrap() {
            let dir = pin_workspace(case);
            let row = check_activation_matches_pin(&dir);
            assert!(row.passed, "a drift row never fails doctor");
            let text = message(&row);
            match case["line"].as_str() {
                None => assert!(!text.starts_with("warning:"), "{}: {text}", case["name"]),
                Some(line) => {
                    assert!(
                        text.starts_with(&format!("warning: {line}")),
                        "{}: {text}",
                        case["name"]
                    );
                    if line.starts_with("active") {
                        let fix = row.fix_command.as_deref().unwrap();
                        assert!(fix.contains("fgctl init") && fix.contains("fgctl upgrade"));
                    }
                }
            }
        }
    }

    #[test]
    fn the_pin_row_skips_with_no_pin_or_no_activation_and_warns_about_an_unreadable_pin_even_with_no_activation(
    ) {
        let dir = scratch("rr-pin-skip");
        let activation =
            json!({ "artifactDigest": "sha256:aaaaaaaaaaaa1111", "releasePath": "/nowhere" });
        put_json(&dir, ".fgos/installation/activation.json", &activation);
        let row = check_activation_matches_pin(&dir);
        assert_eq!((row.passed, row.status), (true, Some(Status::Skip)));
        assert!(message(&row).contains("no committed pin"));
        let only_pin = scratch("rr-pin-skip2");
        put_json(
            &only_pin,
            ".fgos/distribution.json",
            &json!({ "schemaVersion": 1, "projectRuntime": { "policy": "exact-digest", "artifactDigest": "sha256:aaaaaaaaaaaa1111" } }),
        );
        let row = check_activation_matches_pin(&only_pin);
        assert_eq!(row.status, Some(Status::Skip));
        assert!(message(&row).contains("no activation in this workspace"));
        let garbage = scratch("rr-pin-garbage");
        put(&garbage, ".fgos/distribution.json", "{ not json");
        let row = check_activation_matches_pin(&garbage);
        assert!(row.passed);
        assert!(message(&row)
            .starts_with("warning: the committed pin is unreadable: .fgos/distribution.json"));
        assert!(row
            .fix_command
            .unwrap()
            .contains("restore .fgos/distribution.json"));
    }

    #[test]
    fn an_equal_pin_is_named_by_its_short_digest_and_an_unreadable_activation_is_a_warning() {
        let dir = scratch("rr-pin-equal");
        put_json(
            &dir,
            ".fgos/distribution.json",
            &json!({ "schemaVersion": 1, "projectRuntime": { "policy": "exact-digest", "artifactDigest": "sha256:aaaaaaaaaaaa1111" } }),
        );
        put_json(
            &dir,
            ".fgos/installation/activation.json",
            &json!({ "artifactDigest": "sha256:aaaaaaaaaaaa1111" }),
        );
        assert_eq!(
            message(&check_activation_matches_pin(&dir)),
            "active release matches the pin (aaaaaaaaaaaa)"
        );
        put(&dir, ".fgos/installation/activation.json", "{bad");
        let row = check_activation_matches_pin(&dir);
        assert!(row.passed);
        assert!(
            message(&row).starts_with("warning: could not compare the activation with the pin: ")
        );
    }
}
