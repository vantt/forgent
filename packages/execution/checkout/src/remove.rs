use crate::provision::{file_digest, untracked_entries};
use crate::record::{self, Placed, Record};
use crate::{git, Error, ErrorKind, Result};
use fgos_git::{GitDriver, IgnoredBytes, Oid, WorktreeDelivery};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct RemoveRequest {
    pub cwd: PathBuf,
    pub repo_root: PathBuf,
    pub state_root: PathBuf,
    pub writer: String,
    pub path: PathBuf,
    /// A branch, tag, remote-tracking ref, full ref or object id the checkout's tip must be contained in.
    pub delivered_to: String,
    pub discard_ignored: bool,
}

#[derive(Debug)]
pub struct Removed {
    pub path: PathBuf,
    pub expected_tip: String,
    pub delivered_to: String,
    pub delivered_to_ref: Option<String>,
    pub evidence_digest: String,
    pub discarded_files: u64,
    pub discarded_bytes: u64,
}

fn is_object_id(value: &str) -> bool {
    matches!(value.len(), 40 | 64)
        && value
            .bytes()
            .all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

/// Take back what provisioning placed (into a sibling directory), so the Git port judges only the checkout's own
/// bytes. `restore` puts everything back (the port refused); `discard` deletes the moved bytes and the record.
struct Aside {
    worktree: PathBuf,
    aside: PathBuf,
    moved: Vec<String>,
    emptied: Vec<String>,
}

impl Aside {
    /// Put every moved path back. The aside directory is deleted only when every put-back succeeded; otherwise it
    /// is kept and the error names it, so the protected bytes are never lost.
    fn restore(&mut self) -> Result<()> {
        let mut failed: Vec<String> = vec![];
        for rel in self.emptied.drain(..).rev() {
            let _ = fs::create_dir_all(self.worktree.join(rel));
        }
        for rel in self.moved.drain(..).rev() {
            let to = self.worktree.join(&rel);
            let put_back = (|| {
                if let Some(parent) = to.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::rename(self.aside.join(&rel), &to)
            })();
            if let Err(e) = put_back {
                failed.push(format!("{rel} ({e})"));
            }
        }
        if failed.is_empty() {
            let _ = fs::remove_dir_all(&self.aside);
            return Ok(());
        }
        Err(Error::new(
            ErrorKind::Io,
            format!(
                "could not put back {}; the set-aside bytes are kept at {}",
                failed.join(", "),
                self.aside.display()
            ),
        ))
    }

    fn mv(&mut self, rel: &str) -> std::io::Result<()> {
        let to = self.aside.join(rel);
        if let Some(parent) = to.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::rename(self.worktree.join(rel), to)?;
        self.moved.push(rel.to_owned());
        Ok(())
    }
}

fn still_as_placed(abs: &Path, entry: &Placed) -> bool {
    let Ok(meta) = fs::symlink_metadata(abs) else {
        return false;
    };
    match entry {
        Placed::Symlink { target, .. } => {
            meta.file_type().is_symlink()
                && fs::read_link(abs).is_ok_and(|t| t.to_string_lossy() == target.as_str())
        }
        Placed::File { sha256, .. } => {
            meta.is_file() && file_digest(abs).is_ok_and(|d| d == *sha256)
        }
        Placed::Dir { .. } => false,
    }
}

fn set_provisioned_aside(
    driver: &GitDriver,
    request: &RemoveRequest,
    worktree: &Path,
) -> Result<Option<(Aside, Record)>> {
    let Some(record) = record::read(&request.state_root, worktree) else {
        return Ok(None);
    };
    let tag = git::operation_id("");
    let name = worktree
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let aside_dir = worktree
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join(format!(".{name}.provisioned{tag}"));
    let mut aside = Aside {
        worktree: worktree.to_path_buf(),
        aside: aside_dir,
        moved: vec![],
        emptied: vec![],
    };
    let result = (|| -> Result<()> {
        let io = |rel: &str, e: std::io::Error| Error::io(format!("setting aside {rel}"), &e);
        if record.disposable {
            for entry in untracked_entries(driver, worktree, &request.repo_root)? {
                let rel = entry.trim_end_matches('/').to_owned();
                aside.mv(&rel).map_err(|e| io(&rel, e))?;
            }
        }
        for rel in &record.regenerable {
            if worktree.join(rel).exists() {
                aside.mv(rel).map_err(|e| io(rel, e))?;
            }
        }
        for entry in &record.placed {
            if !matches!(entry, Placed::Dir { .. })
                && still_as_placed(&worktree.join(entry.path()), entry)
            {
                aside.mv(entry.path()).map_err(|e| io(entry.path(), e))?;
            }
        }
        let mut dirs: Vec<&str> = record
            .placed
            .iter()
            .filter(|e| matches!(e, Placed::Dir { .. }))
            .map(Placed::path)
            .collect();
        dirs.sort_by_key(|d| std::cmp::Reverse(d.len()));
        for rel in dirs {
            match fs::remove_dir(worktree.join(rel)) {
                Ok(()) => aside.emptied.push(rel.to_owned()),
                Err(e)
                    if matches!(
                        e.kind(),
                        std::io::ErrorKind::NotFound | std::io::ErrorKind::DirectoryNotEmpty
                    ) => {}
                Err(e) if e.raw_os_error().is_some_and(|c| cfg!(unix) && c == 17) => {}
                Err(e) => return Err(io(rel, e)),
            }
        }
        Ok(())
    })();
    if let Err(error) = result {
        return Err(match aside.restore() {
            Ok(()) => error,
            Err(kept) => Error::new(ErrorKind::Io, format!("{error}; {kept}")),
        });
    }
    Ok(Some((aside, record)))
}

/// Remove one delivered checkout. What provisioning placed is set aside first, so the Git port judges only the
/// checkout's own bytes; a refusal puts it back, a removal deletes it with the record. With `discard_ignored` the
/// port deletes the remaining ignored bytes after every other check passed and reports how many.
pub fn remove(request: &RemoveRequest) -> Result<Removed> {
    let target = fgos_git::plain_path(
        &fs::canonicalize(if request.path.is_absolute() {
            request.path.clone()
        } else {
            request.cwd.join(&request.path)
        })
        .map_err(|e| Error::invalid(format!("worktree remove: {}: {e}", request.path.display())))?,
    );
    let driver = git::driver(&request.state_root)?;
    let repo = git::open(&driver, &request.cwd, &request.repo_root)?;
    let target_text = target.to_string_lossy().into_owned();
    let expected_tip = git::worktrees(&driver, &repo)?
        .into_iter()
        .find(|row| String::from_utf8_lossy(&row.path) == target_text)
        .ok_or_else(|| {
            Error::invalid(format!(
                "worktree remove: {target_text} is not a registered worktree"
            ))
        })?
        .head
        .ok_or_else(|| {
            Error::invalid(format!(
                "worktree remove: {target_text} has no commit checked out"
            ))
        })?;
    let (delivered_ref, delivered) = if is_object_id(&request.delivered_to) {
        (
            None,
            Oid::parse(&request.delivered_to, repo.object_format())
                .map_err(|e| Error::invalid(format!("{e:?}")))?,
        )
    } else {
        match driver.resolve_literal_ref(&repo, &request.delivered_to).map_err(Error::git)? {
            Some((name, oid)) => (Some(name.as_str().to_owned()), oid),
            None => {
                return Err(Error::invalid(format!(
                    "worktree remove: --delivered-to {} does not name an existing branch, tag, remote-tracking ref, full ref or object id",
                    request.delivered_to
                )))
            }
        }
    };
    // The digest binds the exact path, tip, delivery target and ignored-bytes choice the caller asserted: the
    // bytes `JSON.stringify` of the same object gave.
    let evidence_digest: String = Sha256::digest(
        json!({
            "path": target_text,
            "expectedTip": expected_tip.as_str(),
            "deliveredTo": {"ref": delivered_ref, "oid": delivered.as_str()},
            "discardIgnored": request.discard_ignored,
        })
        .to_string()
        .as_bytes(),
    )
    .iter()
    .map(|b| format!("{b:02x}"))
    .collect();
    let aside = set_provisioned_aside(&driver, request, &target)?;
    let removal = driver
        .remove_worktree(
            &repo,
            vec![],
            &target,
            &WorktreeDelivery {
                expected_tip: expected_tip.clone(),
                delivered_to: delivered.clone(),
                evidence_digest: evidence_digest.clone(),
            },
            &request.writer,
            &git::operation_id("worktree"),
            if request.discard_ignored {
                IgnoredBytes::Discard
            } else {
                IgnoredBytes::Preserve
            },
        )
        .map_err(Error::git);
    let discarded = match removal {
        Ok(discarded) => discarded,
        Err(error) => {
            if let Some((mut aside, _)) = aside {
                if let Err(kept) = aside.restore() {
                    return Err(Error::new(ErrorKind::Io, format!("{error}; {kept}")));
                }
            }
            return Err(error);
        }
    };
    if let Some((aside, _)) = aside {
        let _ = fs::remove_dir_all(&aside.aside);
    }
    record::delete(&request.state_root, &target);
    Ok(Removed {
        path: target,
        expected_tip: expected_tip.as_str().to_owned(),
        delivered_to: delivered.as_str().to_owned(),
        delivered_to_ref: delivered_ref,
        evidence_digest,
        discarded_files: discarded.files,
        discarded_bytes: discarded.bytes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_failed_put_back_keeps_the_set_aside_bytes_and_names_them() {
        let root = std::env::temp_dir().join(format!("fgos-checkout-aside-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        let (worktree, aside) = (root.join("wt"), root.join(".wt.provisioned"));
        fs::create_dir_all(&aside).unwrap();
        fs::create_dir_all(worktree.join("clash")).unwrap();
        // `clash` is a non-empty directory where the file must go back; `fine` puts back normally.
        fs::write(worktree.join("clash/other"), "occupied").unwrap();
        fs::write(aside.join("clash"), "protected").unwrap();
        fs::write(aside.join("fine"), "ok").unwrap();
        let mut set_aside = Aside {
            worktree: worktree.clone(),
            aside: aside.clone(),
            moved: vec!["fine".into(), "clash".into()],
            emptied: vec![],
        };
        let error = set_aside.restore().unwrap_err();
        assert!(
            error.message.contains(&aside.display().to_string()),
            "{error}"
        );
        assert!(error.message.contains("clash"));
        assert_eq!(
            fs::read_to_string(aside.join("clash")).unwrap(),
            "protected"
        );
        assert_eq!(fs::read_to_string(worktree.join("fine")).unwrap(), "ok");
        fs::remove_dir_all(&root).unwrap();
    }
}
