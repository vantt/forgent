use std::path::Path;
use std::process::Command;

pub struct Spec {
    pub argv: Vec<String>,
}

fn spawn_spec(spec: &Spec) {
    let _ = Command::new(&spec.argv[0]).args(&spec.argv[1..]).status();
}

// git through the argv runner on a repository under temp_dir(): the production sandbox probe.
pub fn probe() {
    let repo = std::env::temp_dir().join("probe-repo");
    let argv = vec!["git".to_string(), "-C".into(), repo.to_string_lossy().into_owned(), "init".into()];
    spawn_spec(&Spec { argv });
}

// The same argv on a repository the caller names: a site.
fn commit_in(repo: &Path) {
    let argv = vec!["git".to_string(), "-C".into(), repo.to_string_lossy().into_owned(), "commit".into()];
    spawn_spec(&Spec { argv });
}

pub fn commit_project() {
    commit_in(Path::new("/srv/project"));
}
