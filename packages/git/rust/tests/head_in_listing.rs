#![cfg(target_os = "linux")]
//! A ref listing that includes `refs/heads/` also observes HEAD, in the one child that lists.
use fgos_git::*;
use std::{fs, os::unix::fs::PermissionsExt, path::{Path, PathBuf}, process::Command, sync::OnceLock};

static LOG: OnceLock<PathBuf> = OnceLock::new();

/// A `git` ahead of the real one on PATH, installed once before any driver exists. It records every
/// argv and, when `<git-dir>/inject-switch` holds a ref, points HEAD there just before a
/// `for-each-ref` on that git dir runs (once).
fn logging_git() -> &'static Path {
    LOG.get_or_init(|| {
        let dir = std::env::temp_dir().join(format!("fgos-head-in-listing-bin-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir(&dir).unwrap();
        let real = Command::new("sh").args(["-c", "command -v git"]).output().unwrap().stdout;
        let real = String::from_utf8(real).unwrap().trim().to_owned();
        let log = dir.join("argv.log");
        let script = dir.join("git");
        fs::write(
            &script,
            format!(
                "#!/bin/sh\nprintf '%s\\n' \"$*\" >> '{log}'\nfor a in \"$@\"; do case \"$a\" in --git-dir=*) gd=${{a#--git-dir=}};; esac; done\n\
                 case \"$*\" in *for-each-ref*) if [ -n \"$gd\" ] && [ -e \"$gd/inject-switch\" ]; then t=$(cat \"$gd/inject-switch\"); rm -f \"$gd/inject-switch\"; '{real}' --git-dir=\"$gd\" symbolic-ref HEAD \"$t\"; fi;; esac\nexec '{real}' \"$@\"\n",
                log = log.display()
            ),
        )
        .unwrap();
        fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
        let mut paths = vec![dir];
        paths.extend(std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()));
        std::env::set_var("PATH", std::env::join_paths(paths).unwrap());
        log
    })
}
fn logged_lines() -> usize {
    fs::read_to_string(logging_git()).map(|l| l.lines().count()).unwrap_or(0)
}
/// Subcommands of the children run against `repo` after the first `from` logged lines.
fn children(repo: &RepoHandle, from: usize) -> Vec<String> {
    let tag = format!("--git-dir={}", repo.git_dir().display());
    let log = fs::read_to_string(logging_git()).unwrap_or_default();
    log.lines()
        .skip(from)
        .filter_map(|l| {
            let mut words = l.split(' ').skip_while(|w| *w != tag).skip(1);
            loop {
                match words.next()? {
                    "-c" => {
                        words.next()?;
                    }
                    option if option.starts_with('-') => {}
                    verb => return Some(verb.to_owned()),
                }
            }
        })
        .collect()
}
fn git(p: &Path, args: &[&str]) -> String {
    let o = Command::new("/usr/bin/git").arg("-C").arg(p).args(args).output().unwrap();
    assert!(o.status.success(), "{args:?}: {o:?}");
    String::from_utf8(o.stdout).unwrap().trim().into()
}
struct Fixture {
    root: PathBuf,
    repo: PathBuf,
    driver: GitDriver,
    handle: RepoHandle,
    first: String,
    second: String,
}
impl Fixture {
    /// Branch `a` at a second commit, branch `b` at the first; HEAD attached to `a`.
    fn new(name: &str) -> Self {
        logging_git();
        let root = std::env::temp_dir().join(format!("fgos-head-in-listing-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir(&root).unwrap();
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
        let repo = root.join("repo");
        git(&root, &["init", "-q", "--initial-branch=a", "repo"]);
        let commit = |m: &str| git(&repo, &["-c", "user.name=T", "-c", "user.email=t@example.invalid", "commit", "-q", "--allow-empty", "-m", m]);
        commit("one");
        let first = git(&repo, &["rev-parse", "HEAD"]);
        git(&repo, &["branch", "b"]);
        commit("two");
        let second = git(&repo, &["rev-parse", "HEAD"]);
        git(&repo, &["update-ref", "refs/fgos/events/m1", &first]);
        let driver = GitDriver::new(&root).unwrap();
        let handle = match driver.resolve_repo(&repo, &repo).unwrap() {
            ResolveRepo::Repository(r) => r,
            _ => panic!(),
        };
        Self { root, repo, driver, handle, first, second }
    }
    fn list(&self) -> RefPage {
        let prefixes = [RefPrefix::parse("refs/fgos/events/").unwrap(), RefPrefix::parse("refs/heads/").unwrap()];
        self.driver.list_refs(&self.handle, &prefixes, None, 4096).unwrap()
    }
    fn value(page: &RefPage, name: &str) -> RefValue {
        page.entries.iter().find(|e| e.name.as_str() == name).unwrap().value.clone()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn an_attached_head_is_observed_by_the_one_child_that_lists_the_tips() {
    let f = Fixture::new("attached");
    f.list(); // the first call per handle may validate configuration
    let from = logged_lines();
    let page = f.list();
    assert_eq!(children(&f.handle, from), ["for-each-ref"]);
    assert_eq!(page.head.as_ref().map(RefName::as_str), Some("refs/heads/a"));
    assert!(matches!(Fixture::value(&page, "refs/heads/a"), RefValue::Direct(o) if o.as_str() == f.second));
    // Agrees with the two-child observation it replaces.
    assert!(matches!(f.driver.resolve_head(&f.handle).unwrap(), HeadFact::Attached { target, commit } if target.as_str() == "refs/heads/a" && commit.as_str() == f.second));
}

#[test]
fn a_head_switched_before_the_listing_reads_it_gives_the_new_branch_with_its_own_value() {
    let f = Fixture::new("switch");
    f.list();
    fs::write(f.handle.git_dir().join("inject-switch"), "refs/heads/b").unwrap();
    let page = f.list();
    assert!(!f.handle.git_dir().join("inject-switch").exists(), "the switch was never injected");
    // One HEAD read names one branch, and the commit is that branch's own listed value, so the
    // pair can only be (a, second) or (b, first); never branch a's name with branch b's commit.
    let name = page.head.as_ref().expect("head observed").as_str();
    let RefValue::Direct(commit) = Fixture::value(&page, name) else { panic!() };
    assert_eq!((name, commit.as_str()), ("refs/heads/b", f.first.as_str()));
    assert_eq!(git(&f.repo, &["symbolic-ref", "HEAD"]), "refs/heads/b");
}

#[test]
fn detached_and_unborn_heads_and_an_unlisted_branch_report_no_head() {
    let f = Fixture::new("none");
    let heads_only = |f: &Fixture| f.driver.list_refs(&f.handle, &[RefPrefix::parse("refs/fgos/events/").unwrap()], None, 4096).unwrap();
    assert!(heads_only(&f).head.is_none(), "branch not among the listed prefixes");
    git(&f.repo, &["symbolic-ref", "HEAD", "refs/heads/unborn"]);
    assert!(f.list().head.is_none());
    assert!(matches!(f.driver.resolve_head(&f.handle).unwrap(), HeadFact::Unborn { .. }));
    git(&f.repo, &["symbolic-ref", "HEAD", "refs/heads/a"]);
    git(&f.repo, &["checkout", "-q", "--detach"]);
    assert!(f.list().head.is_none());
    assert!(matches!(f.driver.resolve_head(&f.handle).unwrap(), HeadFact::Detached { .. }));
}
