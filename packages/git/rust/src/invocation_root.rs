//! Which project, and which `.fgos`, an invocation acts on: the one door every reader of that question
//! goes through (the Node shell, the work-state native verbs and, later, the host).
//!
//! The decision needs two things only a worktree-aware layer knows: the Git top level of the checkout `cwd`
//! sits in, and the trusted main checkout of its repository. Both come from the one driver read
//! ([`read_repo_facts`]); a caller that already holds those facts passes them through the reader it gives
//! [`resolve_invocation_root_with`], so one invocation reads Git once for every answer it needs.
use crate::{plain_path, GitDriver, ResolveRepo};
use std::path::{Component, Path, PathBuf};

/// Fault class every refusal of this door is recorded under.
pub const DIR_INVALID: &str = "dir-invalid";

/// Git causes that mean "this checkout cannot be trusted", refused under every policy.
const TRUST_CAUSES: [&str; 2] = ["untrusted-worktree", "trusted-main-gitfile-unsupported"];

/// A refusal with the fault class the shell records it under and the text the caller prints.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Refusal {
    pub fault_class: &'static str,
    pub message: String,
}

impl Refusal {
    pub(crate) fn new(fault_class: &'static str, message: impl Into<String>) -> Self {
        Self {
            fault_class,
            message: message.into(),
        }
    }
    fn dir_invalid(message: impl Into<String>) -> Self {
        Self::new(DIR_INVALID, message)
    }
}

/// How a policy picks the root.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootPolicy {
    /// The nearest `.fgos` walking up from `cwd`, never above the Git top level of `cwd`'s checkout and never
    /// the home directory's own `.fgos` (the machine's global directory). `found` is false when none exists;
    /// `root` is then the Git top level (or `cwd` outside a repository), where a store would be created.
    CallerTree,
    /// The trusted main checkout root of `cwd`'s repository, from any of its worktrees (`cwd` itself outside a
    /// repository).
    MainCheckout,
    /// `MainCheckout` for a verb that destroys state: a `--dir` must be that main root, and a non-repository is
    /// refused.
    MainCheckoutOnly,
    /// `cwd` itself; refused inside a repository unless `cwd` is its top level, so a store is never created in
    /// a subdirectory.
    StrictCwd,
}

impl RootPolicy {
    /// The policy a caller names (`caller-tree`, `main-checkout`, `main-checkout-only`, `strict-cwd`).
    pub fn parse(name: &str) -> Option<Self> {
        match name {
            "caller-tree" => Some(Self::CallerTree),
            "main-checkout" => Some(Self::MainCheckout),
            "main-checkout-only" => Some(Self::MainCheckoutOnly),
            "strict-cwd" => Some(Self::StrictCwd),
            _ => None,
        }
    }
}

/// The answer: the project root, its `.fgos` directory and whether that directory exists.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvocationRoot {
    pub root: PathBuf,
    pub fgos_dir: PathBuf,
    pub found: bool,
}

/// What Git says about the checkout a directory sits in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RepoFacts {
    NotARepository,
    Repository {
        /// The top level of the checkout `cwd` sits in; none for a bare repository.
        work_tree: Option<PathBuf>,
        /// The trusted main checkout of the repository.
        trusted_main: Option<PathBuf>,
    },
}

/// Git could not be read; `cause` is the driver's own structured cause, never message text.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FactsFault {
    pub cause: String,
}

/// The Git read a decision makes: a directory in, its facts or a fault out.
pub type FactsReader<'a> = &'a dyn Fn(&Path) -> Result<RepoFacts, FactsFault>;

/// The repository facts of the checkout `path` sits in, through a driver on this process's fgOS state root.
/// This is the one read both this door and store admission are built from.
pub fn read_repo_facts(path: &Path) -> Result<RepoFacts, FactsFault> {
    let fault = |e: crate::OperationError| FactsFault { cause: e.cause };
    Ok(match GitDriver::open_at(path).map_err(fault)? {
        None => RepoFacts::NotARepository,
        Some((_driver, repo)) => RepoFacts::Repository {
            work_tree: repo.work_tree().map(plain_path),
            trusted_main: Some(plain_path(repo.trusted_main_root())),
        },
    })
}

/// One request to the door.
#[derive(Debug, Clone, Copy)]
pub struct RootRequest<'a> {
    pub cwd: &'a Path,
    /// The caller's request for the root. It is validated, never walked; under `MainCheckoutOnly` it must be
    /// the main checkout root of `cwd`'s repository.
    pub dir: Option<&'a str>,
    pub policy: RootPolicy,
    /// The home directory whose `.fgos` is the machine's global directory, never a project store.
    pub home: Option<&'a Path>,
}

