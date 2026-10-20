use std::path::Path;
use std::process::Command;

// A scratch file under temp_dir() and the word init in the same body prove nothing about the
// repository the spawn names: it is the caller's, so this reset is a site.
pub fn wipe(real_repo: &Path) {
    let scratch = std::env::temp_dir().join("wipe-scratch");
    let _ = std::fs::write(&scratch, "init");
    let _ = Command::new("git").arg("-C").arg(real_repo).args(["reset", "--hard", "HEAD~5"]).status();
}
