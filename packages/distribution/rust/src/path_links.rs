//! The one walk of a path below a root that looks for a symbolic link, under the two policies the packaging layer
//! needs: any link (a removal never follows one) or only a link that leaves the root (a write may follow a link
//! that stays inside).

use std::io;
use std::path::{Path, PathBuf};

/// Which links stop a walk.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LinkPolicy {
    /// Every link.
    Any,
    /// A link that leaves the canonical root, or points nowhere.
    Escaping,
}

/// The first symbolic link on the way from `root` down `relative` (each component below `root`, the last included)
/// that `policy` refuses, or `None` when there is none or the path stops existing. Only [`LinkPolicy::Escaping`]
/// reads the file system beyond the links themselves (to canonicalise the root), so only it can fail.
pub fn first_link_under(
    root: &Path,
    relative: &[&str],
    policy: LinkPolicy,
) -> io::Result<Option<PathBuf>> {
    let canonical_root = match policy {
        LinkPolicy::Any => None,
        LinkPolicy::Escaping => Some(std::fs::canonicalize(root)?),
    };
    let mut current = root.to_path_buf();
    for part in relative {
        current.push(part);
        match std::fs::symlink_metadata(&current) {
            Ok(meta) if meta.file_type().is_symlink() => match &canonical_root {
                None => return Ok(Some(current)),
                Some(canonical) => match std::fs::canonicalize(&current) {
                    Ok(resolved) if resolved.starts_with(canonical) => {}
                    _ => return Ok(Some(current)),
                },
            },
            Ok(_) => {}
            Err(_) => return Ok(None),
        }
    }
    Ok(None)
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use crate::test_scratch::scratch;

    #[test]
    fn any_stops_at_every_link_and_escaping_only_at_one_that_leaves_the_root() {
        let base = scratch("links");
        let root = base.join("root");
        std::fs::create_dir_all(root.join("real/inner")).unwrap();
        std::fs::create_dir_all(base.join("outside")).unwrap();
        std::os::unix::fs::symlink(root.join("real"), root.join("inside")).unwrap();
        std::os::unix::fs::symlink(base.join("outside"), root.join("out")).unwrap();
        std::os::unix::fs::symlink(base.join("nowhere"), root.join("dangling")).unwrap();
        let any = |rel: &[&str]| first_link_under(&root, rel, LinkPolicy::Any).unwrap();
        let escaping = |rel: &[&str]| first_link_under(&root, rel, LinkPolicy::Escaping).unwrap();
        assert_eq!(any(&["real", "inner"]), None);
        assert_eq!(any(&["inside", "inner"]), Some(root.join("inside")));
        assert_eq!(
            escaping(&["inside", "inner"]),
            None,
            "a link that stays inside is followed"
        );
        assert_eq!(escaping(&["out", "x"]), Some(root.join("out")));
        assert_eq!(escaping(&["dangling"]), Some(root.join("dangling")));
        assert_eq!(
            any(&["missing", "x"]),
            None,
            "a path that stops existing has no link"
        );
        assert!(first_link_under(&base.join("absent"), &["a"], LinkPolicy::Escaping).is_err());
    }
}