/// [`resolve_invocation_root_with`] over the real Git read.
pub fn resolve_invocation_root(request: &RootRequest) -> Result<InvocationRoot, Refusal> {
    resolve_invocation_root_with(request, &read_repo_facts)
}

/// Which project, and which `.fgos`, an invocation acts on. `read` is the Git read, asked at most once and only
/// when the policy needs it (a plain `--dir` never reads Git).
pub fn resolve_invocation_root_with(
    request: &RootRequest,
    read: FactsReader,
) -> Result<InvocationRoot, Refusal> {
    let RootRequest {
        cwd,
        dir,
        policy,
        home,
    } = *request;
    if let Some(dir) = dir {
        if dir.trim().is_empty() {
            return Err(Refusal::dir_invalid(
                "--dir requires a non-empty path value",
            ));
        }
        let requested = resolve(Path::new(dir));
        if policy == RootPolicy::MainCheckoutOnly {
            let facts = facts_or_refuse(cwd, read, Need::Repository)?;
            if let Some(main) = main_of(&facts) {
                if realpath_or_self(&requested) != main {
                    return Err(Refusal::dir_invalid(format!(
                        "--dir \"{dir}\" is not the main checkout of the repository at \"{}\" (\"{}\"); this command acts on the main checkout only -- pass --dir \"{}\" or run it from there.",
                        cwd.display(),
                        main.display(),
                        main.display()
                    )));
                }
            }
        }
        let found = requested.join(".fgos").is_dir();
        return Ok(answer(&requested, found));
    }
    let need = match policy {
        RootPolicy::CallerTree => Need::Lenient,
        RootPolicy::MainCheckoutOnly => Need::Repository,
        RootPolicy::MainCheckout | RootPolicy::StrictCwd => Need::Strict,
    };
    let facts = facts_or_refuse(cwd, read, need)?;
    match policy {
        RootPolicy::MainCheckout | RootPolicy::MainCheckoutOnly => {
            let main = main_of(&facts);
            let found = main.as_ref().is_some_and(|m| m.join(".fgos").is_dir());
            Ok(answer(&main.unwrap_or_else(|| resolve(cwd)), found))
        }
        RootPolicy::StrictCwd => {
            let (here, top) = (realpath_or_self(&resolve(cwd)), top_of(&facts));
            if let Some(top) = top.filter(|top| *top != here) {
                return Err(Refusal::dir_invalid(format!(
                    "\"{}\" is inside the repository whose top level is \"{}\" -- run this command from \"{}\", or pass --dir <project root>.",
                    cwd.display(),
                    top.display(),
                    top.display()
                )));
            }
            let found = cwd.join(".fgos").is_dir();
            Ok(answer(&resolve(cwd), found))
        }
        RootPolicy::CallerTree => {
            let here = realpath_or_self(&resolve(cwd));
            let top = top_of(&facts);
            let home = home
                .filter(|h| !h.as_os_str().is_empty())
                .map(|h| realpath_or_self(&resolve(h)));
            Ok(
                match nearest_store_root(&here, top.as_deref(), home.as_deref()) {
                    Some(found) => answer(&found, true),
                    None => answer(&top.unwrap_or_else(|| resolve(cwd)), false),
                },
            )
        }
    }
}

/// What the policy needs of the Git read.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Need {
    /// An unreadable answer reads as no repository.
    Lenient,
    /// An unreadable answer refuses by name rather than act on `cwd`.
    Strict,
    /// As `Strict`, and a genuine "not a repository" answer refuses too (the destructive policy).
    Repository,
}

fn facts_or_refuse(cwd: &Path, read: FactsReader, need: Need) -> Result<RepoFacts, Refusal> {
    let facts = match read(cwd) {
        Ok(facts) => facts,
        Err(FactsFault { cause }) if TRUST_CAUSES.contains(&cause.as_str()) => {
            return Err(Refusal::dir_invalid(format!(
                "\"{}\" is inside a Git repository fgOS cannot trust: {cause}",
                cwd.display()
            )));
        }
        Err(FactsFault { cause }) if need != Need::Lenient => {
            return Err(Refusal::dir_invalid(format!(
                "cannot establish the main checkout of \"{}\": {cause}",
                cwd.display()
            )));
        }
        Err(_) => RepoFacts::NotARepository,
    };
    if need == Need::Repository && main_of(&facts).is_none() {
        return Err(Refusal::dir_invalid(format!(
            "cannot establish the main checkout of \"{}\": it is not inside a Git repository",
            cwd.display()
        )));
    }
    Ok(facts)
}

fn main_of(facts: &RepoFacts) -> Option<PathBuf> {
    match facts {
        RepoFacts::Repository {
            trusted_main: Some(main),
            ..
        } => Some(realpath_or_self(main)),
        _ => None,
    }
}

fn top_of(facts: &RepoFacts) -> Option<PathBuf> {
    match facts {
        RepoFacts::Repository {
            work_tree: Some(top),
            ..
        } => Some(realpath_or_self(top)),
        _ => None,
    }
}

fn answer(root: &Path, found: bool) -> InvocationRoot {
    InvocationRoot {
        root: root.to_path_buf(),
        fgos_dir: resolve(root).join(".fgos"),
        found,
    }
}

/// The nearest directory at or above `start`, never above `ceiling` and never `home`, holding a `.fgos` directory.
fn nearest_store_root(
    start: &Path,
    ceiling: Option<&Path>,
    home: Option<&Path>,
) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    loop {
        if home == Some(dir.as_path()) {
            return None;
        }
        if dir.join(".fgos").is_dir() {
            return Some(dir);
        }
        if ceiling == Some(dir.as_path()) || !dir.pop() {
            return None;
        }
    }
}

/// `path` made absolute against the process directory and lexically normalised; no symbolic link is followed.
pub(crate) fn resolve(path: &Path) -> PathBuf {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for component in absolute.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// `path` through the filesystem when it exists, else its plain resolved form: the shape every comparison of two
/// checkout paths for identity needs.
pub(crate) fn realpath_or_self(path: &Path) -> PathBuf {
    std::fs::canonicalize(path)
        .map(|real| plain_path(&real))
        .unwrap_or_else(|_| resolve(path))
}

/// What the unit tests of this door and of store admission share: real Git, a private state root.
#[cfg(test)]
pub(crate) mod test_support {
    use super::*;
    use std::process::Command;

    pub fn git(dir: &Path, args: &[&str]) {
        let out = Command::new("git")
            .args(["-c", "user.name=t", "-c", "user.email=t@example.test"])
            .args(["-c", "commit.gpgsign=false"])
            .args(args)
            .current_dir(dir)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "git {args:?}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
    }

    /// A fresh scratch directory (its real path) named for `label`.
    pub fn scratch(label: &str) -> PathBuf {
        let base = std::env::temp_dir().join(format!("fgos-{label}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        std::fs::create_dir_all(&base).unwrap();
        plain_path(&std::fs::canonicalize(base).unwrap())
    }

    /// An owner-only state root under `base`, which the Git door requires.
    pub fn state_root(base: &Path) -> PathBuf {
        let state = base.join("state-root");
        std::fs::create_dir_all(&state).unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&state, std::fs::Permissions::from_mode(0o700)).unwrap();
        }
        state
    }

    /// The real Git read on `state`.
    pub fn read(state: &Path, path: &Path) -> Result<RepoFacts, FactsFault> {
        let fault = |e: crate::OperationError| FactsFault { cause: e.cause };
        let driver = GitDriver::new(state).map_err(fault)?;
        Ok(match driver.resolve_repo(path, path).map_err(fault)? {
            ResolveRepo::NotARepository => RepoFacts::NotARepository,
            ResolveRepo::Repository(repo) => RepoFacts::Repository {
                work_tree: repo.work_tree().map(plain_path),
                trusted_main: Some(plain_path(repo.trusted_main_root())),
            },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::test_support::{git, read, scratch, state_root};
    use super::*;

    const TABLE: &str =
        include_str!("../../../../test/rust-host/fixtures/invocation-root-table.json");

    /// A scratch tree built from the steps of the shared table, and a Git reader on its own state root.
    struct Tree {
        base: PathBuf,
        table: serde_json::Value,
        state: PathBuf,
    }

    impl Tree {
        fn build(label: &str) -> Self {
            let table: serde_json::Value = serde_json::from_str(TABLE).unwrap();
            let base = scratch(&format!("root-{label}"));
            for step in table["steps"].as_array().unwrap() {
                if let Some(dir) = step["mkdir"].as_str() {
                    std::fs::create_dir_all(base.join(dir)).unwrap();
                } else if let Some(file) = step["write"].as_str() {
                    std::fs::write(base.join(file), "x\n").unwrap();
                } else {
                    let args: Vec<&str> = step["git"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|a| a.as_str().unwrap())
                        .collect();
                    git(&base.join(args[0]), &args[1..]);
                }
            }
            let state = state_root(&base);
            Self { base, table, state }
        }

        fn at(&self, relative: &str) -> PathBuf {
            self.base.join(relative)
        }

        fn home(&self) -> PathBuf {
            self.at(self.table["home"].as_str().unwrap())
        }

        fn read(&self, path: &Path) -> Result<RepoFacts, FactsFault> {
            read(&self.state, path)
        }

        fn resolve(
            &self,
            cwd: &Path,
            dir: Option<&str>,
            policy: RootPolicy,
        ) -> Result<InvocationRoot, Refusal> {
            let home = self.home();
            resolve_invocation_root_with(
                &RootRequest {
                    cwd,
                    dir,
                    policy,
                    home: Some(&home),
                },
                &|p| self.read(p),
            )
        }
    }

    impl Drop for Tree {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.base);
        }
    }

    #[test]
    fn the_door_answers_the_shared_root_table() {
        let tree = Tree::build("table");
        for row in tree.table["rows"].as_array().unwrap() {
            let cwd = tree.at(row["cwd"].as_str().unwrap());
            let walked = tree.resolve(&cwd, None, RootPolicy::CallerTree).unwrap();
            let project = row["project"].as_str().map(|p| tree.at(p));
            assert_eq!(
                walked.found.then_some(walked.root.clone()),
                project,
                "project of {}",
                row["name"]
            );
            if let Some(main) = row["main"].as_str() {
                let answer = tree.resolve(&cwd, None, RootPolicy::MainCheckout).unwrap();
                assert_eq!(answer.root, tree.at(main), "main of {}", row["name"]);
            }
        }
    }

    #[test]
    fn the_door_answers_every_policy_row_of_the_shared_table() {
        let tree = Tree::build("policies");
        for row in tree.table["policyRows"].as_array().unwrap() {
            let name = row["name"].as_str().unwrap();
            let cwd = tree.at(row["cwd"].as_str().unwrap());
            let policy = RootPolicy::parse(row["policy"].as_str().unwrap()).unwrap();
            let dir = row["dir"]
                .as_str()
                .map(|d| match row["dirIsRelativeToBase"] {
                    serde_json::Value::Bool(true) => tree.at(d).display().to_string(),
                    _ => d.to_string(),
                });
            let got = tree.resolve(&cwd, dir.as_deref(), policy);
            if let Some(message) = row["refusal"].as_str() {
                let refusal = got.expect_err(name);
                assert_eq!(refusal.fault_class, DIR_INVALID, "{name}");
                let expected = message.replace("{base}", tree.base.to_str().unwrap());
                assert!(
                    refusal.message.contains(&expected),
                    "{name}: {:?} lacks {expected:?}",
                    refusal.message
                );
            } else {
                let got = got.unwrap_or_else(|r| panic!("{name}: {r:?}"));
                assert_eq!(
                    got.root,
                    tree.at(row["root"].as_str().unwrap()),
                    "root of {name}"
                );
                assert_eq!(
                    got.found,
                    row["found"].as_bool().unwrap(),
                    "found of {name}"
                );
                assert_eq!(got.fgos_dir, got.root.join(".fgos"), "fgos dir of {name}");
            }
        }
    }

    fn plain<'a>(cwd: &'a Path, policy: RootPolicy, dir: Option<&'a str>) -> RootRequest<'a> {
        RootRequest {
            cwd,
            dir,
            policy,
            home: None,
        }
    }

    fn broken(cause: &'static str) -> impl Fn(&Path) -> Result<RepoFacts, FactsFault> {
        move |_| {
            Err(FactsFault {
                cause: cause.into(),
            })
        }
    }

    #[test]
    fn an_unreadable_git_answer_refuses_by_name_under_every_policy_but_caller_tree() {
        let dir = std::env::temp_dir();
        for policy in [
            RootPolicy::MainCheckout,
            RootPolicy::MainCheckoutOnly,
            RootPolicy::StrictCwd,
        ] {
            let refusal = resolve_invocation_root_with(
                &plain(&dir, policy, None),
                &broken("git-below-the-floor"),
            )
            .unwrap_err();
            assert!(
                refusal
                    .message
                    .contains("cannot establish the main checkout")
                    && refusal.message.contains("git-below-the-floor"),
                "{policy:?}: {refusal:?}"
            );
            assert_eq!(refusal.fault_class, DIR_INVALID);
        }
        let lenient = resolve_invocation_root_with(
            &plain(&dir, RootPolicy::CallerTree, None),
            &broken("git-below-the-floor"),
        )
        .unwrap();
        assert!(
            !lenient.found,
            "caller-tree reads an unreadable answer as no repository"
        );
    }

    #[test]
    fn the_destructive_policy_refuses_an_unreadable_answer_even_when_a_dir_is_named() {
        let dir = std::env::temp_dir();
        let named = dir.to_str().unwrap();
        let refusal = resolve_invocation_root_with(
            &plain(&dir, RootPolicy::MainCheckoutOnly, Some(named)),
            &broken("git-below-the-floor"),
        )
        .unwrap_err();
        assert!(refusal
            .message
            .contains("cannot establish the main checkout"));
        let not_a_repository = resolve_invocation_root_with(
            &plain(&dir, RootPolicy::MainCheckoutOnly, Some(named)),
            &|_| Ok(RepoFacts::NotARepository),
        )
        .unwrap_err();
        assert!(not_a_repository
            .message
            .contains("not inside a Git repository"));
    }

    #[test]
    fn a_named_dir_is_never_read_through_git_unless_the_policy_is_destructive() {
        let dir = std::env::temp_dir();
        let named = dir.to_str().unwrap();
        for policy in [
            RootPolicy::CallerTree,
            RootPolicy::MainCheckout,
            RootPolicy::StrictCwd,
        ] {
            let answer = resolve_invocation_root_with(
                &plain(Path::new("/nonexistent-cwd"), policy, Some(named)),
                &|_| panic!("a named --dir must not read Git"),
            )
            .unwrap();
            assert_eq!(answer.root, resolve(&dir));
        }
    }

    #[test]
    fn a_trust_refusal_is_matched_on_the_structured_cause_not_on_message_text() {
        let dir = std::env::temp_dir();
        for cause in TRUST_CAUSES {
            let refusal = resolve_invocation_root_with(
                &plain(&dir, RootPolicy::CallerTree, None),
                &broken(cause),
            )
            .unwrap_err();
            assert!(refusal.message.contains("cannot trust"), "{cause}");
        }
        let noise = resolve_invocation_root_with(
            &plain(&dir, RootPolicy::CallerTree, None),
            &broken("mentions untrusted-worktree only in text"),
        )
        .unwrap();
        assert!(!noise.found);
    }

    #[test]
    fn facts_passed_in_are_the_only_git_answer_used() {
        let plain_dir = plain_path(&std::fs::canonicalize(std::env::temp_dir()).unwrap());
        let facts = RepoFacts::Repository {
            work_tree: Some(plain_dir.clone()),
            trusted_main: Some(plain_dir.clone()),
        };
        let answer = resolve_invocation_root_with(
            &plain(
                Path::new("/nonexistent-cwd"),
                RootPolicy::MainCheckout,
                None,
            ),
            &|_| Ok(facts.clone()),
        )
        .unwrap();
        assert_eq!(answer.root, plain_dir);
    }

    #[test]
    fn a_blank_dir_is_refused_with_the_dir_message() {
        let dir = std::env::temp_dir();
        for blank in ["", "  "] {
            let refusal = resolve_invocation_root_with(
                &plain(&dir, RootPolicy::CallerTree, Some(blank)),
                &|_| panic!("a blank --dir must not read Git"),
            )
            .unwrap_err();
            assert_eq!(refusal.message, "--dir requires a non-empty path value");
        }
    }

    #[test]
    fn a_checkout_whose_gitfile_does_not_point_back_is_refused_never_acted_on_as_its_cwd() {
        let tree = Tree::build("forged");
        let forged = tree.at("forged");
        std::fs::create_dir_all(&forged).unwrap();
        let repo_git = tree.at("home/proj/.git");
        std::fs::write(
            forged.join(".git"),
            format!("gitdir: {}\n", repo_git.display()),
        )
        .unwrap();
        for policy in [
            RootPolicy::CallerTree,
            RootPolicy::MainCheckout,
            RootPolicy::StrictCwd,
        ] {
            let refusal = tree.resolve(&forged, None, policy).unwrap_err();
            assert_eq!(refusal.fault_class, DIR_INVALID, "{policy:?}");
            assert!(
                refusal.message.contains("cannot trust"),
                "{policy:?}: {refusal:?}"
            );
        }
    }
}
